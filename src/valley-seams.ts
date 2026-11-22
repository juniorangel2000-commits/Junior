import type Phaser from 'phaser';
import {readTerrainSprites,type TerrainSprites} from './terrain-sprites';
import {VALLEY_LAYOUT,VALLEY_SEAM_BAND,valleySeamsOf,valleySeamWeight,type SeamPalette,type ValleyArea} from './data/valley-seams';

const kinds=['forest','grass','meadow','moss'] as const;
const fallback=[[52,87,56],[92,133,51],[125,150,62],[62,104,53]];
const PALETTES:Record<SeamPalette,{weights:readonly number[];tint:readonly number[]}>={
  meadow:{weights:[.52,.29,.10,.09],tint:[1,1,1]},
  marsh:{weights:[.46,.12,.04,.38],tint:[.86,.8,.6]},
};
const mirrored=(value:number,size:number)=>{
  const period=size*2,p=((Math.floor(value)%period)+period)%period;
  return p<size?p:period-p-1;
};
/** Cor do chão compartilhado em coordenadas do vale: dos dois lados da divisa o mesmo ponto
 * do vale dá a mesma cor, então a linha some (como na Floresta com a Propriedade). */
function seamColor(sprites:TerrainSprites|undefined,palette:SeamPalette,gx:number,gy:number,out:number[]):void {
  const {weights,tint}=PALETTES[palette],pocket=Math.sin(gx*.006+gy*.013)*.035+Math.sin(gy*.037+gx*.021)*.025;
  out.fill(0);
  for(let m=0;m<kinds.length;m++){
    const sprite=sprites?.[kinds[m]];
    const weight=weights[m]+(m===0?pocket:m===3?-pocket:0);
    const offset=sprite?(mirrored(gy,sprite.size)*sprite.size+mirrored(gx,sprite.size))*4:0;
    for(let c=0;c<3;c++)out[c]+=(sprite?.pixels[offset+c]??fallback[m][c])*weight;
  }
  for(let c=0;c<3;c++)out[c]*=tint[c];
}

/** Nas bordas que encostam em outro mapa, o chão vai se tornando o mesmo dos dois lados.
 * Fica sobre o chão do mapa e sobre o terreno pintado no F2 (−90), abaixo de objetos e
 * personagens; a água do próprio mapa e os trechos onde trilha, estrada ou rio atravessam
 * ficam como estão. */
export function drawValleySeams(scene:Phaser.Scene,area:ValleyArea,water?:(x:number,y:number)=>boolean,depth=-89):void {
  const own=VALLEY_LAYOUT[area];
  for(const [index,seam] of valleySeamsOf(area).entries()){
    const key=`valley-seam-v1:${area}:${index}`,horizontal=seam.axis==='y';
    const start=Math.max(seam.from,horizontal?own.x:own.y),end=Math.min(seam.to,horizontal?own.x+own.width:own.y+own.height);
    if(end<=start)continue;
    const before=seam.first===area;
    const band=Math.min(VALLEY_SEAM_BAND,Math.floor((horizontal?own.height:own.width)/2));
    // Faixa em coordenadas do próprio mapa.
    const left=horizontal?start-own.x:before?own.width-band:0;
    const top=horizontal?(before?own.height-band:0):start-own.y;
    const width=horizontal?end-start:band,height=horizontal?band:end-start;
    if(!scene.textures.exists(key)){
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      const context=canvas.getContext('2d');
      if(context&&typeof context.createImageData==='function'){
        const image=context.createImageData(width,height),sprites=readTerrainSprites(scene),color=[0,0,0];
        for(let py=0;py<height;py++)for(let px=0;px<width;px++){
          const lx=left+px,ly=top+py,gx=own.x+lx,gy=own.y+ly;
          const along=horizontal?gx:gy,distance=Math.abs((horizontal?gy:gx)-seam.at);
          const weight=valleySeamWeight(seam,along,distance);
          if(weight<=0||water?.(lx+.5,ly+.5))continue;
          seamColor(sprites,seam.palette,gx,gy,color);
          const at=(py*width+px)*4;
          for(let c=0;c<3;c++)image.data[at+c]=color[c];
          image.data[at+3]=Math.round(weight*255);
        }
        context.putImageData(image,0,0);
      }
      scene.textures.addCanvas(key,canvas)?.setFilter(0);
    }
    scene.add.image(left,top,key).setOrigin(0).setDepth(depth).setData('no-shadow',true).setData('valley-seam',seam.second===area?seam.first:seam.second);
  }
}
