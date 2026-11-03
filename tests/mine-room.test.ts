import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {MINE_ARRIVAL,MINE_EXIT,MINE_SOLIDS,MINE_ROOM,mineBlockedPoint,mineFits,mineResumePosition,validMineInterior,previousMinePosition} from '../src/data/mine-room';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {DoorwayPassage} from '../src/systems/map-transition';
function reachable(){
 const queue=[{...MINE_ARRIVAL}],seen=new Set([`${MINE_ARRIVAL.x},${MINE_ARRIVAL.y}`]);
 for(let i=0;i<queue.length;i++)for(const[dx,dy]of[[4,0],[-4,0],[0,4],[0,-4]]){const p={x:queue[i].x+dx,y:queue[i].y+dy},key=`${p.x},${p.y}`;if(!seen.has(key)&&mineFits(p.x,p.y)){seen.add(key);queue.push(p);}}
 return queue;
}
describe('Mina Antiga — approved playable room',()=>{
 it('arrives visibly inside the room above the main beam, connected to every working area and both tunnel approaches',()=>{
  expect(mineFits(MINE_ARRIVAL.x,MINE_ARRIVAL.y)).toBe(true);expect(MINE_ARRIVAL.y).toBeLessThan(737*MINE_ROOM.scale);
  const points=reachable();for(const target of[{x:346,y:481},{x:362,y:153},{x:639,y:191},{x:230,y:220},{x:180,y:325},{x:560,y:220},{x:540,y:330}])expect(points.some(p=>Math.hypot(p.x-target.x,p.y-target.y)<8),JSON.stringify(target)).toBe(true);
 });
 it('blocks solid walls, the cart, deposits and doorway pillars while leaving the floor and rails walkable',()=>{
  for(const[x,y]of[[0,0],[250,30],[20,240],[745,340],[280,480],[410,480],[-1,500],[300,520]])expect(mineBlockedPoint(x,y),`${x},${y}`).toBe(true);
  for(const solid of MINE_SOLIDS){const x=solid.footprint.reduce((s,p)=>s+p[0],0)/solid.footprint.length*MINE_ROOM.scale,y=solid.footprint.reduce((s,p)=>s+p[1],0)/solid.footprint.length*MINE_ROOM.scale;expect(mineBlockedPoint(x,y),solid.id).toBe(true);}
  for(const[x,y]of[[346,342],[350,420],[346,470],[460,265],[260,255],[490,340]])expect(mineFits(x,y),`${x},${y}`).toBe(true);
 });
 it('returns through the entrance only on an outward step, without bouncing after arrival or a restored save',()=>{
  const passage=new DoorwayPassage();expect(passage.update(MINE_ARRIVAL,MINE_ARRIVAL,MINE_EXIT)).toBe(false);expect(passage.update({x:346,y:483},{x:346,y:482},MINE_EXIT)).toBe(false);expect(passage.update({x:346,y:481},{x:346,y:484},MINE_EXIT)).toBe(true);
  passage.reset();expect(passage.update({x:280,y:481},{x:280,y:484},MINE_EXIT)).toBe(false);
 });
 it('saves the mine independently of the outdoor position and preserves old games without an interior',()=>{
  const save=createNewSave(createCharacterProfile('Mina'));expect(validateSave(save)).toBe(true);save.activeArea='highland';save.highlandPosition={x:1278,y:150,direction:'up'};save.mineInterior={...MINE_ARRIVAL};expect(validateSave(save)).toBe(true);
  const restored=migrateSave(structuredClone(save));expect(restored?.mineInterior).toEqual(MINE_ARRIVAL);expect(restored?.highlandPosition).toEqual(save.highlandPosition);
  save.mineInterior={x:0,y:0};expect(validateSave(save)).toBe(false);expect(mineResumePosition(save.mineInterior)).toEqual(MINE_ARRIVAL);save.mineInterior={...MINE_ARRIVAL};save.activeArea='property';expect(validateSave(save)).toBe(false);
  expect(validMineInterior({x:346,y:342,direction:'invalid'})).toBe(false);expect(validMineInterior({x:NaN,y:342})).toBe(false);
 });
 it('blocks the visible cart, cliff shelves and full-height posts reported in play',()=>{
  for(const [x,y] of [[180,244],[273,414],[410,414],[305,130],[405,130],[612,170],[670,180],[639,285],[650,265]])expect(mineFits(x,y),`${x},${y}`).toBe(false);
 });
 it('recovers an old save on newly blocked scenery without losing progress',()=>{
  const s=createNewSave(createCharacterProfile('Reparo'));s.activeArea='highland';s.mineInterior={x:180,y:244,direction:'up'};delete s.mineCollisionRevision;
  expect(previousMinePosition(180,244)).toBe(true);expect(validMineInterior(s.mineInterior)).toBe(false);
  const restored=migrateSave(s)!;expect(restored).not.toBeNull();expect(restored.inventory).toEqual(s.inventory);expect(validMineInterior(restored.mineInterior)).toBe(true);expect(restored.mineCollisionRevision).toBe(2);
 });
 it('uses the final approved source artwork at native 2x detail',()=>{
  const bytes=readFileSync('public/'+MINE_ROOM.file);expect([bytes.readUInt32BE(16),bytes.readUInt32BE(20)]).toEqual([MINE_ROOM.width/MINE_ROOM.scale,MINE_ROOM.height/MINE_ROOM.scale]);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe('bb73fd9ddbc8218eff6d1eb91df1c470d70faace316e941bf3994051adece1cd');
 });
});
