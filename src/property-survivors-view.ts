import { SURVIVOR_VIEWS, survivorIdleDiagonalFrame, survivorLookDirection, survivorTurnStep, survivorView, survivorWalkFrame, survivorWalkScale } from './data/survivor-walk';
export { SURVIVOR_VIEWS, survivorView, survivorWalkFrame } from './data/survivor-walk';
import type Phaser from 'phaser';
import type {SaveData} from './types';
import type {Player} from './player';
import {PropertyVisitWalk} from './systems/property-visit-walk';
import walkArt from '../public/assets/visual/characters/survivors/walk.json';
import {VillageNpcOverlays} from './village-npc-overlays';
import {PROPERTY_SURVIVORS,SURVIVOR_NAMES,survivorActivity,type PropertySurvivorId} from './systems/property-survivors';
import type {CharacterDirection} from './character-directions';

/** Poses paradas e passadas em oito direções, com pés alinhados. */
type View=typeof SURVIVOR_VIEWS[number];
export const survivorTexture=(id:PropertySurvivorId,view:View)=>view==='south'?`survivor-${id}`:`survivor-${id}-${view}`;
export function preloadSurvivorViews(scene:Phaser.Scene):void{
 for(const id of PROPERTY_SURVIVORS){
  const art=walkArt.characters[id],walk=`survivor-walk-${id}`,idle=`survivor-idle-diagonal-${id}`;
  if(!scene.textures.exists(walk))scene.load.spritesheet(walk,art.file,{frameWidth:walkArt.cell,frameHeight:walkArt.cell});
  if(!scene.textures.exists(idle))scene.load.spritesheet(idle,art.idle.file,{frameWidth:art.idle.cell,frameHeight:art.idle.cell});
 }
 for(const id of PROPERTY_SURVIVORS)for(const view of SURVIVOR_VIEWS){const key=survivorTexture(id,view);if(!scene.textures.exists(key))scene.load.image(key,`assets/visual/characters/survivors/${id}-${view}.png`);}
}
// Quadro quadrado de 256 px mostrado em 64 × 64, como os moradores da vila (antes 48 × 64 os espremia).
const WIDTH=64,HEIGHT=64,FOOT=232/256;
const SETTLE_SECONDS=.18,TURN_SECONDS=.075;
interface Actor{id:PropertySurvivorId;sprite:Phaser.GameObjects.Image;pos:{x:number;y:number};direction:CharacterDirection;walker?:PropertyVisitWalk;goalKey:string;distance:number;moving:boolean;turnDelay:number}
export interface SurvivorViewHost{
 state:()=>SaveData;player:()=>Player;visible:()=>boolean;active:()=>boolean;blocked:(x:number,y:number)=>boolean;
}
export class PropertySurvivorsView {
 private actors=new Map<PropertySurvivorId,Actor>();
 private overlays:VillageNpcOverlays;
 constructor(private scene:Phaser.Scene,private host:SurvivorViewHost){
  this.overlays=new VillageNpcOverlays(scene,()=>({actors:[...this.actors.values()].filter(a=>a.sprite.visible).map(a=>({id:a.id,name:SURVIVOR_NAMES[a.id],role:a.id==='marina'?'Moradora da propriedade':'Morador da propriedade',sprite:a.sprite as unknown as Phaser.GameObjects.Sprite})),blocked:!this.host.active(),speech:this.speech()}));
  scene.events.on('update',this.update,this);
 }
 /** Quem está mais perto do jogador, para o balão com a tarefa do momento. */
 private speech(){
  const p=this.host.player(),s=this.host.state();if(!p||!s)return;
  let best:{id:string;text:string}|undefined,dist=96;
  for(const a of this.actors.values()){if(!a.sprite.visible||a.moving)continue;const d=Math.hypot(a.pos.x-p.x,a.pos.y-p.y);if(d<dist){dist=d;const line=survivorActivity(a.id,s).line;if(line)best={id:a.id,text:line};}}
  return best;
 }
 private actor(id:PropertySurvivorId,start:{x:number;y:number}):Actor|undefined{
  let a=this.actors.get(id);if(a)return a;
  if(!this.scene.textures.exists(survivorTexture(id,'south')))return;
  const sprite=this.scene.add.image(start.x,start.y,survivorTexture(id,'south')).setOrigin(.5,FOOT).setDisplaySize(WIDTH,HEIGHT);
  a={id,sprite,pos:{...start},direction:'down',goalKey:'',distance:0,moving:false,turnDelay:0};this.actors.set(id,a);return a;
 }
 /** Centro do ladrilho livre mais próximo do ponto da tarefa (o andar vai de centro em
  * centro; o poço, a bancada ou uma plantação podem ocupar o ladrilho pedido). */
 private freeTile(p:{x:number;y:number}):{x:number;y:number}{
  const x=Math.floor(p.x/32),y=Math.floor(p.y/32);
  for(let r=0;r<=4;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(Math.max(Math.abs(dx),Math.abs(dy))===r&&!this.host.blocked(x+dx,y+dy))return{x:(x+dx+.5)*32,y:(y+dy+.5)*32};
  return{x:(x+.5)*32,y:(y+.5)*32};
 }
 private update(_time:number,ms:number):void{
  const s=this.host.state();if(!s)return;
  const living=new Set((s.villageSurvivors??[]).filter((id):id is PropertySurvivorId=>(PROPERTY_SURVIVORS as readonly string[]).includes(id)));
  for(const [id,a] of this.actors)if(!living.has(id)){a.sprite.destroy();this.actors.delete(id);}
  const shown=this.host.visible(),seconds=this.host.active()?Math.min(.1,Math.max(0,ms/1000)):0;
  for(const id of living){
   const raw=survivorActivity(id,s),plan={...raw,point:this.freeTile(raw.point)},a=this.actor(id,plan.point);if(!a)continue;
   const firstPlacement=!a.goalKey;
   const key=`${plan.task}:${Math.round(plan.point.x)},${Math.round(plan.point.y)}`;
   if(a.goalKey!==key){
    // Primeira vez na cena: já começa no lugar da tarefa, sem atravessar o mapa.
    if(firstPlacement)a.pos={...plan.point};
    a.goalKey=key;a.walker=new PropertyVisitWalk(a.pos,plan.point,6);
   }
   const atGoal=Math.hypot(a.pos.x-plan.point.x,a.pos.y-plan.point.y)<6;
   a.moving=false;
   if(seconds>0&&!atGoal&&a.walker){
    const step=a.walker.step(seconds,this.host.blocked);
    a.distance+=Math.hypot(step.x-a.pos.x,step.y-a.pos.y);a.pos={x:step.x,y:step.y};a.moving=step.moving;
    if(step.moving){a.direction=step.direction;a.turnDelay=SETTLE_SECONDS;}
   }else if(atGoal&&plan.visible){
    const p=this.host.player();
    const dx=p?p.x-a.pos.x:Infinity,dy=p?p.y-a.pos.y:Infinity,near=Math.hypot(dx,dy);
    const taskDirection=plan.task==='workbench'||plan.task==='well'||plan.task==='crops'?'up':'down';
    const target=near<6?a.direction:near<110?survivorLookDirection(dx,dy):taskDirection;
    a.turnDelay=Math.max(0,a.turnDelay-seconds);
    if(firstPlacement)a.direction=target;
    else if(seconds>0&&a.turnDelay===0&&a.direction!==target){
     a.direction=survivorTurnStep(a.direction,target);a.turnDelay=TURN_SECONDS;
    }
   }
   if(!a.moving)a.distance=0;
   // À noite somem só depois de chegar à porta de casa.
   const visible=shown&&(plan.visible||!atGoal);
   const animated=a.moving&&this.scene.textures.exists(`survivor-walk-${id}`);
   const idleFrame=survivorIdleDiagonalFrame(a.direction),idleTexture=`survivor-idle-diagonal-${id}`;
   if(animated)a.sprite.setTexture(`survivor-walk-${id}`,survivorWalkFrame(id,a.direction,a.distance)).setScale(survivorWalkScale(id,a.direction));
   else if(idleFrame>=0&&this.scene.textures.exists(idleTexture))a.sprite.setTexture(idleTexture,idleFrame).setScale(walkArt.characters[id].idle.scales[idleFrame]);
   else a.sprite.setTexture(survivorTexture(id,survivorView(a.direction))).setDisplaySize(WIDTH,HEIGHT);
   a.sprite.setPosition(a.pos.x,a.pos.y).setDepth(a.pos.y).setVisible(visible);
  }
 }
 destroy():void{this.scene.events.off('update',this.update,this);this.overlays.destroy();for(const a of this.actors.values())a.sprite.destroy();this.actors.clear();}
}
