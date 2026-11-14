import {it,expect} from 'vitest';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {ANIMAL_ART,animalFrame,animalHeadOffset} from '../src/data/animal-art';
import {AnimalWalkCycle} from '../src/systems/animal-animation';
import {CHARACTER_DIRECTIONS} from '../src/character-directions';
it.each(['sheep','goat'] as const)('%s: oito direções e ciclo de quatro poses com contato e passagem, compatível com o controle existente',kind=>{
 const base=`public/assets/animals/${kind}`,book=JSON.parse(fs.readFileSync(`${base}/atlas.json`,'utf8')),png=fs.readFileSync(`${base}/atlas.png`);
 expect(book.sha256).toBe(createHash('sha256').update(fs.readFileSync(`${base}/source.png`)).digest('hex'));
 expect(book.directions).toEqual([...CHARACTER_DIRECTIONS]);expect(book.frames).toHaveLength(72);expect(book.walkPoses).toBe(4);
 expect(png.readUInt32BE(16)).toBe(ANIMAL_ART[kind].cell*9);expect(png.readUInt32BE(20)).toBe(ANIMAL_ART[kind].cell*8);
 for(const[row,direction]of CHARACTER_DIRECTIONS.entries()){
  expect(animalFrame(kind,direction,false,0)).toBe(row*9);
  const poses=book.frames.slice(row*9+1,row*9+9).map((f:{pose:number})=>f.pose);expect(poses).toEqual([1,1,2,2,3,3,4,4]);
  for(let i=0;i<9;i++){const frame=book.frames[row*9+i];expect(frame.x).toBeGreaterThanOrEqual(0);expect(frame.y).toBeGreaterThanOrEqual(0);expect(frame.x+frame.source.width).toBeLessThanOrEqual(book.cell);expect(frame.y+frame.source.height).toBeLessThanOrEqual(book.cell);const head=animalHeadOffset(kind,row*9+i);expect(Math.abs(head.x)).toBeLessThan(35);expect(head.y).toBeLessThan(0);}
  const cycle=new AnimalWalkCycle(kind);let distance=0;const frames=new Set<number>();for(let i=0;i<60;i++){distance+=1.4;cycle.advance(.04,true,distance);frames.add(cycle.frame(direction));}expect(frames.size).toBeGreaterThan(3);
  cycle.advance(.1,false,distance);cycle.advance(.1,false,distance);expect(cycle.frame(direction)).toBe(row*9);
 }
});
