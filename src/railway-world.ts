import Phaser from 'phaser';
import {readTerrainSprites} from './terrain-sprites';
import {preloadCityRoadArt, readCityAsphalt, setupCityForestArt} from './city-forest-world';
import {drawMapTerrainEdits} from './map-editor-terrain';
import {drawEditorProp} from './editor-prop-art';
import {drawExitSign} from './exit-signs';
import {addWaterMotion} from './water-motion';
import {RAILWAY_ART, RAILWAY_KINDS, RAILWAY_FLOORS, RAILWAY_TRACKS, isRailwayKind, railwayTexture} from './data/railway-art';
import {RAILWAY_ENTRY, RAILWAY_EXIT, RAILWAY_ROAD_Y} from './data/ruins-road';
import {
  createRailwayLayout, MAIN_TRACK_BEND, onPlatform, PLATFORM, RAILWAY_CROSSINGS, RAILWAY_LINES, RAILWAY_ROAD_HALF_WIDTH, RAILWAY_SIZE,
  railwayBallastDistance, railwayGravelDistance, railwayRoadDistance, railwayYardDistance, railwaySeed, YARD_BROKEN, YARD_LINE_START,
} from './data/railway';
import {TILE, WORLD_WIDTH} from './data/world-size';
import type {MapEditData} from './systems/map-editor';
import type {WorldEditorObject} from './world';
import {drawValleySeams} from './valley-seams';

const GROUND='railway-ground-v3';
const blend=(n:number):number=>Math.max(0,Math.min(1,n));
const files=[...new Set(RAILWAY_KINDS.map(kind=>RAILWAY_ART[kind].file))];

export function preloadRailway(scene:Phaser.Scene):void {
  preloadCityRoadArt(scene);
  for(const file of [...files,...RAILWAY_FLOORS,...RAILWAY_TRACKS]){
    const key=railwayTexture(file);
    if(!scene.textures.exists(key))scene.load.image(key,`assets/visual/railway/${file}.png`);
  }
}

/** Pixels de uma textura de piso (256 × 256), amostrada pela posição no mundo a meia escala. */
function floorPixels(scene:Phaser.Scene,file:string):Uint8ClampedArray {
  const image=scene.textures.get(railwayTexture(file)).getSourceImage() as HTMLImageElement;
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
  const c=canvas.getContext('2d',{willReadFrequently:true})!;c.drawImage(image,0,0,256,256);
  return c.getImageData(0,0,256,256).data;
}

/** Trilhos: módulos de 64 px a partir das bordas das travessias, para não cortar dormentes. */
export function trackModules(line:'main'|'yard'):{x:number;kind:'straight'|'crossing'}[] {
  const crossing=RAILWAY_CROSSINGS.find(c=>c.line===line)!;
  const start=line==='yard'?YARD_LINE_START*TILE:MAIN_TRACK_BEND.joinX*TILE,end=RAILWAY_SIZE.width;
  const out:{x:number;kind:'straight'|'crossing'}[]=[{x:crossing.left,kind:'crossing'}];
  for(let x=crossing.left-64;x>=start;x-=64)out.push({x,kind:'straight'});
  for(let x=crossing.left+96;x<end;x+=64)out.push({x,kind:'straight'});
  return out.filter(m=>m.kind==='crossing'||line!=='yard'||m.x+64<=YARD_BROKEN.left||m.x>=YARD_BROKEN.right);
}

/** Dobra a reta original sem mudar a bitola, as cores ou o ritmo dos dormentes. */
function drawWesternTrack(ctx:CanvasRenderingContext2D,straight:HTMLImageElement):void {
  const moduleSize=64,half=moduleSize/2;
  const radius=MAIN_TRACK_BEND.radius*TILE;
  const joinX=MAIN_TRACK_BEND.joinX*TILE,joinY=RAILWAY_LINES.main*TILE;
  const centerY=joinY+radius,westX=joinX-radius,endY=MAIN_TRACK_BEND.endY*TILE;
  const source=document.createElement('canvas');source.width=source.height=moduleSize;
  const sample=source.getContext('2d')!;
  sample.imageSmoothingEnabled=false;sample.drawImage(straight,0,0,moduleSize,moduleSize);
  const texture=sample.getImageData(0,0,moduleSize,moduleSize).data;
  const patch=document.createElement('canvas');
  const left=westX-half,top=joinY-half;
  patch.width=joinX-left;patch.height=endY-top;
  const paint=patch.getContext('2d')!,image=paint.createImageData(patch.width,patch.height);
  for(let row=0;row<patch.height;row++)for(let col=0;col<patch.width;col++){
    const x=left+col+.5,y=top+row+.5;
    const angle=Math.atan2(centerY-y,joinX-x);
    const curved=y<centerY;
    const across=curved?radius-Math.hypot(joinX-x,centerY-y):x-westX;
    if(Math.abs(across)>=half)continue;
    const along=-radius*(Math.PI/2-(curved?angle:0))-Math.max(0,y-centerY);
    const sx=(Math.floor(along)%moduleSize+moduleSize)%moduleSize,sy=Math.floor(across+half);
    const from=(sy*moduleSize+sx)*4,to=(row*patch.width+col)*4;
    image.data[to]=texture[from];
    image.data[to+1]=texture[from+1];
    image.data[to+2]=texture[from+2];
    image.data[to+3]=texture[from+3]*blend((endY-y)/24);
  }
  paint.putImageData(image,0,0);ctx.drawImage(patch,left,top);
}

function drawGround(scene:Phaser.Scene):void {
  if(!scene.textures.exists(GROUND)){
    const asphalt=readCityAsphalt(scene),materials=readTerrainSprites(scene)!;
    const floors=Object.fromEntries(RAILWAY_FLOORS.map(file=>[file,floorPixels(scene,file)])) as Record<typeof RAILWAY_FLOORS[number],Uint8ClampedArray>;
    const {width,height}=RAILWAY_SIZE;
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const c=canvas.getContext('2d')!,pixels=c.createImageData(width,height),block=4;
    for(let by=0;by<height;by+=block)for(let bx=0;bx<width;bx+=block){
      const tx=(bx+2)/TILE,ty=(by+2)/TILE;
      const noise=.16*Math.sin(tx*2.1+ty*1.6)+.10*Math.sin(ty*3.3-tx*4.7);
      const roadX=tx+WORLD_WIDTH;
      const roadWear=.15*Math.sin(roadX*2.3+ty*1.7)+.09*Math.sin(ty*3.5-roadX*5.2);
      const road=blend((RAILWAY_ROAD_HALF_WIDTH+roadWear-railwayRoadDistance(ty))/.6);
      const drift=.06*Math.sin(tx*.39+ty*.58)+.045*Math.sin(tx*.83-ty*.32);
      const soil=blend((1.02+drift+noise*.42-railwayYardDistance(tx,ty))/.29);
      const gravelWidth=1.28+.22*Math.sin(tx*.74+ty*.63)+noise*.76;
      const gravel=blend((gravelWidth-railwayGravelDistance(tx,ty))/.84);
      const ballast=blend((1.75+noise*.8-railwayBallastDistance(tx,ty))/.55);
      const deck=onPlatform(tx,ty)?1:0;
      const weatheredDeck=deck*(.92-.23*blend((noise+drift-.035)*2));
      const bright=blend(.22+.18*(Math.sin((roadX+WORLD_WIDTH)*.47+ty*.31)+1)/2+
        .12+.09*Math.sin(roadX*.24-ty*.48));
      for(let dy=0;dy<block;dy++)for(let dx=0;dx<block;dx++){
        const x=bx+dx,y=by+dy,i=(y*width+x)*4,p=((y%96)*96+x%96)*4,f=(((y*2)%256)*256+(x*2)%256)*4;
        for(let k=0;k<3;k++){
          let color=materials.forest.pixels[p+k]*(1-bright)+materials.grass.pixels[p+k]*bright;
          color=color*(1-soil)+floors['terra-com-musgo'][f+k]*soil;
          color=color*(1-gravel)+floors.cascalho[f+k]*gravel;
          color=color*(1-ballast)+floors.lastro[f+k]*ballast;
          color=color*(1-weatheredDeck)+floors['lajes-da-plataforma'][f+k]*weatheredDeck;
          const street=asphalt[p+k]*.9+materials.moss.pixels[p+k]*.1;
          pixels.data[i+k]=color*(1-road)+street*road;
        }
        pixels.data[i+3]=255;
      }
    }
    c.putImageData(pixels,0,0);
    // A faixa tracejada continua a das Ruínas (3072 px antes, 42 px por ciclo).
    c.strokeStyle='#c2b994';c.lineWidth=3;c.setLineDash([23,19]);c.lineDashOffset=RAILWAY_SIZE.width%42;
    c.beginPath();c.moveTo(0,RAILWAY_ROAD_Y*TILE);c.lineTo(width,RAILWAY_ROAD_Y*TILE);c.stroke();c.setLineDash([]);
    for(let i=0;i<620;i++){
      const x=railwaySeed(i,72)*width,side=i%2?1:-1,scatter=railwaySeed(i,21),y=(RAILWAY_ROAD_Y+side*(2.4+scatter*1.36))*TILE;
      c.fillStyle=side>0&&scatter>.53?'#77904f58':i%3?'#a49a7b60':'#413c37aa';c.fillRect(x,y,1+i%4,1+i%3);
    }
    // Borda da plataforma: uma linha escura de sombra sob a mureta e o deck mais claro.
    c.fillStyle='#2f2a2266';c.fillRect(PLATFORM.left*TILE,PLATFORM.bottom*TILE,(PLATFORM.right-PLATFORM.left)*TILE,5);
    // Trilhos em módulos de 128 px exibidos a 64 px; a travessia ocupa 96 px e sobe 24 px.
    c.imageSmoothingEnabled=false;
    const straight=scene.textures.get(railwayTexture('reta-horizontal')).getSourceImage() as HTMLImageElement;
    const crossing=scene.textures.get(railwayTexture('travessia-modular')).getSourceImage() as HTMLImageElement;
    drawWesternTrack(c,straight);
    for(const line of ['main','yard'] as const){
      const top=(RAILWAY_LINES[line]-1)*TILE;
      for(const m of trackModules(line)){
        if(m.kind==='crossing')c.drawImage(crossing,m.x,top-24,96,112);
        else c.drawImage(straight,m.x,top,64,64);
      }
    }
    scene.textures.addCanvas(GROUND,canvas)!.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  scene.add.image(0,0,GROUND).setOrigin(0).setDepth(-100);
  drawValleySeams(scene,'railway');
}

/** Objetos altos que somem um pouco quando o personagem passa atrás deles. */
type Fading={sprite:Phaser.GameObjects.Image;left:number;right:number;top:number;bottom:number};
export class RailwayWorld {
  readonly layout:ReturnType<typeof createRailwayLayout>;
  readonly editorObjects:WorldEditorObject[]=[];
  private readonly terrainTexture:string;
  private readonly fading:Fading[]=[];
  private readonly grass=new Map<number,Phaser.GameObjects.Image>();
  private faded:Phaser.GameObjects.Image[]=[];
  constructor(private readonly scene:Phaser.Scene,edits?:MapEditData,palette=false){
    setupCityForestArt(scene);
    this.layout=createRailwayLayout(edits);
    this.terrainTexture=palette?'railway-editor-terrain':'railway-play-terrain';
    drawGround(scene);
    drawMapTerrainEdits(scene,edits?.terrain??{},this.terrainTexture,()=>false,'forest')?.setDepth(-99);
    if(!palette&&Object.values(edits?.terrain??{}).includes('water')){
      const water=this.layout.water;
      addWaterMotion(scene,(x,y)=>water((x+.5)*TILE,(y+.5)*TILE),water,{...RAILWAY_SIZE,alpha:.4});
    }
    for(const o of this.layout.objects){
      const {x,y}=this.layout.pivot(o),tree=o.kind==='standingTree'||o.kind==='pine';
      const sprite=tree
        ?scene.add.image(x,y,`asset-${o.kind==='pine'?'pine':'tree'}-${o.variant??0}`).setOrigin(.5,256/264).setDisplaySize(166*(o.scale??1),211*(o.scale??1)).setDepth(y).setTint(0xded9b8)
        :drawEditorProp(scene,o.kind,x,y);
      if(!sprite)continue;
      if(isRailwayKind(o.kind)){
        const art=RAILWAY_ART[o.kind];
        if('floor' in art&&art.floor)sprite.setDepth(-93);
        // A trepadeira cobre a fachada: fica na frente do prédio, sem colisão.
        if(o.kind==='rail-vine')sprite.setDepth(y+40);
        if(o.scale)sprite.setScale(sprite.scaleX*o.scale,sprite.scaleY*o.scale);
        if(o.flip)sprite.setFlipX(true);
        if(o.overgrown){
          sprite.setData('no-shadow',true);
          if(!palette)this.grass.set(o.y*WORLD_WIDTH+o.x,sprite);
        }
        if(!palette&&art.height>=60&&!o.overgrown&&!('floor' in art))
          this.fading.push({sprite,left:x-sprite.displayWidth*.44,right:x+sprite.displayWidth*.44,top:y-sprite.displayHeight*.92,bottom:y-6});
      }else if(/^tallGrass[ABC]$/.test(o.kind)){
        sprite.setScale(sprite.scaleX*(o.scale??1)*.8,sprite.scaleY*(o.scale??1)*.6).setData('no-shadow',true);
      }
      if(tree&&!palette)this.fading.push({sprite:sprite.setData('wind-tree',true),left:x-sprite.displayWidth*.38,right:x+sprite.displayWidth*.38,top:y-sprite.displayHeight*.8,bottom:y});
      this.editorObjects.push({id:o.id,kind:o.kind,x:o.x,y:o.y,texture:sprite.texture.key,frame:sprite.frame.name});
    }
    drawExitSign(scene,edits?.points?.exit??RAILWAY_EXIT,edits?.points?.entry??RAILWAY_ENTRY);
  }
  update(_dt:number,player:{x:number;y:number}):void {
    for(const f of this.fading)f.sprite.setAlpha(player.x>f.left&&player.x<f.right&&player.y>f.top&&player.y<f.bottom?.5:1);
    for(const g of this.faded)g.setAlpha(1);
    this.faded.length=0;
    const x=Math.floor(player.x/TILE),y=Math.floor(player.y/TILE);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(x+dx<0||x+dx>=WORLD_WIDTH)continue;
      const g=this.grass.get((y+dy)*WORLD_WIDTH+x+dx);
      if(!g||player.y>g.y||g.y-player.y>g.displayHeight||Math.abs(player.x-g.x)>30)continue;
      this.faded.push(g.setAlpha(.6));
    }
  }
  destroy():void {
    if(this.scene.textures.exists(this.terrainTexture))this.scene.textures.remove(this.terrainTexture);
  }
}
