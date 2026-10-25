import {describe,it,expect} from 'vitest';
import {MapExitPassage} from '../src/systems/map-transition';
import {exitSignLayout} from '../src/data/exit-signs';
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
