import {describe,it,expect} from 'vitest';
import {createNewSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {mountProblem,ownsTamedHorse,INDOOR_SCENES} from '../src/systems/horse-riding';
import {HORSE_ID} from '../src/systems/horse-taming';
import riderLift from '../src/data/horse-rider-lift.json';
import horseAtlas from '../public/assets/animals/horse/atlas.json';
import {RIDER_ORDER,RIDER_ART,riderSheet,riderPose} from '../src/data/horse-rider-art';
import {CHARACTER_DIRECTIONS} from '../src/character-directions';
import {readFileSync} from 'node:fs';
const fresh=()=>createNewSave(createCharacterProfile('Montaria'));
const withHorse=()=>{const s=fresh();s.recruitedAnimals=[HORSE_ID];s.horseTaming={version:1,trust:7,tamed:true,name:'Trovão',lastFedDay:1};s.animalPositions={forest:[],property:[{id:HORSE_ID,x:1200,y:900,direction:'down'}]};return s;};
describe('montaria',()=>{
 it('só monta quem tem o cavalo domado na Propriedade, sem corda',()=>{
  expect(mountProblem(fresh())).toContain('cavalo domado');expect(ownsTamedHorse(fresh())).toBe(false);
  const s=withHorse();expect(mountProblem(s)).toBe('');
  s.animalEscort={id:'forest-cow-1',area:'property'} as never;expect(mountProblem(s)).toContain('corda');
 });
 it('o save aceita montado só com o cavalo na Propriedade',()=>{
  const s=withHorse();s.riding=true;expect(validateSave(s)).toBe(true);
  const t=fresh();t.riding=true;expect(validateSave(t)).toBe(false);
  (s as any).riding=false;expect(validateSave(s)).toBe(false);
 });
 it('cenários fechados fazem descer',()=>{expect(INDOOR_SCENES).toEqual(expect.arrayContaining(['Interior','Mina','Mineracao']));});
});

describe('personagem desenhado montado',()=>{
 it('tem uma célula por direção e acompanha cada quadro do cavalo',()=>{
  expect([...RIDER_ORDER].sort()).toEqual([...CHARACTER_DIRECTIONS].sort());
  expect(riderLift).toHaveLength(horseAtlas.frames.length);
  expect(riderLift.every(n=>Number.isInteger(n))).toBe(true);
  for(const character of RIDER_ART){
   const sheet=riderSheet(character);
   const png=readFileSync('public/'+sheet.file);
   const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
   expect(width).toBe(sheet.width*sheet.columns);
   const poses=CHARACTER_DIRECTIONS.map(direction=>riderPose(character,direction));
   expect(new Set(poses.map(p=>p.frame)).size).toBe(8);
   for(const pose of poses){
    expect(pose.sourceX+sheet.width).toBeLessThanOrEqual(width);
    expect(pose.sourceY+sheet.height).toBeLessThanOrEqual(height);
   }
  }
  // A grade masculina segue a ordem da arte, diferente da ordem do atlas do cavalo.
  expect(riderPose('farmer-male','up').sourceX).toBe(384);
  expect(riderPose('farmer-male','left').sourceX).toBe(768);
  expect(riderPose('farmer-male','right').sourceX).toBe(1152);
  expect(riderPose('farmer-male','down-left').sourceY).toBe(512);
 });
});
