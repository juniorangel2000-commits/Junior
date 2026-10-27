import {describe,it,expect} from 'vitest';
import {MerchantDailyRoutine,merchantPeriod,validMerchantRoutine,validMerchantRoutines,type RoutineId,type RoutineEnvironment,type RoutineArea} from '../src/systems/merchant-routine';
import {createMerchantLayout,merchantRoomNavigation} from '../src/data/merchant-rooms';
import {createSmithLayout,smithNavigation} from '../src/systems/smith-layout';
import {villageBlockedAt,villagePointBlocked} from '../src/data/village';
import {merchantOutside} from '../src/systems/merchant-visit';
import {freeArrival,actorsOverlap} from '../src/systems/actor-arrival';
import {advanceClock} from '../src/systems/clock';
import {createNewSave,validateSave} from '../src/systems/save';
const navigation=(id:RoutineId)=>id==='bento'?smithNavigation(createSmithLayout()):merchantRoomNavigation(id,createMerchantLayout(id));
function fixture(id:RoutineId){
 const nav=navigation(id),r=new MerchantDailyRoutine(id,{...merchantOutside(id),direction:'down',shop:false},nav);
 const blocked=(area:RoutineArea,x:number,y:number)=>area==='shop'?nav.isBlocked(x,y):villageBlockedAt(x,y);
 const point=(area:RoutineArea,x:number,y:number)=>area==='shop'?!nav.validPosition!(x,y):[[-7,-5],[7,-5],[-7,3],[7,3]].some(([dx,dy])=>villagePointBlocked(x+dx,y+dy));
 const env:RoutineEnvironment={blocked,fits:(a,x,y)=>!point(a,x,y),arrival:(a,p)=>freeArrival(p,(x,y)=>point(a,x,y),[])};
 return {nav,r,env,point};
}

describe('daily merchants share routes, clock and persistent actors',()=>{
 it('uses game-clock opening, lunch, return and closing boundaries',()=>{
  for(const id of ['augusto','bento'] as const){expect(merchantPeriod(id,479)).toBe('closed');expect(merchantPeriod(id,480)).toBe('work');expect(merchantPeriod(id,720)).toBe('break');expect(merchantPeriod(id,809.99)).toBe('break');expect(merchantPeriod(id,810)).toBe('work');}
  expect(merchantPeriod('bento',1140)).toBe('closed');expect(merchantPeriod('augusto',1140)).toBe('work');expect(merchantPeriod('augusto',1200)).toBe('closed');expect(merchantPeriod('augusto',0)).toBe('closed');
 });
 it.each(['augusto','bento'] as const)('%s enters, walks around furniture, takes a plaza break and returns before resting',id=>{
  const {r,env,point}=fixture(id);let clock={day:1,time:480},walked=0,sawShop=false,sawPlaza=false,returned=false;
  for(let i=0;i<4300;i++){const step=r.step(.1,clock,env);if(step.moving)walked++;sawShop ||= step.area==='shop';sawPlaza ||= r.activity==='plaza'&&Math.hypot(step.x-1600,step.y-1328)<70;returned ||= sawPlaza&&step.area==='shop'&&clock.time>=810;
   if(point(step.area,step.x,step.y)||!validMerchantRoutine(r.state))throw new Error(id+' '+JSON.stringify({clock,step}));clock=advanceClock(clock,.2);
  }
  expect(walked).toBeGreaterThan(100);expect(sawShop).toBe(true);expect(sawPlaza).toBe(true);expect(returned).toBe(true);expect(r.state.area).toBe('shop');expect(r.isServing(clock)).toBe(false);
 },15000);
 it('waits for an occupied doorway instead of transferring from an unrelated tile',()=>{
  const {r,env}=fixture('augusto');let attempts=0;const locked={...env,arrival:()=>{attempts++;return null;}};
  for(let i=0;i<250;i++)r.step(.1,{day:1,time:510},locked);
  expect(attempts).toBeGreaterThan(0);expect(r.state.area).toBe('village');
  for(let i=0;i<50;i++)r.step(.1,{day:1,time:510},env);expect(r.state.area).toBe('shop');
 });
 it('routes around an actor, never walking through their foot box',()=>{
  const {r,env,nav}=fixture('augusto');Object.assign(r.state,{area:'shop',x:288,y:335});const actor={x:288,y:296};
  const blocked=(a:RoutineArea,x:number,y:number)=>env.blocked(a,x,y)||(a==='shop'&&actorsOverlap({x:x*8+4,y:y*8+4},actor));
  const guarded={...env,blocked,fits:(a:RoutineArea,x:number,y:number)=>env.fits(a,x,y)&&!actorsOverlap({x,y},actor)};
  let moved=0;for(let i=0;i<1200;i++){const s=r.step(.1,{day:1,time:510},guarded);moved+=Number(s.moving);expect(actorsOverlap(s,actor)).toBe(false);expect(nav.validPosition!(s.x,s.y)).toBe(true);}
  expect(moved).toBeGreaterThan(80);expect(r.state.y).toBeLessThan(260);
 },15000);
 it('honors guidance temporarily during lunch, then resumes its clock schedule',()=>{
  const {r,env}=fixture('augusto');r.guided({day:2,time:719},{x:288,y:151},true);
  expect(r.isServing({day:2,time:730})).toBe(true);expect(r.availability({day:2,time:730}).canGuide).toBe(false);
  for(let i=0;i<500;i++)r.step(.1,{day:2,time:780},env);expect(r.state.area).toBe('village');expect(r.isServing({day:2,time:1201})).toBe(false);
 });
 it('copies only coordinates from live sprite objects when guiding',()=>{
  const {r}=fixture('augusto'),sprite=Object.assign(Object.create({x:1072,y:1040}),{scene:{update:()=>undefined},texture:{}});
  r.guided({day:1,time:540},sprite,false);expect(r.state.x).toBe(1072);expect(r.state.y).toBe(1040);expect('scene' in r.state).toBe(false);expect(()=>structuredClone(r.state)).not.toThrow();expect(validMerchantRoutine(r.state)).toBe(true);
 });
 it('persists lunch conversations and rejects corrupted daily states without invalidating old saves',()=>{
  const {r,env,nav}=fixture('augusto');r.socialize({day:3,time:750});const restored=new MerchantDailyRoutine('augusto',{x:288,y:151,direction:'down',shop:true},nav,JSON.parse(JSON.stringify(r.state)));expect(restored.state).toEqual(r.state);const p={x:r.state.x,y:r.state.y};restored.step(.1,{day:3,time:751},env);expect(restored.state.x).toBe(p.x);expect(restored.state.y).toBe(p.y);
  const save=createNewSave({name:'Rotina',skin:'#d9a276',hairStyle:'preso',hairColor:'#754323',outfit:'#638a9d'});expect(validateSave(save)).toBe(true);save.villageRoutines={augusto:restored.state};expect(validateSave(JSON.parse(JSON.stringify(save)))).toBe(true);
  expect(validMerchantRoutines({rosa:r.state})).toBe(false);expect(validMerchantRoutine({...r.state,wait:-1})).toBe(false);expect(validMerchantRoutine({...r.state,x:NaN})).toBe(false);expect(validateSave({...save,villageRoutines:{augusto:{...r.state,serviceUntil:Infinity}}})).toBe(false);
 });
});
