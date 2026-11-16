import {describe,it,expect} from 'vitest';
import {blockMountedEntry,dryStepAllowed,MOUNTED_ENTRY_MESSAGE,CAMP_MOUNTED_MESSAGE} from '../src/riding-guard';
import {INDOOR_SCENES} from '../src/systems/horse-riding';

describe('montado não entra em interiores',()=>{
 it('bloqueia e avisa no máximo a cada 1,5 s; a pé, deixa entrar',()=>{
  const said:string[]=[],ui={toast:(m:string)=>{said.push(m);}};
  expect(blockMountedEntry({mounted:false},ui,10000)).toBe(false);
  expect(blockMountedEntry(undefined,ui,10000)).toBe(false);
  expect(blockMountedEntry({mounted:true},ui,10000)).toBe(true);
  expect(blockMountedEntry({mounted:true},ui,10500)).toBe(true);
  expect(blockMountedEntry({mounted:true},ui,11600)).toBe(true);
  expect(said).toEqual([MOUNTED_ENTRY_MESSAGE,MOUNTED_ENTRY_MESSAGE]);
 });
});
describe('acampamento',()=>{
 it('o cavalo não entra: a passagem avisa e, se chegar montado, o jogador desce',()=>{
  const said:string[]=[];
  expect(blockMountedEntry({mounted:true},{toast:m=>{said.push(m);}},50000,CAMP_MOUNTED_MESSAGE)).toBe(true);
  expect(said).toEqual([CAMP_MOUNTED_MESSAGE]);
  expect(INDOOR_SCENES).toContain('Acampamento');
 });
});
describe('montado ou com a corda, não entra na água',()=>{
 it('seco sempre pode; água só a pé e sem corda',()=>{
  expect(dryStepAllowed(false,0,.8)).toBe(true);
  expect(dryStepAllowed(true,0,0)).toBe(true);
  expect(dryStepAllowed(true,0,.2)).toBe(false);
  expect(dryStepAllowed(true,.1,.3)).toBe(false);
 });
 it('quem já está na água consegue sair para o raso',()=>{
  expect(dryStepAllowed(true,.4,.2)).toBe(true);
  expect(dryStepAllowed(true,.4,0)).toBe(true);
 });
});
