import {mineMaterialAt} from '../src/systems/underground-geology';
import {mineWallCorners,organicMineWallContains,organicMineFloorCornerRock} from '../src/data/mine-wall-shape';
import {createDungeonProgress} from '../src/dungeons/progression';
import {describe,it,expect,vi} from 'vitest';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {ensureUnderground,undergroundBlocked,undergroundFits,undergroundArrival,validUnderground,excavateMineBlock,mineBlockNode,mineTargetVisible,nearbyMineBlock,applyMineStrike} from '../src/systems/underground';
import {UNDERGROUND,MINE_SPINE,mineZone,mineCellIndex,undergroundLayout,mineDepth} from '../src/data/underground-layout';
import {MINE_ARRIVAL} from '../src/data/mine-room';
import {toolCondition,configureTool} from '../src/systems/economy';
import {Inventory,ITEM_IDS} from '../src/systems/inventory';
import {villageRoute} from '../src/systems/village-walk';
import {validWorldPetState,petFreePoint} from '../src/dungeons/world-pet-state';
const fresh=()=>{const s=createNewSave(createCharacterProfile('Galerias'));s.activeArea='highland';s.inventory.pickaxe=1;ensureUnderground(s);return s;};
function target(s:ReturnType<typeof fresh>,zone?:'permanent'|'renewable'){
 const m=s.underground!;
 for(let y=170;y>4;y--)for(let x=5;x<155;x++){
  if(zone&&mineZone(m.seed,x,y)!==zone)continue;
  const node=mineBlockNode(m,x,y);if(!node||mineMaterialAt(m,x,y)!=='stone')continue;
  for(const [dx,dy]of [[0,1],[-1,0],[1,0],[0,-1]]){const origin={x:(x+dx)*32+16,y:(y+dy)*32+16};if(undergroundFits(m,origin.x,origin.y)&&mineTargetVisible(m,origin,node))return{node,origin};}
 }
 throw Error('No accessible mining face');
}
describe('phase 2 continuous underground mine',()=>{
 it('migrates the approved entrance only once, preserving outdoor position, items and other progress',()=>{
  const s=createNewSave(createCharacterProfile('Antigo'));s.activeArea='highland';s.mineInterior={x:346,y:342,direction:'left'};s.highlandPosition={x:1278,y:150};s.inventory.stone=7;const before=structuredClone(s);ensureUnderground(s);const m=structuredClone(s.underground);expect(s.mineInterior).toEqual({x:346+UNDERGROUND.entryX,y:342+UNDERGROUND.entryY,direction:'left'});expect(s.inventory).toEqual(before.inventory);expect(s.highlandPosition).toEqual(before.highlandPosition);ensureUnderground(s);expect(s.underground).toEqual(m);expect(validateSave(s)).toBe(true);expect(migrateSave(s)?.mineInterior).toEqual(s.mineInterior);
 });
 it('connects the arrival, central doorway, every depth and the deepest gallery on one map',()=>{
  const s=fresh(),m=s.underground!,blocked=(x:number,y:number)=>!undergroundFits(m,x*32+16,y*32+16),start={x:s.mineInterior!.x/32,y:s.mineInterior!.y/32};
  for(const p of [MINE_SPINE[1],MINE_SPINE[4],MINE_SPINE[6],MINE_SPINE[9]]){
   const route=villageRoute(start,p,blocked,undefined,UNDERGROUND);expect(route.length,JSON.stringify(p)).toBeGreaterThan(0);for(const p of route)expect(blocked(p.x,p.y)).toBe(false);
  }
  expect(mineDepth(165)).toBe('surface');expect(mineDepth(110)).toBe('middle');expect(mineDepth(65)).toBe('deep');expect(mineDepth(22)).toBe('extreme');
  for(let y=176*32;y<=UNDERGROUND.entryY+153;y+=4)expect(undergroundFits(m,UNDERGROUND.entryX+362,y),String(y)).toBe(true);
 });
 it('keeps the generated base immutable and separates protected, permanent and renewable cells',()=>{
  const s=fresh(),m=s.underground!,layout=undergroundLayout(m.seed);expect(undergroundLayout(m.seed)).toBe(layout);expect(mineZone(m.seed,0,10)).toBe('protected');expect(mineZone(m.seed,79,165)).toBe('protected');expect(target(s,'permanent')).toBeDefined();expect(target(s,'renewable')).toBeDefined();const {node,origin}=target(s);const before=layout.rock.slice();excavateMineBlock(s,origin,node,'pickaxe',validateSave);expect(layout.rock).toEqual(before);
 });
 it('uses five existing basic-pickaxe hits and records cracks, wear and the stone reward exactly once',()=>{
  const s=fresh(),{node,origin}=target(s),i=mineCellIndex(node.x,node.y);s.mineInterior={...origin};const before=s.inventory.stone;
  for(let n=1;n<=5;n++){const r=excavateMineBlock(s,origin,node,'pickaxe',validateSave);expect(r.ok,r.message).toBe(true);expect(r.changed).toHaveLength(n===5?5:1);expect(s.underground!.changes[i]).toMatchObject(n===5?{dug:true}:{hits:n});expect(s.inventory.stone).toBe(before+(n===5?4:0));expect(toolCondition(s,'pickaxe').durability).toBe(100-n);expect(undergroundBlocked(s.underground!,node.x*32+16,node.y*32+16)).toBe(n!==5);}
  expect(undergroundFits(s.underground!,node.x*32+16,node.y*32+16)).toBe(true);const beforeDuplicate=structuredClone(s);expect(excavateMineBlock(s,origin,node,'pickaxe',validateSave).ok).toBe(false);expect(s).toEqual(beforeDuplicate);expect(s.inventory.ironShard+s.inventory.goldShard+s.inventory.blackMetalShard).toBe(0);expect(s.progress.collected).toBe(false);
 });
 it('keeps the current advanced-pickaxe efficiency and does not add tiers or rules',()=>{const s=fresh(),{node,origin}=target(s);configureTool(s,'pickaxe',2);expect(excavateMineBlock(s,origin,node,'pickaxe',validateSave).ok).toBe(true);expect(s.underground!.changes[mineCellIndex(node.x,node.y)]).toMatchObject({hits:2});expect(toolCondition(s,'pickaxe').durability).toBe(449);});
 it('prevents two actors claiming the same rock even if their animations target it concurrently',()=>{const s=fresh(),{node,origin}=target(s),other=new Inventory({pickaxe:1});configureTool(s,'pickaxe',3);const i=new Inventory(s.inventory);expect(applyMineStrike(s.underground!,origin,node,'pickaxe',i,s).ok).toBe(true);expect(applyMineStrike(s.underground!,origin,node,'pickaxe',i,s).depleted).toBe(true);expect(applyMineStrike(s.underground!,origin,node,'pickaxe',other,s).ok).toBe(false);expect(i.data.stone).toBe(4);expect(other.data.stone).toBe(0);});
 it('preserves partial hits and opened tunnels through reload, exit and entering another day',()=>{for(const zone of ['permanent','renewable']as const){let s=fresh();const {node,origin}=target(s,zone);s.mineInterior={...origin};excavateMineBlock(s,origin,node,'pickaxe',validateSave);s=migrateSave(s)!;expect(s.underground!.changes[mineCellIndex(node.x,node.y)]).toMatchObject({hits:1});for(let k=0;k<4;k++)excavateMineBlock(s,origin,node,'pickaxe',validateSave);delete s.mineInterior;s.day+=10;s=migrateSave(s)!;const changes=structuredClone(s.underground!.changes);ensureUnderground(s);expect(s.underground!.changes).toEqual(changes);expect(undergroundBlocked(s.underground!,node.x*32+16,node.y*32+16)).toBe(false);}});
 it('never consumes durability or progress for absent, incorrect, broken or out-of-reach tools',()=>{for(const mode of ['absent','wrong','broken','far']){const s=fresh(),{node,origin}=target(s);if(mode==='absent')s.inventory.pickaxe=0;if(mode==='broken'){configureTool(s,'pickaxe',0);s.economy6!.tools.pickaxe!.durability=0;}const before=structuredClone(s),write=vi.fn(()=>true),r=excavateMineBlock(s,mode==='far'?undergroundArrival():origin,node,mode==='wrong'?'hand':'pickaxe',write);expect(r.ok,mode).toBe(false);expect(s).toEqual(before);expect(write).not.toHaveBeenCalled();}});
 it('rejects protected structures and blocks hidden behind another intact rock',()=>{const s=fresh(),{node,origin}=target(s),m=s.underground!,protectedPoint={x:0,y:10};expect(excavateMineBlock(s,origin,protectedPoint,'pickaxe',()=>true).ok).toBe(false);const dx=node.x*32+16-origin.x,dy=node.y*32+16-origin.y,behind={x:node.x+Math.sign(dx),y:node.y+Math.sign(dy)};expect(mineTargetVisible(m,origin,behind)).toBe(false);expect(nearbyMineBlock(m,origin,{x:Math.sign(dx),y:Math.sign(dy)})?.id).toBeDefined();});
 it('rejects non-finite positions and an actor standing inside solid rock before applying a hit',()=>{
  const s=fresh(),{node}=target(s),before=structuredClone(s),write=vi.fn(()=>true);
  for(const origin of [{x:NaN,y:10},{x:Infinity,y:10},{x:node.x*32+16,y:node.y*32+16}]){expect(excavateMineBlock(s,origin,node,'pickaxe',write).ok).toBe(false);expect(s).toEqual(before);}
  expect(write).not.toHaveBeenCalled();
 });
 it('reverts cracks, opening, inventory and wear when durable storage rejects or throws',()=>{for(const final of [false,true])for(const write of [()=>false,()=>{throw Error('disk');}]){const s=fresh(),{node,origin}=target(s);if(final)for(let i=0;i<4;i++)excavateMineBlock(s,origin,node,'pickaxe',validateSave);const before=structuredClone(s);expect(excavateMineBlock(s,origin,node,'pickaxe',write).ok).toBe(false);expect(s).toEqual(before);}});
 it('keeps the final blow safe when the existing inventory cannot hold the stone',()=>{const s=fresh(),{node,origin}=target(s);for(let k=0;k<4;k++)excavateMineBlock(s,origin,node,'pickaxe',validateSave);for(const id of ITEM_IDS.filter(id=>id!=='stone'&&id!=='backpack').slice(0,30))s.inventory[id]=1;s.inventory.pickaxe=1;s.inventory.stone=0;const before=structuredClone(s);expect(excavateMineBlock(s,origin,node,'pickaxe',()=>true).ok).toBe(false);expect(s).toEqual(before);});
 it('rejects malformed state and positions safely without invalidating old games',()=>{for(const v of [null,{}, {version:1,seed:-1,changes:{},revision:0},{version:1,seed:1,changes:{'-1':{dug:true}},revision:1},{version:1,seed:1,changes:{'0':{dug:true}},revision:1}])expect(validUnderground(v)).toBe(false);const s=fresh(),{node}=target(s),i=mineCellIndex(node.x,node.y);s.underground!.changes[i]={hits:5};expect(validateSave(s)).toBe(false);s.underground!.changes[i]={dug:true,hits:1};expect(validateSave(s)).toBe(false);s.underground!.changes={};s.mineInterior={x:1,y:1};expect(validateSave(s)).toBe(false);const bad={...s,underground:{},mineInterior:{x:2500,y:5800}};expect(()=>validateSave(bad)).not.toThrow();expect(validateSave(bad)).toBe(false);expect(validateSave(createNewSave(createCharacterProfile('Legacy')))).toBe(true);});
 it('translates legacy pets in the entrance only once while leaving outdoor pets untouched',()=>{
  const s=createNewSave(createCharacterProfile('Pets antigos'));s.dungeons=createDungeonProgress();s.dungeons.pets.push({id:'cat-1',species:'cat',rare:false,xp:0,attributes:{speed:0,resistance:0,perception:0,protection:0,efficiency:0},world:{mode:'stay',area:'highland',space:'mine',x:300,y:340,direction:'north'}});s.dungeons.selectedPet='cat-1';ensureUnderground(s);const p=structuredClone(s.dungeons.pets[0].world!);expect(p).toMatchObject({x:300+UNDERGROUND.entryX,y:340+UNDERGROUND.entryY,mode:'stay'});ensureUnderground(s);expect(s.dungeons.pets[0].world).toEqual(p);
 });
 it('allows companions in the enlarged mine without expanding the limits of other maps',()=>{const p={mode:'follow',area:'highland',space:'mine',...undergroundArrival(),direction:'north'};expect(validWorldPetState(p)).toBe(true);expect(validWorldPetState({...p,space:'outdoors'})).toBe(false);const s=fresh();expect(petFreePoint(p,(x,y)=>undergroundBlocked(s.underground!,x,y),{width:5120,height:6144})).toEqual({x:p.x,y:p.y});});
 it('rounds exposed rock corners in both rendering geometry and movement collision',()=>{
  expect(organicMineFloorCornerRock(1,1,9,0,0)).toBe(true);expect(organicMineFloorCornerRock(16,16,15,0,0)).toBe(false);
  const shapes=new Set(Array.from({length:8},(_,tx)=>Array.from({length:32},(_,x)=>Number(organicMineWallContains(x+.5,1.5,0,tx,0))).join('')));expect(shapes.size).toBeGreaterThan(2);
  expect(mineWallCorners(0)).toEqual({nw:12,ne:12,se:12,sw:12});expect(mineWallCorners(15)).toEqual({nw:0,ne:0,se:0,sw:0});expect(organicMineWallContains(1,1,0,0,0)).toBe(false);expect(organicMineWallContains(12,12,0,0,0)).toBe(true);expect(organicMineWallContains(1,1,15,0,0)).toBe(true);
  const s=fresh(),m=s.underground!;let found=false;
  for(let y=6;y<170&&!found;y++)for(let x=6;x<154;x++){
   if(!undergroundLayout(m.seed).rock[mineCellIndex(x,y)])continue;
   const north=undergroundBlocked(m,x*32+16,y*32-16),west=undergroundBlocked(m,x*32-16,y*32+16);
   if(!north&&!west){expect(undergroundBlocked(m,x*32+1,y*32+1)).toBe(false);expect(undergroundBlocked(m,x*32+16,y*32+16)).toBe(true);found=true;break;}
  }expect(found).toBe(true);
 });
 it('retains the original arrival in the approved art after coordinate migration',()=>{const s=fresh();expect(s.mineInterior!.x-UNDERGROUND.entryX).toBe(MINE_ARRIVAL.x);expect(s.mineInterior!.y-UNDERGROUND.entryY).toBe(MINE_ARRIVAL.y);});
});
