import {it,expect} from 'vitest';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import art from '../public/assets/visual/open-fields/meadow-grass.json';
import {meadowGrassFrame} from '../src/meadow-grass-art';

it('preserva a arte original e recorta 12 poses com a mesma base e escala',()=>{
 const png=fs.readFileSync(`public/${art.file}`),width=png.readUInt32BE(16),height=png.readUInt32BE(20);
 expect(createHash('sha256').update(png).digest('hex')).toBe(art.sha256);expect(art.frames).toHaveLength(12);
 for(const f of art.frames){expect(f.x).toBeGreaterThanOrEqual(0);expect(f.y).toBeGreaterThanOrEqual(0);expect(f.x+art.width).toBeLessThanOrEqual(width);expect(f.y+art.height).toBeLessThanOrEqual(height);}
});
it('alterna as folhas dentro de cada variante, com fases diferentes pelo campo',()=>{
 for(let variant=0;variant<3;variant++){
  const frames=Array.from({length:200},(_,i)=>meadowGrassFrame(variant,i*.05,400,800));
  expect(new Set(frames)).toEqual(new Set([0,1,2,3].map(f=>variant*4+f)));
  expect(frames.every(f=>f>=variant*4&&f<variant*4+4)).toBe(true);
 }
 expect(Array.from({length:20},(_,i)=>meadowGrassFrame(0,i*.1,400,800))).not.toEqual(Array.from({length:20},(_,i)=>meadowGrassFrame(0,i*.1,450,830)));
});
