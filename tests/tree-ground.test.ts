import {describe,it,expect} from 'vitest';
import {treeGroundClear,isTreeKind} from '../src/systems/tree-ground';
import {isWaterPoint} from '../src/data/property-water';
import {TILE} from '../src/data/world-size';

describe('árvores em terra firme',()=>{
 it('recusa água nas quinas de uma célula que tenha o centro seco',()=>{
   expect(treeGroundClear(10,10,(x,y)=>x<10*TILE+8&&y<10*TILE+8)).toBe(false);
   expect(treeGroundClear(10,10,()=>false)).toBe(true);
   expect(treeGroundClear(10,10,()=>true)).toBe(false);
 });
 it('exige o mesmo solo seco para as seis espécies do atlas e as árvores antigas',()=>{
   for(const kind of ['standingTree','pine','oakA','oakB','oakC','pineA','pineB','pineC'])expect(isTreeKind(kind)).toBe(true);
   for(const kind of ['stone','fallenLog','stump','lakeRockA',undefined])expect(isTreeKind(kind)).toBe(false);
 });
 it('detecta as margens curvas do rio e dos dois lagos em vez de confiar só no centro',()=>{
   let partial=0;
   for(let y=1;y<71;y++)for(let x=1;x<95;x++)if(!isWaterPoint((x+.5)*TILE,(y+.5)*TILE)&&!treeGroundClear(x,y,isWaterPoint))partial++;
   expect(partial).toBeGreaterThan(80);
   expect(treeGroundClear(36,30,isWaterPoint)).toBe(false);
   expect(treeGroundClear(25,18,isWaterPoint)).toBe(true);
 });
});
