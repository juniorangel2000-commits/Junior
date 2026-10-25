import { forestClearing, forestPathDistance, forestWaterDistanceAt } from './data/ancient-forest';
import type { TerrainSprites } from './terrain-sprites';

const materials = ['forest', 'meadow', 'path-dry', 'water'] as const;
const fallback = [[65,101,49], [125,150,62], [177,137,85], [60,135,143]];
const smooth = (v:number):number => {const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
const cells = new Map<string,number>();
function materialAt(x:number,y:number):number {
  const key=`${x},${y}`;let value=cells.get(key);
  if(value===undefined){value=forestPathDistance(x,y)<1.5&&!(y>=60&&x>=44&&x<=52)?2:forestClearing(x,y)?1:0;cells.set(key,value);}
  return value;
}

/** World-space sampling makes adjacent chunks seamless. Only the art changes. */
export function forestGroundPixels(sprites:TerrainSprites|undefined,left:number,top:number,size=256):Uint8ClampedArray {
  const output=new Uint8ClampedArray(size*size*4),weights=[0,0,0,0];
  for(let py=0;py<size;py++)for(let px=0;px<size;px++){
    const wx=left+px,wy=top+py;
    // A small coherent displacement breaks straight tile edges without obscuring paths.
    const nx=Math.sin(wx*.027+wy*.019)*5+Math.sin(wy*.073)*2;
    const ny=Math.sin(wy*.029-wx*.017)*5+Math.sin(wx*.067)*2;
    const gx=(wx+nx)/32-.5,gy=(wy+ny)/32-.5,x=Math.floor(gx),y=Math.floor(gy);
    const tx=smooth((gx-x-.10)/.80),ty=smooth((gy-y-.10)/.80);
    weights.fill(0);
    weights[materialAt(x,y)]+=(1-tx)*(1-ty);
    weights[materialAt(x+1,y)]+=tx*(1-ty);
    weights[materialAt(x,y+1)]+=(1-tx)*ty;
    weights[materialAt(x+1,y+1)]+=tx*ty;
    const shorePixels=forestWaterDistanceAt(wx+.5,wy+.5);
    if(shorePixels<0){weights.fill(0);weights[3]=1;}
    const color=[0,0,0];
    for(let m=0;m<4;m++){
      if(!weights[m])continue;
      const source=sprites?.[materials[m]],index=source?((wy%source.size)*source.size+wx%source.size)*4:0;
      for(let c=0;c<3;c++){
        let value=source?source.pixels[index+c]:fallback[m][c];
        if(m===2){
          // A worn woodland floor, rather than a separate sandy road material.
          const forest=sprites?.forest,meadow=sprites?.meadow;
          const fi=forest?((wy%forest.size)*forest.size+wx%forest.size)*4:0;
          const mi=meadow?((wy%meadow.size)*meadow.size+wx%meadow.size)*4:0;
          value=value*.10+(forest?forest.pixels[fi+c]:fallback[0][c])*.55+(meadow?meadow.pixels[mi+c]:fallback[1][c])*.35;
        }
        color[c]+=value*weights[m];
      }
    }
    // Damp moss along the shore, with restrained light on the water edge.
    const bank=4*weights[3]*(1-weights[3]);
    color[0]=color[0]*(1-bank*.25)+76*bank*.25;
    color[1]=color[1]*(1-bank*.25)+117*bank*.25;
    color[2]=color[2]*(1-bank*.25)+78*bank*.25;
    if(shorePixels<0){
      const shallow=smooth((shorePixels+28)/28)*.22,depth=.9+.1*smooth((shorePixels+100)/100);
      for(let c=0;c<3;c++)color[c]=color[c]*depth*(1-shallow)+[125,176,160][c]*shallow;
    }
    // Sand shares the exact asymmetric contour used by swimming and waves.
    const shoreDistance=shorePixels/32;
    const shoreWidth=1.05+Math.sin(wx*.009+wy*.004)*.25+Math.sin(wy*.015)*.15;
    const sandWeight=(1-weights[3])*smooth((shoreWidth-Math.max(0,shoreDistance))/.55);
    if(shoreDistance>-.75&&sandWeight>0){
      const sand=sprites?.sand,si=sand?((wy%sand.size)*sand.size+wx%sand.size)*4:0;
      const dry=.76+.24*smooth((shoreDistance-.05)/.65);
      const base=[179,154,108];
      for(let c=0;c<3;c++)color[c]=color[c]*(1-sandWeight)+(sand?sand.pixels[si+c]:base[c])*dry*sandWeight;
    }
    const i=(py*size+px)*4;
    output[i]=color[0];output[i+1]=color[1];output[i+2]=color[2];output[i+3]=255;
  }
  return output;
}
