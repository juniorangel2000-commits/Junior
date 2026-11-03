import Phaser from 'phaser';
import atlas from '../public/assets/visual/farm/buildings.json';
import type {SaveData,TilePoint} from './types';
import {FARM_BUILDINGS,type FarmKind} from './data/farm-buildings';
import {farmSites,farmStage} from './systems/farm-construction';
import {drawGate} from './fence-art';
export function preloadFarmConstructionArt(scene:Phaser.Scene):void{scene.load.image('farm-coop-open-source','assets/visual/farm/coop.png');scene.load.image('farm-buildings-source','assets/visual/farm/buildings.png');}
function texture(scene:Phaser.Scene,kind:FarmKind,stage:0|1|2):string{
 const key=`farm-building-${kind}-${stage}`;if(scene.textures.exists(key))return key;
 const separate=kind==='coop'&&stage===2,source=scene.textures.get(separate?'farm-coop-open-source':'farm-buildings-source').getSourceImage()as HTMLImageElement;
 const frame=separate?{x:0,y:0,width:source.width,height:source.height}:atlas.frames[`${kind}-${stage}` as keyof typeof atlas.frames],canvas=document.createElement('canvas');canvas.width=frame.width;canvas.height=frame.height;
 const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;ctx.drawImage(source,frame.x,frame.y,frame.width,frame.height,0,0,frame.width,frame.height);
 // The opening has its own native gate, so its picture and collision agree.
 if(stage===2&&kind!=='silo'){const scale=FARM_BUILDINGS[kind].width*32/frame.width;ctx.clearRect((frame.width-34/scale)/2,frame.height-35/scale,34/scale,35/scale);}
 scene.textures.addCanvas(key,canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);return key;
}
function buildingLayer(scene:Phaser.Scene,key:string,kind:FarmKind,front:boolean):string{
 const layer=key+(front?'-front':'-back');if(scene.textures.exists(layer))return layer;
 const source=scene.textures.get(key).getSourceImage()as HTMLCanvasElement,canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(source,0,0);
 const d=FARM_BUILDINGS[kind],scale=d.width*32/source.width,split=source.height-(d.height-d.bodyRows)*32/scale;
 if(front)ctx.clearRect(0,0,canvas.width,split);else ctx.clearRect(0,split,canvas.width,canvas.height-split);
 scene.textures.addCanvas(layer,canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);return layer;
}
export class FarmConstructionView{
 private objects:Phaser.GameObjects.GameObject[]=[];private signature='';private ghost?:Phaser.GameObjects.Image;
 constructor(private scene:Phaser.Scene,private save:()=>SaveData){this.refresh();}
 refresh():void{const sites=farmSites(this.save()),signature=JSON.stringify(sites);if(this.signature===signature)return;this.signature=signature;for(const o of this.objects)o.destroy();this.objects=[];
  for(const s of sites){const d=FARM_BUILDINGS[s.kind],stage=farmStage(s),key=texture(this.scene,s.kind,stage);
   const image=(texture:string,depth:number)=>{const o=this.scene.add.image((s.x+d.width/2)*32,(s.y+d.height)*32,texture).setOrigin(.5,1);o.setScale(d.width*32/o.width).setDepth(depth).setData('farmSite',s.id);this.objects.push(o);};
   if(s.finished&&s.kind!=='silo'){
    image(buildingLayer(this.scene,key,s.kind,false),(s.y+d.bodyRows)*32-1);
    image(buildingLayer(this.scene,key,s.kind,true),(s.y+d.height)*32-1);
    this.objects.push(...drawGate(this.scene,{kind:'gate',x:s.x+Math.floor(d.width/2),y:s.y+d.height-.5,rotation:0,open:s.gateOpen}));
   }else image(key,stage===0?-34:(s.y+d.height)*32-1);
  }
 }
 preview(kind:FarmKind|undefined,p:TilePoint,valid:boolean):void{if(!kind){this.ghost?.setVisible(false);return;}const d=FARM_BUILDINGS[kind],key=texture(this.scene,kind,0);if(!this.ghost)this.ghost=this.scene.add.image(0,0,key).setOrigin(.5,1).setDepth(3999).setAlpha(.6);this.ghost.setTexture(key).setPosition((p.x+d.width/2)*32,(p.y+d.height)*32).setScale(d.width*32/this.ghost.width).setTint(valid?0xffffff:0xdd8888).setVisible(true);}
 destroy():void{for(const o of this.objects)o.destroy();this.ghost?.destroy();this.objects=[];}
}
