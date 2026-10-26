import {describe,it,expect,vi,afterEach} from 'vitest';
import {BLACKSMITH_INTERIOR,BLACKSMITH_ROOM,BLACKSMITH_DOOR,BLACKSMITH_ROOM_EXIT,BLACKSMITH_COUNTER,blacksmithRoomPosition} from '../src/data/blacksmith-interior';
import {validateHome} from '../src/systems/home';
import {DoorwayPassage} from '../src/systems/map-transition';
import {BentoRoutine,createBentoRoutine,validBentoRoutine} from '../src/systems/bento-routine';
import {villageBlockedAt,villagePointBlocked,VILLAGE_NPCS} from '../src/data/village';
import {createNewSave,saveGame,loadSave,validateSave,migrateSave,SAVE_KEY} from '../src/systems/save';
import {villageRoute} from '../src/systems/village-walk';
const blocked=(x:number,y:number)=>villageBlockedAt(x,y)||VILLAGE_NPCS.some(n=>n.id!=='bento'&&n.x===x&&n.y===y);
afterEach(()=>vi.unstubAllGlobals());

describe('Bento commercial interior and shared village circulation',()=>{
 it('uses the existing room geometry with armor display, workbench and stock, without beds',()=>{
  expect(validateHome(BLACKSMITH_INTERIOR,false)).toBe(true);
  expect(validateHome(BLACKSMITH_INTERIOR)).toBe(false); // Player homes still require a bed.
  expect(BLACKSMITH_INTERIOR.furniture.some(p=>p.kind==='bed')).toBe(false);
  expect(BLACKSMITH_ROOM.canReachExit({x:6,y:8})).toBe(true);
  expect(blacksmithRoomPosition(192,272)).toBe(true);
  expect(blacksmithRoomPosition(80,112)).toBe(false); // Armor display.
  expect(blacksmithRoomPosition(0,0)).toBe(false);
 });
 it('enters only by walking through the cottage doorway, with no wall or side entry',()=>{
  const pass=new DoorwayPassage(),d=BLACKSMITH_DOOR;
  expect(pass.update({x:d.x,y:1050},{x:d.x,y:1050},d)).toBe(false);
  expect(pass.update({x:d.x+40,y:1040},{x:d.x+40,y:1029},d)).toBe(false);
  expect(pass.update({x:d.x,y:1032},{x:d.x,y:1029},d)).toBe(true);
  for(const [dx,dy]of [[-7,-5],[7,-5],[-7,3],[7,3]])expect(villagePointBlocked(d.x+dx,1029+dy)).toBe(false);
  pass.reset();expect(pass.update({x:192,y:284},{x:192,y:292},BLACKSMITH_ROOM_EXIT)).toBe(true);
 });
 it('blocks the entire continuous counter while preserving the passage to its service side',()=>{
  const c=BLACKSMITH_COUNTER;
  for(let x=c.x*32+1;x<(c.x+c.length)*32;x+=3)expect(blacksmithRoomPosition(x,c.y*32+16)).toBe(false);
  const route=villageRoute({x:6,y:8},{x:8,y:4},(x,y)=>BLACKSMITH_ROOM.isBlocked(x,y));
  expect(route.length).toBeGreaterThan(0);expect(route.some(p=>p.x===5&&p.y===5)).toBe(true);
  expect(route.every(p=>!BLACKSMITH_ROOM.isBlocked(p.x,p.y))).toBe(true);
 });
 it('keeps the stone fireplace solid without blocking the routes in front of it',()=>{
  for(const p of [{x:208,y:80},{x:240,y:112}])expect(blacksmithRoomPosition(p.x,p.y)).toBe(false);
  for(const x of [176,208,240,272])expect(blacksmithRoomPosition(x,144)).toBe(true);
  expect(BLACKSMITH_ROOM.canReachExit({x:8,y:4})).toBe(true);
 });
 it('walks between workshop, village, furnished home and back without duplicating the actor',()=>{
  const b=new BentoRoutine(),seen=new Set<number>(),areas=new Set<string>();let entered=0,left=0,old=b.state.area;
  for(let i=0;i<7500;i++){
   const s=b.step(.1,false,blocked);seen.add(s.stop);areas.add(s.area);
   expect(validBentoRoutine(b.state)).toBe(true);
   expect(s.phase>=0&&s.phase<=6).toBe(true);
   if(s.area==='blacksmith-home')expect(BLACKSMITH_ROOM.isBlocked(Math.floor(s.x/32),Math.floor(s.y/32))).toBe(false);
   else expect(blocked(Math.floor(s.x/32),Math.floor(s.y/32))).toBe(false);
   if(s.area!==old){if(s.area==='blacksmith-home')entered++;else left++;old=s.area;}
  }
  expect(seen.size).toBe(8);expect(areas.size).toBe(2);expect(entered).toBeGreaterThan(0);expect(left).toBeGreaterThan(0);
 });
 it('stops during dialogue and resumes from the same saved room and waypoint',()=>{
  const b=new BentoRoutine();for(let i=0;i<5000&&b.state.area!=='blacksmith-home';i++)b.step(.1,false,blocked);
  expect(b.state.area).toBe('blacksmith-home');
  const snapshot=structuredClone(b.state);expect(b.step(.1,true).phase).toBe(0);expect(b.state).toEqual(snapshot);
  const resumed=new BentoRoutine(snapshot);expect(resumed.state).toEqual(snapshot);
  for(let i=0;i<100;i++)resumed.step(.1,false,blocked);
  expect(resumed.state).not.toEqual(snapshot);expect(snapshot).toEqual(b.state);
 });
 it('saves the player inside and Bento in his own room without changing farm or economy',()=>{
  const disk=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>disk.get(k)??null,setItem:(k:string,v:string)=>disk.set(k,v)});
  const s=createNewSave({name:'Bento',skin:'#d9a276',hairStyle:'preso',hairColor:'#754323',outfit:'#638a9d'});
  const farm=structuredClone(s.player),inventory=structuredClone(s.inventory),wallet=structuredClone(s.villageEconomy);
  s.activeArea='village';s.villagePosition={x:1840,y:1052};s.blacksmithInterior={x:192,y:272,direction:'up'};
  s.bentoRoutine={...createBentoRoutine(),area:'blacksmith-home',stop:5,x:176,y:240,wait:4};
  expect(saveGame(s)).toBe(true);const restored=loadSave()!;expect(restored).toEqual(s);
  expect(restored.player).toEqual(farm);expect(restored.inventory).toEqual(inventory);expect(restored.villageEconomy).toEqual(wallet);
 });
 it('rejects impossible interiors and corrupt NPC schedules while preserving older saves',()=>{
  const s=createNewSave({name:'Bento',skin:'#d9a276',hairStyle:'preso',hairColor:'#754323',outfit:'#638a9d'});
  expect(validateSave(s)).toBe(true);
  expect(validateSave({...s,blacksmithInterior:{x:192,y:272}})).toBe(false);
  expect(validateSave({...s,activeArea:'village',blacksmithInterior:{x:80,y:112}})).toBe(false);
  for(const bad of [{stop:99},{wait:-1},{x:NaN},{direction:'north'},{area:'blacksmith-home'},{doorway:true}])expect(validBentoRoutine({...createBentoRoutine(),...bad})).toBe(false);
 });
 it('recovers an older interior position covered by new fixtures without replacing the save',()=>{
  const s=createNewSave({name:'Bento',skin:'#d9a276',hairStyle:'preso',hairColor:'#754323',outfit:'#638a9d'});
  s.activeArea='village';s.villagePosition={x:1840,y:1052};s.blacksmithInterior={x:208,y:176,direction:'up'};
  s.bentoRoutine={...createBentoRoutine(),area:'blacksmith-home',x:208,y:176,stop:6};s.villageEconomy!.coins=173;s.inventory.ironIngot=4;
  const original=structuredClone(s),raw=JSON.stringify(s),disk=new Map([[SAVE_KEY,raw]]);
  vi.stubGlobal('localStorage',{getItem:(k:string)=>disk.get(k)??null,setItem:vi.fn()});
  const restored=loadSave()!;expect(restored).not.toBeNull();expect(restored.blacksmithInterior).toMatchObject({x:192,y:272,direction:'up'});
  expect(restored.bentoRoutine).toMatchObject({x:192,y:272,stop:6});expect(restored.inventory).toEqual(s.inventory);expect(restored.economy6).toEqual(s.economy6);
  expect(restored.villageEconomy).toEqual(s.villageEconomy);expect(restored.mapEdits).toEqual(s.mapEdits);
  expect(migrateSave(restored)).toEqual(restored);expect(s).toEqual(original);expect(disk.get(SAVE_KEY)).toBe(raw);
 });
 it('recovers revision 2 saves where the fireplace now stands, preserving the wallet and orders',()=>{
  const s=createNewSave({name:'Bento',skin:'#d9a276',hairStyle:'preso',hairColor:'#754323',outfit:'#638a9d'});
  s.activeArea='village';s.blacksmithLayoutRevision=2;s.blacksmithInterior={x:208,y:80,direction:'right'};
  s.bentoRoutine={...createBentoRoutine(),area:'blacksmith-home',x:208,y:80,stop:6};s.villageEconomy!.coins=173;
  const restored=migrateSave(s)!;expect(restored).not.toBeNull();expect(restored.blacksmithLayoutRevision).toBe(3);
  expect(restored.blacksmithInterior).toMatchObject({x:192,y:272,direction:'right'});expect(restored.bentoRoutine).toMatchObject({x:192,y:272,stop:6});
  expect(restored.villageEconomy).toEqual(s.villageEconomy);expect(restored.economy6).toEqual(s.economy6);expect(restored.inventory).toEqual(s.inventory);
  expect(s.blacksmithInterior).toMatchObject({x:208,y:80});expect(migrateSave(restored)).toEqual(restored);
 });
});
