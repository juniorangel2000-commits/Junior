import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import silhouettes from '../src/data/village-building-silhouettes.json';
import {villageTallGrassPositions,villageGrassClearOfWater,villageGrassClearOfPaths} from '../src/village-greenery';
import {VILLAGE_BUILDINGS,VILLAGE_TREES,VILLAGE_SHORE_DETAILS,villagePathEdge,villageWaterPoint} from '../src/data/village';
import {villageBuildingArtBands,villageArtRectsOverlap} from '../src/data/village-building-art';
import {VILLAGE_PIER,VILLAGE_PIER_ACCESS,villagePierAccessDistance} from '../src/data/village-pier';
import type {MapEditData} from '../src/systems/map-editor';

describe('dense planting in free village pockets',()=>{
 it('keeps lake scenery free of reeds and tall vegetation',()=>{
  expect(VILLAGE_SHORE_DETAILS.length).toBeGreaterThan(0);
  expect(VILLAGE_SHORE_DETAILS.every(p=>p.kind==='shoreStones')).toBe(true);
 });
 it('measures silhouettes from the current untouched source art',()=>{
  for(const [file,profile] of Object.entries(silhouettes)){
   const source=readFileSync('public/'+file);
   expect(createHash('sha256').update(source).digest('hex')).toBe(profile.sha256);
   for(const [left,top,right,bottom] of profile.bands){
    expect(left).toBeLessThan(right);expect(top).toBeLessThan(bottom);
    expect(right).toBeLessThanOrEqual(source.readUInt32BE(16));expect(bottom).toBeLessThanOrEqual(source.readUInt32BE(20));
   }
  }
 });
 it('adds abundant grass while keeping its whole sprite outside paving, water and buildings',()=>{
  const positions=villageTallGrassPositions(),bands=VILLAGE_BUILDINGS.flatMap(villageBuildingArtBands);
  expect(positions.length).toBeGreaterThanOrEqual(150);
  for(const p of positions){
   const x=(p.x+.5)*32,y=p.y*32+25,rect={left:x-24,top:y-42,right:x+24,bottom:y};
   expect(bands.some(b=>villageArtRectsOverlap(rect,b))).toBe(false);
   for(const dx of [-24,24])for(const dy of [-42,0]){
    expect(villagePathEdge((x+dx)/32-.5,(y+dy)/32-.5)).toBeGreaterThan(.2);
    expect(villageWaterPoint(x+dx,y+dy)).toBe(false);
   }
  }
 });
 it('rejects a moita when only an upper corner overlaps water painted by the player',()=>{
  const p=villageTallGrassPositions()[0],x=(p.x+.5)*32,y=p.y*32+25;
  const centre=`${Math.floor(x/32)},${Math.floor(y/32)}`;
  const corner=`${Math.floor((x-24)/32)},${Math.floor((y-42)/32)}`;
  expect(corner).not.toBe(centre);
  const edits:MapEditData={version:1,area:'village',width:96,height:72,terrain:{[corner]:'water'},objects:{}};
  expect(edits.terrain[centre]).toBeUndefined();
  expect(villageGrassClearOfWater(p.x,p.y,edits)).toBe(false);
  edits.terrain[corner]='paving';expect(villageGrassClearOfPaths(p.x,p.y,edits)).toBe(false);
  edits.terrain[corner]='grass';expect(villageGrassClearOfPaths(p.x,p.y,edits)).toBe(true);
 });
 it('keeps irregular mixed groves clear of building silhouettes and without duplicate roots',()=>{
  const bands=VILLAGE_BUILDINGS.flatMap(villageBuildingArtBands);
  expect(VILLAGE_TREES.length).toBeGreaterThanOrEqual(200);
  expect(new Set(VILLAGE_TREES.map(t=>`${t.x},${t.y}`)).size).toBe(VILLAGE_TREES.length);
  expect(new Set(VILLAGE_TREES.map(t=>t.kind)).size).toBe(6);
  for(const p of VILLAGE_TREES){
   const x=(p.x+.5)*32,y=p.y*32+25;
   expect(bands.some(b=>villageArtRectsOverlap({left:x-88,right:x+88,top:y-211,bottom:y+6},b))).toBe(false);
  }
 });
 it('centres and tapers the stone access so both curbs fit the pier entrance',()=>{
  const p=VILLAGE_PIER_ACCESS;
  expect(p.centerY).toBe(VILLAGE_PIER.y+(VILLAGE_PIER.deckTop+VILLAGE_PIER.deckBottom)/2);
  expect(p.endHalfWidth+6).toBeLessThanOrEqual((VILLAGE_PIER.deckBottom-VILLAGE_PIER.deckTop)/2);
  expect(p.endX).toBeGreaterThan(VILLAGE_PIER.x);
  expect(villagePierAccessDistance(p.endX-2,p.centerY)).toBeLessThan(0);
  expect(villagePierAccessDistance(p.endX-2,p.centerY+20)).toBeGreaterThan(0);
 });
});
