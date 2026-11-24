import {describe,expect,it} from 'vitest';
import {itemAmount} from '../src/data/item-forms';
import {craftDetailHtml,craftListHtml,maxCraftable,recipeMatches,type CraftRow} from '../src/crafting-view';
import {RECIPES} from '../src/data/recipes';
import {INITIAL_INVENTORY} from '../src/systems/inventory';

const icon=(id:string)=>`<i data-icon="${id}"></i>`;
const cord=RECIPES.find(r=>r.id==='cord')!;
describe('telas de fabricar (preview.49)',()=>{
 it('escreve singular e plural certos',()=>{
  expect(itemAmount('cord',1)).toBe('1 Corda vegetal');expect(itemAmount('cord',3)).toBe('3 Cordas vegetais');
  expect(itemAmount('board',1)).toBe('1 Tábua regular');expect(itemAmount('stone',15)).toBe('15 Pedras');
 });
 it('calcula quantas dá para fazer com a mochila',()=>{
  const inv={...INITIAL_INVENTORY,fiber:20};expect(maxCraftable(cord,inv,false)).toBe(6);expect(maxCraftable(cord,inv,true)).toBe(1);
  expect(maxCraftable(cord,{...INITIAL_INVENTORY,fiber:2},false)).toBe(0);
 });
 it('a busca ignora acentos e maiúsculas',()=>{
  expect(recipeMatches(RECIPES.find(r=>r.name.startsWith('Lâmina'))!,'LAMINA')).toBe(true);
  expect(recipeMatches(cord,'tabua')).toBe(false);expect(recipeMatches(cord,'')).toBe(true);
 });
 it('lista marca o que dá para fazer e o detalhe mostra tenho / preciso',()=>{
  const inv={...INITIAL_INVENTORY,fiber:5};const row:CraftRow={r:cord,learned:true,ready:true,status:'',max:1};
  expect(craftListHtml([row],'cord',icon)).toContain('craft-badge ready');
  const html=craftDetailHtml(row,inv,icon,false);
  expect(html).toContain('<b>5</b> / 3');expect(html).toContain('1 Corda vegetal');
  expect(html).toMatch(/data-craft-count="5" disabled/);
 });
});
