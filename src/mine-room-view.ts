import type Phaser from 'phaser';
import {FixtureLighting} from './fixture-lighting';
import {MINE_ROOM,MINE_SOLIDS,MINE_ENTRY_TIMBER,MINE_PORTAL_TIMBERS,type MinePolygon} from './data/mine-room';
const GROUND='mine-first-gallery';
export function preloadMineRoom(scene:Phaser.Scene):void{
 if(!scene.textures.exists(GROUND))scene.load.image(GROUND,MINE_ROOM.file);
}
/** Source-aligned silhouettes let characters pass behind tall props without covering the floor. */
function silhouette(scene:Phaser.Scene,id:string,polygon:MinePolygon,depth:number):Phaser.GameObjects.Image{
 const left=Math.floor(Math.min(...polygon.map(p=>p[0]))),top=Math.floor(Math.min(...polygon.map(p=>p[1])));
 const width=Math.ceil(Math.max(...polygon.map(p=>p[0])))-left+1,height=Math.ceil(Math.max(...polygon.map(p=>p[1])))-top+1,key='mine-foreground-'+id;
 if(!scene.textures.exists(key)){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const g=canvas.getContext('2d')!;g.imageSmoothingEnabled=false;
  g.beginPath();polygon.forEach(([x,y],i)=>i?g.lineTo(x-left,y-top):g.moveTo(x-left,y-top));g.closePath();g.clip();
  g.drawImage(scene.textures.get(GROUND).getSourceImage() as HTMLImageElement,-left,-top);scene.textures.addCanvas(key,canvas)!.setFilter(0);
 }
 return scene.add.image(left*MINE_ROOM.scale,top*MINE_ROOM.scale,key).setOrigin(0).setDisplaySize(width*MINE_ROOM.scale,height*MINE_ROOM.scale).setDepth(depth).setData('mine-occluder',id);
}
export class MineRoomView{
 readonly ground:Phaser.GameObjects.Image;
 private readonly layers:Phaser.GameObjects.GameObject[]=[];
 private readonly lights:FixtureLighting;
 constructor(scene:Phaser.Scene){
  scene.textures.get(GROUND).setFilter(0);
  this.ground=scene.add.image(0,0,GROUND).setOrigin(0).setDisplaySize(MINE_ROOM.width,MINE_ROOM.height).setDepth(-100);this.layers.push(this.ground);
  for(const solid of MINE_SOLIDS)if(solid.art)this.layers.push(silhouette(scene,solid.id,solid.art,solid.depth*MINE_ROOM.scale));
  this.layers.push(silhouette(scene,'entrance-timber',MINE_ENTRY_TIMBER,2000));
  MINE_PORTAL_TIMBERS.forEach((polygon,i)=>this.layers.push(silhouette(scene,'portal-'+i,polygon,2000)));
  for(const [x,y]of [[359,269],[810,163],[1204,300],[799,825]])this.layers.push(scene.add.zone(x*MINE_ROOM.scale,y*MINE_ROOM.scale,1,1).setData('fixture-light',{radius:32,always:true,strength:.3}));
  this.lights=new FixtureLighting(scene);
 }
 update():void{this.lights.update(0);}
 destroy():void{this.lights.destroy();for(const layer of this.layers)if(layer.active)layer.destroy();}
}
