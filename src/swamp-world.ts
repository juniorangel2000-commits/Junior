import Phaser from 'phaser';
import type { WorldEditorObject } from './world';
import type { MapEditData, TerrainKind } from './systems/map-editor';
import { natureArt } from './data/nature-catalog';
import { createSwampLayout, SWAMP_SIZE, swampEntry, swampExit, swampTrailDistance, swampWaterDistance, tileCenter } from './data/swamp';
import { SWAMP_GROUND, SWAMP_KINDS, SWAMP_ART } from './data/swamp-art';
import { directionFromVector } from './character-directions';
import { readTerrainSprites } from './terrain-sprites';
import { terrainPaintAlpha } from './data/terrain-paint';
import { waterFinishChannel } from './data/water-style';
import { addWaterMotion } from './water-motion';
import { drawExitSign } from './exit-signs';
import frames from '../public/assets/visual/swamp/animals.json';

const ROOT='assets/visual/swamp/';
const TEXTURE_SIZE=128;
type Ground=typeof SWAMP_GROUND[number];
const paintMaterial:Partial<Record<TerrainKind,Ground>>={
  grass:'sod',meadow:'sod',forest:'peat',moss:'peat',forestPath:'mud',path:'mud',wetPath:'mud',soil:'mud',sand:'silt',
};
const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
let nextTerrain=0;

export function preloadSwamp(scene:Phaser.Scene):void {
  for (const kind of SWAMP_KINDS) {
    if(scene.textures.exists(kind))continue;
    const name=kind.slice(6);
    if(name==='frog'||name==='caiman')scene.load.spritesheet(kind,ROOT+name+'.png',{frameWidth:frames[name],frameHeight:frames[name]});
    else scene.load.image(kind,ROOT+name+'.png');
  }
  for(const material of SWAMP_GROUND)if(!scene.textures.exists('swamp-ground-'+material))scene.load.image('swamp-ground-'+material,ROOT+material+'.png');
}

function groundPixels(scene:Phaser.Scene,material:Ground):Uint8ClampedArray {
  const image=scene.textures.get('swamp-ground-'+material).getSourceImage() as HTMLImageElement;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=TEXTURE_SIZE;
  const ctx=canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(image,0,0,TEXTURE_SIZE,TEXTURE_SIZE);
  const data=ctx.getImageData(0,0,TEXTURE_SIZE,TEXTURE_SIZE).data,source=data.slice();
  // Blenda as bordas opostas da textura para repetir sem linhas na turfa e na lama.
  for(let y=0;y<TEXTURE_SIZE;y++)for(let x=0;x<TEXTURE_SIZE;x++){
    const wx=Math.max(0,1-(Math.min(x,TEXTURE_SIZE-1-x)+.5)/12)*.5;
    const wy=Math.max(0,1-(Math.min(y,TEXTURE_SIZE-1-y)+.5)/12)*.5;
    const index=(y*TEXTURE_SIZE+x)*4,mirrorX=(y*TEXTURE_SIZE+TEXTURE_SIZE-1-x)*4;
    const mirrorY=((TEXTURE_SIZE-1-y)*TEXTURE_SIZE+x)*4,other=((TEXTURE_SIZE-1-y)*TEXTURE_SIZE+TEXTURE_SIZE-1-x)*4;
    for(let k=0;k<3;k++)data[index+k]=(source[index+k]*(1-wx)+source[mirrorX+k]*wx)*(1-wy)+
      (source[mirrorY+k]*(1-wx)+source[other+k]*wx)*wy;
  }
  return data;
}

function bakeGround(scene:Phaser.Scene,layout:ReturnType<typeof createSwampLayout>,edits?:MapEditData):HTMLCanvasElement {
  const common=readTerrainSprites(scene)!;
  const sod=groundPixels(scene,'sod'),mud=groundPixels(scene,'mud'),peat=groundPixels(scene,'peat'),silt=groundPixels(scene,'silt');
  const materials={sod,mud,peat,silt};
  const canvas=document.createElement('canvas');
  canvas.width=SWAMP_SIZE.width;canvas.height=SWAMP_SIZE.height;
  const ctx=canvas.getContext('2d')!,pixels=ctx.createImageData(canvas.width,canvas.height),rgba=pixels.data;
  const water=common.water;
  for(let by=0;by<canvas.height;by+=4)for(let bx=0;bx<canvas.width;bx+=4){
    const x=bx+2,y=by+2,distance=swampWaterDistance(x,y),path=swampTrailDistance(x,y);
    const noise=Math.sin(x*.026+y*.037)*5+Math.cos(y*.065-x*.019)*4;
    const wet=smooth((125-distance+noise)/132)*.74;
    const trail=smooth((56-path+noise)/22)*.95;
    const sediment=smooth((30-distance+noise)/28)*.68;
    const variation=1+Math.sin(x*.005+y*.003)*.06+Math.cos(y*.012-x*.012)*.03;
    const terrain=edits?.terrain[`${Math.floor(bx/32)},${Math.floor(by/32)}`];
    const material=terrain&&paintMaterial[terrain];
    const custom=terrain==='wood'||terrain==='paving'?common[terrain]:undefined;
    const centersWater=distance< -8;
    for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){
      const px=bx+dx,py=by+dy,i=(py*canvas.width+px)*4;
      const sample=((py%TEXTURE_SIZE)*TEXTURE_SIZE+px%TEXTURE_SIZE)*4;
      const wav=((py%water.size)*water.size+px%water.size)*4;
      const waterPoint=terrain||Math.abs(distance)<8?layout.water(px+.5,py+.5):centersWater;
      const alpha=terrain&&terrain!=='water'?terrainPaintAlpha(edits!.terrain,px+.5,py+.5):0;
      for(let k=0;k<3;k++){
        const ground=sod[sample+k]*(1-wet)+peat[sample+k]*wet;
        const bank=ground*(1-sediment)+silt[sample+k]*sediment;
        let value=(bank*(1-trail)+mud[sample+k]*trail)*variation;
        if(material)value=value*(1-alpha)+materials[material][sample+k]*alpha;
        if(custom)value=value*(1-alpha)+custom.pixels[((py%custom.size)*custom.size+px%custom.size)*4+k]*alpha;
        rgba[i+k]=waterPoint?waterFinishChannel(water.pixels[wav+k],k,-12):value;
      }
      rgba[i+3]=255;
    }
  }
  ctx.putImageData(pixels,0,0);
  return canvas;
}

class SwampFauna {
  private elapsed=0;
  private wait:number;
  private from:{x:number;y:number};
  private to:{x:number;y:number};
  private turn=0;
  private frog:boolean;
  constructor(
    private sprite:Phaser.GameObjects.Sprite,
    private home:{x:number;y:number},
    private layout:ReturnType<typeof createSwampLayout>,
    index:number,
  ){
    this.frog=sprite.texture.key==='swamp-frog';
    this.from={...home};this.to={...home};this.wait=this.frog?2+index%5:0;
    this.turn=index*.75;
  }
  update(dt:number):void {
    if(this.frog)this.hop(dt);
    else this.swim(dt);
  }
  private hop(dt:number):void {
    if(this.wait>0){this.wait-=dt;return;}
    if(this.elapsed===0){
      const origin=this.from;
      for(let i=0;i<8;i++){
        const a=this.turn+i*Math.PI/4,x=origin.x+Math.cos(a)*28,y=origin.y+Math.sin(a)*23;
        if(Math.hypot(x-this.home.x,y-this.home.y)>54||this.layout.inWater(x,y)||this.layout.blocked(x,y))continue;
        this.to={x,y};break;
      }
      if(this.to===this.from){this.wait=4;return;}
      this.sprite.setFlipX(this.to.x<this.from.x);
    }
    this.elapsed+=dt;
    const motion=Math.max(0,Math.min(1,(this.elapsed-.11)/.32));
    const x=Phaser.Math.Linear(this.from.x,this.to.x,motion),y=Phaser.Math.Linear(this.from.y,this.to.y,motion);
    this.sprite.setFrame(this.elapsed<.11?1:motion<1?2:3).setPosition(x,y-Math.sin(motion*Math.PI)*13).setDepth(y);
    if(this.elapsed>=.56){
      this.from=this.to;this.elapsed=0;this.wait=3.4+(this.turn%3);this.turn+=2.2;
      this.sprite.setFrame(0);
    }
  }
  private swim(dt:number):void {
    this.elapsed+=dt;
    const a=this.turn+this.elapsed*.31;
    const p={x:this.home.x+Math.cos(a)*62,y:this.home.y+Math.sin(a)*45};
    const sprite=this.sprite,dx=p.x-sprite.x,dy=p.y-sprite.y;
    if(this.layout.inWater(p.x,p.y)&&!this.layout.blocked(p.x,p.y)){
      const direction=directionFromVector(Math.abs(dx)>Math.abs(dy)?dx:0,Math.abs(dy)>=Math.abs(dx)?dy:0);
      const row=direction==='right'?0:direction==='down'?1:direction==='left'?2:3;
      if(Math.hypot(dx,dy)<5||this.elapsed<.1)sprite.setPosition(p.x,p.y);
      else{
        const distance=Math.hypot(dx,dy),step=Math.min(distance,dt*32);
        const x=sprite.x+dx/distance*step,y=sprite.y+dy/distance*step;
        if(this.layout.inWater(x,y)&&!this.layout.blocked(x,y))sprite.setPosition(x,y);
      }
      sprite.setFrame(row*4+Math.floor(this.elapsed*7)%4).setDepth(-77);
    }
  }
}

export class SwampWorld {
  readonly layout:ReturnType<typeof createSwampLayout>;
  readonly editorObjects:WorldEditorObject[]=[];
  private readonly fauna:SwampFauna[]=[];
  private readonly trees:Phaser.GameObjects.Image[]=[];
  private readonly terrainKey:string;
  constructor(private scene:Phaser.Scene,edits?:MapEditData,palette=false){
    this.layout=createSwampLayout(edits);
    this.terrainKey='swamp-ground-bake-'+(++nextTerrain);
    scene.textures.addCanvas(this.terrainKey,bakeGround(scene,this.layout,edits))!.setFilter(Phaser.Textures.FilterMode.NEAREST);
    scene.add.image(0,0,this.terrainKey).setOrigin(0).setDepth(-100);
    if(!palette)addWaterMotion(scene,(x,y)=>this.layout.water(x*32+16,y*32+16),this.layout.water,{...SWAMP_SIZE,alpha:.4,depth:-80});
    let index=0;
    for(const object of this.layout.objects){
      const art=natureArt(object.kind);
      const fallback:Partial<Record<WorldEditorObject['kind'],string>>={
        standingTree:'asset-tree-0',pine:'asset-pine-0',stone:'asset-small-stones',vein:'lake-rock-0',tree:'asset-new-branches',
        fiber:'forest-detail-fern',seeds:'asset-berry-bush',scrap:'asset-scrap',
      };
      const texture=art?.texture??fallback[object.kind];
      if(!texture||!scene.textures.exists(texture))continue;
      const p=tileCenter(object);
      this.editorObjects.push({...object,texture,...(object.kind==='swamp-caiman'||object.kind==='swamp-frog'?{frame:'0'}:{})});
      if(object.kind==='swamp-caiman'||object.kind==='swamp-frog'){
        const wet=object.kind==='swamp-caiman';
        const side=wet?108:43;
        const sprite=scene.add.sprite(p.x,p.y,texture,0).setOrigin(.5,wet?.5:.94).setDisplaySize(side,side)
          .setDepth(wet?-77:p.y).setAlpha(wet?.87:1).setData('swamp-animal',object.kind);
        if(!palette)this.fauna.push(new SwampFauna(sprite,p,this.layout,index++));
        continue;
      }
      const sprite=scene.add.image(p.x,p.y,texture).setOrigin(.5,art?.pivot??1)
        .setDisplaySize(art?.width??48,art?.height??48).setDepth(p.y).setData('swamp-prop',object.id);
      if(object.kind==='swamp-boardwalk'){
        sprite.setDepth(-65);
        const frame=sprite.frame,cut=Math.round(frame.height*.56);
        const front=scene.add.image(p.x,p.y,texture).setOrigin(.5,SWAMP_ART['swamp-boardwalk'].pivot)
          .setDisplaySize(art!.width,art!.height).setDepth(p.y+22)
          .setCrop(0,cut,frame.width,frame.height-cut);
        front.setData('swamp-boardwalk-rail',true);
      }
      if(object.kind==='swamp-lilies')sprite.setDepth(-76);
      if(/^swamp-(cypress|willow|alder)$/.test(object.kind)){
        this.trees.push(sprite.setData('wind-tree',true));
        scene.add.ellipse(p.x,p.y,art!.width*.57,art!.height*.21,0x1e2012,.24).setDepth(-68);
      }
    }
    drawExitSign(scene,swampExit(edits),swampEntry(edits));
  }
  update(delta:number,player:{x:number;y:number}):void {
    this.fauna.forEach(a=>a.update(delta));
    for(const tree of this.trees){
      const behind=player.y<tree.y&&player.y>tree.y-tree.displayHeight*.82&&Math.abs(player.x-tree.x)<tree.displayWidth*.4;
      tree.setAlpha(behind?.44:1);
    }
  }
  destroy():void {
    if(this.scene.textures.exists(this.terrainKey))this.scene.textures.remove(this.terrainKey);
  }
}
