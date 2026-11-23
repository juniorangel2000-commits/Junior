import {describe,expect,it} from 'vitest';
import {promptWithoutKey} from '../src/prompt-key';

describe('aviso de interação',()=>{
 it('não repete a tecla que já aparece no selo',()=>{
  expect(promptWithoutKey('E · Pegar o trem do Vale','E')).toBe('Pegar o trem do Vale');
  expect(promptWithoutKey('G · Soltar a corda','G')).toBe('Soltar a corda');
  expect(promptWithoutKey('Ponto do trem do Vale','E')).toBe('Ponto do trem do Vale');
  expect(promptWithoutKey('E · Algo',undefined)).toBe('E · Algo');
 });
});
