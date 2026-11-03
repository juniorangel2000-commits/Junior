import {describe,it,expect,vi} from 'vitest';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {UNDERGROUND_BALANCE,type MineMaterial} from '../src/data/underground-balance';
import {mineZone,mineCellIndex,mineCellPoint,undergroundLayout} from '../src/data/underground-layout';
import {ensureUnderground,mineRockAt,mineBlockNode,excavateMineBlock,undergroundFits,type UndergroundState} from '../src/systems/underground';
import {mineMaterialAt} from '../src/systems/underground-geology';
import {beginMineExpedition,finishMineExpedition,resumeMineExpedition} from '../src/systems/underground-renewal';
import {configureTool,toolCondition} from '../src/systems/economy';
import {createDungeonProgress} from '../src/dungeons/progression';
const fresh=()=>{const s=createNewSave(createCharacterProfile('Geologia'));s.activeArea='highland';s.inventory.pickaxe=1;ensureUnderground(s);return s;};
const forceRenew=()=>{const b=structuredClone(UNDERGROUND_BALANCE);b.regeneration.fraction=1;b.regeneration.maxPerEntry=64;for(const band of Object.values(b.deposits))band.iron=band.gold=band.blackMetal=0;return b;};
function deposit(s:ReturnType<typeof fresh>,material:MineMaterial){const m=s.underground!;for(let y=5;y<172;y++)for(let x=5;x<155;x++)if(mineBlockNode(m,x,y)&&mineMaterialAt(m,x,y)===material)return{x,y};throw Error('Missing sample '+material);}
function workFace(s:ReturnType<typeof fresh>,material:MineMaterial){
 const p=deposit(s,material),origin={x:p.x*32+16,y:(p.y+1)*32+16};
 // Fixture represents an existing excavated approach, using the real persistent cell format.
 for(let y=p.y+1;y<p.y+4;y++)if(mineZone(s.underground!.seed,p.x,y)!=='protected'&&undergroundLayout(s.underground!.seed).rock[mineCellIndex(p.x,y)])s.underground!.changes[mineCellIndex(p.x,y)]={dug:true,dugDay:1,mineral:'stone'};
 s.mineInterior=origin;expect(undergroundFits(s.underground!,origin.x,origin.y)).toBe(true);return{p,origin};
}
function markDug(m:UndergroundState,p:{x:number;y:number},material:MineMaterial='stone') {m.changes[mineCellIndex(p.x,p.y)]={dug:true,dugDay:1,mineral:material};}
/** A single secondary spur; optionally extend into permanent excavation rock. */
function spur(s:ReturnType<typeof fresh>,permanentEnd=false){
 const m=s.underground!,base=undergroundLayout(m.seed);
 for(let y=6;y<170;y++)for(let x=6;x<154;x++){
  if(mineZone(m.seed,x,y)!=='renewable'||!base.rock[mineCellIndex(x,y)])continue;
  for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){
   if(mineRockAt(m,x-dx,y-dy))continue;const path:{x:number;y:number}[]=[];
   for(let k=0;k<22;k++){const p={x:x+k*dx,y:y+k*dy},zone=mineZone(m.seed,p.x,p.y);if(zone==='protected'||!base.rock[mineCellIndex(p.x,p.y)])break;path.push(p);if(permanentEnd&&zone==='permanent'&&path.length>2||!permanentEnd&&path.length===5)break;}
   if(path.length>=3&&(!permanentEnd||mineZone(m.seed,path.at(-1)!.x,path.at(-1)!.y)==='permanent')){
    path.forEach(p=>markDug(m,p));return path;
   }
  }
 }
 throw Error('Missing test spur');
}
function outside(s:ReturnType<typeof fresh>){delete s.mineInterior;s.underground!.expedition={id:1,inside:false,enteredDay:1,exitedDay:1};s.day=20;return s;}
function reachable(m:UndergroundState){
 const seen=new Set<number>(),queue=[mineCellIndex(79,165)];seen.add(queue[0]);
 for(let n=0;n<queue.length;n++){const p=mineCellPoint(queue[n]);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy;if(x<0||y<0||x>=160||y>=192||mineRockAt(m,x,y))continue;const i=mineCellIndex(x,y);if(!seen.has(i)){seen.add(i);queue.push(i);}}}return seen;
}
describe('official deposits and existing equipment',()=>{
 it('is deterministic by seed/cell/cycle, follows depth and never guarantees black metal',()=>{
  const s=fresh(),m=s.underground!;const found=new Set<MineMaterial>();
  for(let y=5;y<172;y++)for(let x=5;x<155;x++){if(!mineBlockNode(m,x,y))continue;const metal=mineMaterialAt(m,x,y);found.add(metal);expect(['stone','iron','gold','blackMetal']).toContain(metal);if(y>=132)expect(['stone','iron']).toContain(metal);}
  expect(found).toEqual(new Set(['stone','iron','gold','blackMetal']));const p=deposit(s,'blackMetal');expect(mineMaterialAt(structuredClone(m),p.x,p.y)).toBe('blackMetal');
  let empty=false;for(let seed=0;seed<20;seed++){const copy={...m,seed,changes:{}};const patch=Array.from({length:25},(_,i)=>mineMaterialAt(copy,30+i%5,10+Math.floor(i/5)));empty||=!patch.includes('blackMetal');}expect(empty).toBe(true);
  const noOre=forceRenew();for(let y=5;y<170;y+=11)for(let x=5;x<150;x+=13)expect(mineMaterialAt(m,x,y,noOre)).toBe('stone');
 });
 it('uses each depth profile and the secondary-gallery weight from the configurable balance',()=>{
  const s=fresh(),m=s.underground!,b=forceRenew();b.galleryWeight.renewable=0;
  b.deposits.surface.iron=1;b.deposits.middle.gold=1;b.deposits.deep.blackMetal=1;
  for(const [y,expected]of [[160,'iron'],[120,'gold'],[70,'blackMetal'],[20,'stone']]as const){
   let sample;for(let x=5;x<155;x++)if(mineZone(m.seed,x,y)==='permanent'){sample={x,y};break;}
   expect(sample).toBeDefined();expect(mineMaterialAt(m,sample!.x,y,b)).toBe(expected);
  }
  for(let y=150;y<170;y++)for(let x=5;x<155;x++)if(mineZone(m.seed,x,y)==='renewable')expect(mineMaterialAt(m,x,y,b)).toBe('stone');
 });
 it('preserves phase 2 partial rock work, mined paths and dates instead of changing their rewards',()=>{
  const s=fresh(),p=deposit(s,'iron'),i=mineCellIndex(p.x,p.y);delete s.underground!.geology;s.underground!.changes[i]={hits:2};expect(mineMaterialAt(s.underground!,p.x,p.y)).toBe('stone');ensureUnderground(s);expect(s.underground!.changes[i]).toMatchObject({hits:2,mineral:'stone'});
  const q=deposit(s,'gold'),j=mineCellIndex(q.x,q.y);delete s.underground!.geology;s.underground!.changes[j]={dug:true};s.day=7;ensureUnderground(s);expect(s.underground!.changes[j]).toMatchObject({dug:true,mineral:'stone',dugDay:7});expect(migrateSave(s)?.underground?.changes).toEqual(s.underground!.changes);
 });
 it.each(['iron','gold','blackMetal']as const)('collects %s through the current resource and inventory system exactly once',material=>{
  const s=fresh(),{p,origin}=workFace(s,material);configureTool(s,'pickaxe',material==='iron'?0:material==='gold'?1:2);
  let result;for(let n=0;n<6&&!s.underground!.changes[mineCellIndex(p.x,p.y)]?.dug;n++){result=excavateMineBlock(s,origin,p,'pickaxe',validateSave);expect(result.ok,result.message).toBe(true);}
  expect(result?.depleted).toBe(true);expect(s.inventory[`${material}Shard`]+s.inventory[`${material}Ore`]).toBe(1);expect(s.economy6!.mined[material]).toBe(1);const before=structuredClone(s);expect(excavateMineBlock(s,origin,p,'pickaxe',validateSave).ok).toBe(false);expect(s).toEqual(before);
 });
 it('keeps the current gold/black-metal pickaxe restrictions without wear or cracks on rejection',()=>{
  for(const material of ['gold','blackMetal']as const){const s=fresh(),{p,origin}=workFace(s,material),before=structuredClone(s);expect(excavateMineBlock(s,origin,p,'pickaxe',validateSave).ok).toBe(false);expect(s).toEqual(before);expect(toolCondition(s,'pickaxe').durability).toBe(100);}
 });
 it('preserves a deposit identity after partial hits, reloads and time changes',()=>{
  const s=fresh(),{p,origin}=workFace(s,'gold');configureTool(s,'pickaxe',1);const id=mineBlockNode(s.underground!,p.x,p.y)!.id;expect(excavateMineBlock(s,origin,p,'pickaxe',validateSave).ok).toBe(true);const copy=migrateSave(s)!;copy.day+=10;resumeMineExpedition(copy);expect(mineBlockNode(copy.underground!,p.x,p.y)).toMatchObject({id,metal:'gold'});expect(copy.underground!.changes[mineCellIndex(p.x,p.y)]).toMatchObject({mineral:'gold',hits:1});
 });
});
describe('partial secondary-gallery renewal',()=>{
 it('restores actual stone blocks only on a later entry after a recorded exit',()=>{
  const s=fresh(),path=spur(s),m=s.underground!,before=structuredClone(m.changes);s.day=20;resumeMineExpedition(s);expect(m.changes).toEqual(before);expect(beginMineExpedition(s,validateSave).ok).toBe(false);finishMineExpedition(s);
  const result=beginMineExpedition(s,validateSave,[],forceRenew());expect(result.ok,result.message).toBe(true);expect(result.regenerated).toBeGreaterThan(0);expect(s.underground!.expedition).toMatchObject({id:2,inside:true,enteredDay:20});
  const refilled=path.filter(p=>!s.underground!.changes[mineCellIndex(p.x,p.y)].dug);expect(refilled.length).toBe(result.regenerated);for(const p of refilled){expect(mineRockAt(s.underground!,p.x,p.y)).toBe(true);expect(s.underground!.changes[mineCellIndex(p.x,p.y)]).toMatchObject({cycle:1,renewedDay:20,mineral:'stone'});}expect(validateSave(s)).toBe(true);
 });
 it('uses ore-specific day intervals and does nothing for repeated entries before the deadline',()=>{
  const s=fresh(),path=spur(s);path.forEach(p=>markDug(s.underground!,p,'blackMetal'));outside(s);s.day=UNDERGROUND_BALANCE.regeneration.days.blackMetal;const before=structuredClone(s.underground!.changes);expect(beginMineExpedition(s,validateSave,[],forceRenew()).regenerated).toBe(0);expect(s.underground!.changes).toEqual(before);finishMineExpedition(s);s.day++;expect(beginMineExpedition(s,validateSave,[],forceRenew()).regenerated).toBeGreaterThan(0);
 });
 it('preserves every remaining reachable cell and never seals a permanent tunnel beyond secondary excavation',()=>{
  const s=fresh(),path=spur(s,true),before=reachable(s.underground!);outside(s);const result=beginMineExpedition(s,validateSave,[],forceRenew());expect(result.ok,result.message).toBe(true);const after=reachable(s.underground!);for(const i of before)if(!mineRockAt(s.underground!,mineCellPoint(i).x,mineCellPoint(i).y))expect(after.has(i),String(i)).toBe(true);expect(after.has(mineCellIndex(path.at(-1)!.x,path.at(-1)!.y))).toBe(true);expect(s.underground!.changes[mineCellIndex(path.at(-1)!.x,path.at(-1)!.y)].dug).toBe(true);
 });
 it('protects off-screen waiting pets and extra NPC/quest positions, leaving their route open',()=>{
  const s=fresh(),path=spur(s),p=path.at(-1)!,point={x:p.x*32+16,y:p.y*32+16};s.dungeons=createDungeonProgress();s.dungeons.pets.push({id:'cat-1',species:'cat',rare:false,xp:0,attributes:{speed:0,resistance:0,perception:0,protection:0,efficiency:0},world:{mode:'stay',area:'highland',space:'mine',...point,direction:'north'}});outside(s);const result=beginMineExpedition(s,validateSave,[point],forceRenew());expect(result.ok,result.message).toBe(true);expect(undergroundFits(s.underground!,point.x,point.y)).toBe(true);expect(reachable(s.underground!).has(mineCellIndex(p.x,p.y))).toBe(true);expect(s.dungeons!.pets[0].world).toMatchObject(point);
 });
 it('limits the fraction/quota, does not generate inventory, and prevents same-day renewal farming',()=>{
  const s=fresh(),path=spur(s),b=forceRenew();b.regeneration.fraction=.4;b.regeneration.maxPerEntry=1;outside(s);const stock=structuredClone(s.inventory);const r=beginMineExpedition(s,validateSave,[],b);expect(r.regenerated).toBe(1);expect(s.inventory).toEqual(stock);const changes=structuredClone(s.underground!.changes),copy=migrateSave(s)!;resumeMineExpedition(copy);expect(copy.underground!.changes).toEqual(changes);expect(beginMineExpedition(copy,validateSave).ok).toBe(false);
  finishMineExpedition(s);expect(beginMineExpedition(s,validateSave,[],b).regenerated).toBe(0);expect(s.underground!.changes).toEqual(changes);expect(s.underground!.renewal?.lastRegeneratedDay).toBe(20);expect(path.filter(p=>s.underground!.changes[mineCellIndex(p.x,p.y)].dug)).toHaveLength(path.length-1);
 });
 it('gives regenerated ore a new stable cycle identity and makes it wait again after mining',()=>{
  const s=fresh(),path=spur(s);outside(s);const b=forceRenew();expect(beginMineExpedition(s,validateSave,[],b).ok).toBe(true);const p=path.find(p=>!s.underground!.changes[mineCellIndex(p.x,p.y)].dug)!;const id=mineBlockNode(s.underground!,p.x,p.y)!.id;expect(id).toContain('-r1');expect(mineBlockNode(migrateSave(s)!.underground!,p.x,p.y)!.id).toBe(id);
  const origin=[[0,1],[0,-1],[1,0],[-1,0]].map(([dx,dy])=>({x:(p.x+dx)*32+16,y:(p.y+dy)*32+16})).find(a=>undergroundFits(s.underground!,a.x,a.y))!;s.mineInterior=origin;const stock=s.inventory.stone;for(let k=0;k<5;k++)expect(excavateMineBlock(s,origin,p,'pickaxe',validateSave).ok).toBe(true);expect(s.inventory.stone).toBe(stock+4);expect(s.underground!.changes[mineCellIndex(p.x,p.y)]).toMatchObject({cycle:1,dug:true,dugDay:20});finishMineExpedition(s);s.day=21;expect(beginMineExpedition(s,validateSave,[],b).regenerated).toBe(0);
 });
 it('reverts renewal, geology migration, visit counters and actor positions if saving fails',()=>{
  for(const write of [()=>false,()=>{throw Error('disk');}]){const s=fresh();spur(s);outside(s);const before=structuredClone(s);expect(beginMineExpedition(s,write,[],forceRenew()).ok).toBe(false);expect(s).toEqual(before);}
 });
 it('keeps partial work and category B untouched across renewal',()=>{
  const s=fresh(),path=spur(s),partial=deposit(s,'iron'),i=mineCellIndex(partial.x,partial.y);s.underground!.changes[i]={hits:2,mineral:'iron'};outside(s);expect(beginMineExpedition(s,validateSave,[],forceRenew()).ok).toBe(true);expect(s.underground!.changes[i]).toEqual({hits:2,mineral:'iron'});expect(path.some(p=>s.underground!.changes[mineCellIndex(p.x,p.y)].cycle===1)).toBe(true);
 });
 it('rejects malformed minerals, histories, future timestamps and inconsistent visit state',()=>{
  const s=fresh(),p=deposit(s,'iron'),i=mineCellIndex(p.x,p.y);for(const c of [{dug:true,mineral:'copper'},{dug:true,dugDay:99},{cycle:1},{renewedDay:1,mineral:'iron'},{hits:1,dugDay:1},{cycle:1,renewedDay:2,mineral:'iron',dug:true,dugDay:1}]){const copy=structuredClone(s);copy.underground!.changes[i]=c as never;expect(validateSave(copy),JSON.stringify(c)).toBe(false);}
  const copy=structuredClone(s);copy.underground!.expedition={id:1,inside:false,enteredDay:1,exitedDay:1};expect(validateSave(copy)).toBe(false);delete copy.mineInterior;expect(validateSave(copy)).toBe(true);
  const write=vi.fn(()=>true);expect(beginMineExpedition(s,write).ok).toBe(false);expect(write).not.toHaveBeenCalled();
 });
});
