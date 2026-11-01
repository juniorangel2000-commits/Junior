import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import contour from '../src/data/homestead-mountain-contour.json';
import {riverBanksAt} from '../src/data/property-water';
import {it,expect} from 'vitest';
import {homesteadPetPath,mountainSolid,mountainSolidTile,mountainFrontAt,mountainPieces,mountainFits,mountainLayout,onHomesteadPetPath} from '../src/data/homestead-landscape';
import {propertyHouseSolidPoint} from '../src/data/property-collision';
import {shelterSolid} from '../src/systems/pet-shelter';
it('curves a connected walkable path around the house to each supported shelter site',()=>{
 for(const site of [{x:960,y:352},{x:896,y:288},{x:1056,y:352},{x:896,y:224}]){
  const path=homesteadPetPath(site);
  expect(path).toHaveLength(65);expect(path.at(-1)).toEqual({x:site.x,y:site.y+18});
  for(const [i,p] of path.entries()){
   expect(propertyHouseSolidPoint(p.x,p.y)).toBe(false);expect(shelterSolid(site,p.x,p.y)).toBe(false);expect(mountainSolid(site,p.x,p.y)).toBe(false);
   if(i)expect(Math.hypot(p.x-path[i-1].x,p.y-path[i-1].y)).toBeLessThan(16);
   expect(onHomesteadPetPath(site,p.x,p.y)).toBe(true);
  }
 }
});
it('keeps the mountain behind the shelter and protects existing construction or prepared tiles',()=>{
 const site={x:960,y:352},plan=mountainLayout(site);
 expect(plan.baseY).toBeLessThanOrEqual(site.y-24);expect(mountainSolid(site,plan.x,plan.baseY-50)).toBe(true);
 expect(mountainSolid(site,site.x,site.y)).toBe(false);expect(mountainSolid(site,plan.x-plan.width/2-64,100)).toBe(false);
 expect(mountainFits(site,[])).toBe(true);expect(mountainFits(site,[{kind:'workbench',x:26,y:5}])).toBe(false);
 expect(mountainFits(site,[],[{x:26,y:5}])).toBe(false);
});

it('keeps the complete mountain image west of the river, not just its collision area',()=>{
 const plan=mountainLayout({x:960,y:352});
 for(let y=0;y<=plan.baseY;y+=8)expect(plan.x+plan.width/2).toBeLessThanOrEqual(riverBanksAt(y).left-48);
});

it('uses a detailed front edge and blocks rock while keeping ground immediately in front walkable',()=>{
 const site={x:960,y:352},plan=mountainLayout(site),edges=[];
 for(let x=64;x<plan.x+plan.width/2;x+=8){
  const edge=mountainFrontAt(site,x);if(!Number.isFinite(edge)||edge<30)continue;
  expect(mountainSolid(site,x,edge-1)).toBe(true);expect(mountainSolid(site,x,edge+1)).toBe(false);edges.push(Math.round(edge));
 }
 expect(new Set(edges).size).toBeGreaterThan(20);
});

it('binds the collision contour to the unchanged original sprite bytes',()=>{
 for(const panel of contour.panels){
  const bytes=readFileSync(new URL('../public/'+panel.file,import.meta.url));
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(panel.sha256);
  expect(panel.front).toHaveLength(Math.ceil(panel.crop.width/panel.columnWidth));
 }
});

it('forms a canyon on both banks while keeping the whole river and bridge approaches clear',()=>{
 const site={x:960,y:352},plan=mountainLayout(site),pieces=mountainPieces(site);
 expect(pieces.some(p=>p.x>1600)).toBe(true);
 for(const piece of pieces)expect(piece.width/piece.art.crop.width).toBeLessThan(.55);
 for(let y=24;y<=plan.baseY;y+=8){const bank=riverBanksAt(y);
  for(let x=bank.left;x<=bank.right;x+=8)expect(mountainSolid(site,x,y)).toBe(false);
 }
 expect(mountainSolid(site,1700,580)).toBe(false);
});

it('blocks partially occupied tiles so animals cannot walk through narrow rock tips',()=>{
 const site={x:960,y:352};let partial=0;
 for(let y=1;y<11;y++)for(let x=1;x<74;x++){
  if(!mountainSolidTile(site,x,y))continue;
  const sample=Array.from({length:8},(_,i)=>mountainSolid(site,x*32+i*4,y*32));
  expect(sample.some(Boolean)).toBe(true);
  if(!mountainSolid(site,x*32+16,y*32+16))partial++;
 }
 expect(partial).toBeGreaterThan(0);
});
