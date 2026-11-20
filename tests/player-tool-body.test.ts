import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {PNG}=createRequire(import.meta.url)('pngjs');
import {CHARACTER_DIRECTIONS} from '../src/character-directions';
import {playerToolMotion,type BodyTool} from '../src/data/player-tool-motion';
import art from '../public/assets/visual/characters/player-tool-body.json';

describe('corpo e ferramenta separados durante o trabalho',()=>{
 it('mantém tamanho e espelhamento da ferramenta em todo o ciclo, inclusive diagonais',()=>{
  for(const tool of ['hoe','shovel','sickle','water'] as BodyTool[])for(const direction of CHARACTER_DIRECTIONS){
   const poses=Array.from({length:9},(_,frame)=>playerToolMotion(tool,direction,frame));
   expect(new Set(poses.map(p=>p.scale)).size).toBe(1);
   expect(new Set(poses.map(p=>p.flipX)).size).toBe(1);
   expect(poses.at(-1)?.pose).toBe(5);
   expect(poses[0].hand).toEqual(poses[8].hand);
   expect(poses.every(p=>Number.isFinite(p.angle)&&p.frame>=0&&p.frame<24)).toBe(true);
  }
 });
 it('usa só as vistas laterais, com golpe da enxada espelhado e contato no chão',()=>{
  for(const direction of CHARACTER_DIRECTIONS)expect([2,3]).toContain(playerToolMotion('hoe',direction,4).row);
  expect(playerToolMotion('hoe','down',4)).toEqual(playerToolMotion('hoe','right',4));
  expect(playerToolMotion('hoe','up-left',4)).toEqual(playerToolMotion('hoe','left',4));
  const contact=playerToolMotion('hoe','right',4);
  expect(-Math.cos(contact.angle*Math.PI/180)).toBeGreaterThan(0);
  expect(Math.sin(contact.angle*Math.PI/180)).toBeGreaterThan(0);
  for(let frame=0;frame<9;frame++)expect(playerToolMotion('hoe','left',frame).angle).toBe(-playerToolMotion('hoe','right',frame).angle);
 });
 it('não levanta foice ou regador sobre a cabeça nem gira novamente o jato autoral',()=>{
  for(const direction of CHARACTER_DIRECTIONS)for(let frame=0;frame<9;frame++){
   expect(playerToolMotion('sickle',direction,frame).pose).not.toBe(2);
   expect(playerToolMotion('shovel',direction,frame).pose).not.toBe(2);
   const water=playerToolMotion('water',direction,frame);
   expect(water.pose).not.toBe(2);expect(water.angle).toBe(0);
  }
 });
 it('mantém folhas nativas de seis poses por quatro vistas com mãos dentro do recorte',()=>{
  for(const character of Object.values(art.characters)){
   const png=PNG.sync.read(readFileSync('public/'+character.file));
   expect([png.width,png.height]).toEqual([1536,1024]);
   expect(character.rows).toHaveLength(4);
   for(const row of character.rows)expect(row.originY).toBeGreaterThan(.8);
  }
  expect(playerToolMotion('hoe','up',NaN).frame).toBe(12);
  expect(playerToolMotion('hoe','down',99).frame).toBe(17);
 });
});
