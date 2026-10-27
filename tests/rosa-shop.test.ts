import {describe,it,expect} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import catalog from '../public/assets/visual/village/rosa/manifest.json';
import sourceHashes from '../public/assets/visual/village/rosa/personagem-sha256.json';
import previousRosa from '../src/data/rosa-layout-v1.json';
import {createMerchantLayout,MERCHANT_ROOM_ASSETS,merchantRoomConnected,merchantRoomFits,merchantRoomNavigation,validMerchantLayout,resolveMerchantLayout,merchantAssets,merchantRoomPieces} from '../src/data/merchant-rooms';
import {MerchantDailyRoutine,merchantPeriod,dailyMerchant,validMerchantRoutines} from '../src/systems/merchant-routine';
import {merchantOutside,merchantDoor,merchantCanTrade} from '../src/systems/merchant-visit';
import {villageBlockedAt,villagePointBlocked,VILLAGE_BUILDINGS} from '../src/data/village';
import {freeArrival} from '../src/systems/actor-arrival';
import {createNewSave,validateSave} from '../src/systems/save';
import {cottageSolidPoint,wellFootprint} from '../src/data/architecture-collision';
import {ROSA_SHOP,rosaShopBlockedPoint} from '../src/data/rosa-shop';
import type {SmithLayout} from '../src/systems/smith-layout';

describe('Rosa agricultural shop',()=>{
 it('has 16 new independent atlas objects and the final connected 20-piece interior',()=>{
  expect(catalog.createdFromScratch).toBe(16);expect(catalog.referenceCrops).toBe(0);
  const layout=createMerchantLayout('rosa');expect(layout.pieces).toHaveLength(20);expect(validMerchantLayout(layout)).toBe(true);expect(merchantRoomConnected('rosa',layout)).toBe(true);
  expect(merchantRoomFits('rosa',288,151)).toBe(true);expect(merchantRoomFits('rosa',288,233)).toBe(true);expect(merchantRoomFits('rosa',288,335)).toBe(true);
  for(const p of layout.pieces)expect(MERCHANT_ROOM_ASSETS.some(a=>a.id===p.asset)).toBe(true);
 });
 it('adopts the new default only when the former shared layout was untouched',()=>{
  const old:SmithLayout={version:1,pieces:[{id:'structure',asset:'structure',x:0,y:0,sx:1,sy:1,visible:true,wallShade:1},{id:'floor',asset:'floor-wood',x:33,y:116,sx:510,sy:234,visible:true},...merchantRoomPieces('rosa').map(a=>({id:a.id,asset:a.id,x:a.recommendedPosition.x*.6,y:a.recommendedPosition.y*.6,sx:a.scale*.6,sy:a.scale*.6,visible:true,...a.supportId?{parent:a.supportId}:{}}))]};
  expect(resolveMerchantLayout('rosa',old)).toEqual(createMerchantLayout('rosa'));old.pieces[2].x+=3;expect(resolveMerchantLayout('rosa',old)).toEqual(old);expect(merchantAssets.length).toBe(31);
 });
 it('migrates the former 19-piece Rosa interior, including normalized editor flags, without discarding other custom edits',()=>{
  const old=structuredClone(previousRosa) as SmithLayout;expect(resolveMerchantLayout('rosa',old)).toEqual(createMerchantLayout('rosa'));
  for(const p of old.pieces){p.effects=true;p.solid=!!MERCHANT_ROOM_ASSETS.find(a=>a.id===p.asset)?.collision;}
  expect(resolveMerchantLayout('rosa',old)).toEqual(createMerchantLayout('rosa'));old.pieces[2].x+=4;expect(resolveMerchantLayout('rosa',old)).toEqual(old);
 });
 it('uses the game clock to enter, take a plaza break, return and close at 18h',()=>{
  const nav=merchantRoomNavigation('rosa'),r=new MerchantDailyRoutine('rosa',{...merchantOutside('rosa'),direction:'down',shop:false},nav);
  const scenery=(area:string,x:number,y:number)=>area==='shop'?!nav.validPosition!(x,y):[[-7,-5],[7,-5],[-7,3],[7,3]].some(([dx,dy])=>villagePointBlocked(x+dx,y+dy));
  const env={cellBlocked:(area:string,x:number,y:number)=>area==='shop'?nav.cellBlocked!(x,y):villageBlockedAt(x,y),blocked:(area:string,x:number,y:number)=>area==='shop'?nav.isBlocked(x,y):villageBlockedAt(x,y),fits:(area:string,x:number,y:number)=>!scenery(area,x,y),arrival:(area:string,p:{x:number;y:number})=>freeArrival(p,(x,y)=>scenery(area,x,y),[])};
  for(let i=0;i<300;i++)r.step(.1,{day:1,time:540},env);expect(r.state.area).toBe('shop');expect(r.isServing({day:1,time:540})).toBe(true);
  for(let i=0;i<1800;i++)r.step(.1,{day:1,time:735},env);expect(r.state.area).toBe('village');expect(Math.hypot(r.state.x-1552,r.state.y-1392)).toBeLessThan(50);
  for(let i=0;i<1800;i++)r.step(.1,{day:1,time:900},env);expect(r.state.area).toBe('shop');expect(r.isServing({day:1,time:900})).toBe(true);expect(merchantPeriod('rosa',1080)).toBe('closed');expect(r.isServing({day:1,time:1080})).toBe(false);
  expect(dailyMerchant('rosa')).toBe(true);expect(merchantCanTrade('rosa',undefined)).toBe(false);expect(merchantCanTrade('rosa','rosa')).toBe(true);
  const save=createNewSave({name:'Rosa',skin:'#d9a276',hairStyle:'preso',hairColor:'#754323',outfit:'#638a9d'});save.villageRoutines={rosa:structuredClone(r.state)};save.merchantScenes={rosa:createMerchantLayout('rosa')};expect(validMerchantRoutines(save.villageRoutines)).toBe(true);expect(validateSave(JSON.parse(JSON.stringify(save)))).toBe(true);
 },15000);
 it('preserves every supplied animation PNG without resampling',()=>{
  const base=resolve('public/assets/visual/village/rosa/Idle'),walk=(p:string):string[]=>readdirSync(p,{withFileTypes:true}).flatMap(f=>f.isDirectory()?walk(resolve(p,f.name)):f.name.endsWith('.png')?[resolve(p,f.name)]:[]),files=walk(base);
  expect(files).toHaveLength(40);
  for(const p of files){const key=relative(base,p).split('\\').join('/') as keyof typeof sourceHashes;expect(createHash('sha256').update(readFileSync(p)).digest('hex')).toBe(sourceHashes[key]);}
 });
});

describe('external ground collision',()=>{
 it('keeps all ten village doors clear for the complete player foot box',()=>{
  for(const b of VILLAGE_BUILDINGS){const id=({general:'augusto',blacksmith:'bento',herbalist:'amelia',carpenter:'tobias',seeds:'rosa',traveler:'nilo',tailor:'celina',fisher:'damiao',inn:'helena',mechanic:'icaro'} as const)[b.shop!],d=merchantDoor(id);
   for(const[dx,dy]of[[-7,-5],[7,-5],[-7,3],[7,3]])expect(villagePointBlocked(d.x+dx,d.y+dy),id).toBe(false);
  }
 });
 it('uses the new facade ground walls and leaves roofs and entry free',()=>{
  const b={x:37,y:60},d=merchantDoor('rosa');expect(ROSA_SHOP.width*ROSA_SHOP.scale).toBeLessThan(360);expect(rosaShopBlockedPoint(d.x,d.y,b)).toBe(false);expect(rosaShopBlockedPoint(d.x-60,d.y-35,b)).toBe(true);expect(rosaShopBlockedPoint(d.x,d.y-200,b)).toBe(false);
  expect(cottageSolidPoint(0,-31,{x:0,y:0})).toBe(false);expect(cottageSolidPoint(45,-40,{x:0,y:0})).toBe(true);expect(cottageSolidPoint(0,-160,{x:0,y:0})).toBe(false);expect(cottageSolidPoint(80,-60,{x:0,y:0})).toBe(false);
 });
 it('protects the entire well opening and grounded posts at both used scales',()=>{
  for(const scale of [.42,.49]){const a={x:500,y:600},at=(x:number,y:number)=>wellFootprint(a.x+(x-128)*scale,a.y+(y-256)*scale,a,scale);
   for(const[x,y]of[[124,160],[124,185],[124,220],[185,238],[72,220]])expect(at(x,y)).toBe(true);
   expect(at(128,80)).toBe(false);expect(at(128,240)).toBe(false);expect(at(30,195)).toBe(false);
  }
 });
});
