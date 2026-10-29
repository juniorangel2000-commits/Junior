import {describe,it,expect,vi} from 'vitest';
import {villageRoute} from '../src/systems/village-walk';
import {compileRoomNavigation} from '../src/systems/room-navigation';
import {createSmithLayout,smithNavigation,smithFits,resolveSmithLayout} from '../src/systems/smith-layout';
import previousSmith from '../src/data/blacksmith-layout-v3.json';
import authoredSmith from '../src/data/blacksmith-layout.json';
import type {SmithLayout} from '../src/systems/smith-layout';
import {createMerchantLayout,merchantRoomNavigation,merchantRoomFits} from '../src/data/merchant-rooms';
import {AUGUSTO_SHOP,augustoShopBlockedPoint} from '../src/data/augusto-shop';
import {merchantDoor,merchantOutside} from '../src/systems/merchant-visit';

describe('navigation caches preserve editor collisions without repeated geometry scans',()=>{
 it('queries each A* cell at most once per search, and sees changed obstacles in the next search',()=>{
  const seen=new Map<string,number>();let wall=true;const blocked=(x:number,y:number)=>{const k=x+','+y;seen.set(k,(seen.get(k)??0)+1);return wall&&x===8&&y<12;};
  const first=villageRoute({x:4,y:5},{x:12,y:5},blocked);expect(first.some(p=>p.y>=12)).toBe(true);expect(Math.max(...seen.values())).toBe(1);
  wall=false;seen.clear();const second=villageRoute({x:4,y:5},{x:12,y:5},blocked);expect(second.length).toBeLessThan(first.length);expect(second.some(p=>p.x===8&&p.y===5)).toBe(true);
 });
 it('retains full-cell clearance but does not repeat the static geometry calculation for cached cells',()=>{
  const shell=vi.fn((x:number,y:number)=>x>=0&&y>=0&&x<=100&&y<=100),nav=compileRoomNavigation(shell,[{left:35,top:35,right:60,bottom:60}],{width:12,height:12,tileSize:8});
  for(let y=0;y<12;y++)for(let x=0;x<12;x++)nav.cellBlocked(x,y);const calls=shell.mock.calls.length;
  for(let repeat=0;repeat<100;repeat++)for(let y=0;y<12;y++)for(let x=0;x<12;x++)nav.cellBlocked(x,y);
  expect(shell.mock.calls.length).toBe(calls);expect(nav.cellBlocked(5,5)).toBe(true);expect(nav.cellBlocked(-1,0)).toBe(true);
 });
 it('matches existing foot collisions for both authored interiors and refreshes after an edit',()=>{
  const smith=createSmithLayout(),augusto=createMerchantLayout('augusto'),a=smithNavigation(smith),b=merchantRoomNavigation('augusto',augusto);
  for(let y=100;y<355;y+=9)for(let x=35;x<542;x+=11){expect(a.validPosition(x,y)).toBe(smithFits(smith,x,y));expect(b.validPosition!(x,y)).toBe(merchantRoomFits('augusto',x,y,augusto));}
  const probe={x:288,y:198},old=b.validPosition!(probe.x,probe.y);augusto.pieces.filter(p=>p.asset!=='structure'&&p.asset!=='floor-wood').forEach(p=>p.visible=false);
  const edited=merchantRoomNavigation('augusto',augusto);expect(b.validPosition!(probe.x,probe.y)).toBe(old);expect(edited.validPosition!(probe.x,probe.y)).toBe(true);
 });
 it('adopts the new 52-piece smith export only for untouched previous defaults',()=>{
  expect(resolveSmithLayout(previousSmith as SmithLayout)).toEqual(authoredSmith);expect(createSmithLayout().pieces).toHaveLength(52);
  const custom=structuredClone(previousSmith) as SmithLayout;custom.pieces.find(p=>p.id==='tapete_ferraria')!.x+=7;expect(resolveSmithLayout(custom)).toEqual(custom);
 });
});
describe('Augusto supplied exterior has a usable aligned entrance',()=>{
 it('blocks walls and stock while allowing entry and the arrival point',()=>{
  const b={x:33,y:31},d=merchantDoor('augusto'),outside=merchantOutside('augusto');
  for(const[dx,dy]of[[-7,-5],[7,-5],[-7,3],[7,3]])expect(augustoShopBlockedPoint(d.x+dx,d.y+dy,b)).toBe(false);
  expect(augustoShopBlockedPoint(outside.x,outside.y,b)).toBe(false);expect(augustoShopBlockedPoint(d.x+60,d.y-35,b)).toBe(true);expect(augustoShopBlockedPoint(d.x,d.y-180,b)).toBe(false);
  expect(AUGUSTO_SHOP.width*AUGUSTO_SHOP.scale).toBeGreaterThan(360);
  expect(AUGUSTO_SHOP.width*AUGUSTO_SHOP.scale).toBeLessThan(400);
 });
});
