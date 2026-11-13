import type {TerrainSprites} from './terrain-sprites';
import {FIELDS_SIZE,fieldsPathDistance,FIELDS_SHED} from './data/open-fields';
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
/** Native property materials: every source pixel retains the property floor scale. */
export function paintFieldsFloor(ctx:CanvasRenderingContext2D,s:TerrainSprites):void{
 const {width,height}=FIELDS_SIZE,image=ctx.createImageData(width,height),size=s.grass.size,period=size*2;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const sx=x%period,sy=y%period,index=((sy<size?sy:period-sy-1)*size+(sx<size?sx:period-sx-1))*4;
  const meadow=.45+.25*Math.sin(x*.003+Math.cos(y*.004)),edge=smooth((180-Math.min(x,y,width-x,height-y))/180)*.35;
  const worn=(1-smooth((fieldsPathDistance(x,y)-12)/38))*.28;
  const shed=(1-smooth((Math.hypot((x-FIELDS_SHED.x)/1.5,y-FIELDS_SHED.y)-65)/45))*.75;
  const path=Math.max(worn,shed),light=Math.sin(x*.013+y*.008)*2+Math.sin(y*.021-x*.005)*2,at=(y*width+x)*4;
  for(let c=0;c<3;c++){let v=s.grass.pixels[index+c]*(1-meadow)+s.meadow.pixels[index+c]*meadow;v=v*(1-edge)+s.forest.pixels[index+c]*edge;image.data[at+c]=(v*(1-path)+s['path-dry'].pixels[index+c]*path)+light;}
  image.data[at+3]=255;
 }ctx.putImageData(image,0,0);
}
