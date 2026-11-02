import {describe,it,expect} from 'vitest';
import {HIGHLAND_ENTRY,HIGHLAND_SIZE,LAKE_HIGHLAND_EXIT,LAKE_HIGHLAND_RETURN,highlandBlockedPoint,highlandAllowsStep,highlandDeck,highlandWaterPoint,highlandMineApproach} from '../src/data/highland';
import {lakeBlockedPoint} from '../src/data/fishing-lake';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {defaultMap} from '../src/data/default-maps';
import {readSceneMap,writeSceneMap} from '../src/systems/scene-map-edits';
const fits=(x:number,y:number)=>[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!highlandBlockedPoint(x+dx,y+dy));
function reachable(){const source={x:240,y:880},queue=[source],seen=new Set<string>(['240,880']);for(let i=0;i<queue.length;i++){const p=queue[i];for(const[dx,dy]of[[8,0],[-8,0],[0,8],[0,-8]]){const next={x:p.x+dx,y:p.y+dy},key=`${next.x},${next.y}`;if(seen.has(key)||!fits(next.x,next.y)||!highlandAllowsStep(p,next))continue;seen.add(key);queue.push(next);}}return queue;}
describe('Alto da Serra',()=>{
 it('uses its own native art extent and safe lake/stair arrivals',()=>{expect(HIGHLAND_SIZE).toEqual({width:1536,height:1024});expect(fits((HIGHLAND_ENTRY.x+.5)*32,(HIGHLAND_ENTRY.y+.5)*32)).toBe(true);for(const p of[LAKE_HIGHLAND_EXIT,LAKE_HIGHLAND_RETURN])expect(lakeBlockedPoint((p.x+.5)*32,(p.y+.5)*32)).toBe(false);});
 it('connects the southwest stairs to both bridge approaches and the accessible mine with full player clearance',()=>{const points=reachable();for(const target of[{x:520,y:416},{x:820,y:428},{x:1100,y:448},highlandMineApproach()!])expect(points.some(p=>Math.hypot(p.x-target.x,p.y-target.y)<16),JSON.stringify(target)).toBe(true);});
 it('reserves a clear forecourt and two-person entrance instead of blocking it with minecart or rubble',()=>{for(const x of[1288,1315,1342])for(const y of[232,248,272,296,320])expect(fits(x,y),`${x},${y}`).toBe(true);expect(highlandBlockedPoint(1450,260)).toBe(true);});
 it('keeps cliffs and bridge rails solid, with entry restricted to the landward bridge ends',()=>{expect(highlandBlockedPoint(400,600,undefined,true)).toBe(true);expect(highlandDeck(820,428)).toBe(true);expect(highlandWaterPoint(850,500)).toBe(true);expect(highlandBlockedPoint(850,500)).toBe(true);expect(highlandBlockedPoint(850,500,undefined,true)).toBe(false);expect(highlandAllowsStep({x:820,y:456},{x:820,y:440})).toBe(false);expect(highlandAllowsStep({x:548,y:410},{x:556,y:410})).toBe(true);});
 it('persists native position and separate edits without changing prior maps',()=>{const save=createNewSave(createCharacterProfile('Serra'));save.activeArea='highland';save.highlandPosition={x:240,y:880,direction:'up'};const before=structuredClone(save.fishingLakeMapEdits);writeSceneMap(save,'highland',defaultMap('highland'));expect(readSceneMap(save,'highland').area).toBe('highland');expect(save.fishingLakeMapEdits).toEqual(before);expect(validateSave(save)).toBe(true);expect(migrateSave(structuredClone(save))?.highlandPosition).toEqual(save.highlandPosition);save.highlandPosition.x=2000;expect(validateSave(save)).toBe(false);});
});
