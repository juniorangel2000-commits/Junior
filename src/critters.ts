import Phaser from 'phaser';
import {BUTTERFLY_VARIANTS,CRITTER_ART,CRITTER_CELL,CRITTER_TEXTURE,critterActive,critterDirection,critterFrame,critterRandom,critterSpot,crittersOf,type CritterSpecies,type CritterTerrain} from './data/critters';

const WALK=[1,2];
const RUN=[3,4];
const WINGS=[3,4];
const BUTTERFLY_FLIGHT=[0,1,2,1,0,3,4,3];
const BAT_FLIGHT=[0,1,2,3,4];

export function preloadCritters(scene:Phaser.Scene):void {
 if(!scene.textures.exists(CRITTER_TEXTURE))scene.load.spritesheet(CRITTER_TEXTURE,CRITTER_ART,{frameWidth:CRITTER_CELL,frameHeight:CRITTER_CELL});
}

type Phase='idle'|'walk'|'flee'|'gone'|'hide';
interface Critter{
 sp:CritterSpecies;sprite:Phaser.GameObjects.Sprite;variant:number;facing:ReturnType<typeof critterDirection>;
 x:number;y:number;home:{x:number;y:number};target?:{x:number;y:number};
 phase:Phase;timer:number;anim:number;lift:number;vx:number;vy:number;seed:number;
}
export interface CritterHost{state:()=>{time:number;day:number};player:()=>{x:number;y:number}|undefined;active:()=>boolean;
 /** Multiplica a distância em que cada espécie se assusta (ex.: com a rede, o caranguejo deixa chegar perto). */
 fleeScale?:(id:string)=>number}

/** Bichos de um cenário: andam, ficam parados, fogem do jogador e voltam depois. Decoração:
 * não bloqueiam ninguém e não vão para o save. */
export class CritterField {
 private critters:Critter[]=[];
 private random:()=>number;
 constructor(private scene:Phaser.Scene,area:string,private terrain:CritterTerrain,private host:CritterHost){
  this.random=critterRandom([...area].reduce((h,ch)=>Math.imul(h,31)+ch.charCodeAt(0),7));
  const texture=scene.textures.get(CRITTER_TEXTURE);
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  for(const sp of crittersOf(area))for(let i=0;i<sp.count;i++){
   const spot=critterSpot(sp,terrain,this.random);if(!spot)continue;
   const variant=sp.id==='butterfly'?i%BUTTERFLY_VARIANTS:0,facing='down';
   const sprite=scene.add.sprite(spot.x,spot.y,CRITTER_TEXTURE,critterFrame(sp.id,facing,0,variant)).setOrigin(.5,.875).setData('no-shadow',sp.mode==='air'||sp.mode==='perch');
   this.critters.push({sp,sprite,variant,facing,x:spot.x,y:spot.y,home:{...spot},phase:'idle',timer:this.random()*3,anim:this.random()*10,lift:0,vx:0,vy:0,seed:this.random()*1000});
  }
  scene.events.on('update',this.update,this);
 }
 get count(){return this.critters.length;}
 /** O bicho visível mais perto do ponto, de uma espécie (para pegar com a rede). */
 nearest(id:string,p:{x:number;y:number},radius:number):{x:number;y:number}|undefined{
  let best:Critter|undefined,dist=radius;
  for(const c of this.critters){const d=Math.hypot(c.x-p.x,c.y-p.y);if(c.sp.id===id&&c.phase!=='gone'&&c.sprite.visible&&d<dist){best=c;dist=d;}}
  return best&&{x:best.x,y:best.y};
 }
 /** Tira o bicho mais perto do mapa (pego pelo jogador); ele volta depois, em outro lugar. */
 take(id:string,p:{x:number;y:number},radius:number):boolean{
  let best:Critter|undefined,dist=radius;
  for(const c of this.critters){const d=Math.hypot(c.x-p.x,c.y-p.y);if(c.sp.id===id&&c.phase!=='gone'&&c.sprite.visible&&d<dist){best=c;dist=d;}}
  if(!best)return false;
  best.phase='gone';best.timer=40+this.random()*40;best.sprite.setVisible(false);return true;
 }
 private pickTarget(c:Critter):void{
  for(let i=0;i<8;i++){
   const a=this.random()*Math.PI*2,r=c.sp.wander*(.3+.7*this.random()),x=c.home.x+Math.cos(a)*r,y=c.home.y+Math.sin(a)*r;
   if(c.sp.mode==='air'||this.terrain.land(x,y)){c.target={x,y};return;}
  }
  c.target=undefined;
 }
 private respawn(c:Critter):void{
  const p=this.host.player(),spot=critterSpot(c.sp,this.terrain,this.random,p?{x:p.x,y:p.y,r:420}:undefined);
  if(spot){c.home={...spot};c.x=spot.x;c.y=spot.y;}
  c.phase='idle';c.timer=1+this.random()*3;c.lift=0;c.sprite.setAlpha(1);
 }
 private pose(c:Critter,pose:number):void {
  const frame=critterFrame(c.sp.id,c.facing,pose,c.variant),flip=c.facing==='left';
  if(Number(c.sprite.frame.name)!==frame)c.sprite.setFrame(frame,false,false);
  if(c.sprite.flipX!==flip)c.sprite.setFlipX(flip);
 }
 private cycle(c:Critter,sequence:readonly number[],fps:number):void{this.pose(c,sequence[Math.floor(c.anim*fps)%sequence.length]);}
 private update(_time:number,ms:number):void{
  const dt=Math.min(.1,Math.max(0,ms/1000)),{time}=this.host.state(),player=this.host.player(),running=this.host.active();
  for(const c of this.critters){
   const on=critterActive(c.sp.when,time);
   if(!on){c.sprite.setVisible(false);continue;}
   if(!running){c.sprite.setVisible(c.phase!=='gone');continue;}
   c.anim+=dt;
   const dist=player?Math.hypot(player.x-c.x,player.y-c.y):Infinity;
   if(c.phase==='gone'){c.sprite.setVisible(false);c.timer-=dt;if(c.timer<=0&&dist>300)this.respawn(c);continue;}
   c.sprite.setVisible(true);
   const mode=c.sp.mode;
   // Reage ao jogador.
   const flee=c.sp.flee*(this.host.fleeScale?.(c.sp.id)??1);
   if(player&&flee>0&&dist<flee&&c.phase!=='flee'&&c.phase!=='hide'){
    if(mode==='ball'){c.phase='hide';c.timer=.14;}
    else{
     const away=Math.atan2(c.y-player.y,c.x-player.x);c.phase='flee';c.timer=mode==='fly'?2.2:1.6;
     c.vx=Math.cos(away);c.vy=Math.sin(away);
     if(mode==='burrow'){
      // O caranguejo corre para a água mais próxima, se houver; se não, cava na areia.
      for(let r=30;r<=150;r+=30){const a=[0,1,2,3,4,5,6,7].map(i=>i*Math.PI/4).find(a=>this.terrain.water(c.x+Math.cos(a)*r,c.y+Math.sin(a)*r));if(a!==undefined){c.vx=Math.cos(a);c.vy=Math.sin(a);break;}}
     }
     c.facing=critterDirection(c.vx,c.vy);
    }
   }
   if(c.phase==='hide'){
    c.timer-=dt;this.pose(c,c.timer>0?3:4);
    if(dist>c.sp.flee*1.6){c.phase='idle';c.timer=1.5;}
   }else if(c.phase==='flee'){
    c.timer-=dt;
    if(mode==='fly'){
     const speed=150;c.x+=c.vx*speed*dt;c.y+=c.vy*speed*dt;c.lift=Math.min(90,c.lift+70*dt);
     this.cycle(c,WINGS,10);
     c.sprite.setAlpha(Math.min(1,c.timer/.8));
    }else{
     // O caranguejo se afasta devagar para dar tempo de chegar com a rede.
     const speed=c.sp.speed*(mode==='burrow'?1.3:2.2),nx=c.x+c.vx*speed*dt,ny=c.y+c.vy*speed*dt;
     if(mode==='burrow'||this.terrain.land(nx,ny)){c.x=nx;c.y=ny;}
     if(mode==='burrow'&&(this.terrain.water(c.x,c.y)||c.timer<.6)){
      this.pose(c,c.timer<.3?4:3);c.sprite.setAlpha(Math.max(0,c.timer/.6));
     }else this.cycle(c,mode==='ball'||mode==='burrow'?WALK:RUN,12);
    }
    if(c.timer<=0){c.phase='gone';c.timer=12+this.random()*18;c.sprite.setVisible(false);continue;}
   }else if(mode==='air'){
    // Voo à toa em volta de casa, com um leve sobe e desce.
    if(!c.target||Math.hypot(c.target.x-c.x,c.target.y-c.y)<8)this.pickTarget(c);
    if(c.target){const dx=c.target.x-c.x,dy=c.target.y-c.y,a=Math.atan2(dy,dx);c.x+=Math.cos(a)*c.sp.speed*dt;c.y+=Math.sin(a)*c.sp.speed*dt;c.facing=critterDirection(dx,dy);}
    c.lift=(c.sp.id==='bat'?70:18)+Math.sin(c.anim*3+c.seed)*6;
    this.cycle(c,c.sp.id==='bat'?BAT_FLIGHT:BUTTERFLY_FLIGHT,c.sp.id==='bat'?13:15);
   }else if(mode==='perch'){
    // As piscadas são breves, separadas pelo repouso da coruja.
    const watching=!!player&&dist<260;
    if(watching)c.facing=critterDirection(player.x-c.x,player.y-c.y);
    const blink=c.anim%4,ruffle=!watching&&c.anim%13<.22;
    this.pose(c,blink<.1?1:blink<.19?2:ruffle?4:watching?3:0);
   }else{
    // Anda até um ponto perto de casa, para um pouco e escolhe outro.
    if(c.phase==='idle'){c.timer-=dt;this.pose(c,0);if(c.timer<=0){this.pickTarget(c);c.phase=c.target?'walk':'idle';c.timer=1+this.random()*3;}}
    else if(c.phase==='walk'&&c.target){
     const dx=c.target.x-c.x,dy=c.target.y-c.y,d=Math.hypot(dx,dy),step=c.sp.speed*dt;
     if(d<=step){c.x=c.target.x;c.y=c.target.y;c.phase='idle';c.timer=1+this.random()*4;}
     else{const nx=c.x+dx/d*step,ny=c.y+dy/d*step;if(this.terrain.land(nx,ny)){c.x=nx;c.y=ny;c.facing=critterDirection(dx,dy);}else{c.phase='idle';c.timer=1;}}
     this.cycle(c,WALK,6+c.sp.speed/12);
    }
   }
   // Quem voa não sai pela borda de cima do mapa.
   c.sprite.setPosition(Math.round(c.x),Math.round(Math.max(48,c.y-c.lift))).setDepth(mode==='air'||c.lift>20?c.y+600:c.y);
  }
 }
 destroy():void{this.scene.events.off('update',this.update,this);for(const c of this.critters)c.sprite.destroy();this.critters=[];}
}
