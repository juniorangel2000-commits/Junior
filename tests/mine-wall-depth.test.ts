import {describe,it,expect} from 'vitest';
import {mineWallLight,mineWallRefreshCells} from '../src/data/mine-wall-depth';
import {createNewSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {ensureUndergroundWorld,mineRockAt,mineWallMask,mineInnerWallMask} from '../src/systems/underground';
describe('continuous exposed cave faces',()=>{
 it('matches brightness across the front and back-band seam and disappears continuously into hidden rock',()=>{for(const bit of [1,2,4,8]){const front=bit===1?[16,32]:bit===2?[0,16]:bit===4?[16,0]:[32,16],inner=bit===1?[16,0]:bit===2?[32,16]:bit===4?[16,32]:[0,16];expect(mineWallLight(bit,front[0],front[1])).toBe(mineWallLight(bit,inner[0],inner[1],true));}expect(mineWallLight(4,16,32)).toBe(1);expect(mineWallLight(4,16,0,true)).toBe(0);});
 it('keeps refresh work bounded to thirteen cells when one block opens, and one for partial damage',()=>{const p={x:30,y:40},cells=[p,{x:29,y:40},{x:31,y:40},{x:30,y:39},{x:30,y:41}];expect(mineWallRefreshCells([p])).toEqual([p]);const changed=mineWallRefreshCells(cells);expect(changed).toHaveLength(13);expect(changed).toContainEqual({x:30,y:42});expect(changed.every(q=>Math.abs(q.x-p.x)+Math.abs(q.y-p.y)<=2)).toBe(true);});
 it('distinguishes the exposed ore layer, its rock-only back band, and the hidden mass',()=>{const m=ensureUndergroundWorld(createNewSave(createCharacterProfile('Faces naturais')));let front=0,back=0,hidden=0;for(let y=140;y<173;y++)for(let x=60;x<105;x++)if(mineRockAt(m,x,y)){if(mineWallMask(m,x,y)!==15)front++;else if(mineInnerWallMask(m,x,y))back++;else hidden++;}expect(front).toBeGreaterThan(10);expect(back).toBeGreaterThan(10);expect(hidden).toBeGreaterThan(10);});
});
