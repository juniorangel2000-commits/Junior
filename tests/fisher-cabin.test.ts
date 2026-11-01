import {describe,it,expect} from 'vitest';
import {cabinPoint,cabinFloorPoint,cabinSolidPoint,FISHER_CABIN,cabinClearing} from '../src/data/fisher-cabin';
import {lakeBlockedPoint,LAKE_OBJECTS,lakeWaterDistance} from '../src/data/fishing-lake';
import {fisherAtLake} from '../src/data/fisher-schedule';
import {lakeFisherPose,LAKE_FISHER_WALK} from '../src/systems/lake-fisher';
import {fisherTrade,fisherService} from '../src/systems/fisher-transactions';
import {createNewSave,validateSave} from '../src/systems/save';
import {createVillageEconomy} from '../src/data/village-commerce';
import {createVillageProgress} from '../src/data/village-progress';
import {MerchantDailyRoutine} from '../src/systems/merchant-routine';
import {merchantRoomNavigation,createMerchantLayout} from '../src/data/merchant-rooms';
const save=()=>{const s=createNewSave({name:'Pesca',characterId:'farmer-male',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'curto'});s.time=480;s.villageEconomy=createVillageEconomy();s.villageEconomy.coins=1000;s.villageProgress=createVillageProgress();return s;};
describe('fishing cabin and morning visit',()=>{
 it('keeps walls and rails solid but leaves the staircase and porch accessible',()=>{
  for(const [x,y]of[[650,765],[603,825],[530,1010]]){const p=cabinPoint(x,y);expect(cabinSolidPoint(p.x,p.y)).toBe(false);expect(cabinFloorPoint(p.x,p.y)).toBe(true);expect(lakeWaterDistance(p.x/32,p.y/32)).toBeGreaterThan(0);}
  for(const [x,y]of[[700,620],[300,744],[1000,837],[860,770],[430,635]]){const p=cabinPoint(x,y);expect(cabinSolidPoint(p.x,p.y)).toBe(true);expect(lakeBlockedPoint(p.x,p.y,undefined,true)).toBe(true);}
  expect(LAKE_OBJECTS.filter(p=>cabinClearing(p.x,p.y)&&!p.kind.startsWith('lakeRock'))).toEqual([]);expect(FISHER_CABIN.width).toBeLessThan(450);
 });
 it('provides a continuous dry walk between the porch, stairs and pier with full foot clearance',()=>{
  for(let i=1;i<LAKE_FISHER_WALK.length;i++){const a=LAKE_FISHER_WALK[i-1],b=LAKE_FISHER_WALK[i],steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/3);for(let j=0;j<=steps;j++)for(const[dx,dy]of[[-7,-5],[7,-5],[-7,3],[7,3]]){const x=a.x+(b.x-a.x)*j/steps+dx,y=a.y+(b.y-a.y)*j/steps+dy;expect(lakeBlockedPoint(x,y),`segment ${i} at ${(x/32).toFixed(2)},${(y/32).toFixed(2)}`).toBe(false);}}
 });
 it('uses game time for a continuous routine and stands still at each fishing stop',()=>{
  expect(fisherAtLake(479.99)).toBe(false);expect(fisherAtLake(480)).toBe(true);expect(fisherAtLake(689.99)).toBe(true);expect(fisherAtLake(690)).toBe(false);
  expect(lakeFisherPose(480).moving).toBe(false);let moving=0,idle=0;
  for(let t=480;t<690;t+=.1){const p=lakeFisherPose(t),next=lakeFisherPose(t+.1);expect(Math.hypot(next.x-p.x,next.y-p.y)).toBeLessThanOrEqual(3.601);if(p.moving)moving++;else{idle++;expect(p.phase).toBe(0);}}
  expect(moving).toBeGreaterThan(50);expect(idle).toBeGreaterThan(50);
  const r=new MerchantDailyRoutine('damiao',{x:288,y:200,direction:'down',shop:true},merchantRoomNavigation('damiao',createMerchantLayout('damiao')));
  expect(r.isServing({day:1,time:480})).toBe(false);expect(r.availability({day:1,time:480})).toEqual({message:expect.stringContaining('cabana do lago'),canGuide:false});expect(r.isServing({day:1,time:700})).toBe(true);
 });
 it('keeps lessons, inventory and wallet atomic when saving fails',()=>{
  const s=save(),before=structuredClone(s);expect(fisherService(s,'fishing-lesson',()=>false).ok).toBe(false);expect(s).toEqual(before);
  expect(fisherService(s,'fishing-lesson',validateSave).ok).toBe(true);expect(s.villageProgress!.fishingSkill).toBe(1);expect(s.villageEconomy!.coins).toBe(970);
  const after=structuredClone(s);expect(fisherService(s,'inn-rest',()=>true).ok).toBe(false);expect(s).toEqual(after);
  expect(fisherTrade(s,'fisher','buy','cord',1,()=>false).ok).toBe(false);expect(s).toEqual(after);
  expect(fisherTrade(s,'fisher','buy','cord',1,validateSave).ok).toBe(true);expect(s.inventory.cord).toBe(after.inventory.cord+1);expect(s.villageEconomy!.coins).toBeLessThan(after.villageEconomy!.coins);
  const final=structuredClone(s);s.time=700;expect(fisherService(s,'fishing-lesson',()=>true).ok).toBe(false);expect(fisherTrade(s,'general','buy','wood',1,()=>true).ok).toBe(false);expect(s.inventory).toEqual(final.inventory);
 });
});
