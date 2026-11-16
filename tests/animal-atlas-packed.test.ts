import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {ANIMAL_ART} from '../src/data/animal-art';
/** Atlas compactados (scripts/pack_animal_atlases.py): um quadro para cada célula do atlas
 * original, na mesma célula de origem. O script confere os pixels ao gerar. */
describe('atlas compactados dos animais',()=>{
 for(const kind of Object.keys(ANIMAL_ART) as (keyof typeof ANIMAL_ART)[])it(kind,()=>{
  const dir=`public/assets/animals/${kind}`,packed=JSON.parse(fs.readFileSync(`${dir}/atlas-packed.json`,'utf8')),cell=ANIMAL_ART[kind].cell;
  const png=fs.readFileSync(`${dir}/atlas.png`),w=png.readUInt32BE(16),h=png.readUInt32BE(20),count=(w/cell)*(h/cell);
  expect(packed.meta.cell).toBe(cell);expect(Object.keys(packed.frames)).toHaveLength(count);
  for(let i=0;i<count;i++){const f=packed.frames[String(i)];expect(f.sourceSize).toEqual({w:cell,h:cell});
   expect(f.spriteSourceSize.x+f.spriteSourceSize.w).toBeLessThanOrEqual(cell);expect(f.spriteSourceSize.y+f.spriteSourceSize.h).toBeLessThanOrEqual(cell);}
  const out=fs.readFileSync(`${dir}/atlas-packed.png`);expect(out.readUInt32BE(16)*out.readUInt32BE(20)).toBeLessThan(w*h);
 });
});
