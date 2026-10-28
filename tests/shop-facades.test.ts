import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {SHOP_FACADES,facadeBlockedPoint,facadeSourceSolid} from '../src/data/shop-facades';
import {VILLAGE_NPCS,VILLAGE_BUILDINGS} from '../src/data/village';
import {merchantDoor} from '../src/systems/merchant-visit';
describe('distinct merchant facades',()=>{
 it('keeps the foot box clear at every main entrance with source-aligned geometry',()=>{
  for(const [id,b] of Object.entries(SHOP_FACADES)){
   const npc=VILLAGE_NPCS.find(n=>n.id===id)!,anchor=VILLAGE_BUILDINGS.find(a=>a.shop===npc.merchantId)!,d=merchantDoor(npc.id);
   for(const [dx,dy]of[[-7,-5],[7,-5],[-7,3],[7,3]])expect(facadeBlockedPoint(b,d.x+dx,d.y+dy,anchor),id).toBe(false);
   const png=readFileSync('public/'+b.file);expect(png.readUInt32BE(16)).toBe(b.width);expect(png.readUInt32BE(20)).toBe(b.height);
  }
 });
 it('keeps the inn side door and workshop garage closed while the personnel doors stay clear',()=>{
  expect(facadeSourceSolid(SHOP_FACADES.helena,1330,870)).toBe(true);
  expect(facadeSourceSolid(SHOP_FACADES.icaro,1000,830)).toBe(true);
  expect(facadeSourceSolid(SHOP_FACADES.helena,330,850)).toBe(false);
  expect(facadeSourceSolid(SHOP_FACADES.icaro,355,823)).toBe(false);
  expect(facadeSourceSolid(SHOP_FACADES.icaro,1000,300)).toBe(false);
 });
 it('preserves the approved carpenter and blacksmith source files byte for byte',()=>{
  const expected={
  "src/data/tobias-shop.ts": "2f978a234a42c48a9962f216d16599a87fd8556c4b3f378ba63a31f028a47e6a",
  "src/tobias-shop.ts": "81392a0a2f52d1d6e89550506b016b2972eafe5910cd9a285e6b8d2bc0f03837",
  "src/blacksmith-house.ts": "164289a0b20b12d0fe28fe5c5f844b76ac2ae337bac28494710516edb37c8d80",
  "public/assets/visual/village/tobias/fachada.png": "75244fe21e2d92b079ec59c400e300d7e26627ccdeb17790e221d962f730e6ac"
};
  for(const [file,sha] of Object.entries(expected))expect(createHash('sha256').update(readFileSync(file)).digest('hex')).toBe(sha);
 });
});
