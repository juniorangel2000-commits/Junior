/** Posição de cada mapa externo no vale (px, com a Propriedade em 0,0) e as divisas entre eles.
 * A montagem vem das saídas ligadas: veja docs/cenarios/MAPA-DO-VALE.md. */
export type ValleyArea='property'|'village'|'forest'|'fishingLake'|'cityForest'|'ruins'|'railway'|'highland'|'survivorCamp'|'swamp'|'openFields'|'coast';
const W=3072,H=2304,T=32;
export const VALLEY_LAYOUT:Readonly<Record<ValleyArea,{readonly x:number;readonly y:number;readonly width:number;readonly height:number}>>={
  property:{x:0,y:0,width:W,height:H},
  village:{x:W,y:0,width:W,height:H},
  forest:{x:-W,y:0,width:W,height:H},
  fishingLake:{x:0,y:-H,width:W,height:H},
  cityForest:{x:W,y:-H,width:W,height:H},
  ruins:{x:2*W,y:-H+6*T,width:W,height:H},
  railway:{x:3*W,y:-H+6*T,width:W,height:H},
  highland:{x:1462-925,y:-H-1024,width:1536,height:1024},
  survivorCamp:{x:-W-13*T,y:-H,width:W,height:H},
  swamp:{x:-W,y:H,width:W,height:H},
  openFields:{x:0,y:H,width:W,height:H},
  coast:{x:0,y:2*H,width:W,height:H},
};

/** Paleta do chão compartilhado na divisa: `meadow` é a mesma da Floresta com a Propriedade;
 * `marsh` puxa para musgo e lama, onde um dos lados é o Pântano. */
export type SeamPalette='meadow'|'marsh';
/** Uma divisa. `axis:'y'`: linha horizontal em y=`at`, de x=`from` a `to`, com `first` ao norte.
 * `axis:'x'`: linha vertical em x=`at`, de y=`from` a `to`, com `first` a oeste. `open` são os
 * trechos (coordenada ao longo da divisa) onde trilha, estrada ou rio atravessam: ali cada lado
 * mantém o próprio chão, que já está alinhado com o do vizinho. */
export type ValleySeam={readonly first:ValleyArea;readonly second:ValleyArea;readonly axis:'x'|'y';readonly at:number;readonly from:number;readonly to:number;readonly palette:SeamPalette;readonly open:readonly (readonly [number,number])[]};

/** A divisa Floresta ↔ Propriedade já tem o chão compartilhado próprio (map-seam-ground). */
export const VALLEY_SEAMS:readonly ValleySeam[]=[
  {first:'fishingLake',second:'property',axis:'y',at:0,from:0,to:W,palette:'meadow',open:[[1350,1550],[2336,2496]]},
  {first:'property',second:'openFields',axis:'y',at:H,from:0,to:W,palette:'meadow',open:[[1310,1490],[736,896]]},
  {first:'openFields',second:'coast',axis:'y',at:2*H,from:0,to:W,palette:'meadow',open:[[440,590],[832,992]]},
  {first:'forest',second:'swamp',axis:'y',at:H,from:-W,to:0,palette:'marsh',open:[[-2560,-2400]]},
  {first:'survivorCamp',second:'forest',axis:'y',at:0,from:-W,to:-13*T,palette:'meadow',open:[[-2016,-1856]]},
  {first:'cityForest',second:'village',axis:'y',at:0,from:W,to:2*W,palette:'meadow',open:[[4560,4768]]},
  {first:'highland',second:'fishingLake',axis:'y',at:-H,from:1462-925,to:1462-925+1536,palette:'meadow',open:[[1340,1590],[660,930]]},
  {first:'property',second:'village',axis:'x',at:W,from:0,to:H,palette:'meadow',open:[[1600,1760]]},
  {first:'fishingLake',second:'cityForest',axis:'x',at:W,from:-H,to:0,palette:'meadow',open:[[-1312,-1152]]},
  {first:'cityForest',second:'ruins',axis:'x',at:2*W,from:-H+6*T,to:0,palette:'meadow',open:[[-2112,-1824]]},
  {first:'village',second:'ruins',axis:'x',at:2*W,from:0,to:6*T,palette:'meadow',open:[]},
  {first:'ruins',second:'railway',axis:'x',at:3*W,from:-H+6*T,to:6*T,palette:'meadow',open:[[-2112,-1824]]},
  {first:'swamp',second:'openFields',axis:'x',at:0,from:H,to:2*H,palette:'marsh',open:[]},
];
export const VALLEY_SEAM_BAND=256;

const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
/** Peso do chão compartilhado a `distance` px da divisa: inteiro junto à linha (com uma borda
 * interna ondulada), sumindo até o fim da faixa; zero nos trechos abertos. */
export function valleySeamWeight(seam:ValleySeam,along:number,distance:number):number {
  const inner=78+Math.sin(along*.011)*14+Math.sin(along*.031)*5;
  let weight=1-smooth((distance-inner)/(VALLEY_SEAM_BAND-inner));
  for(const [a,b] of seam.open){
    const outside=along<a?a-along:along>b?along-b:0;
    weight*=smooth(outside/40);
  }
  return weight;
}
export const valleySeamsOf=(area:ValleyArea)=>VALLEY_SEAMS.filter(s=>s.first===area||s.second===area);
