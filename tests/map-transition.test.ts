import {describe,it,expect} from 'vitest';
import {DoorwayPassage,MapExitPassage,SCENE_FADE_MS} from '../src/systems/map-transition';
import {exitSignLayout} from '../src/data/exit-signs';
import {HOME_OUTDOOR_DOORWAY,HOME_INTERIOR_DOORWAY,HOME_OUTDOOR_SPAWN,HOME_SPAWN} from '../src/systems/home';
describe('troca automática ao ultrapassar a placa',()=>{
 const exit={x:1,y:52},entry={x:2,y:52},y=52.5*32;
 it('não troca parado, ao apertar interagir ou ao chegar exatamente à linha',()=>{
  const passage=new MapExitPassage();expect(passage.update({x:80,y},{x:80,y},exit,entry)).toBe(false);
  expect(passage.update({x:80,y},{x:64,y},exit,entry)).toBe(false);
  expect(passage.update({x:64,y},{x:63,y},exit,entry)).toBe(true);
  expect(exitSignLayout(exit,entry).x).toBe(64);
 });
 it('só aceita a passagem marcada e um passo na direção da seta',()=>{
  const passage=new MapExitPassage();
  expect(passage.update({x:70,y:500},{x:60,y:500},exit,entry)).toBe(false);
  expect(passage.update({x:60,y:y-33},{x:60,y},exit,entry)).toBe(false);
  expect(passage.update({x:60,y},{x:61,y},exit,entry)).toBe(false);
  expect(passage.update({x:61,y},{x:60,y},exit,entry)).toBe(true);
 });
 it('permite esperar pelo animal e desarma ao voltar para dentro do mapa',()=>{
  const passage=new MapExitPassage();expect(passage.update({x:65,y},{x:63,y},exit,entry)).toBe(true);
  expect(passage.update({x:63,y},{x:63,y},exit,entry)).toBe(true);
  expect(passage.update({x:63,y},{x:65,y},exit,entry)).toBe(false);
  passage.reset();expect(passage.update({x:63,y},{x:63,y},exit,entry)).toBe(false);
 });
 it('não devolve automaticamente o jogador nos pontos de chegada dos dois mapas',()=>{
  const passage=new MapExitPassage();
  expect(passage.update({x:80,y},{x:80,y},exit,entry)).toBe(false);
  expect(passage.update({x:2992,y:1488},{x:2992,y:1488},{x:94,y:46},{x:93,y:46})).toBe(false);
  expect(passage.update({x:2992,y:1488},{x:3009,y:1488},{x:94,y:46},{x:93,y:46})).toBe(true);
  expect(exitSignLayout({x:94,y:46},{x:93,y:46}).x).toBe(3008);
 });
 it('acompanha passagens movidas no editor, incluindo norte e sul',()=>{
  const passage=new MapExitPassage();
  expect(passage.update({x:336,y:380},{x:336,y:383},{x:10,y:12},{x:10,y:11})).toBe(false);
  expect(passage.update({x:336,y:383},{x:336,y:385},{x:10,y:12},{x:10,y:11})).toBe(true);
  passage.reset();expect(passage.update({x:336,y:418},{x:336,y:415},{x:10,y:12},{x:10,y:13})).toBe(true);
 });
});

describe('portas automáticas da casa',()=>{
 it('entra apenas por um passo para dentro da faixa da porta',()=>{
  const passage=new DoorwayPassage(),door=HOME_OUTDOOR_DOORWAY;
  expect(passage.update({x:door.x,y:door.y+8},{x:door.x,y:door.y+8},door)).toBe(false);
  expect(passage.update({x:door.x,y:door.y+2},{x:door.x,y:door.y},door)).toBe(false);
  expect(passage.update({x:door.x,y:door.y+2},{x:door.x,y:door.y-1},door)).toBe(true);
  expect(passage.update({x:door.x,y:door.y-1},{x:door.x,y:door.y-1},door)).toBe(true);
 });
 it('não entra pela lateral, pelos fundos ou andando para fora',()=>{
  const passage=new DoorwayPassage(),door=HOME_OUTDOOR_DOORWAY;
  expect(passage.update({x:door.x+25,y:door.y+1},{x:door.x+25,y:door.y-1},door)).toBe(false);
  expect(passage.update({x:door.x+25,y:door.y-1},{x:door.x,y:door.y-1},door)).toBe(false);
  expect(passage.update({x:door.x,y:door.y-70},{x:door.x,y:door.y-72},door)).toBe(false);
  expect(passage.update({x:door.x,y:door.y-2},{x:door.x,y:door.y-1},door)).toBe(false);
 });
 it('não retorna parado ao chegar, salvar ou recarregar perto das portas',()=>{
  const passage=new DoorwayPassage();
  expect(passage.update(HOME_SPAWN,HOME_SPAWN,HOME_INTERIOR_DOORWAY)).toBe(false);
  expect(passage.update(HOME_OUTDOOR_SPAWN,HOME_OUTDOOR_SPAWN,HOME_OUTDOOR_DOORWAY)).toBe(false);
  const saved={x:HOME_OUTDOOR_DOORWAY.x,y:HOME_OUTDOOR_DOORWAY.y-3};
  expect(passage.update(saved,saved,HOME_OUTDOOR_DOORWAY)).toBe(false);
  expect(passage.update(saved,{...saved,y:saved.y-1},HOME_OUTDOOR_DOORWAY)).toBe(true);
  passage.reset();expect(passage.update(saved,saved,HOME_OUTDOOR_DOORWAY)).toBe(false);
 });
 it('sai somente andando para baixo no vão interno e desarma ao retornar',()=>{
  const passage=new DoorwayPassage(),door=HOME_INTERIOR_DOORWAY;
  expect(passage.update({x:door.x,y:door.y-1},{x:door.x,y:door.y+1},door)).toBe(true);
  expect(passage.update({x:door.x,y:door.y+1},{x:door.x,y:door.y-1},door)).toBe(false);
  expect(passage.update({x:door.x-40,y:door.y-1},{x:door.x-40,y:door.y+1},door)).toBe(false);
  expect(SCENE_FADE_MS).toBeLessThan(250);
 });
});
