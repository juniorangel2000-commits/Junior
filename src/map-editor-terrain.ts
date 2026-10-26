import type Phaser from 'phaser';
import { TILE, WORLD_HEIGHT, WORLD_WIDTH,isFarmTile,isBridgeTile } from './data/regions';
import { isWaterPoint } from './data/terrain-shape';
import { readTerrainSprites, type TerrainSprites } from './terrain-sprites';
import type { TerrainKind } from './systems/map-editor';
import {terrainPaintAlpha} from './data/terrain-paint';
import {propertyGrassStyle} from './terrain-art';
import {GRASS_KINDS,isGrassKind,grassBlendAt,type GrassBlend} from './data/grass-blend';
import {seamBand,seamGlobalX,seamGrassKind} from './data/map-seam';
import {seamGroundColor,seamGroundWeight} from './map-seam-ground';


const MATERIALS: Record<TerrainKind, keyof TerrainSprites> = {
  grass:'grass',meadow:'meadow',forest:'forest',moss:'moss',forestPath:'forest',path:'path-dry',wetPath:'path-wet',water:'water',sand:'sand',soil:'soil',wood:'wood',paving:'paving',
};
const FALLBACK: Record<TerrainKind, readonly [number, number, number]> = {
  grass: [92, 133, 51], path: [187, 148, 94], water: [48, 130, 138],
  sand:[179,154,108],soil:[105,72,45],meadow:[125,150,62],forest:[52,87,56],moss:[62,104,53],forestPath:[79,108,58],wetPath:[124,100,69],wood:[153,111,65],paving:[157,154,129],
};
const mirror = (position: number, size: number): number => {
  const local = position % (size * 2);
  return local < size ? local : size * 2 - local - 1;
};

/**
 * Paint edits above the original ground without changing or rebaking that atlas.
 * Painted land feathers into the original floor. The same alpha mask decides
 * the edge of reclaimed land for swimming, so curved shores and movement agree.
 * Explicit water, wood and paving retain their full painted footprint.
 * The caller must destroy the previous world's images before replacing its
 * texture. Reusing one key prevents GPU textures accumulating after each stroke.
 */
export function drawMapTerrainEdits(
  scene: Phaser.Scene,
  terrain: Readonly<Record<string, TerrainKind>>,
  textureKey='world-map-edits',
  baseWater?: (x:number,y:number)=>boolean,
  naturalSampling:'property'|'forest'='property',
  seamLayout=false,
): Phaser.GameObjects.Image | undefined {
  if (scene.textures.exists(textureKey)) scene.textures.remove(textureKey);
  const cells:Array<{x:number;y:number;material:TerrainKind;extended?:boolean}> = Object.entries(terrain).flatMap(([key, material]) => {
    if (!/^[0-9]+,[0-9]+$/.test(key) || !Object.hasOwn(MATERIALS, material)) return [];
    const [x, y] = key.split(',').map(Number);
    return Number.isSafeInteger(x) && Number.isSafeInteger(y)
      && x >= 0 && y >= 0 && x < WORLD_WIDTH && y < WORLD_HEIGHT ? [{ x, y, material }] : [];
  });
  if (!cells.length) return undefined;
  const occupied=new Set(cells.map(c=>`${c.x},${c.y}`));
  for(const cell of [...cells])if(isGrassKind(cell.material))for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const x=cell.x+dx,y=cell.y+dy,key=`${x},${y}`;
    if(x<0||y<0||x>=WORLD_WIDTH||y>=WORLD_HEIGHT||occupied.has(key)||terrain[key]!==undefined)continue;
    if(naturalSampling==='property'&&(isFarmTile(x,y)||isBridgeTile(x,y)))continue;
    occupied.add(key);cells.push({x,y,material:'grass',extended:true});
  }

  const canvas = document.createElement('canvas');
  canvas.width = WORLD_WIDTH * TILE;
  canvas.height = WORLD_HEIGHT * TILE;
  const context = canvas.getContext('2d')!;
  context.imageSmoothingEnabled = false;
  const sprites = readTerrainSprites(scene);
  const pixels = context.createImageData(TILE, TILE);
  const neighbourIsWater = (x: number, y: number): boolean => {
    const edit = terrain[`${x},${y}`];
    return edit ? edit === 'water' : baseWater?baseWater(x,y):isWaterPoint((x + .5) * TILE, (y + .5) * TILE);
  };

  for (const { x, y, material,extended } of cells) {
    const left = x * TILE, top = y * TILE;
    const sprite = sprites?.[MATERIALS[material]];
    const sharedGround=seamLayout&&isGrassKind(material)&&seamBand(x,y,naturalSampling)&&(extended||material===seamGrassKind(seamGlobalX(x,naturalSampling),y));
    const edges = material === 'water' ? {
      left: !neighbourIsWater(x - 1, y), right: !neighbourIsWater(x + 1, y),
      top: !neighbourIsWater(x, y - 1), bottom: !neighbourIsWater(x, y + 1),
    } : undefined;
    const grassStyles:Array<ReturnType<typeof propertyGrassStyle>>=[];
    const blends:Array<GrassBlend|undefined>=[],computed=new Set<number>();
    const waterNearby=isGrassKind(material)&&[-1,0,1].some(dy=>[-1,0,1].some(dx=>{
      const tx=x+dx,ty=y+dy;return terrain[`${tx},${ty}`]==='water'||(baseWater?baseWater(tx,ty):isWaterPoint((tx+.5)*TILE,(ty+.5)*TILE));
    }));
    if(extended&&waterNearby)continue;
    const seamRGB=[0,0,0];
    for (let py = 0; py < TILE; py++) for (let px = 0; px < TILE; px++) {
      const wx = left + px, wy = top + py, destination = (py * TILE + px) * 4;
      const seamWeight=sharedGround?seamGroundWeight(naturalSampling,wx,wy):0;
      const seamColor=seamWeight>0?seamGroundColor(sprites,naturalSampling,wx,wy,seamRGB):undefined;
      const block=(py>>1)*16+(px>>1);
      let blend:GrassBlend|undefined;
      if(isGrassKind(material)&&!waterNearby){
        if(!computed.has(block)){blends[block]=grassBlendAt(terrain,(wx&~1)+.5,(wy&~1)+.5);computed.add(block);}
        blend=blends[block];
      }
      if(extended&&!blend){pixels.data[destination+3]=0;continue;}
      let grassStyle:ReturnType<typeof propertyGrassStyle>|undefined;
      if(material==='grass'||blend?.grass){
        grassStyle=grassStyles[block]??(grassStyles[block]=propertyGrassStyle(wx&~1,wy&~1));
      }
      let sample = 0;
      if (sprite) {
        // Match the existing world's continuous sampling; water keeps its wave
        // direction instead of mirroring into diamond-shaped repeats.
        if (material === 'water') {
          const offsetX = Math.round(Math.sin(wy * .018) * 13 + Math.sin(wy * .043) * 5);
          const offsetY = Math.round(Math.sin(wx * .009 + wy * .005) * 4);
          sample = (((wy + offsetY + sprite.size) % sprite.size) * sprite.size
            + (wx + offsetX + sprite.size) % sprite.size) * 4;
        } else sample = (naturalSampling==='forest'&&isGrassKind(material)?((wy%sprite.size)*sprite.size+wx%sprite.size):(mirror(wy, sprite.size) * sprite.size + mirror(wx, sprite.size))) * 4;
      }
      const edgeDistance = edges ? Math.min(
        edges.left ? px : TILE, edges.right ? TILE - px - 1 : TILE,
        edges.top ? py : TILE, edges.bottom ? TILE - py - 1 : TILE,
      ) : TILE;
      const shallow = material === 'water' ? Math.max(0, 1 - edgeDistance / 5) * .22 : 0;
      for (let channel = 0; channel < 3; channel++) {
        let value = sprite?.pixels[sample + channel] ?? FALLBACK[material][channel];
        if(blend){
          value=0;
          for(const kind of GRASS_KINDS){
            if(!blend[kind])continue;
            let mixed=sprites?.[kind].pixels[sample+channel]??FALLBACK[kind][channel];
            if(kind==='grass'&&grassStyle&&sprites){
              const {forest,field,moss,light}=grassStyle;
              mixed=mixed*(1-forest-field)+sprites.forest.pixels[sample+channel]*forest+sprites.meadow.pixels[sample+channel]*field;
              mixed=mixed*(1-moss)+sprites.moss.pixels[sample+channel]*moss+light;
            }
            value+=mixed*blend[kind];
          }
          value/=1-blend.base;
        }
        if(material==='forestPath'&&sprites){value=value*.6+sprites.meadow.pixels[sample+channel]*.3+sprites['path-dry'].pixels[sample+channel]*.1;}
        if (!blend&&grassStyle && sprites && sprite) {
          const {forest,field,moss,light}=grassStyle;
          value = value * (1 - forest - field) + sprites.forest.pixels[sample + channel] * forest + sprites.meadow.pixels[sample + channel] * field;
          value=value*(1-moss)+sprites.moss.pixels[sample+channel]*moss+light;
        }
        if (shallow) value = value * (1 - shallow) + [125, 176, 160][channel] * shallow;
        if(seamColor)value=value*(1-seamWeight)+seamColor[channel]*seamWeight;
        pixels.data[destination + channel] = value;
      }
      pixels.data[destination + 3] = Math.round(255*Math.max(seamWeight,blend?1-blend.base:terrainPaintAlpha(terrain,wx+.5,wy+.5)));
    }
    context.putImageData(pixels, left, top);
  }
  scene.textures.addCanvas(textureKey, canvas)?.setFilter(0);
  return scene.add.image(0, 0, textureKey).setOrigin(0).setDepth(-90);
}
