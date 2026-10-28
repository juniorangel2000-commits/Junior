import type {GameClock} from './clock';
import {merchantPeriod,type MerchantDailyRoutine,type RoutineId} from './merchant-routine';
import {MERCHANT_VISITS} from '../data/merchant-visits';
import {PLAZA_CONVERSATIONS} from '../data/merchant-lunches';

export interface MerchantSpeech {id:RoutineId;text:string}
interface Conversation {
 pair:readonly [RoutineId,RoutineId];lines:readonly [string,string];
 day:number;room?:RoutineId;elapsed:number;key:string;
}

/** One exchange at a time, timed in simulation seconds. Both actors stay idle
 * for the whole exchange; clock changes never alternate the balloon per frame. */
export class MerchantConversations {
 private active?:Conversation;
 private completed=new Set<string>();
 private day=0;
 get participants():readonly RoutineId[]{return this.active?.pair??[];}
 private release(routines:ReadonlyMap<RoutineId,MerchantDailyRoutine>):void{
  for(const id of this.participants)routines.get(id)?.holdStill(false);
  this.active=undefined;
 }
 reset(routines:ReadonlyMap<RoutineId,MerchantDailyRoutine>):void{
  this.release(routines);this.completed.clear();this.day=0;
 }
 update(seconds:number,clock:GameClock,routines:ReadonlyMap<RoutineId,MerchantDailyRoutine>,room?:RoutineId,guide?:RoutineId):MerchantSpeech|undefined{
  if(this.day!==clock.day){this.release(routines);this.completed.clear();this.day=clock.day;}
  if(this.active){
   const c=this.active;
   const valid=c.room===room&&c.pair.every(id=>{
    const r=routines.get(id);
    return r&&id!==guide&&r.state.area===(room?'shop':'village')
     &&(!room||r.roomOwner===room)&&merchantPeriod(id,clock.time)===(room?'work':'break');
   });
   if(!valid)this.release(routines);
  }
  if(!this.active){
   const start=(pair:readonly [RoutineId,RoutineId],lines:readonly [string,string],key:string)=>{
    if(this.completed.has(key)||pair.includes(guide!))return;
    this.active={pair,lines,key,day:clock.day,room,elapsed:0};
    for(const id of pair)routines.get(id)!.holdStill(true);
   };
   if(!room){
    for(const plan of PLAZA_CONVERSATIONS){
     const [a,b]=plan.pair.map(id=>routines.get(id));
     if(!a||!b||!a.plazaReady||!b.plazaReady||plan.pair.some(id=>merchantPeriod(id,clock.time)!=='break'))continue;
     if(Math.hypot(a.state.x-b.state.x,a.state.y-b.state.y)>72)continue;
     start(plan.pair,plan.lines[(clock.day-1)%plan.lines.length],'plaza:'+plan.pair.join(':'));
     if(this.active)break;
    }
   }else{
    const host=routines.get(room);
    for(const [id,visitor] of routines){
     const cue=visitor.conversation(clock);
     if(!host||!cue||cue.host!==room||host.state.area!=='shop'||host.roomOwner!==room||merchantPeriod(room,clock.time)!=='work'||id===guide||room===guide||this.completed.has('shop:'+id))continue;
     host.holdConversation(clock);
     if(host.isMoving||host.activity!=='receiving-visitor'||Math.hypot(host.state.x-visitor.state.x,host.state.y-visitor.state.y)>110)continue;
     start([id,room],MERCHANT_VISITS[id].lines,'shop:'+id);
     if(this.active)break;
    }
   }
  }
  const c=this.active;if(!c)return;
  c.elapsed+=Number.isFinite(seconds)?Math.max(0,Math.min(seconds,.1)):0;
  const first=Math.max(4.5,Math.min(8,c.lines[0].length/14));
  const second=Math.max(4.5,Math.min(8,c.lines[1].length/14));
  if(c.elapsed>=first+.4+second){this.completed.add(c.key);this.release(routines);return;}
  if(c.elapsed>=first&&c.elapsed<first+.4)return;
  const turn=c.elapsed<first?0:1;
  return{id:c.pair[turn],text:c.lines[turn]};
 }
}
