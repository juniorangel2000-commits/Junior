import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { PNG } = createRequire(import.meta.url)('pngjs') as { PNG: { sync: { read(bytes: Buffer): { width: number; height: number; data: Buffer } } } };
import { createHash } from 'node:crypto';
import art from '../public/assets/visual/characters/survivors/walk.json';
import { survivorWalkFrame, SURVIVOR_WALK_CYCLE_DISTANCE, SURVIVOR_WALK_DIRECTIONS } from '../src/data/survivor-walk';

describe('passadas próprias dos sobreviventes', () => {
  it('tem todos os quadros completos, transparentes e distintos em cada direção', () => {
    for (const id of ['marina','rui'] as const) {
      const data = art.characters[id], p = PNG.sync.read(fs.readFileSync('public/'+data.file));
      expect(p.width).toBe(data.columns*256); expect(p.height).toBe(SURVIVOR_WALK_DIRECTIONS.length*256);
      for (const [row, direction] of SURVIVOR_WALK_DIRECTIONS.entries()) {
        const hashes=new Set<string>();
        for (let col=0;col<data.columns;col++) {
          const bytes=Buffer.alloc(256*256*4); let opaque=0,touchesEdge=false;
          for (let y=0;y<256;y++)for(let x=0;x<256;x++) {
            const i=((row*256+y)*p.width+col*256+x)*4;
            p.data.copy(bytes,(y*256+x)*4,i,i+4);
            if(p.data[i+3]) {opaque++;if(x===0||x===255||y===0||y===255)touchesEdge=true;}
          }
          expect(touchesEdge).toBe(false);expect(opaque).toBeGreaterThan(5000); hashes.add(createHash('sha256').update(bytes).digest('hex'));
        }
        expect(hashes.size).toBe(data.columns);
        if (!direction.includes('-')) continue;
        for (let col=0;col<data.columns;col++) {
          const next = (col + 1) % data.columns;
          let changed = 0;
          for (let y=190;y<232;y++) for (let x=0;x<256;x++) {
            const start = ((row*256+y)*p.width+x)*4+3;
            if (p.data[start+col*256*4] !== p.data[start+next*256*4]) changed++;
          }
          // A silhueta das botas muda inclusive entre o último e o primeiro quadro.
          expect(changed).toBeGreaterThan(100);
        }
      }
    }
  });
  it('acompanha a distância da passada original, sem acelerar o personagem de oito quadros', () => {
    expect(SURVIVOR_WALK_CYCLE_DISTANCE).toBe(48);
    for(const id of ['marina','rui'] as const)for(const [row,direction]of SURVIVOR_WALK_DIRECTIONS.entries()) {
      const frames=art.characters[id].columns, seen=new Set<number>();
      for(let distance=0;distance<48;distance+=.5)seen.add(survivorWalkFrame(id,direction,distance));
      expect([...seen].sort((a,b)=>a-b)).toEqual(Array.from({length:frames},(_,i)=>row*frames+i));
      expect(survivorWalkFrame(id,direction,48)).toBe(row*frames);
    }
  });
});
