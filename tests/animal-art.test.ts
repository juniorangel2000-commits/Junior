import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {CHARACTER_DIRECTIONS} from '../src/character-directions';
import {ANIMAL_ART,animalFrame,animalHeadOffset} from '../src/data/animal-art';
import {animalRopeAnchor} from '../src/animal-sprites';
import type Phaser from 'phaser';
import type {AnimalBrain} from '../src/systems/animals';

describe('supplied animal animation assets',()=>{
 it.each(['chicken','cow'] as const)('keeps every original %s PNG and maps all eight poses and walk cycles',kind=>{
  const base=`public/assets/animals/${kind}`;
  const atlas=JSON.parse(fs.readFileSync(`${base}/atlas.json`,'utf8'));
  expect(atlas.frames).toHaveLength(72);expect(atlas.cell).toBe(ANIMAL_ART[kind].cell);
  for(const frame of atlas.frames){
   expect(createHash('sha256').update(fs.readFileSync(`${base}/${frame.file}`)).digest('hex')).toBe(frame.sha256);
   expect(frame.x).toBe((atlas.cell-frame.width)/2);expect(frame.y).toBe((atlas.cell-frame.height)/2);
  }
  for(const [row,direction]of CHARACTER_DIRECTIONS.entries()){
   expect(animalFrame(kind,direction,false,1000)).toBe(row*9);
   const frames=new Set(Array.from({length:8},(_,i)=>animalFrame(kind,direction,true,i*ANIMAL_ART[kind].stride/8)));
   expect([...frames]).toEqual(Array.from({length:8},(_,i)=>row*9+i+1));
   expect(animalFrame(kind,direction,true,ANIMAL_ART[kind].stride)).toBe(row*9+1);
  }
 });
 it.each(['chicken','cow'] as const)('anchors the rope to the %s head for every direction and walking frame',kind=>{
  const atlas=JSON.parse(fs.readFileSync(`public/assets/animals/${kind}/atlas.json`,'utf8'));
  const offsets=new Set();
  for(const f of atlas.frames){
   const h=animalHeadOffset(kind,f.frame),art=ANIMAL_ART[kind];
   const px=h.x/art.scale+f.width/2,py=h.y/art.scale+f.height/2+art.foot;
   expect(Number.isFinite(px)&&Number.isFinite(py)).toBe(true);
   expect(px).toBeGreaterThanOrEqual(0);expect(px).toBeLessThan(f.width);
   expect(py).toBeGreaterThanOrEqual(0);expect(py).toBeLessThan(f.height);
   const sprite={texture:{key:`animal-${kind}-animated`},frame:{name:f.frame},x:500,y:600} as unknown as Phaser.GameObjects.Sprite;
   expect(animalRopeAnchor(sprite,{kind} as AnimalBrain)).toEqual({x:500+h.x,y:600+h.y});
   offsets.add(`${h.x},${h.y}`);
  }
  expect(offsets.size).toBeGreaterThan(16);
  expect(animalHeadOffset(kind,9).x).toBeLessThan(0);expect(animalHeadOffset(kind,18).x).toBeGreaterThan(0);
  expect(animalHeadOffset(kind,27).y).toBeLessThan(animalHeadOffset(kind,0).y);
 });
 it('keeps the head attachment mirrored with the remaining static animal sprites',()=>{
  for(const kind of ['sheep','goat','rabbit','deer'] as const){
   const sprite={texture:{key:'forest-animals-source'},x:500,y:600,displayWidth:40,displayHeight:40,flipX:false} as Phaser.GameObjects.Sprite;
   const right=animalRopeAnchor(sprite,{kind} as AnimalBrain);sprite.flipX=true;const left=animalRopeAnchor(sprite,{kind} as AnimalBrain);
   expect(right.x-500).toBeCloseTo(500-left.x);expect(right.x).toBeGreaterThan(500);expect(left.x).toBeLessThan(500);expect(right.y).toBe(left.y);expect(right.y).toBeLessThan(585);
  }
 });
});
