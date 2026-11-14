import type {CharacterDirection} from '../character-directions';
import {animalFrame} from '../data/animal-art';
import poses from '../data/horse-poses.json';
export type HorseIdlePhase='waiting'|'turning'|'starting'|'eating'|'ending'|'shaking';
/** Finite actions separated by independent 8–15 second rests. This grants no taming progress. */
export class HorseIdleCycle{
 phase:HorseIdlePhase='waiting';direction:CharacterDirection='down';private age=0;private seed=0;private cooldown=0;private meal=4;private nextMeal=true;private stopRequested=false;
 constructor(id:string){for(const c of id)this.seed=(Math.imul(this.seed,31)+c.charCodeAt(0))>>>0;this.reset();}
 private random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 private reset(){this.phase='waiting';this.age=0;this.stopRequested=false;this.cooldown=8+this.random()*7;}
 get locked(){return this.phase!=='waiting';}
 /** Come a cesta da doma: mesma sequência de comer do capim (começar, comer 4–7 s e terminar). */
 eatBasket(direction:CharacterDirection):void{this.direction=direction.includes('up')?'up':'down';this.meal=4+this.random()*3;this.stopRequested=false;this.nextMeal=false;this.set('turning');}
 get waitSeconds(){return this.cooldown;}
 private set(p:HorseIdlePhase){this.phase=p;this.age=0;}
 update(delta:number,idle:boolean,unsafe:boolean,direction:CharacterDirection,grass:boolean):void{
  const dt=Math.max(0,Math.min(.1,delta));if(!Number.isFinite(dt)||dt<=0)return;
  if(this.phase==='waiting'){
   this.cooldown=Math.max(0,this.cooldown-dt);if(this.cooldown>0||!idle||unsafe)return;
   if(this.nextMeal&&grass){this.direction=direction.includes('up')?'up':'down';this.meal=4+this.random()*3;this.set('turning');this.nextMeal=false;}
   else{this.direction=direction.includes('left')?'left':direction.includes('right')?'right':direction.includes('up')?'up':'down';this.set('shaking');this.nextMeal=true;}return;
  }
  if(unsafe){if(this.phase==='starting')this.stopRequested=true;else if(this.phase==='eating')this.set('ending');else if(this.phase!=='ending'){this.reset();return;}}
  this.age+=dt;
  if(this.phase==='turning'&&this.age>=.35)this.set('starting');
  else if(this.phase==='starting'&&this.age>=1)this.set(this.stopRequested?'ending':'eating');
  else if(this.phase==='eating'&&this.age>=this.meal)this.set('ending');
  else if(this.phase==='ending'&&this.age>=7/6)this.reset();
  else if(this.phase==='shaking'&&this.age>=11/5)this.reset();
 }
 frame():number|undefined{
  if(this.phase==='waiting')return;
  if(this.phase==='turning')return animalFrame('horse',this.direction,false,0);
  if(this.phase==='shaking'){const d=this.direction==='up'?'north':this.direction==='left'?'west':this.direction==='right'?'east':'south';return poses.Idle_Shaking_Head[d][Math.min(10,Math.floor(this.age*5))];}
  const d=this.direction==='up'?'north':'south',list=this.phase==='starting'?poses.Eat_Start[d]:this.phase==='eating'?poses.Eating[d]:poses.Eat_End[d];
  return list[this.phase==='eating'?Math.floor(this.age*5)%list.length:Math.min(list.length-1,Math.floor(this.age*6))];
 }
}
