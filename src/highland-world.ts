import Phaser from 'phaser';
import type {WorldEditorObject} from './world';
import type {MapEditData} from './systems/map-editor';
import {HIGHLAND_OBJECTS,highlandObjects,highlandWaterPoint,highlandBlockedPoint,highlandDeck} from './data/highland';
import {addWaterMotion} from './water-motion';
import {drawMapTerrainEdits} from './map-editor-terrain';
export function preloadHighland(scene:Phaser.Scene):void {for(const key of ['terrain','mine','bridge'])if(!scene.textures.exists('highland-'+key)&&!scene.textures.exists('highland-'+key+'-source'))scene.load.image('highland-'+key+'-source','assets/visual/highland/'+key+'.png');}
export function setupHighlandArt(scene:Phaser.Scene):void {
 for(const key of ['terrain','mine','bridge']){const id='highland-'+key;if(scene.textures.exists(id))continue;const src=scene.textures.get(id+'-source').getSourceImage() as HTMLImageElement,c=document.createElement('canvas');c.width=src.width;c.height=src.height;const g=c.getContext('2d')!;g.drawImage(src,0,0);if(key!=='terrain'){const p=g.getImageData(0,0,c.width,c.height);for(let i=3;i<p.data.length;i+=4)if(p.data[i]<128)p.data[i]=0;g.putImageData(p,0,0);}scene.textures.addCanvas(id,c)!.setFilter(0);}
 if(!scene.textures.exists('highland-bridge-front')){const src=scene.textures.get('highland-bridge').getSourceImage() as HTMLCanvasElement,c=document.createElement('canvas');c.width=src.width;c.height=src.height;c.getContext('2d')!.drawImage(src,0,310,src.width,125,0,310,src.width,125);scene.textures.addCanvas('highland-bridge-front',c)!.setFilter(0);}
}
export class HighlandWorld {
 readonly trees:Phaser.GameObjects.Image[]=[];
 readonly editorObjects:WorldEditorObject[]=[];
 private objects:Phaser.GameObjects.GameObject[]=[];
 private fall:Phaser.GameObjects.Graphics;
 constructor(scene:Phaser.Scene,readonly edits?:MapEditData){
  setupHighlandArt(scene);const before=new Set(scene.children.list);scene.add.image(0,0,'highland-terrain').setOrigin(0).setDepth(-100);
  if(edits)drawMapTerrainEdits(scene,edits.terrain,'highland-ground-edits',()=>false,'forest',false);
  const source=scene.textures.get('highland-terrain').getSourceImage() as HTMLCanvasElement,pixels=source.getContext('2d')!.getImageData(0,0,source.width,source.height).data;
  const wet=(x:number,y:number)=>{if(x<0||y<0||x>=1536||y>=1024||!highlandWaterPoint(x,y,edits)||highlandDeck(x,y,edits))return false;const i=(Math.floor(y)*source.width+Math.floor(x))*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];return b>r*1.12&&g>r*1.15||r>155&&g>r*.96&&b>r*.96;};
  addWaterMotion(scene,(x,y)=>highlandWaterPoint((x+.5)*32,(y+.5)*32,edits),wet,{width:1536,height:1024,alpha:.9,opacity:(_x,y)=>Math.max(0,Math.min(1,(905-y)/45))});
  this.fall=scene.add.graphics().setDepth(-75);
  for(const o of highlandObjects(edits)){
   const image=scene.add.image(o.x,o.y,o.texture).setOrigin(.5,o.kind==='highland-bridge'||o.kind==='highland-mine'?.5:1).setDisplaySize(o.width,o.height).setRotation(o.rotation).setDepth(o.kind==='highland-bridge'?0:o.y);
   if(o.kind==='highland-bridge')scene.add.image(o.x,o.y,'highland-bridge-front').setDisplaySize(o.width,o.height).setRotation(o.rotation).setDepth(o.y+5);
   if(o.kind==='standingTree'||o.kind==='pine')this.trees.push(image);
   this.editorObjects.push({id:o.id,kind:o.kind,x:Math.floor(o.x/32),y:Math.floor(o.y/32),texture:o.texture});
   if(o.kind==='highland-mine')scene.add.zone(o.x-110,o.y-48,1,1).setData('fixture-light',{radius:68,always:true});
  }
  this.objects=scene.children.list.filter(o=>!before.has(o));
 }
 blockedPoint=(x:number,y:number)=>highlandBlockedPoint(x,y,this.edits);
 update(time:number):void{this.fall.clear();for(let i=0;i<10;i++){const t=(time*.0015+i*.137)%1,x=799+i*10.5,y=908+t*110;this.fall.lineStyle(i%3===0?2:1,0xd8f2ec,Math.sin(t*Math.PI)*.32).lineBetween(x,y,x+Math.sin(time*.002+i)*1.3,y+12+i%4*3);}}
 destroy():void{for(const o of this.objects)if(o.active)o.destroy();this.objects=[];this.trees.length=0;}
}
export const highlandTemplate=(kind:string)=>HIGHLAND_OBJECTS.find(o=>o.kind===kind);
