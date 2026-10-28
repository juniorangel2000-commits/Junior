import {VILLAGE_BUILDINGS} from '../src/data/village';
import {describe,it,expect} from 'vitest';
import catalog from '../public/assets/visual/village/tobias/manifest.json';
import authored from '../src/data/tobias-layout.json';
import previousTobias from '../src/data/tobias-layout-v1.json';
import {createMerchantLayout,validMerchantLayout,merchantRoomConnected,merchantRoomFits,merchantRoomNavigation,merchantRoomPieces,resolveMerchantLayout} from '../src/data/merchant-rooms';
import {TOBIAS_SHOP,tobiasShopBlockedPoint,tobiasSourceSolid} from '../src/data/tobias-shop';
import {MerchantDailyRoutine,validMerchantRoutines,merchantPeriod} from '../src/systems/merchant-routine';
import {merchantDoor,merchantOutside} from '../src/systems/merchant-visit';
import {villageBlockedAt,villagePointBlocked} from '../src/data/village';
import {freeArrival} from '../src/systems/actor-arrival';
import {createNewSave,validateSave} from '../src/systems/save';
import type {SmithLayout} from '../src/systems/smith-layout';
describe('Tobias carpentry',()=>{
 it('uses seventeen original objects and the connected 22-piece authored retail/workshop interior',()=>{
  expect(catalog.createdFromScratch).toBe(17);expect(catalog.referenceCrops).toBe(0);const layout=createMerchantLayout('tobias');expect(layout).toEqual(authored);expect(layout.pieces).toHaveLength(22);expect(layout.pieces.some(p=>p.asset==='floor-stone')).toBe(false);expect(layout.pieces.find(p=>p.id==='floor')?.asset).toBe('floor-wood');expect(validMerchantLayout(layout)).toBe(true);expect(merchantRoomConnected('tobias',layout)).toBe(true);
  for(const p of [{x:288,y:335},{x:288,y:225},{x:288,y:151}])expect(merchantRoomFits('tobias',p.x,p.y,layout)).toBe(true);
 });
 it('updates the previous published default, preserving other edits and surviving save/load',()=>{
  const old=structuredClone(previousTobias) as SmithLayout;
  expect(resolveMerchantLayout('tobias',old)).toEqual(authored);
  const normalized=structuredClone(old);for(const p of normalized.pieces)p.effects=true;
  expect(resolveMerchantLayout('tobias',normalized)).toEqual(authored);
  old.pieces.find(p=>p.id==='tobias-mat')!.x+=4;
  expect(resolveMerchantLayout('tobias',old)).toEqual(old);
  const save=createNewSave({name:'Tobias',skin:'#d9a276',hairStyle:'preso',hairColor:'#754323',outfit:'#638a9d'});
  save.merchantScenes={tobias:createMerchantLayout('tobias')};const loaded=JSON.parse(JSON.stringify(save));
  expect(validateSave(loaded)).toBe(true);expect(resolveMerchantLayout('tobias',loaded.merchantScenes.tobias)).toEqual(authored);
 });
 it('replaces only the untouched provisional carpentry, preserving custom arrangements',()=>{
  const old:SmithLayout={version:1,pieces:[{id:'structure',asset:'structure',x:0,y:0,sx:1,sy:1,visible:true,wallShade:1},{id:'floor',asset:'floor-wood',x:33,y:116,sx:510,sy:234,visible:true},...merchantRoomPieces('tobias').map(a=>({id:a.id,asset:a.id,x:a.recommendedPosition.x*.6,y:a.recommendedPosition.y*.6,sx:a.scale*.6,sy:a.scale*.6,visible:true,...a.supportId?{parent:a.supportId}:{}}))]};
  expect(resolveMerchantLayout('tobias',old)).toEqual(authored);old.pieces[2].x+=6;expect(resolveMerchantLayout('tobias',old)).toEqual(old);
 });
 it('keeps the doorway and open workshop apron walkable while walls, bench and grounded posts remain solid',()=>{
  expect((1374-206)*TOBIAS_SHOP.scale).toBeCloseTo(350.4);
  const d=merchantDoor('tobias'),b=VILLAGE_BUILDINGS.find(b=>b.shop==='carpenter')!;for(const[dx,dy]of[[-7,-5],[7,-5],[-7,3],[7,3]])expect(tobiasShopBlockedPoint(d.x+dx,d.y+dy,b)).toBe(false);
  expect(tobiasSourceSolid(450,640)).toBe(true);expect(tobiasSourceSolid(778,823)).toBe(true);expect(tobiasSourceSolid(1299,830)).toBe(true);expect(tobiasSourceSolid(970,770)).toBe(true);expect(tobiasSourceSolid(970,830)).toBe(false);expect(tobiasSourceSolid(970,450)).toBe(false);
 });
 it('walks into the shop, takes a plaza break, returns, closes and persists using the existing calendar',()=>{
  const nav=merchantRoomNavigation('tobias'),r=new MerchantDailyRoutine('tobias',{...merchantOutside('tobias'),direction:'down',shop:false},nav);
  const scenery=(area:string,x:number,y:number)=>area==='shop'?!nav.validPosition!(x,y):[[-7,-5],[7,-5],[-7,3],[7,3]].some(([dx,dy])=>villagePointBlocked(x+dx,y+dy));
  const env={cellBlocked:(a:string,x:number,y:number)=>a==='shop'?nav.cellBlocked!(x,y):villageBlockedAt(x,y),blocked:(a:string,x:number,y:number)=>a==='shop'?nav.isBlocked(x,y):villageBlockedAt(x,y),fits:(a:string,x:number,y:number)=>!scenery(a,x,y),arrival:(a:string,p:{x:number;y:number})=>freeArrival(p,(x,y)=>scenery(a,x,y),[])};
  const walk=(time:number,count:number)=>{for(let i=0;i<count;i++){r.step(.1,{day:2,time},env);expect(scenery(r.state.area,r.state.x,r.state.y)).toBe(false);}};
  walk(540,400);expect(r.state.area).toBe('shop');expect(r.isServing({day:2,time:540})).toBe(true);
  walk(735,2000);expect(r.state.area).toBe('village');expect(Math.hypot(r.state.x-1456,r.state.y-1392)).toBeLessThan(40);
  walk(900,2000);expect(r.state.area).toBe('shop');expect(merchantPeriod('tobias',1080)).toBe('closed');expect(r.isServing({day:2,time:1080})).toBe(false);
  const save=createNewSave({name:'Tobias',skin:'#d9a276',hairStyle:'preso',hairColor:'#754323',outfit:'#638a9d'});save.villageRoutines={tobias:structuredClone(r.state)};save.merchantScenes={tobias:createMerchantLayout('tobias')};expect(validMerchantRoutines(save.villageRoutines)).toBe(true);expect(validateSave(JSON.parse(JSON.stringify(save)))).toBe(true);
 },15000);
});
