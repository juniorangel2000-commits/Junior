import {createMineMineralAtlas,MINE_ORE_ATLASES,MINE_TERRAIN_ATLAS,MINE_HIDDEN_ROCK_TILE,mineMineralTile} from './underground-mineral-art';
import {mineFixedLights} from './systems/underground-light';
import {mineMaterialAt} from './systems/underground-geology';
import {MINE_FLOOR_CORNER_MASKS} from './data/mine-wall-shape';
import Phaser from 'phaser';
import type {TilePoint} from './types';
import {MineRoomView} from './mine-room-view';
import {UNDERGROUND,MINE_SPINE,MINE_DECOR,inMineEntrance} from './data/underground-layout';
import {mineRockAt,mineWallMask,type UndergroundState} from './systems/underground';
const ATLAS=MINE_TERRAIN_ATLAS,TILE=32;

export class UndergroundView{
 readonly hall?:MineRoomView;
 readonly ores:Phaser.Tilemaps.TilemapLayer;
 readonly terrain:Phaser.Tilemaps.TilemapLayer;
 private readonly map:Phaser.Tilemaps.Tilemap;
 private readonly decorations:Phaser.GameObjects.GameObject[]=[];
 private tracks:Phaser.GameObjects.Graphics;
 private damage=new Map<number,Phaser.GameObjects.Graphics>();
 localUpdates=0;
 constructor(private scene:Phaser.Scene,private state:()=>UndergroundState,includeEntrance=true){
  createMineMineralAtlas(scene);
  this.map=scene.make.tilemap({tileWidth:TILE,tileHeight:TILE,width:UNDERGROUND.width,height:UNDERGROUND.height});
  const tiles=this.map.addTilesetImage(ATLAS,ATLAS,32,32,0,0)!;
  this.terrain=this.map.createBlankLayer('continuous-mine',tiles)!.setDepth(-110).setData('mine-terrain',true);
  const oreTiles=MINE_ORE_ATLASES.map(a=>this.map.addTilesetImage(a.key,a.key,32,32,0,0,a.gid)!);this.ores=this.map.createBlankLayer('mine-minerals',oreTiles)!.setDepth(-107).setData('mine-ores',true);
  for(let y=0;y<UNDERGROUND.height;y++)for(let x=0;x<UNDERGROUND.width;x++)this.drawCell(x,y);
  if(includeEntrance)this.hall=new MineRoomView(scene,{x:UNDERGROUND.entryX,y:UNDERGROUND.entryY},true);
  this.drawDamage(Object.keys(this.state().changes).map(Number));
  this.tracks=scene.add.graphics().setDepth(-106).setData('mine-tracks',true);this.drawTracks();
  this.placeDecorations();
 }
 get ground(){return this.hall?.ground??this.terrain;}
 private drawCell(x:number,y:number):void{
  if(x<0||y<0||x>=UNDERGROUND.width||y>=UNDERGROUND.height)return;
  const px=x*32+16,py=y*32+16;
  if(inMineEntrance(px,py)&&!(px>=UNDERGROUND.entryX+332&&px<=UNDERGROUND.entryX+388&&py<UNDERGROUND.entryY+154)){this.terrain.removeTileAt(x,y);return;}
  const mine=this.state(),material=mineMaterialAt(mine,x,y),mask=mineWallMask(mine,x,y);this.ores.removeTileAt(x,y);
  if(mineRockAt(mine,x,y)&&material!=='stone'&&mask!==15)this.ores.putTileAt(mineMineralTile(material,mask,(y%8)*8+x%8),x,y,false);
  const pattern=(y%8)*8+x%8;
  if(!mineRockAt(mine,x,y)){const kind=(MINE_FLOOR_CORNER_MASKS as readonly number[]).indexOf(mask);this.terrain.putTileAt(kind<0?pattern:1088+kind*64+pattern,x,y,false);return;}
  this.terrain.putTileAt(mask===15?MINE_HIDDEN_ROCK_TILE:64+mask*64+pattern,x,y,false);
 }
 /** The affected cell and its four neighbours are the entire terrain update. */
 refresh(cells:readonly TilePoint[]):void{
  const seen=new Set<string>();for(const p of cells){const id=p.x+','+p.y;if(seen.has(id))continue;seen.add(id);this.drawCell(p.x,p.y);this.localUpdates++;}
  this.drawDamage(cells.map(p=>p.y*UNDERGROUND.width+p.x));
 }
 private drawDamage(indices:readonly number[]):void{
  const mine=this.state();
  for(const i of new Set(indices)){
   const hits=mine.changes[i]?.hits,old=this.damage.get(i);
   if(!hits){old?.destroy();this.damage.delete(i);continue;}
   const g=old??this.scene.add.graphics().setPosition((i%UNDERGROUND.width)*32,Math.floor(i/UNDERGROUND.width)*32).setDepth(-105).setData('mine-cracks',true);this.damage.set(i,g);g.clear();
   g.lineStyle(1.3,0x211611,.95).beginPath().moveTo(16,2).lineTo(11,9).lineTo(18,16).lineTo(12,25).lineTo(16,31).strokePath();
   if(hits>=2)g.beginPath().moveTo(18,16).lineTo(25,10).lineTo(31,14).strokePath();
   if(hits>=3)g.beginPath().moveTo(12,25).lineTo(4,21).lineTo(1,25).strokePath();
   if(hits>=4)g.beginPath().moveTo(11,9).lineTo(4,5).lineTo(1,9).strokePath();
  }
 }
 private drawTracks():void{
  const g=this.tracks,curve=new Phaser.Curves.Spline(MINE_SPINE.map(p=>new Phaser.Math.Vector2(p.x*32+16,p.y*32+16))),points=curve.getSpacedPoints(Math.ceil(curve.getLength()/6));
  const normal=(i:number)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],d=Math.max(1,Math.hypot(b.x-a.x,b.y-a.y));return{x:-(b.y-a.y)/d,y:(b.x-a.x)/d};};
  for(let i=0;i<points.length;i+=4){const p=points[i],n=normal(i);g.lineStyle(5,0x37241e,.95).lineBetween(p.x-n.x*15,p.y-n.y*15,p.x+n.x*15,p.y+n.y*15);g.lineStyle(2,0x805333,.9).lineBetween(p.x-n.x*14,p.y-n.y*14,p.x+n.x*14,p.y+n.y*14);}
  for(const side of [-1,1])for(const [width,color]of [[3,0x2e2424],[1.2,0x9a8c6c]]){
   g.lineStyle(width,color,.95).beginPath();points.forEach((p,i)=>{const n=normal(i),x=p.x+n.x*side*9,y=p.y+n.y*side*9;if(i)g.lineTo(x,y);else g.moveTo(x,y);});g.strokePath();
  }
 }
 private placeDecorations():void{
  const source=this.scene.textures.get('mine-first-gallery').getSourceImage() as HTMLImageElement;
  for(const d of MINE_DECOR){
   const key='underground-prop-'+d.kind;
   if(!this.scene.textures.exists(key)){
    const crop=d.kind==='cart'?{x:270,y:449,w:170,h:150}:{x:821,y:231,w:104,h:117},canvas=document.createElement('canvas');canvas.width=crop.w;canvas.height=crop.h;const c=canvas.getContext('2d')!;
    // Alpha silhouettes cut the floor away; never paste rectangular patches into the new gallery.
    const poly=d.kind==='cart'?[[15,29],[84,0],[165,22],[154,80],[168,97],[155,123],[110,148],[54,128],[6,104],[3,85],[18,68]]:[[1,23],[47,0],[101,21],[103,93],[54,116],[0,96]];
    c.beginPath();poly.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();c.drawImage(source,-crop.x,-crop.y);this.scene.textures.addCanvas(key,canvas)!.setFilter(0);
   }
   const image=this.scene.add.image(d.x*32,(d.y+d.h)*32,key).setOrigin(0,1).setScale(d.kind==='cart'?.38:.27).setDepth((d.y+d.h)*32).setData('mine-decoration',d.id);this.decorations.push(image);
  }
  // Fixed warm fixtures use the existing light renderer owned by the entrance view.
  for(const {x,y} of mineFixedLights(this.state())){const key='underground-lantern';
   if(!this.scene.textures.exists(key)){const canvas=document.createElement('canvas');canvas.width=44;canvas.height=84;const c=canvas.getContext('2d')!;c.beginPath();[[22,0],[26,15],[38,29],[36,68],[22,82],[8,68],[6,29],[18,15]].forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();c.drawImage(source,788,112,44,84,0,0,44,84);this.scene.textures.addCanvas(key,canvas)!.setFilter(0);}
   const lamp=this.scene.add.image(x,y,key).setOrigin(.5,1).setScale(.38).setDepth(y).setData('fixture-light',{radius:80,always:true,strength:.5});this.decorations.push(lamp);
  }
 }
 impact(p:TilePoint):void{
  for(let i=0;i<6;i++){const chip=this.scene.add.rectangle(p.x*32+16,p.y*32+12,2+i%2,2,0xc78a58).setDepth(p.y*32+34);this.scene.tweens.add({targets:chip,x:chip.x+(i-2.5)*7,y:chip.y+10+(i%3)*5,alpha:0,duration:260,onComplete:()=>chip.destroy()});}
 }
 update(player:{x:number;y:number}):void{this.hall?.update(player);}
 destroy():void{this.hall?.destroy();this.map.destroy();this.damage.forEach(g=>g.destroy());this.damage.clear();this.tracks.destroy();this.decorations.forEach(o=>o.destroy());}
}
