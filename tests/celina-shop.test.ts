import {describe,it,expect} from 'vitest';
import catalog from '../public/assets/visual/village/celina/manifest.json';
import authored from '../src/data/celina-layout.json';
import {createMerchantLayout,validMerchantLayout,merchantRoomConnected,merchantRoomFits,merchantRoomNavigation,merchantRoomPieces,resolveMerchantLayout} from '../src/data/merchant-rooms';
import {celinaSourceSolid,celinaShopBlockedPoint} from '../src/data/celina-shop';
import {MerchantDailyRoutine,dailyMerchant,merchantPeriod} from '../src/systems/merchant-routine';
import {merchantDoor,merchantOutside} from '../src/systems/merchant-visit';
import {villageBlockedAt,villagePointBlocked} from '../src/data/village';
import {freeArrival} from '../src/systems/actor-arrival';
import {createNewSave,validateSave} from '../src/systems/save';
import type {SmithLayout} from '../src/systems/smith-layout';

describe('Celina tailor shop',()=>{
 it('has sixteen independent objects and a connected wood-floor shop',()=>{
  const layout=createMerchantLayout('celina');expect(layout).toEqual(authored);expect(catalog.createdFromScratch).toBe(16);expect(layout.pieces).toHaveLength(19);expect(validMerchantLayout(layout)).toBe(true);expect(merchantRoomConnected('celina',layout)).toBe(true);
  expect(layout.pieces.some(p=>p.asset==='floor-stone')).toBe(false);expect(layout.pieces.find(p=>p.id==='structure')?.wallShade).toBe(1);
  for(const p of [{x:288,y:335},{x:288,y:225},{x:288,y:151}])expect(merchantRoomFits('celina',p.x,p.y)).toBe(true);
  for(const a of catalog.assets.filter(a=>'crop'in a)){const r=a.crop!,b=a.bounds;expect(b[0]).toBeGreaterThan(0);expect(b[1]).toBeGreaterThan(0);expect(b[2]).toBeLessThan(r.width);expect(b[3]).toBeLessThan(r.height);}
 });
 it('migrates only untouched provisional interiors and preserves customized saves',()=>{
  const old:SmithLayout={version:1,pieces:[{id:'structure',asset:'structure',x:0,y:0,sx:1,sy:1,visible:true,wallShade:1},{id:'floor',asset:'floor-wood',x:33,y:116,sx:510,sy:234,visible:true},...merchantRoomPieces('celina').map(a=>({id:a.id,asset:a.id,x:a.recommendedPosition.x*.6,y:a.recommendedPosition.y*.6,sx:a.scale*.6,sy:a.scale*.6,visible:true,...a.supportId?{parent:a.supportId}:{}}))]};
  expect(resolveMerchantLayout('celina',old)).toEqual(authored);old.pieces[2].x+=5;expect(resolveMerchantLayout('celina',old)).toEqual(old);
  const save=createNewSave({name:'Celina',skin:'#d9a276',hairStyle:'preso',hairColor:'#754323',outfit:'#638a9d'});save.merchantScenes={celina:createMerchantLayout('celina')};expect(validateSave(JSON.parse(JSON.stringify(save)))).toBe(true);
 });
 it('protects the walls and planters while preserving the door and roof overhang',()=>{
  const d=merchantDoor('celina'),b={x:70,y:22};for(const[dx,dy]of[[-7,-5],[7,-5],[-7,3],[7,3]])expect(celinaShopBlockedPoint(d.x+dx,d.y+dy,b)).toBe(false);
  expect(celinaSourceSolid(400,800)).toBe(true);expect(celinaSourceSolid(1100,850)).toBe(true);expect(celinaSourceSolid(800,850)).toBe(false);expect(celinaSourceSolid(800,300)).toBe(false);
 });
 it('uses the existing daily routine, persisted calendar without requiring a village level',()=>{
  const nav=merchantRoomNavigation('celina'),r=new MerchantDailyRoutine('celina',{...merchantOutside('celina'),direction:'down',shop:false},nav,undefined,6);
  const scenery=(area:string,x:number,y:number)=>area==='shop'?!nav.validPosition!(x,y):[[-7,-5],[7,-5],[-7,3],[7,3]].some(([dx,dy])=>villagePointBlocked(x+dx,y+dy));
  const env={cellBlocked:(a:string,x:number,y:number)=>a==='shop'?nav.cellBlocked!(x,y):villageBlockedAt(x,y),blocked:(a:string,x:number,y:number)=>a==='shop'?nav.isBlocked(x,y):villageBlockedAt(x,y),fits:(a:string,x:number,y:number)=>!scenery(a,x,y),arrival:(a:string,p:{x:number;y:number})=>freeArrival(p,(x,y)=>scenery(a,x,y),[])};
  const phases=new Set<number>(),walk=(time:number,count:number)=>{for(let i=0;i<count;i++){const step=r.step(.1,{day:2,time},env);if(step.moving)phases.add(step.phase);expect(scenery(r.state.area,r.state.x,r.state.y)).toBe(false);}};
  walk(540,500);expect(r.state.area).toBe('shop');expect(r.isServing({day:2,time:540})).toBe(true);
  walk(735,3500);expect(r.state.area).toBe('village');expect(Math.hypot(r.state.x-1648,r.state.y-1392)).toBeLessThan(40);
  walk(900,3500);expect(r.state.area).toBe('shop');expect(phases.size).toBe(6);expect(dailyMerchant('celina')).toBe(true);expect(merchantPeriod('celina',1080)).toBe('closed');
  const save=createNewSave({name:'Celina',skin:'#d9a276',hairStyle:'preso',hairColor:'#754323',outfit:'#638a9d'});save.villageRoutines={celina:structuredClone(r.state)};save.merchantScenes={celina:createMerchantLayout('celina')};expect(validateSave(JSON.parse(JSON.stringify(save)))).toBe(true);
 },15000);
});
