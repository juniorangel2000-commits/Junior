import {describe,expect,it} from 'vitest';
import {travelInfo,travelLabel} from '../src/travel-loading';

describe('tela de carregamento entre cenários',()=>{
 it('mostra o lugar de destino com a personagem e a hora do save',()=>{
  expect(travelInfo('Floresta',{profile:{characterId:'luna'} as never,time:1200})).toEqual({character:'luna',area:'forest',time:1200});
  expect(travelInfo('Mina',undefined)?.area).toBe('highland');
  expect(travelLabel('Mina')).toBe('Descendo à mina…');
  expect(travelLabel('Vila')).toBe('Viajando…');
 });
 it('não aparece ao entrar em casa nem no editor',()=>{
  expect(travelInfo('Interior',undefined)).toBeUndefined();
  expect(travelInfo('Editor',undefined)).toBeUndefined();
 });
});
