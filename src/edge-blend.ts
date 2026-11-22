import Phaser from 'phaser';
import {EDGE_BLEND,EDGE_BLEND_SEGMENT,type EdgeArea,type EdgeSide} from './data/edge-blend';
import {EDGE_BLEND_BAND,EDGE_BLEND_SCALE as SCALE,edgeBlendAlpha,edgeBlendGrain as grain,type EdgeSegment as Segment,parseEdgeBlend as parse} from './data/edge-blend-shape';

function segmentAt(segments:readonly Segment[],along:number):Segment {
  const f=along/EDGE_BLEND_SEGMENT-.5,i=Math.max(0,Math.min(segments.length-1,Math.floor(f))),j=Math.min(segments.length-1,i+1);
  const t=Math.max(0,Math.min(1,f-i)),a=segments[i],b=segments[j];
  // Um trecho sem vizinho (força 0) não empresta a cor: só a força é interpolada.
  const color=a.strength===0?b:b.strength===0?a:{r:a.r+(b.r-a.r)*t,g:a.g+(b.g-a.g)*t,b:a.b+(b.b-a.b)*t,strength:0};
  return {r:color.r,g:color.g,b:color.b,strength:a.strength+(b.strength-a.strength)*t};
}

/** Desenha, sobre o chão, a transição de cor para o mapa vizinho em cada borda que encosta em
 * outro mapa do vale. Fica abaixo de trilhas, objetos e personagens. */
export function drawEdgeBlend(scene:Phaser.Scene,area:EdgeArea,depth=-96):void {
  const data=EDGE_BLEND[area];
  for(const [side,code] of Object.entries(data.sides) as [EdgeSide,string][]){
    const horizontal=side==='north'||side==='south';
    const length=horizontal?data.width:data.height;
    const band=Math.min(EDGE_BLEND_BAND,Math.floor((horizontal?data.height:data.width)/3));
    const key=`edge-blend-${area}-${side}`;
    if(!scene.textures.exists(key)){
      const segments=parse(code);
      const w=Math.ceil((horizontal?length:band)/SCALE),h=Math.ceil((horizontal?band:length)/SCALE);
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      const context=canvas.getContext('2d');
      // Telas falsas dos testes não pintam pixels; a textura fica vazia e o resto segue igual.
      if(!context||typeof context.createImageData!=='function'){scene.textures.addCanvas(key,canvas);continue;}
      const image=context.createImageData(w,h);
      for(let py=0;py<h;py++)for(let px=0;px<w;px++){
        const along=(horizontal?px:py)*SCALE,across=(horizontal?py:px)*SCALE;
        const fromEdge=side==='north'||side==='west'?across:band-across;
        const s=segmentAt(segments,along);
        const alpha=edgeBlendAlpha(s.strength,along,fromEdge,band,side)*(.9+.2*grain(px,py));
        const i=(py*w+px)*4;
        image.data[i]=s.r;image.data[i+1]=s.g;image.data[i+2]=s.b;image.data[i+3]=Math.round(Math.max(0,Math.min(1,alpha))*255);
      }
      context.putImageData(image,0,0);
      scene.textures.addCanvas(key,canvas)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    const x=side==='east'?data.width-band:0,y=side==='south'?data.height-band:0;
    scene.add.image(x,y,key).setOrigin(0).setDisplaySize(horizontal?length:band,horizontal?band:length)
      .setDepth(depth).setData('no-shadow',true).setData('edge-blend',side);
  }
}
