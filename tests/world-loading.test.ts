import {describe,it,expect} from 'vitest';
import {AREA_NAMES} from '../src/data/area-names';
import {loadingStep,loadingPeriod,LOADING_TIPS,LOADING_PLACES} from '../src/world-loading';

describe('tela de carregamento',()=>{
 it('o passo da viagem acompanha o progresso',()=>{
  expect([0,.3,.6,.95].map(loadingStep)).toEqual(['Selando o cavalo…','Seguindo pela trilha…','Passando pela porteira…','Quase chegando…']);
 });
 it('a cor do céu segue a hora do dia',()=>{
  expect([3*60,7*60,12*60,18*60,22*60,undefined].map(loadingPeriod)).toEqual(['night','morning','day','evening','night','day']);
 });
 it('tem dicas e o nome de todos os lugares ao ar livre',()=>{
  expect(LOADING_TIPS.length).toBeGreaterThanOrEqual(8);
  for(const area of ['property','forest','village','cityForest','fishingLake','openFields','highland','survivorCamp'])expect(LOADING_PLACES[area]).toBeTruthy();
 });
});

describe('nomes dos lugares',()=>{
 it('seguem a lista escolhida pelo Junior',()=>{
  expect(AREA_NAMES).toEqual({property:'Propriedade Abandonada',forest:'Floresta Antiga',village:'Vila',cityForest:'Estrada da Cidade',fishingLake:'Lago da Cachoeira',
   openFields:'Campos Abertos',highland:'Platô da Nascente',survivorCamp:'Acampamento dos Sobreviventes',mine:'Mina Antiga'});
 });
});
