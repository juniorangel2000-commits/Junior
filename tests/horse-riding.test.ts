import {describe,it,expect} from 'vitest';
import {createNewSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {mountProblem,ownsTamedHorse,INDOOR_SCENES} from '../src/systems/horse-riding';
import {HORSE_ID} from '../src/systems/horse-taming';
import riderLift from '../src/data/horse-rider-lift.json';
import horseAtlas from '../public/assets/animals/horse/atlas.json';
import {RIDER_ORDER,RIDER_ART,riderFile,riderPose,frontHeadFrame,FRONT_HEAD_PLACEMENT} from '../src/data/horse-rider-art';
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
   const png=readFileSync('public/'+riderFile(character));
   const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
   const poses=CHARACTER_DIRECTIONS.map(direction=>riderPose(character,direction));
   expect(new Set(poses.map(p=>p.frame)).size).toBe(8);
   for(const pose of poses){
    expect(pose.sourceX+pose.width).toBeLessThanOrEqual(width);
    expect(pose.sourceY+pose.height).toBeLessThanOrEqual(height);
   }
  }
  // A ordem da arte difere da ordem do atlas do cavalo nas vistas principais.
  expect(riderPose('farmer-male','up').frame).toBe(1);
  expect(riderPose('farmer-male','left').frame).toBe(2);
  expect(riderPose('farmer-male','right').frame).toBe(3);
  expect(riderPose('farmer-male','down').height).toBeGreaterThan(512);
 });

 it('cobre cada quadro frontal do cavalo parado, ao passo e no galope',()=>{
  const expected=[0,1,2,3,4,5,6,7,8,112,113,114,115,116,117,118,119];
  expect(FRONT_HEAD_PLACEMENT.frames).toEqual(expected);
  expect(expected.map(frontHeadFrame)).toEqual(expected.map((_,index)=>index));
  expect(frontHeadFrame(9)).toBe(-1);
  const png=readFileSync('public/assets/animals/horse-rider/horse-head-male.png');
  const {width,height,columns}=FRONT_HEAD_PLACEMENT;
  expect(png.readUInt32BE(16)).toBe(width*columns);
  expect(png.readUInt32BE(20)).toBe(height*Math.ceil(expected.length/columns));
 });
});
