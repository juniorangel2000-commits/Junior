import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {CHARACTERS,characterSourcePaths} from '../src/data/characters';
import {CHARACTER_DIRECTIONS} from '../src/character-directions';
import anchors from '../src/data/character-run-left-hand.json';
describe('uploaded running animation assets',()=>{
 for(const c of CHARACTERS)it(`${c.label} has eight complete directions and matching hand anchors`,()=>{
  const unique=new Set<string>();
  for(const direction of CHARACTER_DIRECTIONS){const paths=characterSourcePaths(c.id,direction,'run');expect(paths).toHaveLength(9);
   for(const path of paths.slice(1)){const data=readFileSync(new URL('../public/'+path,import.meta.url));expect(data.readUInt32BE(16)).toBe(256);expect(data.readUInt32BE(20)).toBe(256);unique.add(path);}
  }
  expect(unique.size).toBe(64);expect(anchors[c.id]).toHaveLength(72);
  for(const[x,y]of anchors[c.id]){expect(x).toBeGreaterThan(40);expect(x).toBeLessThan(210);expect(y).toBeGreaterThan(100);expect(y).toBeLessThan(205);}
 });
});
