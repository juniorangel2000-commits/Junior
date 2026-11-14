import Phaser from 'phaser';
import stableAtlas from '../public/assets/visual/farm/stable.json';
import atlas from '../public/assets/visual/farm/buildings.json';
import type {SaveData,TilePoint} from './types';
import {FARM_BUILDINGS,type FarmKind} from './data/farm-buildings';
import {farmSites,farmStage} from './systems/farm-construction';
import {drawGate} from './fence-art';
export function preloadFarmConstructionArt(scene:Phaser.Scene):void{scene.load.image('farm-aprisco-source','assets/visual/farm/aprisco.png');scene.load.image('farm-stable-source','assets/visual/farm/stable.png');scene.load.image('farm-stable-stages-source','assets/visual/farm/stable-stages.png');scene.load.image('farm-coop-open-source','assets/visual/farm/coop.png');scene.load.image('farm-buildings-source','assets/visual/farm/buildings.png');}
function texture(scene:Phaser.Scene,kind:FarmKind,stage:0|1|2):string{
 const key=`farm-building-${kind}-${stage}`;if(scene.textures.exists(key))return key;
 const stable=kind==='stable'?stableAtlas.frames[`stable-${stage}` as keyof typeof stableAtlas.frames]:undefined;
 const separate=(kind==='coop'||kind==='aprisco')&&stage===2,source=scene.textures.get(stable?(stage===2?'farm-stable-source':'farm-stable-stages-source'):separate?(kind==='aprisco'?'farm-aprisco-source':'farm-coop-open-source'):'farm-buildings-source').getSourceImage()as HTMLImageElement;
 const frame=stable??(separate?{x:0,y:0,width:source.width,height:source.height}:atlas.frames[`${kind==='aprisco'?'barn':kind}-${stage}` as keyof typeof atlas.frames]),canvas=document.createElement('canvas');canvas.width=frame.width;canvas.height=kind==='aprisco'&&stage===2?930+Math.round((FARM_BUILDINGS[kind].height-FARM_BUILDINGS[kind].bodyRows)*32*frame.width/(FARM_BUILDINGS[kind].width*32)):frame.height;
 const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;if(kind==='aprisco'&&stage===2){ctx.drawImage(source,0,0,frame.width,930,0,0,frame.width,930);ctx.drawImage(source,0,930,frame.width,frame.height-930,0,930,frame.width,canvas.height-930);}else ctx.drawImage(source,frame.x,frame.y,frame.width,frame.height,0,0,frame.width,frame.height);
 // The opening has its own native gate, so its picture and collision agree.
 if(stage===2&&kind!=='silo'&&!FARM_BUILDINGS[kind].openYard){const scale=FARM_BUILDINGS[kind].width*32/frame.width;ctx.clearRect((frame.width-34/scale)/2,frame.height-35/scale,34/scale,35/scale);}
 scene.textures.addCanvas(key,canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);return key;
}
function buildingLayer(scene:Phaser.Scene,key:string,kind:FarmKind,front:boolean):string{
 const layer=key+(front?'-front':'-back');if(scene.textures.exists(layer))return layer;
 const source=scene.textures.get(key).getSourceImage()as HTMLCanvasElement,canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(source,0,0);
 const d=FARM_BUILDINGS[kind],scale=d.width*32/source.width,split=source.height-(d.height-d.bodyRows)*32/scale;
 if(front)ctx.clearRect(0,0,canvas.width,split);else ctx.clearRect(0,split,canvas.width,canvas.height-split);
 scene.textures.addCanvas(layer,canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);return layer;
}
/** Piso e parede ficam atrás dos moradores; postes e telhado têm camadas próprias. */
function stableLayer(scene:Phaser.Scene,key:string,part:'body'|'roof'|'posts'):string{
 const layer=key+'-'+part;if(scene.textures.exists(layer))return layer;
 const source=scene.textures.get(key).getSourceImage()as HTMLCanvasElement,canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
 const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;const w=canvas.width,h=canvas.height;
 if(part==='posts'){for(const x of [.05,.82])ctx.drawImage(source,x*w,.48*h,.13*w,.52*h,x*w,.48*h,.13*w,.52*h);}
 else{ctx.drawImage(source,0,0);if(part==='roof')ctx.clearRect(0,.56*h,w,h);else{ctx.clearRect(0,0,w,.56*h);for(const x of [.05,.82])ctx.clearRect(x*w,.48*h,.13*w,.52*h);}}
 scene.textures.addCanvas(layer,canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);return layer;
}
export class FarmConstructionView{
 private roofs:{site:ReturnType<typeof farmSites>[number];image:Phaser.GameObjects.Image}[]=[];
 private objects:Phaser.GameObjects.GameObject[]=[];private signature='';private ghost?:Phaser.GameObjects.Image;
 constructor(private scene:Phaser.Scene,private save:()=>SaveData,private actors:()=>readonly TilePoint[]=()=>[]){this.refresh();}
 refresh():void{const sites=farmSites(this.save()),signature=JSON.stringify(sites);if(this.signature===signature)return;this.signature=signature;for(const o of this.objects)o.destroy();this.objects=[];this.roofs=[];
  for(const s of sites){const d=FARM_BUILDINGS[s.kind],stage=farmStage(s),key=texture(this.scene,s.kind,stage);
   const image=(texture:string,depth:number)=>{const o=this.scene.add.image((s.x+d.width/2)*32,(s.y+d.height)*32,texture).setOrigin(.5,1);o.setScale(d.width*32/o.width).setDepth(depth).setData('farmSite',s.id);this.objects.push(o);return o;};
   if(s.finished&&d.openYard){
    image(stableLayer(this.scene,key,'body'),(s.y+d.bodyRows)*32-1);
    image(stableLayer(this.scene,key,'posts'),(s.y+d.height)*32);
    this.roofs.push({site:s,image:image(stableLayer(this.scene,key,'roof'),(s.y+d.height)*32+1)});
   }else if(s.finished&&s.kind!=='silo'){
    image(buildingLayer(this.scene,key,s.kind,false),(s.y+d.bodyRows)*32-1);
    image(buildingLayer(this.scene,key,s.kind,true),(s.y+d.height)*32-1);
    this.objects.push(...drawGate(this.scene,{kind:'gate',x:s.x+Math.floor(d.width/2),y:s.y+d.height-.5,rotation:0,open:s.gateOpen}));
   }else image(key,stage===0?-34:(s.y+d.height)*32-1);
  }
 }
 update():void{const actors=this.actors();for(const r of this.roofs){const d=FARM_BUILDINGS[r.site.kind],inside=actors.some(p=>p.x>(r.site.x+1)*32&&p.x<(r.site.x+d.width-1)*32&&p.y>(r.site.y+d.bodyRows)*32-22&&p.y<(r.site.y+d.height)*32+10);r.image.setAlpha(inside?.35:1);}}
 preview(kind:FarmKind|undefined,p:TilePoint,valid:boolean):void{this.update();if(!kind){this.ghost?.setVisible(false);return;}const d=FARM_BUILDINGS[kind],key=texture(this.scene,kind,0);if(!this.ghost)this.ghost=this.scene.add.image(0,0,key).setOrigin(.5,1).setDepth(3999).setAlpha(.6);this.ghost.setTexture(key).setPosition((p.x+d.width/2)*32,(p.y+d.height)*32).setScale(d.width*32/this.ghost.width).setTint(valid?0xffffff:0xdd8888).setVisible(true);}
 destroy():void{for(const o of this.objects)o.destroy();this.ghost?.destroy();this.objects=[];}
}
