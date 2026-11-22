import type {TerrainSprites} from './terrain-sprites';
import {FIELDS_SIZE,fieldsPathDistance,FIELDS_SHED,FIELDS_ENTRY} from './data/open-fields';
import {fieldsRiverDistance,FIELDS_RIVER_BRIDGES} from './data/fields-river';
import {waterFinishChannel} from './data/water-style';
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
const paths=[
 [[FIELDS_ENTRY.x,0],[838,190],[936,296],[1220,355],[1490,300]],
 [[930,1780],[876,1930],[894,2100],[912,2304]],
 [[1850,1020],[1952,991],[2272,991],[2410,885]],
 [[930,1780],[1240,1690],[1560,1696],[1900,1696],[2200,1750]],
] as const;
const connections=paths.flatMap(path=>path.slice(1).map(([bx,by],i)=>{
 const [x,y]=path[i],dx=bx-x,dy=by-y;
 return {x,y,dx,dy,inv:1/(dx*dx+dy*dy)};
}));
function connectionDistance(x:number,y:number):number{
 let nearest=Infinity;
 for(const line of connections){
  const px=x-line.x,py=y-line.y,t=Math.max(0,Math.min(1,(px*line.dx+py*line.dy)*line.inv));
  nearest=Math.min(nearest,(px-line.dx*t)**2+(py-line.dy*t)**2);
 }
 return Math.sqrt(nearest);
}
/** The channel uses the same water material and sand band as the farm. */
export function paintFieldsFloor(ctx:CanvasRenderingContext2D,s:TerrainSprites):void{
 const {width,height}=FIELDS_SIZE,image=ctx.createImageData(width,height),size=s.grass.size,period=size*2;
 for(let by=0;by<height;by+=4)for(let bx=0;bx<width;bx+=4){
  const x=bx+2,y=by+2;
  const meadow=.45+.25*Math.sin(x*.003+Math.cos(y*.004)),edge=smooth((180-Math.min(x,y,width-x,height-y))/180)*.35;
  const jitter=Math.sin(x*.014+y*.033)*6+Math.cos(y*.042-x*.027)*5;
  const worn=(1-smooth((Math.min(fieldsPathDistance(x,y),connectionDistance(x,y))-12+jitter)/41))*.49;
  const shed=(1-smooth((Math.hypot((x-FIELDS_SHED.x)/1.5,y-FIELDS_SHED.y)-65)/45))*.75;
  const path=Math.max(worn,shed),light=Math.sin(x*.013+y*.008)*2+Math.sin(y*.021-x*.005)*2;
  const dist=fieldsRiverDistance(x,y);
  const landing=FIELDS_RIVER_BRIDGES.some(b=>Math.abs(y-(b.y+1)*32)<30&&x>b.x*32-25&&x<(b.x+b.width)*32+25)?.34:0;
  for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){
   const px=bx+dx,py=by+dy,at=(py*width+px)*4;
   const sx=px%period,sy=py%period,index=((sy<size?sy:period-sy-1)*size+(sx<size?sx:period-sx-1))*4;
   const w=((py%size)*size+px%size)*4;
   const d=Math.abs(dist)<8?fieldsRiverDistance(px+.5,py+.5):dist;
   const bank=smooth((33-d+jitter)/16)*.88,moisture=.76+.24*smooth(d/18);
   for(let c=0;c<3;c++){
    const base=s.grass.pixels[index+c]*(1-meadow)+s.meadow.pixels[index+c]*meadow;
    const verge=base*(1-edge)+s.forest.pixels[index+c]*edge;
    const trail=verge*(1-path)+s['path-dry'].pixels[index+c]*path;
    const land=trail*(1-bank)+s.sand.pixels[index+c]*moisture*bank;
    image.data[at+c]=d<0?waterFinishChannel(s.water.pixels[w+c],c,d):land*(1-landing)+s['path-dry'].pixels[index+c]*landing+light;
   }
   image.data[at+3]=255;
  }
 }
 ctx.putImageData(image,0,0);
}
