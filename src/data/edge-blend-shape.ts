import type {EdgeSide} from './edge-blend';

/** Largura da faixa de transição (px) e redução da textura: a mistura é suave, então uma
 * textura 4× menor ampliada com filtro linear basta e economiza memória. */
export const EDGE_BLEND_BAND=352;
export const EDGE_BLEND_SCALE=4;
export type EdgeSegment={r:number;g:number;b:number;strength:number};
export const parseEdgeBlend=(code:string):EdgeSegment[]=>Array.from({length:code.length/8},(_,i)=>{
  const hex=(at:number)=>parseInt(code.slice(i*8+at,i*8+at+2),16);
  return {r:hex(0),g:hex(2),b:hex(4),strength:hex(6)/255};
});
const smooth=(t:number)=>{const v=Math.max(0,Math.min(1,t));return v*v*(3-2*v);};
export const edgeBlendGrain=(x:number,y:number)=>{const h=Math.sin(x*12.9898+y*78.233)*43758.5453;return h-Math.floor(h);};

/** Opacidade da mistura num ponto: 50% na divisa (vezes a força do trecho), sumindo para dentro
 * com uma borda ondulada, para não parecer uma faixa reta. Exportada para os testes. */
export function edgeBlendAlpha(strength:number,along:number,fromEdge:number,band=EDGE_BLEND_BAND,side:EdgeSide='north'):number {
  const phase=side.length*1.7;
  const wave=.14*Math.sin(along*.0094+phase)+.08*Math.sin(along*.031+phase*2.1);
  const u=fromEdge/band+wave*smooth(fromEdge/(band*.35));
  return .5*strength*(1-smooth(u));
}

