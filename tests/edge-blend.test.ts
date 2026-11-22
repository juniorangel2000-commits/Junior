import {describe,expect,it} from 'vitest';
import {EDGE_BLEND,EDGE_BLEND_SEGMENT,type EdgeArea} from '../src/data/edge-blend';
import {edgeBlendAlpha,EDGE_BLEND_BAND} from '../src/data/edge-blend-shape';

const strength=(area:EdgeArea,side:'north'|'south'|'west'|'east')=>{
  const code=EDGE_BLEND[area].sides[side];
  if(!code)return [];
  return Array.from({length:code.length/8},(_,i)=>parseInt(code.slice(i*8+6,i*8+8),16)/255);
};

describe('degradê nas bordas dos mapas',()=>{
  it('tem um trecho de cor para cada 96 px de cada borda com vizinho',()=>{
    for(const [area,data] of Object.entries(EDGE_BLEND)){
      for(const [side,code] of Object.entries(data.sides)){
        const length=side==='north'||side==='south'?data.width:data.height;
        expect(code.length,`${area} ${side}`).toBe(Math.ceil(length/EDGE_BLEND_SEGMENT)*8);
        expect(code).toMatch(/^[0-9a-f]+$/);
      }
    }
  });
  it('só mistura bordas que encostam em outro mapa',()=>{
    // A Costa só tem os Campos ao norte; o mar e o resto da borda dão para fora do vale.
    expect(Object.keys(EDGE_BLEND.coast.sides)).toEqual(['north']);
    expect(EDGE_BLEND.railway.sides.east).toBeUndefined();
    expect(EDGE_BLEND.highland.sides.north).toBeUndefined();
    // O Pântano (lama) encosta na Floresta e nos Campos (grama): a mistura ali é forte.
    expect(Math.max(...strength('swamp','east'))).toBeGreaterThan(.6);
    expect(Math.max(...strength('openFields','west'))).toBeGreaterThan(.6);
  });
  it('chega a 50% na divisa e some antes do fim da faixa',()=>{
    for(const along of [0,700,1900])expect(edgeBlendAlpha(1,along,0)).toBeCloseTo(.5);
    for(const along of [0,700,1900])expect(edgeBlendAlpha(1,along,EDGE_BLEND_BAND*1.3)).toBe(0);
    expect(edgeBlendAlpha(.4,300,0)).toBeCloseTo(.2);
    expect(edgeBlendAlpha(0,300,0)).toBe(0);
    for(let d=0;d<EDGE_BLEND_BAND;d+=16)expect(edgeBlendAlpha(1,500,d+16)).toBeLessThanOrEqual(edgeBlendAlpha(1,500,d)+1e-9);
  });
});
