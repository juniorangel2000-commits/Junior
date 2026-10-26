import {describe,it,expect,vi,afterEach} from 'vitest';
import {Home,validateHome} from '../src/systems/home';
import {BLACKSMITH_INTERIOR,BLACKSMITH_CATALOG,validateBlacksmithHome,blacksmithRoomPosition} from '../src/data/blacksmith-interior';
import {BentoRoutine,validBentoRoutine} from '../src/systems/bento-routine';
import {createNewSave,saveGame,loadSave,validateSave} from '../src/systems/save';
afterEach(()=>vi.unstubAllGlobals());
const room=()=>new Home(BLACKSMITH_INTERIOR,false);
describe('editable blacksmith interior',()=>{
 it('offers every authored fixture with its own kind and no residential furniture',()=>{
  expect(validateBlacksmithHome(BLACKSMITH_INTERIOR)).toBe(true);
  expect(BLACKSMITH_CATALOG).not.toContain('bed');expect(new Set(BLACKSMITH_INTERIOR.furniture.map(p=>p.kind))).toEqual(new Set(BLACKSMITH_CATALOG));
  expect(validateHome(BLACKSMITH_INTERIOR)).toBe(false);
 });
 it('moves bench accessories together with their support, rejecting floating tools',()=>{
  const r=room();expect(r.move('home-smithWorkbench-3',1,5).ok).toBe(true);
  expect(r.data.furniture.find(p=>p.kind==='tongs')).toMatchObject({x:1,y:5});
  expect(r.place('tongs',9,4).ok).toBe(false);
  expect(r.remove('home-smithWorkbench-3').ok).toBe(true);expect(r.data.furniture.some(p=>p.kind==='tongs')).toBe(false);
 });
 it('moves wall fixtures along the wall and rejects placing them on the floor',()=>{
  const r=room();expect(r.move('home-toolRack-16',6,0).ok).toBe(true);
  expect(r.move('home-toolRack-16',6,3).ok).toBe(false);
  expect(r.data.furniture.find(p=>p.kind==='toolRack')).toMatchObject({x:6,y:0});
 });
 it('allows clearing the shop and rebuilding it while protecting the doorway',()=>{
  const r=room();for(const p of [...r.data.furniture])if(r.data.furniture.some(n=>n.id===p.id))expect(r.remove(p.id).ok).toBe(true);
  expect(r.data.furniture).toEqual([]);expect(validateBlacksmithHome(r.data)).toBe(true);
  expect(r.place('fireplace',5,8).ok).toBe(false);
  expect(r.place('fireplace',6,2).ok).toBe(true);expect(r.place('counter',6,5).ok).toBe(true);expect(r.place('counter',7,5).ok).toBe(true);
 });
 it('reroutes Bento around a fixture placed at a former walking destination',()=>{
  const r=room();expect(r.place('anvil',3,4).ok).toBe(true);
  const b=new BentoRoutine({area:'blacksmith-home',x:176,y:240,direction:'up',stop:5,wait:0,doorway:false},r);let moved=0;
  for(let i=0;i<600;i++){const previous={...b.state},s=b.step(.1);if(Math.hypot(previous.x-s.x,previous.y-s.y)>.01)moved++;expect(validBentoRoutine(b.state,r)).toBe(true);if(s.area==='blacksmith-home')expect(blacksmithRoomPosition(s.x,s.y,r)).toBe(true);}
  expect(moved).toBeGreaterThan(0);expect(b.state.stop).not.toBe(5);
 });
 it('saves an edited layout and keeps the property interior, wallet and orders unchanged',()=>{
  const disk=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>disk.get(k)??null,setItem:(k:string,v:string)=>disk.set(k,v)});
  const s=createNewSave({name:'Editor',skin:'#d9a276',hairStyle:'preso',hairColor:'#754323',outfit:'#638a9d'}),before=structuredClone(s);
  const r=room();expect(r.move('home-smithWorkbench-3',1,5).ok).toBe(true);expect(r.setStyle('dark','sage').ok).toBe(true);
  s.blacksmithHome=structuredClone(r.data);s.blacksmithLayoutRevision=3;s.activeArea='village';s.blacksmithInterior={x:192,y:272};
  expect(saveGame(s)).toBe(true);const loaded=loadSave()!;expect(loaded.blacksmithHome).toEqual(r.data);expect(loaded.home).toEqual(before.home);expect(loaded.villageEconomy).toEqual(before.villageEconomy);expect(loaded.economy6).toEqual(before.economy6);
  expect(validateSave({...s,blacksmithHome:{...r.data,furniture:[{id:'home-bed-1',kind:'bed',x:2,y:2}]}})).toBe(false);
 });
});
