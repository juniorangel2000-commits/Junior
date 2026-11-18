import {describe,it,expect} from 'vitest';
import {MERCHANT_VISITS} from '../src/data/merchant-visits';
import {MerchantDailyRoutine,merchantMayEnter,merchantPeriod,type RoutineId,type RoutineArea,type RoutineEnvironment} from '../src/systems/merchant-routine';
import {createMerchantLayout,merchantRoomNavigation} from '../src/data/merchant-rooms';
import {createSmithLayout,smithNavigation} from '../src/systems/smith-layout';
import {villageBlockedAt,villagePointBlocked} from '../src/data/village';
import {freeArrival} from '../src/systems/actor-arrival';
import {restDay,restDays,innGuests,villageExtra,REST_WEEKDAY,rainyDay} from '../src/data/village-schedule';
import {MERCHANT_LUNCHES} from '../src/data/merchant-lunches';

const ids=Object.keys(MERCHANT_VISITS) as RoutineId[];
const rooms=new Map(ids.map(id=>[id,id==='bento'?smithNavigation(createSmithLayout()):merchantRoomNavigation(id,createMerchantLayout(id))]));
const navigation=(id:RoutineId)=>rooms.get(id)!;
function fixture(id:RoutineId){
 const r=new MerchantDailyRoutine(id,{...navigation(id).entry!,direction:'up',shop:true},navigation(id),undefined,6,navigation);
 const blocked=(area:RoutineArea,x:number,y:number,owner=r.roomOwner)=>area==='shop'?!navigation(owner).validPosition!(x,y):[[-7,-5],[7,-5],[-7,3],[7,3]].some(([dx,dy])=>villagePointBlocked(x+dx,y+dy));
 const env:RoutineEnvironment={blocked:(a,x,y,o=r.roomOwner)=>a==='shop'?navigation(o).isBlocked(x,y):villageBlockedAt(x,y),cellBlocked:(a,x,y)=>a==='shop'?!!navigation(r.roomOwner).cellBlocked!(x,y):villageBlockedAt(x,y),fits:(a,x,y,o)=>!blocked(a,x,y,o),arrival:(a,p,o)=>freeArrival(p,(x,y)=>blocked(a,x,y,o),[])};
 return{r,env,blocked};
}
const run=(r:MerchantDailyRoutine,env:RoutineEnvironment,clock:{day:number;time:number},until:()=>boolean,max=15000)=>{for(let i=0;i<max&&!until();i++)r.step(.1,clock,env);return until();};

describe('rotina da vila: folga, chuva e pousada',()=>{
 it('dá uma folga semanal a sete moradores e mantém Bento, Damião e Helena sem folga',()=>{
  expect(Object.keys(REST_WEEKDAY)).toHaveLength(7);
  for(const id of ['bento','damiao','helena'] as const){expect(restDays(id)).toEqual([]);for(let d=1;d<=28;d++)expect(restDay(id,d)).toBe(false);}
  for(const id of Object.keys(REST_WEEKDAY) as RoutineId[]){
   const days=restDays(id);expect(days).toHaveLength(4);
   for(const d of days){expect(restDay(id,d)).toBe(true);expect(restDay(id,d+28)).toBe(true);expect(merchantPeriod(id,600,d)).toBe('closed');expect(merchantMayEnter(id,{day:d,time:600})).toBe(false);expect(merchantMayEnter(id,{day:d,time:600},id)).toBe(true);}
   expect(merchantPeriod(id,600,days[0]+1)).toBe('work');
  }
  // Os primeiros dias de uma partida nova não têm folga.
  for(const d of [1,2,3])for(const id of ids)expect(restDay(id,d)).toBe(false);
 });
 it('leva três moradores diferentes à pousada a cada noite, em rodízio',()=>{
  const seen=new Set<RoutineId>();
  for(let d=1;d<=9;d++){const g=innGuests(d);expect(new Set(g).size).toBe(3);expect(g).not.toContain('helena');g.forEach(id=>seen.add(id));}
  expect(seen.size).toBe(9);expect(innGuests(4)).not.toEqual(innGuests(5));
 });
 it('escolhe passeio na folga com sol e pousada na folga com chuva, no almoço chuvoso e à noite',()=>{
  const lunch=MERCHANT_LUNCHES.augusto,days=[...Array(200).keys()].map(i=>i+1);
  const sunnyOff=days.find(d=>restDay('augusto',d)&&!rainyDay(d))!,rainyOff=days.find(d=>restDay('nilo',d)&&rainyDay(d))!,rainyWork=days.find(d=>!restDay('augusto',d)&&rainyDay(d))!,sunnyWork=days.find(d=>!restDay('augusto',d)&&!rainyDay(d))!;
  expect(villageExtra('augusto',{day:sunnyOff,time:600},1200,lunch)).toBe('stroll');
  expect(villageExtra('augusto',{day:sunnyOff,time:8*60},1200,lunch)).toBeUndefined();
  expect(villageExtra('nilo',{day:rainyOff,time:600},1080,MERCHANT_LUNCHES.nilo)).toBe('inn');
  expect(villageExtra('augusto',{day:rainyWork,time:lunch.start+5},1200,lunch)).toBe('inn');
  expect(villageExtra('augusto',{day:sunnyWork,time:lunch.start+5},1200,lunch)).toBeUndefined();
  expect(villageExtra('helena',{day:rainyWork,time:MERCHANT_LUNCHES.helena.start+5},1320,MERCHANT_LUNCHES.helena)).toBe('inn');
  const day=[...Array(20).keys()].map(i=>i+1).find(d=>innGuests(d).includes('rosa'))!;
  expect(villageExtra('rosa',{day,time:1100},1080,MERCHANT_LUNCHES.rosa)).toBe('inn');
  expect(villageExtra('rosa',{day,time:21*60},1080,MERCHANT_LUNCHES.rosa)).toBeUndefined();
 });
 it('Augusto sai para passear na folga e mostra a folga na janela',()=>{
  const day=[...Array(200).keys()].map(i=>i+1).find(d=>restDay('augusto',d)&&!rainyDay(d))!,{r,env,blocked}=fixture('augusto'),clock={day,time:600};
  expect(run(r,env,clock,()=>r.state.area==='village'&&r.activity.startsWith('stroll')&&!r.isMoving&&r.state.wait>0)).toBe(true);
  expect(blocked(r.state.area,r.state.x,r.state.y)).toBe(false);expect(r.isServing(clock)).toBe(false);
  const a=r.availability(clock);expect(a.message).toContain('Folga hoje');expect(a.canGuide).toBe(false);
  expect(r.availability({day:3,time:1300}).message).toContain('folga nos dias 5, 12, 19 e 26');
 },20000);
 it('com chuva, Augusto almoça dentro da pousada e volta à loja depois',()=>{
  const day=[...Array(200).keys()].map(i=>i+1).find(d=>!restDay('augusto',d)&&rainyDay(d))!,{r,env}=fixture('augusto'),lunch=MERCHANT_LUNCHES.augusto;
  expect(run(r,env,{day,time:lunch.start+1},()=>r.state.area==='shop'&&r.roomOwner==='helena')).toBe(true);
  expect(r.availability({day,time:lunch.start+1}).message).toContain('pousada');
  expect(run(r,env,{day,time:lunch.end+1},()=>r.state.area==='shop'&&r.roomOwner==='augusto')).toBe(true);
 },20000);
 it('à noite um hóspede janta na pousada e vai para casa às 21:00',()=>{
  const day=[...Array(40).keys()].map(i=>i+1).find(d=>innGuests(d).includes('rosa')&&!restDay('rosa',d))!;
  const {r,env}=fixture('rosa');
  expect(run(r,env,{day,time:1081},()=>r.state.area==='shop'&&r.roomOwner==='helena'&&r.activity==='inn-seat'&&!r.isMoving)).toBe(true);
  expect(r.availability({day,time:1100}).message).toContain('Jantando');
  expect(run(r,env,{day,time:21*60+1},()=>r.state.area==='shop'&&r.roomOwner==='rosa')).toBe(true);
  expect(r.state.roomOwner).toBeUndefined();
 },20000);
});
describe('chuva sorteada',()=>{
 it('sorteia o tempo por dia, sem padrão semanal, e mantém o primeiro dia aberto',async()=>{
  const {weatherForDay}=await import('../src/weather-model');
  expect(weatherForDay(1)).toBe('clear');
  const year=Array.from({length:112},(_,i)=>weatherForDay(i+1)),rain=year.filter(w=>w==='rain').length;
  expect(rain).toBeGreaterThan(15);expect(rain).toBeLessThan(50);
  expect(year).toEqual(Array.from({length:112},(_,i)=>weatherForDay(i+1)));
  const weekday=(w:number)=>year.filter((_,i)=>(i+1)%7===w).map(x=>x==='rain');
  expect([0,1,2,3,4,5,6].some(w=>new Set(weekday(w)).size===2)).toBe(true);
  const {rainDropCount}=await import('../src/world-rain');const c=rainDropCount(1920*1080);expect(c.far).toBeGreaterThan(200);expect(c.near).toBeGreaterThan(60);
 });
});
