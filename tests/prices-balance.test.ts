import {describe,it,expect} from 'vitest';
import {MERCHANTS} from '../src/data/village-commerce';
import {DISH_RECIPES,dishStation} from '../src/data/kitchen';
import {MACHINE_RECIPES} from '../src/data/machines';
/** Regra de preços da preview.36 (docs/construcoes/PRECOS.md). */
const val=(id:string)=>Math.max(0,...Object.values(MERCHANTS).map(m=>(m.sell as Record<string,number>)[id]??0));
const buy=(id:string)=>Math.min(Infinity,...Object.values(MERCHANTS).map(m=>(m.buy as Record<string,number>)[id]??Infinity));
describe('equilíbrio de preços',()=>{
 it('produto de máquina vale pelo menos 1,3× o que entra',()=>{
  for(const r of MACHINE_RECIPES.filter(r=>!['clayOven','beehive','composter'].includes(r.machine))){
   const input=val(r.input)*r.amount+Object.entries(r.extra??{}).reduce((n,[k,q])=>n+val(k)*(q??0),0);
   expect(val(r.output)*r.quantity,r.id).toBeGreaterThanOrEqual(input*1.3);
  }
 });
 it('prato vale mais que os ingredientes e a lenha: 1,35× no fogão, 1,45× no forno, 1,3× na fogueira',()=>{
  const F={stove:1.35,oven:1.45,campfire:1.3} as const;
  for(const d of DISH_RECIPES){const input=Object.entries(d.ingredients).reduce((n,[k,q])=>n+val(k)*(q??0),0)+val('wood');
   expect(d.price,d.id).toBeGreaterThanOrEqual(Math.floor(input*F[dishStation(d)]/5)*5);expect(val(d.id),d.id).toBe(d.price);}
 });
 it('nenhum produto pode ser comprado mais barato do que é vendido na vila',()=>{
  for(const m of Object.values(MERCHANTS))for(const [id,p] of Object.entries(m.sell))expect(buy(id),id).toBeGreaterThanOrEqual(p as number);
 });
});
