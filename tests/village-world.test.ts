import {describe,it,expect} from 'vitest';
import {VILLAGE_BUILDINGS,VILLAGE_ENTRY,VILLAGE_EXIT,VILLAGE_NPCS,VILLAGE_TREES,villageBlockedAt,villageGround} from '../src/data/village';

describe('walkable village layout',()=>{
 it('keeps the east-property passage aligned on row52 and clear',()=>{
  expect(VILLAGE_ENTRY).toEqual({x:2,y:52});expect(VILLAGE_EXIT).toEqual({x:1,y:52});
  for(let x=1;x<=33;x++){expect(villageBlockedAt(x,52)).toBe(false);expect(['path','paving']).toContain(villageGround(x,52));}
 });
 it('connects every merchant and resident to the entry by walkable ground',()=>{
  const queue:Array<{x:number;y:number}>=[{...VILLAGE_ENTRY}],seen=new Set<string>([`${VILLAGE_ENTRY.x},${VILLAGE_ENTRY.y}`]);
  for(let head=0;head<queue.length;head++){
   const p=queue[head];
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const x=p.x+dx,y=p.y+dy,key=`${x},${y}`;if(seen.has(key)||villageBlockedAt(x,y))continue;
    seen.add(key);queue.push({x,y});
   }
  }
  for(const npc of VILLAGE_NPCS){expect(villageBlockedAt(npc.x,npc.y)).toBe(false);expect(seen.has(`${npc.x},${npc.y}`)).toBe(true);}
  expect(new Set(VILLAGE_NPCS.filter(n=>n.merchantId).map(n=>n.merchantId))).toEqual(new Set(['general','blacksmith','herbalist','carpenter','seeds','traveler','tailor','fisher','inn','mechanic']));
  expect(VILLAGE_NPCS).toHaveLength(10);
 });
 it('keeps buildings solid and trees away from every storefront approach',()=>{
  expect(VILLAGE_BUILDINGS.length).toBeGreaterThanOrEqual(6);
  for(const building of VILLAGE_BUILDINGS)expect(villageBlockedAt(building.x,building.y)).toBe(true);
  for(const npc of VILLAGE_NPCS)expect(VILLAGE_TREES.some(tree=>Math.abs(tree.x-npc.x)<3&&Math.abs(tree.y-npc.y)<3)).toBe(false);
 });
});
