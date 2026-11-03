import {describe,it,expect,vi} from 'vitest';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {advanceClock} from '../src/systems/clock';
import {ensureUndergroundWorld,undergroundFits,mineBlockNode,mineTargetVisible,applyMineStrike} from '../src/systems/underground';
import {mineCellIndex} from '../src/data/underground-layout';
import {mineMaterialAt} from '../src/systems/underground-geology';
import {bentoMapNavigation,bentoSmithNavigation,bentoRoute} from '../src/systems/bento-navigation';
import {bentoFixture} from '../src/systems/bento-fixtures';
import {advanceBentoTravel,bentoTripGoal} from '../src/systems/bento-travel';
import {ensureBentoTravel} from '../src/systems/bento-travel';
import {bentoAvailability} from '../src/systems/bento-schedule';
import {ensureBentoWork,beginBentoWorkTrip,bentoCanCarry,depositBentoPack,planBentoPersonalJob,withdrawBentoJob,finishBentoJob} from '../src/systems/bento-stock';
import {validBentoWork,bentoStockUnits} from '../src/systems/bento-work-state';
import {bentoMiningAllowed,strikeBentoBlock,stepBentoMining} from '../src/systems/bento-mining';
import {stepBentoHandling,stepBentoForge} from '../src/systems/bento-workshop';
import {bentoSceneWriter} from '../src/systems/bento-commit';
import {ensureMineHazards} from '../src/systems/underground-hazards';
import {ToolUse} from '../src/systems/tool-use';
import {Inventory} from '../src/systems/inventory';
import {newEconomyState} from '../src/systems/economy';
import {BENTO_WORK as B} from '../src/data/bento-work';
import type {SaveData,ResourceNode} from '../src/types';
const fresh=()=>{const s=createNewSave(createCharacterProfile('Bento trabalho'));s.day=2;s.time=420;s.activeArea='property';const nav=bentoSmithNavigation(s);s.villageRoutines={bento:{area:'shop',...nav.entry,direction:'up',stop:0,wait:0,serviceUntil:0,socialUntil:0,socialDay:0}};return s;};
const runtime={write:(s:SaveData)=>validateSave(s)};
function face(s:SaveData,material='stone'){
 const mine=ensureUndergroundWorld(s),nav=bentoMapNavigation(s,'mining');
 for(let y=169;y>4;y--)for(let x=5;x<155;x++){
  const node=mineBlockNode(mine,x,y);if(!node||mineMaterialAt(mine,x,y)!==material)continue;
  for(const[dx,dy]of[[0,1],[1,0],[-1,0],[0,-1]]){const origin={x:(x+dx)*32+16,y:(y+dy)*32+16};if(nav.fits(origin)&&mineTargetVisible(mine,origin,node))return{node,origin};}
 }throw Error('No safe exposed '+material);
}
function ready(s:SaveData,material='stone'){
 const{node,origin}=face(s,material);const trip=ensureBentoTravel(s).trip={day:s.day,area:'mining' as const,leg:'explore' as const,...origin,direction:'up' as const,route:[],index:0,distance:0,moving:false,wait:0,blocked:false};
 beginBentoWorkTrip(s,s.day);ensureBentoWork(s).mining={target:{cell:{x:node.x,y:node.y},origin,id:node.id},pause:0};const use=new ToolUse();use.start({tool:'pickaxe',direction:'up',target:node});s.bentoWork!.mining!.swing=use.snapshot();return{node,trip};
}
function hit(s:SaveData,node:ResourceNode,write=runtime.write){const t=new ToolUse();t.start({tool:'pickaxe',direction:'up',target:node});s.bentoWork!.mining!.swing=t.snapshot();t.advance(.25);return strikeBentoBlock(s,s.bentoTravel!.trip!,t.snapshot(),{write});}
function stock(s:SaveData,stone=0,ironShard=0,ironOre=0){const w=ensureBentoWork(s);w.pack={stone,ironShard,ironOre};w.ledger.collected={stone,ironShard,ironOre};return w;}
function at(s:SaveData,kind:'stone'|'iron'|'anvil',leg:'unload'|'withdraw'|'forge'='unload'){
 const fixture=bentoFixture(s,kind)!;const t=ensureBentoTravel(s).trip={day:s.day,area:'shop' as const,leg,...fixture.point,direction:'up' as const,route:[],index:0,distance:0,moving:false,wait:0,blocked:false,purpose:'workshop' as const};return t;
}
describe('Bento real mining and private smithy depot',()=>{
 it('shares actual rock damage, loot and native pickaxe wear, without touching player equipment/economy',()=>{
  const s=fresh(),{node}=ready(s),before=structuredClone({inventory:s.inventory,economy:s.economy6,progress:s.progress});const durability=s.bentoWork!.pickaxe.durability;
  for(let n=1;n<=5;n++){expect(hit(s,node)).toBe(true);expect(s.bentoWork!.pack.stone).toBe(n===5?4:0);expect(s.bentoWork!.pickaxe.durability).toBe(durability-n);expect(validateSave(s)).toBe(true);}
  expect(s.underground!.changes[mineCellIndex(node.x,node.y)]).toMatchObject({dug:true,dugDay:2});expect(s.bentoWork!.trip.blocks).toBe(1);expect(hit(s,node)).toBe(false);expect({inventory:s.inventory,economy:s.economy6,progress:s.progress}).toEqual(before);
 });
 it('restricts actual targets to stone and limited iron, rejecting protected/mission cells, gold and black metal',()=>{
  const s=fresh(),{node}=ready(s);expect(bentoMiningAllowed(s,node)).toBe(true);expect(bentoMiningAllowed(s,node,{protectedCells:[node]})).toBe(false);expect(bentoMiningAllowed(s,{x:0,y:10})).toBe(false);
  const iron=face(s,'iron');expect(bentoMiningAllowed(s,iron.node)).toBe(true);for(const material of ['gold','blackMetal']){const p=face(s,material);expect(bentoMiningAllowed(s,p.node)).toBe(false);}
  s.bentoWork!.trip.ironBlocks=B.maxIronBlocks;expect(bentoMiningAllowed(s,iron.node)).toBe(false);
 });
 it('collects iron via the exact shared strike primitive with no alternative loot table',()=>{
  const s=fresh(),{node}=ready(s,'iron'),player=new Inventory({pickaxe:1}),economy=newEconomyState(),copy=structuredClone(s.underground!);
  for(let i=0;i<5;i++){expect(hit(s,node)).toBe(true);expect(applyMineStrike(copy,s.bentoTravel!.trip!,node,'pickaxe',player,{...s,inventory:player.data,economy6:economy}).ok).toBe(true);}
  expect(s.bentoWork!.pack).toEqual({stone:player.data.stone,ironShard:player.data.ironShard,ironOre:player.data.ironOre});expect(s.bentoWork!.trip.ironBlocks).toBe(1);
 });
 it('awards a contested final rock to exactly one actor and cancels the other actor without wear',()=>{
  const s=fresh(),{node,trip}=ready(s);for(let i=0;i<4;i++)expect(hit(s,node)).toBe(true);const inv=new Inventory({pickaxe:1}),economy=newEconomyState();expect(applyMineStrike(s.underground!,trip,node,'pickaxe',inv,{...s,inventory:inv.data,economy6:economy}).depleted).toBe(true);const wear=s.bentoWork!.pickaxe.durability;expect(hit(s,node)).toBe(false);expect(inv.data.stone).toBe(4);expect(s.bentoWork!.pack.stone).toBe(0);expect(s.bentoWork!.pickaxe.durability).toBe(wear);
 });
 it('rolls back cracks, tool wear, cargo and audiovisual impact if durable storage rejects or throws',()=>{
  for(const write of[()=>false,()=>{throw Error('disk');}]){const s=fresh(),{node}=ready(s),before=structuredClone(s);expect(hit(s,node,write)).toBe(false);expect(s).toEqual(before);}
 });
 it('resumes a saved strike before/after impact without a second hit and finishes its recovery at quota',()=>{
  let s=fresh();const{node,trip}=ready(s),tool=new ToolUse();tool.start({tool:'pickaxe',direction:'up',target:node});tool.advance(.15);s.bentoWork!.mining!.swing=tool.snapshot();s=migrateSave(JSON.parse(JSON.stringify(s)))!;expect(s).toBeDefined();const d=s.bentoWork!.pickaxe.durability;stepBentoMining(s,s.bentoTravel!.trip!,.1,runtime);expect(s.bentoWork!.pickaxe.durability).toBe(d-1);
  s=migrateSave(JSON.parse(JSON.stringify(s)))!;for(let i=0;i<3;i++)stepBentoMining(s,s.bentoTravel!.trip!,.1,runtime);expect(s.bentoWork!.pickaxe.durability).toBe(d-1);
  const after=new ToolUse();after.start({tool:'pickaxe',direction:'up',target:node});after.advance(.3);s.bentoWork!.trip.blocks=B.maxBlocks;s.bentoWork!.mining={target:{cell:node,origin:trip,id:node.id},pause:0,swing:after.snapshot()};expect(stepBentoMining(s,s.bentoTravel!.trip!,.1,runtime).done).toBe(false);expect(s.bentoWork!.mining?.swing?.elapsed).toBeCloseTo(.4);
 });
 it('reserves whole-ore capacity, honours carry/time/block quotas and never deletes a full depot',()=>{
  const s=fresh(),{node}=ready(s),w=ensureBentoWork(s);w.depot.stone=B.depotStoneUnits;w.ledger.collected.stone=B.depotStoneUnits;const before=structuredClone(w);expect(bentoMiningAllowed(s,node)).toBe(false);expect(w).toEqual(before);expect(bentoCanCarry(w,'ironOre',1)).toBe(true);w.pack.stone=28;expect(bentoCanCarry(w,'ironOre',1)).toBe(false);w.pack.stone=0;w.depot.stone=0;w.ledger.collected.stone=0;w.trip.blocks=B.maxBlocks;expect(bentoMiningAllowed(s,node)).toBe(false);w.trip.blocks=0;w.trip.elapsed=B.miningSeconds;expect(bentoMiningAllowed(s,node)).toBe(false);
 });
 it('uses only existing reachable ore box, iron cabinet and anvil without adding furniture',()=>{
  const s=fresh(),before=structuredClone(s.blacksmithScene),nav=bentoSmithNavigation(s);for(const kind of ['stone','iron','anvil']as const){const f=bentoFixture(s,kind);expect(f,kind).toBeDefined();expect(nav.validPosition!(f!.point.x,f!.point.y)).toBe(true);expect(bentoRoute(s,'shop',nav.entry,f!.point).length,kind+JSON.stringify(f)).toBeGreaterThan(0);}expect(s.blacksmithScene).toEqual(before);
 });
 it('requires walking to each actual bin and atomically persists deposit and withdrawal only once',()=>{
  const s=fresh();stock(s,8,2,1);const t=at(s,'stone');t.x=244;t.y=324;expect(depositBentoPack(s,'stone',runtime)).toBe(false);Object.assign(t,bentoFixture(s,'stone')!.point);for(let i=0;i<6;i++)stepBentoHandling(s,'stone','deposit',.1,runtime);expect(s.bentoWork!.depot.stone).toBe(8);expect(s.bentoWork!.pack.stone).toBe(0);let loaded=migrateSave(JSON.parse(JSON.stringify(s)))!;expect(loaded).toBeDefined();for(let i=0;i<8;i++)stepBentoHandling(loaded,'stone','deposit',.1,runtime);expect(loaded.bentoWork!.ledger.deposited).toBe(8);expect(loaded.bentoWork!.depot.stone).toBe(8);at(loaded,'iron');expect(depositBentoPack(loaded,'iron',runtime)).toBe(true);expect(depositBentoPack(loaded,'iron',runtime)).toBe(false);expect(loaded.bentoWork!.depot).toEqual({stone:8,ironShard:2,ironOre:1});expect(validateSave(loaded)).toBe(true);
 });
 it('reverses failed transfers and consumes only own stock at the actual anvil for bounded personal work',()=>{
  const s=fresh();s.time=540;stock(s,12,2);at(s,'stone');const before=structuredClone(s.bentoWork);expect(depositBentoPack(s,'stone',{write:()=>false})).toBe(false);expect(s.bentoWork).toEqual(before);expect(depositBentoPack(s,'stone',runtime)).toBe(true);at(s,'iron');expect(depositBentoPack(s,'iron',runtime)).toBe(true);const publicState=structuredClone({inventory:s.inventory,economy:s.economy6});expect(planBentoPersonalJob(s)).toBe(true);const kind=s.bentoWork!.job!.kind;at(s,kind,'withdraw');expect(withdrawBentoJob(s,runtime)).toBe(true);expect(withdrawBentoJob(s,runtime)).toBe(false);expect(finishBentoJob(s,runtime)).toBe(false);at(s,'anvil','forge');for(let i=0;i<41;i++)stepBentoForge(s,.1,runtime);expect(s.bentoWork!.ledger.jobs).toBe(1);expect(bentoStockUnits(s.bentoWork!.ledger.consumed)).toBeGreaterThan(0);expect(finishBentoJob(s,runtime)).toBe(false);expect(planBentoPersonalJob(s)).toBe(false);s.time+=B.jobCooldownMinutes;expect(planBentoPersonalJob(s)).toBe(true);s.bentoWork!.jobsToday=B.jobsPerDay;s.bentoWork!.jobsDay=s.day;delete s.bentoWork!.job;expect(planBentoPersonalJob(s)).toBe(false);expect({inventory:s.inventory,economy:s.economy6}).toEqual(publicState);expect(validBentoWork(s.bentoWork,s.day)).toBe(true);
 });
 it('keeps home workshop services available while a personal job owns the same saved actor',()=>{const s=fresh();s.time=540;at(s,'anvil','forge');expect(bentoAvailability(s).open).toBe(true);});
 it('validates conservation and migrates older saves without conjuring depot contents',()=>{const s=fresh();expect(s.bentoWork).toBeUndefined();expect(validateSave(s)).toBe(true);ensureBentoWork(s);expect(validateSave(s)).toBe(true);s.bentoWork!.depot.stone=1;expect(validateSave(s)).toBe(false);s.bentoWork!.ledger.collected.stone=1;expect(validateSave(s)).toBe(true);s.bentoWork!.depot.stone=B.depotStoneUnits+1;s.bentoWork!.ledger.collected.stone=B.depotStoneUnits+1;expect(validateSave(s)).toBe(false);});
 it('snapshots live player inventory/position, preventing an NPC save from reverting unsaved player actions',()=>{const s=fresh(),draft=structuredClone(s),write=vi.fn((_s:SaveData)=>true);ensureBentoWork(draft);draft.bentoWork!.trip.blocks=1;const live={...s,inventory:{...s.inventory,stone:7},player:{...s.player,x:456}};const writer=bentoSceneWriter(()=>live,write);expect(writer(draft)).toBe(true);expect(write.mock.calls[0][0]).toMatchObject({inventory:{stone:7},player:{x:456},bentoWork:{trip:{blocks:1}}});});
 it('preserves newly saved social state when an older NPC draft has no relationships yet',()=>{const s=fresh(),draft=structuredClone(s),write=vi.fn((_s:SaveData)=>true);s.npcSocial={version:1,players:{bento:{affinity:3,responseDay:s.day}},pairs:{},memories:{}};const writer=bentoSceneWriter(()=>s,write);expect(writer(draft)).toBe(true);expect(write.mock.calls[0][0].npcSocial).toEqual(s.npcSocial);});
 // Two complete journeys share CPU with the full suite on CI; all route/stock assertions remain bounded.
 it('inspects a full depot in safe conditions, consumes own stock and resumes collection when space opens',()=>{
  const s=fresh(),w=ensureBentoWork(s),h=ensureMineHazards(ensureUndergroundWorld(s));h.zombies=[];h.bats=[];h.cave.cooldown=120;w.depot={stone:B.depotStoneUnits,ironShard:B.depotIronUnits,ironOre:0};w.ledger.collected={...w.depot};const seen=new Set<string>();
  for(let i=0;i<12000;i++){Object.assign(s,advanceClock(s,.1));advanceBentoTravel(s,.1,undefined,false,runtime);if(s.bentoTravel?.trip)seen.add(s.bentoTravel.trip.leg);if(s.bentoTravel?.lastCompletedDay===2&&!s.bentoTravel.trip)break;}
  expect(seen.has('inspect')).toBe(true);expect(s.bentoWork!.trip.blocks).toBe(0);expect(s.underground!.changes).toEqual({});expect(s.bentoWork!.ledger.jobs).toBe(1);expect(s.bentoWork!.ledger.consumed.stone).toBe(B.stoneJobCost);expect(s.bentoWork!.depot.stone).toBe(B.depotStoneUnits-B.stoneJobCost);expect(s.bentoWork!.depot.ironShard).toBe(B.depotIronUnits);
  s.day=5;s.time=420;s.underground!.hazards!.cave.cooldown=120;for(let i=0;i<12000;i++){Object.assign(s,advanceClock(s,.1));advanceBentoTravel(s,.1,undefined,false,runtime);if(s.bentoTravel?.lastCompletedDay===5&&!s.bentoTravel.trip)break;}
  expect(s.bentoWork!.trip.blocks).toBeGreaterThan(0);expect(s.bentoWork!.trip.ironBlocks).toBe(0);expect(s.bentoWork!.depot.stone).toBeLessThanOrEqual(B.depotStoneUnits);expect(validateSave(s)).toBe(true);
 },90000);
 it('does not replay an already committed impact snapshot',()=>{const s=fresh(),{node}=ready(s),tool=new ToolUse();tool.start({tool:'pickaxe',direction:'up',target:node});tool.advance(.25);const after=tool.snapshot();expect(strikeBentoBlock(s,s.bentoTravel!.trip!,after,runtime)).toBe(true);const before=structuredClone(s);expect(strikeBentoBlock(s,s.bentoTravel!.trip!,after,runtime)).toBe(false);expect(s).toEqual(before);});
 it('stops before the next impact when a danger enters the actual work area',()=>{const s=fresh(),{trip,node}=ready(s),hazards=ensureMineHazards(s.underground!,[trip]);hazards.zombies=[{id:1,x:trip.x+50,y:trip.y,hp:20,mode:'dormant',alert:0}];const before=structuredClone({world:s.underground!.changes,pack:s.bentoWork!.pack,durability:s.bentoWork!.pickaxe.durability});expect(stepBentoMining(s,trip,.1,runtime).done).toBe(true);expect({world:s.underground!.changes,pack:s.bentoWork!.pack,durability:s.bentoWork!.pickaxe.durability}).toEqual(before);expect(mineBlockNode(s.underground!,node.x,node.y)).toBeDefined();});
 it('prioritizes a full-depot personal job before departing when the smithy is open',()=>{const s=fresh();s.time=480;const w=ensureBentoWork(s);w.depot.stone=B.depotStoneUnits;w.ledger.collected.stone=B.depotStoneUnits;advanceBentoTravel(s,.1,undefined,false,runtime);expect(s.bentoTravel!.trip).toMatchObject({area:'shop',leg:'withdraw',purpose:'workshop'});expect(s.bentoTravel!.lastAttemptDay).toBeUndefined();expect(w.job?.kind).toBe('stone');});
 it('walks a full expedition in a safe mine, deposits and consumes without player rewards',()=>{
  const s=fresh(),before=structuredClone({inventory:s.inventory,economy:s.economy6}),visited=new Set<string>();const h=ensureMineHazards(ensureUndergroundWorld(s));h.zombies=[];h.bats=[];h.cave.cooldown=120;let finished=false,maxCarry=0;
  for(let i=0;i<12000;i++){Object.assign(s,advanceClock(s,.1));advanceBentoTravel(s,.1,undefined,false,runtime);const t=s.bentoTravel?.trip,w=s.bentoWork;if(w)maxCarry=Math.max(maxCarry,bentoStockUnits(w.pack));if(t){visited.add(t.leg);expect(s.bentoExpedition?.safety&&t.area==='mining'?undergroundFits(s.underground!,t.x,t.y):bentoMapNavigation(s,t.area).fits(t),t.leg).toBe(true);}if(s.bentoTravel?.lastCompletedDay===2&&!t){finished=true;break;}}
  expect(finished,JSON.stringify({trip:s.bentoTravel?.trip,goal:s.bentoTravel?.trip&&bentoTripGoal(s,s.bentoTravel.trip),work:s.bentoWork,visited:[...visited]})).toBe(true);expect(s.bentoWork!.trip.blocks).toBeGreaterThan(0);expect(s.bentoWork!.trip.blocks).toBeLessThanOrEqual(B.maxBlocks);expect(s.bentoWork!.trip.ironBlocks).toBeLessThanOrEqual(B.maxIronBlocks);expect(maxCarry).toBeLessThanOrEqual(B.carryUnits);expect(s.bentoWork!.ledger.deposited).toBeGreaterThan(0);expect(s.bentoWork!.ledger.jobs).toBe(1);expect(visited.has('forge')).toBe(true);expect({inventory:s.inventory,economy:s.economy6}).toEqual(before);expect(validateSave(s)).toBe(true);
 },90000);
});
