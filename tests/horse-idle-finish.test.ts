import {describe,it,expect} from 'vitest';
import {HorseIdleCycle} from '../src/systems/horse-idle';
const run=(h:HorseIdleCycle,seconds:number)=>{for(let t=0;t<seconds;t+=.05)h.update(.05,true,false,'down',true);};
describe('cavalo domado deixa o que está fazendo para vir até você',()=>{
 it('comendo a cesta: termina a mordida e fica livre em pouco mais de 1 s',()=>{
  const h=new HorseIdleCycle('field-horse-1');h.eatBasket('down');run(h,2);expect(h.phase).toBe('eating');
  h.finish();expect(h.phase).toBe('ending');run(h,1.25);expect(h.locked).toBe(false);
 });
 it('começando a comer: não emenda a refeição',()=>{
  const h=new HorseIdleCycle('field-horse-1');h.eatBasket('up');run(h,.5);expect(h.phase).toBe('starting');
  h.finish();run(h,.9);expect(h.phase).toBe('ending');run(h,1.25);expect(h.locked).toBe(false);
 });
 it('virando ou parado: libera na hora',()=>{
  const h=new HorseIdleCycle('field-horse-1');h.eatBasket('down');expect(h.phase).toBe('turning');h.finish();expect(h.locked).toBe(false);
  const idle=new HorseIdleCycle('field-horse-2');idle.finish();expect(idle.phase).toBe('waiting');
 });
});
