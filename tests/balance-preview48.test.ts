import {describe,expect,it} from 'vitest';
import {WATER_VIGOR_COST} from '../src/systems/economy';
import {FISH_PRICE,MERCHANTS} from '../src/data/village-commerce';

describe('ajustes de equilíbrio do relatório de três anos (preview.48)',()=>{
 it('rega gasta 1 de vigor por canteiro',()=>expect(WATER_VIGOR_COST).toBe(1));
 it('refeição da pousada custa 60 coroas',()=>expect(MERCHANTS.inn.buy.meal).toBe(60));
 it('peixe comum vale 10 coroas na peixaria e na pousada',()=>{expect(FISH_PRICE).toBe(10);expect(MERCHANTS.fisher.sell.fish).toBe(10);expect(MERCHANTS.inn.sell.fish).toBe(10);});
});
