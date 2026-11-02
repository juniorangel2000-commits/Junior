import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import contour from '../src/data/highland-river-contour.json';
import {describe,it,expect} from 'vitest';
import {DoorwayPassage} from '../src/systems/map-transition';
import {HIGHLAND_ENTRY,HIGHLAND_SIZE,LAKE_HIGHLAND_EXIT,LAKE_HIGHLAND_RETURN,highlandBlockedPoint,highlandAllowsStep,highlandDeck,highlandWaterPoint,highlandMineApproach,HIGHLAND_OBJECTS,HIGHLAND_STAIRS,HIGHLAND_LAKE_PASSAGE,highlandArrivalPosition,highlandResumePosition,highlandBridgePose,HIGHLAND_ART} from '../src/data/highland';
import {lakeBlockedPoint,lakeStairs,lakeElevationAllowsStep} from '../src/data/fishing-lake';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {defaultMap} from '../src/data/default-maps';
import {readSceneMap,writeSceneMap} from '../src/systems/scene-map-edits';
const fits=(x:number,y:number)=>[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!highlandBlockedPoint(x+dx,y+dy));
function reachable(){const source=highlandArrivalPosition(),queue=[{x:source.x,y:source.y}],seen=new Set<string>([`${source.x},${source.y}`]);for(let i=0;i<queue.length;i++){const p=queue[i];for(const[dx,dy]of[[8,0],[-8,0],[0,8],[0,-8]]){const next={x:p.x+dx,y:p.y+dy},key=`${next.x},${next.y}`;if(seen.has(key)||!fits(next.x,next.y)||!highlandAllowsStep(p,next))continue;seen.add(key);queue.push(next);}}return queue;}
describe('Platô da Nascente — upper plateau',()=>{
 it('arrives at the very top of the stairs at the southern map boundary',()=>{expect(HIGHLAND_SIZE).toEqual({width:1536,height:1024});expect(HIGHLAND_ENTRY).toEqual({x:8,y:29});const arrival=highlandArrivalPosition();expect(fits(arrival.x,arrival.y)).toBe(true);expect(arrival.y).toBeLessThan(HIGHLAND_STAIRS.y);expect(HIGHLAND_STAIRS.height).toBe(48);expect(HIGHLAND_STAIRS.y+HIGHLAND_STAIRS.height).toBe(HIGHLAND_SIZE.height);for(const p of[LAKE_HIGHLAND_EXIT,LAKE_HIGHLAND_RETURN])expect(lakeBlockedPoint((p.x+.5)*32,(p.y+.5)*32)).toBe(false);});
 it('connects the upper stair landing to both bridge approaches and the accessible mine with full player clearance',()=>{const points=reachable(),b=highlandBridgePose()!;for(const target of[{x:b.left-16,y:b.y},{x:(b.left+b.right)/2,y:b.y},{x:b.right+16,y:b.y},highlandMineApproach()!])expect(points.some(p=>Math.hypot(p.x-target.x,p.y-target.y)<16),JSON.stringify(target)).toBe(true);});
 it('keeps the mine forecourt and central entrance clear',()=>{for(const x of[1256,1278,1302])for(const y of[150,170,210,250])expect(fits(x,y),`${x},${y}`).toBe(true);expect(highlandBlockedPoint(1412,145)).toBe(true);expect(highlandBlockedPoint(1160,146)).toBe(true);expect(highlandBlockedPoint(1280,130)).toBe(true);expect(HIGHLAND_OBJECTS.find(o=>o.kind==='highland-mine')?.height).toBe(140);});
 it('uses the artwork shoreline for rendering and swimming',()=>{expect(createHash('sha256').update(readFileSync('public/assets/visual/highland/terrain.png')).digest('hex')).toBe(contour.sha256);for(let y=0;y<1024;y++)for(const [left,right]of contour.rows[y]){expect(highlandWaterPoint(left,y)).toBe(true);expect(highlandWaterPoint(right-1,y)).toBe(true);expect(highlandWaterPoint(right,y)).toBe(false);}});
 it('has no obsolete internal cliff walls on the single-level plateau',()=>{for(const [x,y]of [[608,328],[545,500],[1350,560],[400,600],[240,880]])expect(fits(x,y),`${x},${y}`).toBe(true);for(const [x,y]of [[70,400],[1480,400],[400,90]])expect(highlandBlockedPoint(x,y,undefined,true)).toBe(true);});
 it('blocks bridge rails and side climbing from water',()=>{const b=highlandBridgePose()!;expect(highlandDeck(836,b.y)).toBe(true);expect(highlandWaterPoint(800,500)).toBe(true);expect(highlandBlockedPoint(800,500)).toBe(true);expect(highlandBlockedPoint(800,500,undefined,true)).toBe(false);expect(highlandAllowsStep({x:836,y:b.y+b.half+10},{x:836,y:b.y+b.half-2})).toBe(false);expect(highlandAllowsStep({x:b.left-4,y:b.y},{x:b.left+4,y:b.y})).toBe(true);});
 it('keeps swimmers before the waterfall lip at the map boundary',()=>{const row=contour.rows[1000],x=(row[0][0]+row[row.length-1][1])/2;expect(highlandWaterPoint(x,1000)).toBe(true);expect(highlandBlockedPoint(x,1000,undefined,true)).toBe(true);});
 it('only returns to the lake when walking down across the stair top',()=>{const arrival=highlandArrivalPosition(),passage=new DoorwayPassage();expect(passage.update(arrival,arrival,HIGHLAND_LAKE_PASSAGE)).toBe(false);expect(passage.update(arrival,{...arrival,y:arrival.y-2},HIGHLAND_LAKE_PASSAGE)).toBe(false);for(const x of[236,272,306]){passage.reset();expect(passage.update({x,y:981},{x,y:984},HIGHLAND_LAKE_PASSAGE)).toBe(true);}const interior={x:1315,y:240,direction:'left' as const};expect(highlandResumePosition(interior)).toEqual(interior);expect(highlandResumePosition({x:50,y:50})).toEqual(arrival);});
 it('returns to the original lake stairs and permits continued descent',()=>{const point={x:(LAKE_HIGHLAND_RETURN.x+.5)*32,y:(LAKE_HIGHLAND_RETURN.y+.5)*32};expect(lakeStairs(point.x/32,point.y/32)).toBe(true);for(let y=point.y;y<280;y+=2){expect(lakeBlockedPoint(point.x,y)).toBe(false);expect(lakeElevationAllowsStep({x:point.x,y},{x:point.x,y:y+2})).toBe(true);}});
 it('uses prop frames inside their source assets and scales the bridge to both riverbanks',()=>{
  for(const kind of ['bridge','mine'] as const){const bytes=readFileSync(`public/assets/visual/highland/${kind}.png`),frame=HIGHLAND_ART[kind];expect(frame.x+frame.width).toBeLessThanOrEqual(bytes.readUInt32BE(16));expect(frame.y+frame.height).toBeLessThanOrEqual(bytes.readUInt32BE(20));}
  const b=highlandBridgePose()!,row=contour.rows[Math.round(b.y)];expect(b.left).toBeLessThan(row[0][0]-12);expect(b.right).toBeGreaterThan(row[row.length-1][1]+12);expect(b.right-b.left).toBeLessThan(220);expect(Math.hypot(b.left-740,b.y-398)).toBeLessThan(6);expect(Math.hypot(b.right-930,b.y-400)).toBeLessThan(6);
  expect(Math.abs(HIGHLAND_LAKE_PASSAGE.x-(226+317)/2)).toBeLessThanOrEqual(.5);expect(Math.abs(highlandArrivalPosition().x-HIGHLAND_LAKE_PASSAGE.x)).toBeLessThanOrEqual(1);
 });
 it('uses the shifted stairs for fresh/editor arrivals and recovers the former default entry',()=>{
  const map=defaultMap('highland');expect(map.points?.entry).toEqual(HIGHLAND_ENTRY);expect(highlandArrivalPosition(map)).toEqual({x:272,y:944,direction:'up'});
  map.points!.entry={x:7,y:27};expect(highlandArrivalPosition(map).x).toBe(272);map.points!.entry={x:9,y:29};expect(highlandArrivalPosition(map).x).toBe(272);
 });
 it('keeps mining decorations outside the entrance, with movable solid footprints',()=>{
  const map=defaultMap('highland'),barrel=HIGHLAND_OBJECTS.find(o=>o.id==='editor-village-barrel-highland0')!;
  expect(highlandBlockedPoint(barrel.x,barrel.y)).toBe(true);map.objects[barrel.id]={x:34,y:10,kind:barrel.kind};expect(highlandBlockedPoint(barrel.x,barrel.y,map)).toBe(false);expect(highlandBlockedPoint(1104,336,map)).toBe(true);
  for(const o of HIGHLAND_OBJECTS.filter(o=>o.footprint))expect(Math.abs(o.x-highlandMineApproach()!.x)).toBeGreaterThan(60);
 });
 it('persists position and independent edits without changing prior maps',()=>{const save=createNewSave(createCharacterProfile('Serra'));save.activeArea='highland';save.highlandPosition={x:1315,y:240,direction:'up'};const before=structuredClone(save.fishingLakeMapEdits);writeSceneMap(save,'highland',defaultMap('highland'));expect(readSceneMap(save,'highland').area).toBe('highland');expect(save.fishingLakeMapEdits).toEqual(before);expect(validateSave(save)).toBe(true);expect(migrateSave(structuredClone(save))?.highlandPosition).toEqual(save.highlandPosition);save.highlandPosition.x=2000;expect(validateSave(save)).toBe(false);});
});
