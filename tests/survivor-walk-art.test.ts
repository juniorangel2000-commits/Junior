import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { PNG } = createRequire(import.meta.url)('pngjs') as { PNG: { sync: { read(bytes: Buffer): { width: number; height: number; data: Buffer } } } };
import { createHash } from 'node:crypto';
import art from '../public/assets/visual/characters/survivors/walk.json';
import { survivorWalkFrame, SURVIVOR_WALK_CYCLE_DISTANCE } from '../src/data/survivor-walk';

describe('passadas próprias dos sobreviventes', () => {
  it('tem todos os quadros completos, transparentes e distintos em cada direção', () => {
    for (const id of ['marina','rui'] as const) {
      const data = art.characters[id], p = PNG.sync.read(fs.readFileSync('public/'+data.file));
      expect(p.width).toBe(data.columns*256); expect(p.height).toBe(4*256);
      for (let row=0;row<4;row++) {
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
      }
    }
  });
  it('acompanha a distância da passada original, sem acelerar o personagem de oito quadros', () => {
    expect(SURVIVOR_WALK_CYCLE_DISTANCE).toBe(48);
    for(const id of ['marina','rui'] as const)for(const [row,direction]of ['down','up','right','left'].entries()) {
      const frames=art.characters[id].columns, seen=new Set<number>();
      for(let distance=0;distance<48;distance+=.5)seen.add(survivorWalkFrame(id,direction as 'down',distance));
      expect([...seen].sort((a,b)=>a-b)).toEqual(Array.from({length:frames},(_,i)=>row*frames+i));
      expect(survivorWalkFrame(id,direction as 'down',48)).toBe(row*frames);
    }
  });
});
