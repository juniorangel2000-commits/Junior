import {beginSocialExchange,completeSocialExchange,socialExchangeAvailable,type SocialRuntime,type SocialExchange} from './npc-social';
import type {GameClock} from './clock';
import {merchantPeriod,type MerchantDailyRoutine,type RoutineId} from './merchant-routine';
import {MERCHANT_VISITS} from '../data/merchant-visits';
import {PLAZA_CONVERSATIONS} from '../data/merchant-lunches';

export interface MerchantSpeech {id:RoutineId;text:string}
interface Conversation {
 pair:readonly [RoutineId,RoutineId];lines:readonly [string,string];
 day:number;room?:RoutineId;elapsed:number;key:string;social?:SocialExchange;
}

/** One exchange at a time, timed in simulation seconds. Both actors stay idle
 * for the whole exchange; clock changes never alternate the balloon per frame. */
export class MerchantConversations {
 private active?:Conversation;
 private retry=0;
 constructor(private socialRuntime?:()=>SocialRuntime|undefined){}
 get farewell():boolean{const c=this.active;if(!c?.social)return false;return c.elapsed>=Math.max(4.5,Math.min(8,c.lines[0].length/14))+.4+Math.max(4.5,Math.min(8,c.lines[1].length/14));}
 glance(id:RoutineId):boolean{const c=this.active;if(!c?.social)return false;const second=Math.max(4.5,Math.min(8,c.lines[0].length/14))+.4;const elapsed=c.elapsed-(id===c.pair[0]?0:second);return elapsed>=.2&&elapsed<.45;}
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
  if(!Number.isFinite(seconds)||seconds<=0)return;
  this.retry=Math.max(0,this.retry-(Number.isFinite(seconds)?Math.max(0,Math.min(seconds,.1)):0));
  if(this.day!==clock.day){this.release(routines);this.completed.clear();this.day=clock.day;}
  const runtime=this.socialRuntime?.(),socialSave=runtime?.current?.();
  const permitted=(pair:readonly[RoutineId,RoutineId],key:string)=>{if(pair.some(id=>routines.get(id)?.externallyControlled||routines.get(id)!.state.serviceUntil>clock.day*1440+clock.time))return false;if(socialSave&&(pair.includes('bento')&&socialSave.bentoTravel?.trip||pair.includes('damiao')&&socialSave.fisherTravel&&socialSave.fisherTravel.area!=='village'))return false;if(this.completed.has(key))return false;if(socialSave&&!socialExchangeAvailable(socialSave,pair)){this.completed.add(key);return false;}return true;};
  if(this.active){
   const c=this.active;
   const valid=c.room===room&&c.pair.every(id=>{
    const r=routines.get(id);
    return r&&!r.externallyControlled&&id!==guide&&!(socialSave&&(id==='bento'&&socialSave.bentoTravel?.trip||id==='damiao'&&socialSave.fisherTravel&&socialSave.fisherTravel.area!=='village'))&&r.state.area===(room?'shop':'village')
     &&(!room||r.roomOwner===room)&&merchantPeriod(id,clock.time)===(room?'work':'break')&&r.state.serviceUntil<=clock.day*1440+clock.time;
   });
   if(!valid||Math.hypot(routines.get(c.pair[0])!.state.x-routines.get(c.pair[1])!.state.x,routines.get(c.pair[0])!.state.y-routines.get(c.pair[1])!.state.y)>(room?110:72))this.release(routines);
  }
  if(!this.active&&this.retry===0){
   const start=(pair:readonly [RoutineId,RoutineId],lines:readonly [string,string],key:string)=>{
    if(!permitted(pair,key)||pair.includes(guide!))return;
    const runtime=this.socialRuntime?.(),social=runtime?beginSocialExchange(runtime,pair,lines):undefined;
    if(runtime&&!social){this.completed.add(key);this.retry=1;return;}
    this.active={pair,lines:social?.lines??lines,key,day:clock.day,room,elapsed:0,social};
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
     if(!host||host.externallyControlled||!cue||cue.host!==room||host.state.area!=='shop'||host.roomOwner!==room||merchantPeriod(room,clock.time)!=='work'||id===guide||room===guide||!permitted([id,room],'shop:'+id))continue;
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
  if(c.elapsed>=first+.4+second+(c.social?1.5:0)){const runtime=this.socialRuntime?.();if(c.social&&runtime)completeSocialExchange(runtime,c.social);this.completed.add(c.key);this.release(routines);return;}
  if(c.social&&c.elapsed>=first+.4+second)return{id:c.pair[1],text:'Até mais. A gente se encontra por aí.'};
  if(c.elapsed>=first&&c.elapsed<first+.4)return;
  const turn=c.elapsed<first?0:1;
  return{id:c.pair[turn],text:c.lines[turn]};
 }
}
