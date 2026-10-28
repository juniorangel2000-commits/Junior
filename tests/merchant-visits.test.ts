import {describe,it,expect} from 'vitest';
import {MERCHANT_VISITS} from '../src/data/merchant-visits';
import {MerchantDailyRoutine,merchantMayEnter,MERCHANT_DAILY_PLAN,validMerchantRoutine,type RoutineId,type RoutineArea,type RoutineEnvironment} from '../src/systems/merchant-routine';
import {merchantOutside} from '../src/systems/merchant-visit';
import {createMerchantLayout,merchantRoomNavigation} from '../src/data/merchant-rooms';
import {createSmithLayout,smithNavigation} from '../src/systems/smith-layout';
import {villageBlockedAt,villagePointBlocked} from '../src/data/village';
import {freeArrival} from '../src/systems/actor-arrival';
import {createNewSave,validateSave} from '../src/systems/save';
import {advanceClock,GAME_MINUTES_PER_SECOND} from '../src/systems/clock';

const ids=Object.keys(MERCHANT_VISITS) as RoutineId[];
const rooms=new Map(ids.map(id=>[id,id==='bento'?smithNavigation(createSmithLayout()):merchantRoomNavigation(id,createMerchantLayout(id))]));
const navigation=(id:RoutineId)=>rooms.get(id)!;
function fixture(id:RoutineId){
 const r=new MerchantDailyRoutine(id,{...navigation(id).entry!,direction:'up',shop:true},navigation(id),undefined,6,navigation);
 const blocked=(area:RoutineArea,x:number,y:number,owner=r.roomOwner)=>area==='shop'?!navigation(owner).validPosition!(x,y):[[-7,-5],[7,-5],[-7,3],[7,3]].some(([dx,dy])=>villagePointBlocked(x+dx,y+dy));
 const env:RoutineEnvironment={blocked:(a,x,y,o=r.roomOwner)=>a==='shop'?navigation(o).isBlocked(x,y):villageBlockedAt(x,y),cellBlocked:(a,x,y)=>a==='shop'?!!navigation(r.roomOwner).cellBlocked!(x,y):villageBlockedAt(x,y),fits:(a,x,y,o)=>!blocked(a,x,y,o),arrival:(a,p,o)=>freeArrival(p,(x,y)=>blocked(a,x,y,o),[])};
 return{r,env,blocked};
}
describe('individual shop visits and closed-door access',()=>{
 it('gives all ten merchants a different visit, conversation and work order',()=>{
  expect(ids).toHaveLength(10);
  expect(new Set(ids.map(id=>MERCHANT_VISITS[id].start))).toHaveProperty('size',10);
  expect(new Set(ids.map(id=>MERCHANT_VISITS[id].workOrder.join(','))).size).toBe(10);
  for(const id of ids){const p=MERCHANT_VISITS[id];expect(p.host).not.toBe(id);expect(p.end).toBeGreaterThan(p.start);expect(p.lines.every(s=>s.length>10)).toBe(true);}
 });
 it.each(ids)('%s walks to the other shop, preserves that room in save, and walks home',id=>{
  const {r,env,blocked}=fixture(id),plan=MERCHANT_VISITS[id],clock={day:3,time:plan.start+1};let moved=0,arrived=false;
  for(let i=0;i<12000;i++){
   const s=r.step(.1,clock,env);moved+=Number(s.moving);
   expect(blocked(s.area,s.x,s.y),id+' '+r.activity+' '+JSON.stringify(s)).toBe(false);
   if(r.conversation(clock)){arrived=true;break;}
  }
  expect(arrived).toBe(true);expect(moved).toBeGreaterThan(20);expect(r.roomOwner).toBe(plan.host);expect(r.isServing(clock)).toBe(false);
  const restored=new MerchantDailyRoutine(id,{...merchantOutside(id),direction:'down',shop:false},navigation(id),JSON.parse(JSON.stringify(r.state)),6,navigation);
  expect(restored.state).toEqual(r.state);expect(restored.roomOwner).toBe(plan.host);
  const save=createNewSave({name:'Visita',skin:'#d9a276',hairStyle:'preso',hairColor:'#754323',outfit:'#638a9d'});save.villageRoutines={[id]:structuredClone(r.state)};expect(validateSave(JSON.parse(JSON.stringify(save)))).toBe(true);
  for(let i=0;i<12000&&!(r.state.area==='shop'&&r.roomOwner===id);i++){const s=r.step(.1,{day:3,time:plan.end+1},env);expect(blocked(s.area,s.x,s.y)).toBe(false);}
  expect(r.state.area).toBe('shop');expect(r.roomOwner).toBe(id);expect(r.state.roomOwner).toBeUndefined();
 },15000);
 it('admits only the owner after closing, blocks early entry, and allows visitors while open',()=>{
  for(const id of ids){const close=MERCHANT_DAILY_PLAN.closing[id];for(const time of [0,479,close,1439]){expect(merchantMayEnter(id,{day:1,time})).toBe(false);for(const actor of ids)expect(merchantMayEnter(id,{day:1,time},actor)).toBe(actor===id);}expect(merchantMayEnter(id,{day:1,time:480})).toBe(true);expect(merchantMayEnter(id,{day:1,time:close-1})).toBe(true);}
 });
 it.each(ids)('%s has time to arrive when the real game clock advances',id=>{
  const {r,env}=fixture(id),plan=MERCHANT_VISITS[id];let clock={day:2,time:plan.start},arrived=false;
  while(clock.time<plan.end){r.step(.1,clock,env);if(r.conversation(clock)){arrived=true;break;}clock=advanceClock(clock,.1*GAME_MINUTES_PER_SECOND);}
  expect(arrived,id+' '+r.activity+' '+JSON.stringify(r.state)).toBe(true);
 });
 it('rejects corrupted visitor owners while preserving old states without the new field',()=>{
  const {r}=fixture('augusto');expect(validMerchantRoutine(r.state)).toBe(true);
  expect(validMerchantRoutine({...r.state,roomOwner:'unknown'})).toBe(false);
  expect(validMerchantRoutine({...r.state,area:'village',roomOwner:'rosa'})).toBe(false);
 });
});
