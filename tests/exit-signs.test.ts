import {describe,it,expect} from 'vitest';
import {exitSignLayout} from '../src/data/exit-signs';
describe('placas de continuação',()=>{
 it('indica a saída exata dos dois mapas novos sem ocupar a passagem',()=>{
  const property=exitSignLayout({x:1,y:52},{x:2,y:52}),forest=exitSignLayout({x:94,y:46},{x:93,y:46});
  expect(property.direction).toBe('left');expect(forest.direction).toBe('right');
  expect(Math.floor(property.y/32)).not.toBe(52);expect(Math.floor(forest.y/32)).not.toBe(46);
 });
 it('acompanha portais verticais e mantém a placa inteira dentro dos limites do mapa',()=>{
  expect(exitSignLayout({x:48,y:1},{x:48,y:2}).direction).toBe('up');expect(exitSignLayout({x:48,y:70},{x:48,y:69}).direction).toBe('down');
  for(const exit of [{x:1,y:1},{x:94,y:1},{x:1,y:70},{x:94,y:70}]){
   const p=exitSignLayout(exit);expect(p.x).toBeGreaterThanOrEqual(32);expect(p.x).toBeLessThanOrEqual(3040);expect(p.y).toBeGreaterThanOrEqual(68);expect(p.y).toBeLessThanOrEqual(2288);
  }
 });
});
