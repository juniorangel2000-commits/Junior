import type Phaser from 'phaser';
import { TILE, WORLD_HEIGHT, WORLD_WIDTH } from './data/regions';
import { isWaterPoint } from './data/terrain-shape';
import { readTerrainSprites, type TerrainSprites } from './terrain-sprites';
import type { TerrainKind } from './systems/map-editor';
import {terrainPaintAlpha} from './data/terrain-paint';
import {propertyGrassStyle} from './terrain-art';


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
): Phaser.GameObjects.Image | undefined {
  if (scene.textures.exists(textureKey)) scene.textures.remove(textureKey);
  const cells = Object.entries(terrain).flatMap(([key, material]) => {
    if (!/^[0-9]+,[0-9]+$/.test(key) || !Object.hasOwn(MATERIALS, material)) return [];
    const [x, y] = key.split(',').map(Number);
    return Number.isSafeInteger(x) && Number.isSafeInteger(y)
      && x >= 0 && y >= 0 && x < WORLD_WIDTH && y < WORLD_HEIGHT ? [{ x, y, material }] : [];
  });
  if (!cells.length) return undefined;

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

  for (const { x, y, material } of cells) {
    const left = x * TILE, top = y * TILE;
    const sprite = sprites?.[MATERIALS[material]];
    const edges = material === 'water' ? {
      left: !neighbourIsWater(x - 1, y), right: !neighbourIsWater(x + 1, y),
      top: !neighbourIsWater(x, y - 1), bottom: !neighbourIsWater(x, y + 1),
    } : undefined;
    const grassStyles:Array<ReturnType<typeof propertyGrassStyle>>=[];
    for (let py = 0; py < TILE; py++) for (let px = 0; px < TILE; px++) {
      const wx = left + px, wy = top + py, destination = (py * TILE + px) * 4;
      let grassStyle:ReturnType<typeof propertyGrassStyle>|undefined;
      if(material==='grass'){
        const block=(py>>1)*16+(px>>1);
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
        } else sample = (mirror(wy, sprite.size) * sprite.size + mirror(wx, sprite.size)) * 4;
      }
      const edgeDistance = edges ? Math.min(
        edges.left ? px : TILE, edges.right ? TILE - px - 1 : TILE,
        edges.top ? py : TILE, edges.bottom ? TILE - py - 1 : TILE,
      ) : TILE;
      const shallow = material === 'water' ? Math.max(0, 1 - edgeDistance / 5) * .22 : 0;
      for (let channel = 0; channel < 3; channel++) {
        let value = sprite?.pixels[sample + channel] ?? FALLBACK[material][channel];
        if(material==='forestPath'&&sprites){value=value*.6+sprites.meadow.pixels[sample+channel]*.3+sprites['path-dry'].pixels[sample+channel]*.1;}
        if (grassStyle && sprites && sprite) {
          const {forest,field,moss,light}=grassStyle;
          value = value * (1 - forest - field) + sprites.forest.pixels[sample + channel] * forest + sprites.meadow.pixels[sample + channel] * field;
          value=value*(1-moss)+sprites.moss.pixels[sample+channel]*moss+light;
        }
        if (shallow) value = value * (1 - shallow) + [125, 176, 160][channel] * shallow;
        pixels.data[destination + channel] = value;
      }
      pixels.data[destination + 3] = Math.round(255*terrainPaintAlpha(terrain,wx+.5,wy+.5));
    }
    context.putImageData(pixels, left, top);
  }
  scene.textures.addCanvas(textureKey, canvas)?.setFilter(0);
  return scene.add.image(0, 0, textureKey).setOrigin(0).setDepth(-90);
}
