import {describe,it,expect,vi} from 'vitest';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {COMMUNITY_STEPS,communityReady,communityStage,repairCommunity,validCommunityCenter} from '../src/systems/community-center';
import {ensureSurvivorCamp,recruitCampVisitor} from '../src/systems/survivor-camp';
import {COMMUNITY_BEDS,COMMUNITY_ROOM_ENTRY,COMMUNITY_ROOM_EXIT,communityRoomFits,communityResidentPosition} from '../src/data/community-room';
import type {ItemId,SaveData} from '../src/types';
const fresh=()=>createNewSave(createCharacterProfile('Recomeço'));
function supply(save:SaveData,stage:number){save.inventory.hammer=1;for(const [id,n]of Object.entries(COMMUNITY_STEPS[stage].cost))save.inventory[id as ItemId]=n!;}
describe('community restoration and progression',()=>{
 it('starts locked and rejects recruitment even when a peaceful group exists',()=>{const s=fresh(),c=ensureSurvivorCamp(s),before=structuredClone(s),write=vi.fn(()=>true);expect(communityStage(s)).toBe(0);expect(recruitCampVisitor(s,c.members[0].id,write).ok).toBe(false);expect(s).toEqual(before);expect(write).not.toHaveBeenCalled();});
 it('accepts separate partial deliveries at every stage, persists them and unlocks only at completion',()=>{
  let s=fresh();for(let stage=0;stage<3;stage++){
   supply(s,stage);const hammer=s.inventory.hammer;
   for(const [id,n]of Object.entries(COMMUNITY_STEPS[stage].cost)){
    const item=id as ItemId,total=n!,first=Math.floor(total/2);
    expect(repairCommunity(s,{kind:'deliver',item,amount:first},validateSave).ok).toBe(true);
    s=migrateSave(s)!;expect(s).not.toBeNull();expect(s.communityCenter?.delivered?.[item]).toBe(first);expect(communityReady(s)).toBe(false);
    expect(repairCommunity(s,{kind:'deliver',item,amount:total-first},validateSave).ok).toBe(true);expect(s.inventory[item]).toBe(0);
   }
   expect(repairCommunity(s,{kind:'upgrade'},validateSave).ok).toBe(true);expect(s.communityCenter).toEqual({stage:stage+1,delivered:{}});expect(s.inventory.hammer).toBe(hammer);expect(communityReady(s)).toBe(stage===2);
  }
  const c=ensureSurvivorCamp(s),id=c.members[0].id;expect(recruitCampVisitor(s,id,validateSave).ok).toBe(true);expect(s.survivorCamp?.residents).toHaveLength(1);expect(validateSave(s)).toBe(true);
 });
 it('concludes with remaining stock after partial deliveries without charging delivered items again',()=>{const s=fresh();supply(s,0);expect(repairCommunity(s,{kind:'deliver',item:'plank',amount:5},validateSave).ok).toBe(true);expect(repairCommunity(s,{kind:'upgrade'},validateSave).ok).toBe(true);for(const id of ['stone','plank','cord']as const)expect(s.inventory[id]).toBe(0);});
 it('requires the tool but allows donations before owning it',()=>{const s=fresh();s.inventory.stone=3;expect(repairCommunity(s,{kind:'deliver',item:'stone',amount:3},validateSave).ok).toBe(true);const before=structuredClone(s);expect(repairCommunity(s,{kind:'upgrade'},validateSave).ok).toBe(false);expect(s).toEqual(before);});
 it('rejects invalid, excess, unrelated, duplicate and unaffordable deliveries',()=>{for(const [item,amount]of [['stone',0],['stone',-1],['stone',1.5],['stone',NaN],['stone',17],['stone',Infinity],['meal',1],['sword',1]]as [ItemId,number][]){const s=fresh();supply(s,0);const before=structuredClone(s);expect(repairCommunity(s,{kind:'deliver',item,amount},()=>true).ok).toBe(false);expect(s).toEqual(before);}const s=fresh();expect(repairCommunity(s,{kind:'deliver',item:'plank',amount:1},()=>true).ok).toBe(false);supply(s,0);expect(repairCommunity(s,{kind:'deliver',item:'stone',amount:16},validateSave).ok).toBe(true);expect(repairCommunity(s,{kind:'deliver',item:'stone',amount:1},validateSave).ok).toBe(false);});
 it('keeps stock, stage and donated materials unchanged if either operation cannot save',()=>{for(const write of [()=>false,()=>{throw Error('disk full');}])for(const action of [{kind:'deliver' as const,item:'stone' as const,amount:2},{kind:'upgrade' as const}]){const s=fresh();supply(s,0);repairCommunity(s,{kind:'deliver',item:'plank',amount:2},validateSave);const before=structuredClone(s);expect(repairCommunity(s,action,write).ok).toBe(false);expect(s).toEqual(before);}});
 it('preserves legacy residents and their tasks, grants their home, and does not unlock merely visited camps',()=>{
  const s=fresh();s.communityCenter={stage:3};const c=ensureSurvivorCamp(s);recruitCampVisitor(s,c.members[0].id,validateSave);delete s.communityCenter;const before=structuredClone(s),copy=migrateSave(s)!;expect(copy.communityCenter?.stage).toBe(3);expect(copy.survivorCamp).toEqual(before.survivorCamp);expect(s).toEqual(before);
  const visitor=fresh();delete visitor.communityCenter;visitor.activeArea='survivorCamp';ensureSurvivorCamp(visitor);const locked=migrateSave(visitor)!;expect(communityReady(locked)).toBe(false);expect(locked.activeArea).toBe('forest');expect(locked.forestPosition).toMatchObject({x:1136,y:272});expect(locked.survivorCamp).toEqual(visitor.survivorCamp);
 });
 it('rejects malformed camp data before using it to validate an indoor save',()=>{
  for(const camp of [{},{residents:null},{residents:[{}]}]){
   const s={...fresh(),activeArea:'village',communityCenter:undefined,communityInterior:{...COMMUNITY_ROOM_ENTRY},survivorCamp:camp};
   expect(()=>validateSave(s)).not.toThrow();expect(validateSave(s)).toBe(false);
  }
 });
 it('rejects corrupt progress and incompatible indoor saves',()=>{for(const v of [{stage:4},{stage:-1},{stage:1.2},{stage:0,delivered:{stone:17}},{stage:0,delivered:{meal:1}},{stage:3,delivered:{stone:0}},{stage:0,delivered:[]},{stage:0,delivered:{stone:NaN}}])expect(validCommunityCenter(v)).toBe(false);const s=fresh();s.activeArea='village';s.communityInterior={...COMMUNITY_ROOM_ENTRY,direction:'up'};expect(validateSave(s)).toBe(false);s.communityCenter={stage:3};expect(validateSave(s)).toBe(true);s.activeArea='forest';expect(validateSave(s)).toBe(false);s.activeArea='village';s.merchantInterior={owner:'rosa',x:288,y:335};expect(validateSave(s)).toBe(false);delete s.merchantInterior;s.communityInterior={x:60,y:170};expect(validateSave(s)).toBe(false);});
});
describe('usable community lodging',()=>{
 it('provides eight beds, solid furniture and a connected entrance, exit and resident spaces',()=>{
  expect(COMMUNITY_BEDS).toHaveLength(8);for(const p of COMMUNITY_BEDS)expect(communityRoomFits(p.x+27,p.y-20)).toBe(false);
  const start=COMMUNITY_ROOM_ENTRY,seen=new Set([`${start.x},${start.y}`]),queue=[start];
  for(let i=0;i<queue.length;i++)for(const [dx,dy]of [[4,0],[-4,0],[0,4],[0,-4]]){const p={x:queue[i].x+dx,y:queue[i].y+dy},key=`${p.x},${p.y}`;if(!seen.has(key)&&communityRoomFits(p.x,p.y)){seen.add(key);queue.push(p);}}
  for(const target of [COMMUNITY_ROOM_EXIT,...COMMUNITY_BEDS.map((_,i)=>communityResidentPosition(i))])expect(queue.some(p=>Math.hypot(p.x-target.x,p.y-target.y)<5),JSON.stringify(target)).toBe(true);
 });
});
