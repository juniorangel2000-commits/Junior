import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {SPRINKLER_FRAMES,SPRINKLER_FRAME_MS} from '../src/village-equipment';
import {ITEMS} from '../src/data/items';
const png=(p:string)=>{const b=readFileSync(p);return{w:b.readUInt32BE(16),h:b.readUInt32BE(20)};};
describe('aspersor automático',()=>{
 it('gira em loop com 14 quadros de 96×72 (sem os quadros parados)',()=>{
  expect(SPRINKLER_FRAMES).toBe(14);expect(SPRINKLER_FRAME_MS).toBe(90);
  const s=png('public/assets/visual/equipment/irrigation-sprinkler-loop.png');expect((s.w/96)*(s.h/72)).toBeGreaterThanOrEqual(SPRINKLER_FRAMES);
  expect(png('public/assets/visual/equipment/irrigation-sprinkler-off.png')).toEqual({w:96,h:72});
 });
 it('o item mantém o id antigo e passa a se chamar aspersor',()=>{expect(ITEMS.waterPump.name).toBe('Aspersor automático');});
});
