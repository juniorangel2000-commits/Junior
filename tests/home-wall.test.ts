import {describe,expect,it} from 'vitest';
import {wallBays} from '../src/home-art';
import {HOME_SIZES,HOME_TILE} from '../src/systems/home';

describe('parede do fundo da casa ampliada',()=>{
 it('cobre a parede inteira sem cortar janela nem quadro no meio',()=>{
  for(const size of HOME_SIZES){const end=size.width*HOME_TILE-33,parts=wallBays(end);let x=0;
   for(const [sx,w,dx] of parts){expect(dx).toBe(x);x+=w;
    if(sx===250)expect(w).toBe(101);if(sx===144)expect(w).toBe(95);}
   expect(x).toBe(end);
   // Nunca dois pilares seguidos nem pilar colado no canto.
   const last=parts[parts.length-1];expect(last[0]).not.toBe(239);
  }
 });
});
