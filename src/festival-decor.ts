import Phaser from 'phaser';
import {VILLAGE_PLAZA} from './data/village';
import {festivalOn,type Festival} from './systems/festivals';

const T=32;
const COLORS:Record<string,readonly number[]>={
 'seed-fair':[0xe8c23a,0x6fae4c,0xe07a8a,0x5a8ad8],
 'harvest-festival':[0xd8822c,0xb5482a,0xe8c23a,0x8a6a2a],
 'lantern-night':[0xf0c060,0xe08a3a,0xf6e08a,0xd86a4a],
};
/** Decoração da praça no dia do festival (desenho provisório): bandeirinhas entre postes,
 * barracas com toldo listrado e, na Noite das Lanternas, lanternas acesas. Fica de fora das
 * passagens: os postes e as barracas ficam na borda da praça. */
export class FestivalDecor{
 private items:Phaser.GameObjects.GameObject[]=[];
 private shown='';
 constructor(private scene:Phaser.Scene){}
 update(day:number,inside:boolean):void{
  const f=festivalOn(day),key=f&&f.place==='village'&&!inside?`${f.id}:${day}`:'';
  if(key===this.shown)return;
  this.clear();this.shown=key;
  if(f&&key)this.build(f);
 }
 private build(f:Festival):void{
  const cx=VILLAGE_PLAZA.x*T,cy=VILLAGE_PLAZA.y*T,rx=VILLAGE_PLAZA.rx*T*.92,ry=VILLAGE_PLAZA.ry*T*.92;
  const colors=COLORS[f.id]??COLORS['seed-fair'];
  const posts=Array.from({length:8},(_,i)=>{const a=i/8*Math.PI*2+Math.PI/8;return{x:cx+Math.cos(a)*rx,y:cy+Math.sin(a)*ry};});
  // Bandeirinhas: cordão entre postes vizinhos, com triângulos coloridos pendurados.
  const flags=this.scene.add.graphics().setDepth(cy+ry+400);
  for(let i=0;i<posts.length;i++){
   const a=posts[i],b=posts[(i+1)%posts.length],top=56;
   flags.lineStyle(1.5,0x4a3220,1);
   const pts=Array.from({length:13},(_,k)=>{const t=k/12;return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t-top+Math.sin(t*Math.PI)*16};});
   flags.strokePoints(pts as Phaser.Types.Math.Vector2Like[]);
   pts.slice(1,-1).forEach((p,k)=>{flags.fillStyle(colors[k%colors.length],1).fillTriangle(p.x-5,p.y,p.x+5,p.y,p.x,p.y+11);});
  }
  this.items.push(flags);
  for(const p of posts){
   const post=this.scene.add.graphics().setDepth(p.y);
   post.fillStyle(0x5a3a22,1).fillRect(p.x-2,p.y-60,4,60);post.fillStyle(0x3a2616,1).fillEllipse(p.x,p.y,10,4);
   this.items.push(post);
  }
  // Barracas no lado norte da praça.
  for(const [i,dx] of [-150,0,150].entries()){
   const x=cx+dx,y=cy-ry+40,stall=this.scene.add.graphics().setDepth(y);
   stall.fillStyle(0x7a5232,1).fillRect(x-38,y-30,76,30);
   stall.fillStyle(0x5a3a22,1).fillRect(x-38,y-62,4,62).fillRect(x+34,y-62,4,62);
   for(let k=0;k<6;k++)stall.fillStyle(k%2?0xf2ead8:colors[i%colors.length],1).fillRect(x-44+k*15,y-72,15,16);
   stall.fillStyle(0x2a1a10,.25).fillRect(x-44,y-56,90,3);
   for(let k=0;k<4;k++)stall.fillStyle(colors[(k+i)%colors.length],1).fillCircle(x-24+k*16,y-34,5);
   this.items.push(stall);
  }
  // Noite das Lanternas: uma lanterna em cada poste, acesa.
  if(f.id==='lantern-night')for(const p of posts){
   const glow=this.scene.add.graphics().setDepth(p.y+1);
   glow.fillStyle(0xf6c060,1).fillRoundedRect(p.x-6,p.y-74,12,14,3);glow.fillStyle(0x5a3a22,1).fillRect(p.x-7,p.y-76,14,3);
   const light=this.scene.add.container(p.x,p.y,[glow]).setData('fixture-light',{offsetX:0,offsetY:-68,radius:36,strength:.9,always:true});
   this.items.push(light);
  }
 }
 private clear():void{for(const o of this.items)o.destroy();this.items=[];}
 destroy():void{this.clear();}
}
