import {describe,it,expect} from 'vitest';
import {MerchantGuide,merchantCanTrade,merchantDoor,merchantOutside,validShopResidents} from '../src/systems/merchant-visit';
import {VILLAGE_NPCS,villagePixelPoint,villageBlockedAt,villagePointBlocked,VILLAGE_BUILDINGS,VILLAGE_TREES,villageTreeId} from '../src/data/village';
import {createMerchantLayout,validMerchantLayout,merchantRoomConnected,merchantRoomFits,merchantRoomBlocked} from '../src/data/merchant-rooms';
import {freeArrival,actorsOverlap} from '../src/systems/actor-arrival';
import {cottageSolidPoint,wellFootprint} from '../src/data/architecture-collision';
import {fixtureStrength} from '../src/fixture-light-model';
import {emptyMapEdits,validateMapEdits,saveMapDraft,loadMapDraft} from '../src/systems/map-editor';
import {createNewSave,validateSave} from '../src/systems/save';
const DEFAULT_PROFILE={name:'Teste',skin:'#d9a276',hairStyle:'preso' as const,hairColor:'#754323',outfit:'#638a9d'};

describe('optional merchant guidance and interior trading',()=>{
 it('routes every owner to the corresponding door and pauses for a distant player',()=>{
  for(const npc of VILLAGE_NPCS){let p=villagePixelPoint(npc);expect(MerchantGuide.canStart(npc.id,p),npc.id).toBe(true);const guide=new MerchantGuide(npc.id);const paused=guide.step(.1,p,{x:p.x+300,y:p.y});expect(paused.moving).toBe(false);expect(paused.waitingForPlayer).toBe(true);
   let arrived=false;for(let i=0;i<1200&&!arrived;i++){const next=guide.step(.1,p,{x:p.x,y:p.y+30});p={x:next.x,y:next.y};arrived=next.waiting;expect(villageBlockedAt(Math.floor(p.x/32),Math.floor(p.y/32)),npc.id).toBe(false);}
   expect(arrived,npc.id).toBe(true);expect(Math.hypot(p.x-merchantOutside(npc.id).x,p.y-merchantOutside(npc.id).y)).toBeLessThan(20);expect(merchantDoor(npc.id).direction).toBe('up');
  }
 });
 it('permits buy/sell only in the owner’s room, while the service UI remains separate',()=>{for(const npc of VILLAGE_NPCS){expect(merchantCanTrade(npc.id)).toBe(false);expect(merchantCanTrade(npc.id,npc.id)).toBe(true);for(const other of VILLAGE_NPCS)if(other.id!==npc.id)expect(merchantCanTrade(npc.id,other.id)).toBe(false);}});
 it('keeps entrances, counter access and owner positions usable in all nine new rooms',()=>{for(const npc of VILLAGE_NPCS.filter(n=>n.id!=='bento')){const data=createMerchantLayout(npc.id);expect(validMerchantLayout(data),npc.id).toBe(true);expect(merchantRoomConnected(npc.id,data),npc.id).toBe(true);expect(merchantRoomFits(npc.id,288,335,data)).toBe(true);expect(merchantRoomFits(npc.id,288,151,data)).toBe(true);}});
 it('does not spawn player and owner on the same foot box at either side of a door',()=>{
  for(const npc of VILLAGE_NPCS.filter(n=>n.id!=='bento')){const terrain=(x:number,y:number)=>merchantRoomBlocked(npc.id,x,y),inside={x:288,y:335};const result=freeArrival(inside,terrain,[inside]);expect(result).not.toBeNull();expect(actorsOverlap(result!,inside)).toBe(false);expect(merchantRoomFits(npc.id,result!.x,result!.y)).toBe(true);
   const outside=merchantOutside(npc.id),free=freeArrival(outside,villagePointBlocked,[outside]);expect(free,npc.id).not.toBeNull();expect(actorsOverlap(outside,free!)).toBe(false);expect([Math.floor(free!.x/32),Math.floor(free!.y/32)]).not.toEqual([Math.floor(outside.x/32),Math.floor(outside.y/32)]);
  }expect(freeArrival({x:0,y:0},()=>true,[])).toBeNull();expect(freeArrival(Object.create({x:288,y:335}),()=>false,[])).toEqual({x:288,y:335});
 });
 it('persists owner/interior/layout and rejects malformed or obstructed arrivals',()=>{
  const s=createNewSave(DEFAULT_PROFILE);s.activeArea='village';s.merchantScenes={augusto:createMerchantLayout('augusto')};s.merchantInterior={owner:'augusto',x:288,y:335};s.shopResidents=[{id:'augusto',x:288,y:151,direction:'down',shop:true}];expect(validateSave(s)).toBe(true);expect(validateSave(JSON.parse(JSON.stringify(s)))).toBe(true);
  const invalid=structuredClone(s);invalid.merchantInterior!.owner='bento';expect(validateSave(invalid)).toBe(false);invalid.merchantInterior={owner:'augusto',x:0,y:0};expect(validateSave(invalid)).toBe(false);expect(validShopResidents([...s.shopResidents,...s.shopResidents])).toBe(false);
  const bad=createMerchantLayout('augusto');bad.pieces[2].parent=bad.pieces[2].id;expect(validMerchantLayout(bad)).toBe(false);
 });
});
describe('village editing and precise architecture',()=>{
 it('saves independent village drafts and applies terrain and moved-tree collision',()=>{
  const village=emptyMapEdits('village');village.terrain['50,50']='water';expect(validateMapEdits(village)).toBe(true);expect(villageBlockedAt(50,50,village)).toBe(true);
  const tree=VILLAGE_TREES.find(t=>t.x>2&&t.x<90&&t.y>2&&t.y<68)!;village.objects[villageTreeId(tree)]={kind:tree.kind,x:50,y:50,removed:true};expect(villageBlockedAt(tree.x,tree.y,village)).toBe(false);
  const store=new Map<string,string>(),storage={setItem:(k:string,v:string)=>store.set(k,v),getItem:(k:string)=>store.get(k)??null};expect(saveMapDraft(village,storage)).toBe(true);expect(loadMapDraft(storage,'village')).toEqual(village);expect(loadMapDraft(storage,'forest')).toBeNull();expect(loadMapDraft(storage)).toBeNull();
 });
 it('preserves closed walls, makes roof overhangs passable and covers the rear well opening',()=>{
  for(const b of VILLAGE_BUILDINGS.filter(b=>b.shop!=='blacksmith')){const a={x:(b.x+.5)*32,y:b.y*32+25};expect(cottageSolidPoint(a.x,a.y-145,a)).toBe(false);expect(cottageSolidPoint(a.x,a.y-40,a)).toBe(true);expect(villagePointBlocked(a.x,a.y-40)).toBe(true);expect(villagePointBlocked(a.x,a.y+28)).toBe(false);}
  for(const[sx,sy]of[[128,130],[128,185],[72,217],[186,239]])expect(wellFootprint((sx-128)*.49,(sy-256)*.49,{x:0,y:0},.49)).toBe(true);
 });
 it('lights burning furnaces during daylight and applies smooth night brightness to lamps',()=>{
  expect(fixtureStrength(720,0,true,1)).toBeGreaterThan(.25);expect(fixtureStrength(720,0,false,1)).toBe(0);expect(fixtureStrength(1320,0,false,1)).toBeGreaterThan(.9);expect(fixtureStrength(1320,0,true,0)).toBe(0);expect(Math.abs(fixtureStrength(1140,0,false,1)-fixtureStrength(1141,0,false,1))).toBeLessThan(.03);
 });
});
