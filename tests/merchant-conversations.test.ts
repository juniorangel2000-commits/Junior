import {describe,it,expect} from 'vitest';
import {MerchantConversations} from '../src/systems/merchant-conversations';
import {MerchantDailyRoutine,merchantPeriod,MERCHANT_DAILY_PLAN,type RoutineId,type RoutineEnvironment} from '../src/systems/merchant-routine';
import {MERCHANT_LUNCHES,PLAZA_CONVERSATIONS} from '../src/data/merchant-lunches';
import {GAME_MINUTES_PER_SECOND,advanceClock} from '../src/systems/clock';

const env:RoutineEnvironment={blocked:()=>false,fits:()=>true,arrival:(_area,p)=>p};
function plazaPair(pair:readonly RoutineId[]){
 const time=MERCHANT_LUNCHES[pair[0]].start+5,clock={day:2,time};
 const routines=new Map(pair.map(id=>{
  const p=MERCHANT_DAILY_PLAN.plaza[id];
  const r=new MerchantDailyRoutine(id,{x:(p.x+.5)*32,y:(p.y+.5)*32,direction:'down',shop:false},{isBlocked:()=>false});
  r.step(.1,clock,env);r.step(.1,clock,env);
  return [id,r] as const;
 }));
 return {routines,clock};
}

describe('slower clock and staggered lunch conversations',()=>{
 it('doubles the time available in the day across the shared game clock',()=>{
  expect(advanceClock({day:1,time:480},60*GAME_MINUTES_PER_SECOND)).toEqual({day:1,time:540});
 });
 it('schedules every resident once, with no more than four on lunch break',()=>{
  const ids=Object.keys(MERCHANT_LUNCHES) as RoutineId[];
  expect(new Set(PLAZA_CONVERSATIONS.flatMap(p=>[...p.pair])).size).toBe(10);
  for(let time=660;time<=960;time++){
   expect(ids.filter(id=>merchantPeriod(id,time)==='break').length).toBeLessThanOrEqual(4);
  }
  for(const id of ids){
   const p=MERCHANT_LUNCHES[id];
   expect(merchantPeriod(id,p.start-1)).toBe('work');
   expect(merchantPeriod(id,p.start)).toBe('break');
   expect(merchantPeriod(id,p.end)).toBe('work');
  }
 });
 it.each(PLAZA_CONVERSATIONS)('lets $pair exchange readable lines without either actor moving',plan=>{
  const {routines,clock}=plazaPair(plan.pair),conversation=new MerchantConversations();
  const positions=[...routines.values()].map(r=>({x:r.state.x,y:r.state.y}));
  const speakers=new Set<string>();let firstText='',firstSeconds=0,finished=false;
  for(let i=0;i<130;i++){
   const speech=conversation.update(.1,clock,routines);
   if(speech){speakers.add(speech.id);if(!firstText)firstText=speech.text;if(speech.text===firstText)firstSeconds+=.1;}
   if(conversation.participants.length){
    for(const [index,r] of [...routines.values()].entries()){
     const step=r.step(.1,clock,env);
     expect(step.moving).toBe(false);expect(step.phase).toBe(0);
     expect({x:step.x,y:step.y}).toEqual(positions[index]);
    }
   }else if(speakers.size)finished=true;
   clock.time+=.1;
  }
  expect(speakers).toEqual(new Set(plan.pair));expect(firstSeconds).toBeGreaterThanOrEqual(4.4);expect(finished).toBe(true);
  expect(conversation.update(.1,clock,routines)).toBeUndefined();
 });
 it('waits until both residents have arrived instead of talking on the walk',()=>{
  const {routines,clock}=plazaPair(['augusto','bento']);
  const b=routines.get('bento')!;b.state.x-=160;b.state.wait=0;b.step(.1,clock,env);
  const conversation=new MerchantConversations();
  expect(conversation.update(.1,clock,routines)).toBeUndefined();
  expect(conversation.participants).toHaveLength(0);
 });
 it('does not hold a shop owner at work when their own lunch has started',()=>{
  const nav={isBlocked:()=>false,tileSize:8,entry:{x:288,y:335}};
  const clock={day:2,time:830};
  const host=new MerchantDailyRoutine('celina',{x:288,y:151,direction:'down',shop:true},nav);
  const visitor=new MerchantDailyRoutine('helena',{x:288,y:230,direction:'up',shop:true},nav,undefined,6,()=>nav);
  visitor.state.roomOwner='celina';
  for(let i=0;i<100;i++)visitor.step(.1,clock,env);
  expect(visitor.conversation(clock)).toBeDefined();
  const conversation=new MerchantConversations();
  expect(conversation.update(.1,clock,new Map([['celina',host],['helena',visitor]]),'celina')).toBeUndefined();
  expect(host.state.socialUntil).toBe(0);
  expect(host.step(.1,clock,env).moving).toBe(true);
 });
 it('releases both actors on a schedule boundary, room change or guidance',()=>{
  for(const reason of ['schedule','room','guide'] as const){
   const {routines,clock}=plazaPair(['augusto','bento']),conversation=new MerchantConversations();
   expect(conversation.update(.1,clock,routines)).toBeDefined();
   if(reason==='schedule')clock.time=MERCHANT_LUNCHES.augusto.end;
   expect(conversation.update(.1,clock,routines,reason==='room'?'augusto':undefined,reason==='guide'?'bento':undefined)).toBeUndefined();
   expect(conversation.participants).toHaveLength(0);
   for(const r of routines.values()){
    r.state.wait=0;
    expect(r.step(.1,{day:2,time:1000},env).moving).toBe(true);
   }
  }
 });
});
