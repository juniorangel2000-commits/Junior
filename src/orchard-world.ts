import Phaser from 'phaser';
import {setupCityForestArt} from './city-forest-world';
import {ORCHARD_FRUITS,ORCHARD_KINDS,orchardArt,orchardFruitFile} from './data/orchard-art';
import {ORCHARD_ENTRY,ORCHARD_EXIT,orchardGate} from './data/orchard-gate';
import {ORCHARD_SIZE,createOrchardLayout,orchardBaseWater,orchardPondDistance,orchardTrailDistance,orchardFruitReady,type OrchardFruitSpot} from './data/orchard';
import {TILE} from './data/world-size';
import {waterFinishChannel} from './data/water-style';
import {drawEditorProp} from './editor-prop-art';
import {drawExitSign} from './exit-signs';
import {drawMapTerrainEdits} from './map-editor-terrain';
import {fruitWithinReach} from './systems/orchard-harvest';
import type {MapEditData} from './systems/map-editor';
import {readTerrainSprites} from './terrain-sprites';
import {addWaterMotion} from './water-motion';
import type {TilePoint} from './types';
import type {WorldEditorObject} from './world';

const GROUND='orchard-ground';
const smooth=(value:number)=>{
  const t=Math.max(0,Math.min(1,value));
  return t*t*(3-2*t);
};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;

export function preloadOrchard(scene:Phaser.Scene):void{
  for(const kind of ORCHARD_KINDS)if(!scene.textures.exists(kind))scene.load.image(kind,`assets/visual/orchard/${kind.slice(8)}${orchardArt(kind)?.fruit?'-tree':''}.png`);
  for(const fruit of ORCHARD_FRUITS)if(!scene.textures.exists(`orchard-fruit-${fruit}`))scene.load.image(`orchard-fruit-${fruit}`,orchardFruitFile(fruit));
}

function drawGround(scene:Phaser.Scene):void{
  if(!scene.textures.exists(GROUND)){
    const {width,height}=ORCHARD_SIZE,canvas=document.createElement('canvas');
    canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d')!,image=ctx.createImageData(width,height);
    const terrain=readTerrainSprites(scene)!;
    const size=terrain.water.size;
    for(let by=0;by<height;by+=4)for(let bx=0;bx<width;bx+=4){
      const x=(bx+2)/TILE,y=(by+2)/TILE;
      const edge=Math.min(x,y,width/TILE-x,height/TILE-y);
      const grass=.22+.15*Math.sin(x*.23+y*.18)+.12*Math.cos(x*.39-y*.37);
      const woods=(1-smooth((edge-2.8+Math.sin(x*.3+y*.2)*1.8)/14))*.66;
      const noise=.12*Math.sin(x*1.7+y*2.2)+.08*Math.cos(x*3.4-y*2.7);
      const trail=1-smooth((orchardTrailDistance(x,y)-.86+noise)/.62);
      const press=1-smooth((Math.hypot((x-41.5)/1.45,y-48.2)-1.4)/3.1);
      const shed=1-smooth((Math.hypot((x-68.5)/1.4,y-48.5)-1.5)/2.8);
      const worn=Math.max(trail,press*.71,shed*.67)*.94;
      const pond=orchardPondDistance(x,y);
      for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){
        const px=bx+dx,py=by+dy,at=(py*width+px)*4,p=((py%size)*size+px%size)*4;
        const d=Math.abs(pond)<.23?orchardPondDistance((px+.5)/TILE,(py+.5)/TILE):pond;
        const bank=(1-smooth((d-.15+noise)/.9))*.94;
        for(let c=0;c<3;c++){
          let land=mix(terrain.grass.pixels[p+c],terrain.meadow.pixels[p+c],grass);
          land=mix(land,terrain.forest.pixels[p+c],woods);
          land=mix(land,terrain['path-dry'].pixels[p+c],worn);
          const sand=mix(terrain['path-wet'].pixels[p+c],terrain.sand.pixels[p+c],smooth(d/.66)*.8+.16);
          image.data[at+c]=d<0?waterFinishChannel(terrain.water.pixels[p+c],c,d*TILE):mix(land,sand,bank);
        }
        image.data[at+3]=255;
      }
    }
    ctx.putImageData(image,0,0);
    scene.textures.addCanvas(GROUND,canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  scene.add.image(0,0,GROUND).setOrigin(0).setDepth(-100);
}
export class OrchardWorld {
  readonly layout:ReturnType<typeof createOrchardLayout>;
  readonly editorObjects:WorldEditorObject[]=[];
  private readonly fading:Phaser.GameObjects.Image[]=[];
  private readonly fruitSprites=new Map<string,Phaser.GameObjects.Image>();
  private readonly terrainKey:string;
  constructor(private readonly scene:Phaser.Scene,edits?:MapEditData,editor=false){
    setupCityForestArt(scene);
    this.layout=createOrchardLayout(edits);
    this.terrainKey=editor?'orchard-editor-terrain':'orchard-play-terrain';
    drawGround(scene);
    const terrain=Object.fromEntries(Object.entries(edits?.terrain??{}).filter(([key])=>{
      const [x,y]=key.split(',').map(Number);
      return !orchardGate(x,y);
    }));
    const sourceWater=(x:number,y:number)=>orchardBaseWater((x+.5)*TILE,(y+.5)*TILE);
    drawMapTerrainEdits(scene,terrain,this.terrainKey,sourceWater,'forest')?.setDepth(-99);
    if(!editor)addWaterMotion(scene,(x,y)=>this.layout.water((x+.5)*TILE,(y+.5)*TILE),this.layout.water,{...ORCHARD_SIZE,alpha:.32});
    for(const object of this.layout.objects){
      const {x,y}=this.layout.pivot(object),art=orchardArt(object.kind);
      const natural=object.kind==='standingTree'||object.kind==='pine';
      const sprite=natural?scene.add.image(x,y,`asset-${object.kind==='pine'?'pine':'tree'}-${object.variant??0}`).setOrigin(.5,256/264).setDisplaySize(166,211).setDepth(y)
        :drawEditorProp(scene,object.kind,x,y);
      if(!sprite)continue;
      if(object.scale)sprite.setScale(sprite.scaleX*object.scale,sprite.scaleY*object.scale);
      if(!editor&&(natural||art?.tree))sprite.setData('wind-tree',true);
      if(object.generated&&!natural)sprite.setData('no-shadow',true);
      if(!editor&&sprite.displayHeight>64)this.fading.push(sprite);
      this.editorObjects.push({id:object.id,kind:object.kind,x:object.x,y:object.y,texture:sprite.texture.key,frame:sprite.frame.name});
    }
    if(!editor)for(const fruit of this.layout.fruit){
      this.fruitSprites.set(fruit.id,scene.add.image(fruit.x,fruit.y,`orchard-fruit-${fruit.item}`).setOrigin(.5,.86).setDisplaySize(17,17).setDepth(fruit.y).setData('no-shadow',true));
    }
    drawExitSign(scene,edits?.points?.exit??ORCHARD_EXIT,edits?.points?.entry??ORCHARD_ENTRY);
  }
  fruitNear(player:TilePoint,day:number,harvest:Record<string,number>|undefined):OrchardFruitSpot|undefined{
    return this.layout.fruit.filter(fruit=>orchardFruitReady(harvest?.[fruit.id],day)&&fruitWithinReach(fruit,player))
      .sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];
  }
  showFruits(day:number,harvest:Record<string,number>|undefined):void{
    for(const [id,sprite] of this.fruitSprites)sprite.setVisible(orchardFruitReady(harvest?.[id],day));
  }
  update(_dt:number,player:TilePoint):void{
    for(const sprite of this.fading){
      const fade=player.y<sprite.y&&player.y>sprite.y-sprite.displayHeight*.88&&Math.abs(player.x-sprite.x)<sprite.displayWidth*.37;
      sprite.setAlpha(fade?.47:1);
    }
  }
  destroy():void{
    if(this.scene.textures.exists(this.terrainKey))this.scene.textures.remove(this.terrainKey);
  }
}
