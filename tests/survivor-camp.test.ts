import {describe,it,expect} from 'vitest';
import {createNewSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {ensureSurvivorCamp,advanceSurvivorCamp,recruitCampVisitor,validSurvivorCamp} from '../src/systems/survivor-camp';
import {CAMP_ENTRY,CAMP_EXIT,CAMP_VISITOR_SLOTS,CAMP_RESIDENT_SLOTS,campBlockedPoint} from '../src/data/survivor-camp';
import {CAMP_APPROACH,forestCampFootprints} from '../src/data/forest-camp-access';
import {forestWaterDistanceAt} from '../src/data/ancient-forest';
import {CHARACTER_DIRECTIONS,characterFrame} from '../src/character-directions';
import {survivorWalkFrame,SURVIVOR_LOOKS} from '../src/data/survivor-looks';
const stock=()=>{const s=createNewSave(createCharacterProfile('Acampamento'));s.activeArea='survivorCamp';s.communityCenter={stage:3};return s;};
describe('separate survivor camp',()=>{
 it('keeps gates and all arrival/resident slots walkable',()=>{for(const p of [CAMP_ENTRY,CAMP_EXIT])expect(campBlockedPoint((p.x+.5)*32,(p.y+.5)*32)).toBe(false);for(const p of [...CAMP_VISITOR_SLOTS,...CAMP_RESIDENT_SLOTS])expect(campBlockedPoint(p.x,p.y),JSON.stringify(p)).toBe(false);});
 it('places a few footprints west of the lake without touching its water',()=>{expect(forestCampFootprints()).toHaveLength(7);for(const p of forestCampFootprints())expect(forestWaterDistanceAt(p.x,p.y)).toBeGreaterThan(32);for(const p of CAMP_APPROACH)expect(forestWaterDistanceAt(p.x,p.y)).toBeGreaterThan(32);});
 it('starts with a peaceful group and preserves it through save and reload',()=>{const s=stock(),c=ensureSurvivorCamp(s);expect(c.kind).toBe('peaceful');expect(c.members).toHaveLength(3);expect(validSurvivorCamp(c)).toBe(true);expect(validateSave(s)).toBe(true);const copy=structuredClone(s);expect(ensureSurvivorCamp(copy)).toEqual(c);});
 it('walks from the entry rather than teleporting to the tents',()=>{const s=stock(),c=ensureSurvivorCamp(s),before=c.members.map(p=>({x:p.x,y:p.y}));advanceSurvivorCamp(s,.1);c.members.forEach((p,i)=>{expect(Math.hypot(p.x-before[i].x,p.y-before[i].y)).toBeLessThanOrEqual(4.600001);expect(p.status).toBe('arriving');});for(let n=0;n<650;n++)advanceSurvivorCamp(s,.1);expect(c.members.every(p=>p.status==='staying')).toBe(true);});
 it('persists recruitment once and keeps the original position',()=>{const s=stock(),c=ensureSurvivorCamp(s),p=c.members[0],before={x:p.x,y:p.y};expect(recruitCampVisitor(s,p.id,()=>false).ok).toBe(false);expect(s.survivorCamp!.members).toHaveLength(3);expect(recruitCampVisitor(s,p.id,validateSave).ok).toBe(true);expect(s.survivorCamp!.residents[0]).toMatchObject({...before,id:p.id,status:'resident'});expect(recruitCampVisitor(s,p.id,validateSave).ok).toBe(false);expect(s.survivorCamp!.residents).toHaveLength(1);});
 it('turns a late group around without replacing its actors on a clock jump',()=>{const s=stock(),c=ensureSurvivorCamp(s),ids=c.members.map(p=>p.id),before=c.members.map(p=>({x:p.x,y:p.y}));s.day+=5;advanceSurvivorCamp(s,.1);expect(c.members.map(p=>p.id)).toEqual(ids);c.members.forEach((p,i)=>{expect(p.status).toBe('leaving');expect(Math.hypot(p.x-before[i].x,p.y-before[i].y)).toBeLessThanOrEqual(4.600001);});});
 it('can bring hostile groups on later visits without rerolling at reload',()=>{const s=stock();let hostile=false;for(let n=0;n<16;n++){const c=ensureSurvivorCamp(s);hostile||=c.kind==='hostile';expect(validSurvivorCamp(c)).toBe(true);c.members.forEach(p=>p.status='gone');s.day=c.nextVisitDay;advanceSurvivorCamp(s,.1);}expect(hostile).toBe(true);});
 it('rejects hostile aggression before warning and malformed members',()=>{const s=stock(),c=ensureSurvivorCamp(s);c.kind='hostile';c.aggressive=true;expect(validSurvivorCamp(c)).toBe(false);c.warned=true;expect(validSurvivorCamp(c)).toBe(true);c.members[0].x=NaN;expect(validSurvivorCamp(c)).toBe(false);});
});
describe('canonical player motion for survivors',()=>{
 it('uses the exact eight directions and 48px gait cycle for every appearance',()=>{for(const look of Object.keys(SURVIVOR_LOOKS) as (keyof typeof SURVIVOR_LOOKS)[]){const frames=SURVIVOR_LOOKS[look].character==='farmer-male'?8:6;for(const direction of CHARACTER_DIRECTIONS){expect(survivorWalkFrame(look,direction,30,false)).toBe(characterFrame(direction,0,frames));for(let distance=0;distance<48;distance++)expect(survivorWalkFrame(look,direction,distance,true)).toBe(characterFrame(direction,Math.floor((distance+1e-7)/48*frames)%frames+1,frames));}}});
});
