/** Offline composition of the redrawn terrain; never imported by the game. */
export interface GroundPixels {width:number;height:number;data:Uint8Array|Uint8ClampedArray}
export interface GroundBake extends GroundPixels {data:Uint8ClampedArray}
export const GROUND_SECTIONS=['noroeste','nordeste','sudoeste','sudeste'] as const;
export type GroundSections=Record<typeof GROUND_SECTIONS[number],GroundPixels>;
type Shore=readonly(readonly(readonly number[])[])[];
const clamp=(n:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,n));
const wet=(p:GroundPixels,i:number)=>p.data[i+2]>p.data[i]*1.35&&p.data[i+1]>p.data[i]*1.3&&p.data[i+2]>=p.data[i+1]*.9;
/** Locate the continuous channel, ignoring tiny isolated colour accents. */
function banks(p:GroundPixels):([number|undefined,number|undefined]|undefined)[]{
 const rows:([number|undefined,number|undefined]|undefined)[]=[];
 for(let y=0;y<p.height;y++){
  let left=0,right=0;
  for(let x=0;x<p.width;x++)if(wet(p,(y*p.width+x)*4)){
   const a=x;while(x+1<p.width&&wet(p,(y*p.width+x+1)*4))x++;
   if(x+1-a>right-left){left=a;right=x+1;}
  }
  rows.push(right-left>=4?[left>0?left:undefined,right<p.width?right:undefined]:undefined);
 }
 return rows;
}
/** Preserve the approved water/collision silhouette while fitting new bank detail. */
export function bakeHighlandGround(base:GroundPixels,sections:GroundSections,shore:Shore):GroundBake {
 if(base.data.length!==base.width*base.height*4)throw Error('Invalid ground base');
 const width=base.width*2,height=base.height*2,data=new Uint8ClampedArray(width*height*4);
 const layers=GROUND_SECTIONS.map((name,i)=>{
  const image=sections[name];if(!image||image.data.length!==image.width*image.height*4||!image.width||!image.height)throw Error('Invalid terrain section: '+name);
  return{image,banks:banks(image),x:i%2?base.width*7/16:0,y:i>1?base.height*7/16:0,width:base.width*9/16,height:base.height*9/16};
 });
 // Only the overlaps are blended. Most pixels retain one authored, sharp sample.
 const blend=(v:number,mid:number,extent:number)=>{const t=clamp((v-mid)/(extent/128)+.5,0,1);return t*t*(3-2*t);};
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const wx=(x+.5)/2,wy=(y+.5)/2,row=shore[Math.floor(wy)],at=(y*width+x)*4;
  if(row?.some(([a,b])=>wx>=a&&wx<b))continue;
  const right=blend(wx,base.width/2,base.width),bottom=blend(wy,base.height/2,base.height);
  const weights=[(1-right)*(1-bottom),right*(1-bottom),(1-right)*bottom,right*bottom];
  const rgb=[0,0,0];
  for(let n=0;n<4;n++){
   if(!weights[n])continue;const layer=layers[n],image=layer.image;
   const sy=clamp(Math.floor((wy-layer.y)/layer.height*image.height),0,image.height-1),bank=layer.banks[sy];let sx=wx;
   if(row?.length&&bank){
    const left=row[0][0],right=row[row.length-1][1],reach=base.width/24;
    // Match each bank independently, fading the fit out before the paths/props.
    if(wx<left&&bank[0]!==undefined)sx+=(layer.x+bank[0]/image.width*layer.width-left)*clamp(1-(left-wx)/reach,0,1);
    if(wx>=right&&bank[1]!==undefined)sx+=(layer.x+bank[1]/image.width*layer.width-right)*clamp(1-(wx-right)/reach,0,1);
   }
   let ix=clamp(Math.floor((sx-layer.x)/layer.width*image.width),0,image.width-1);
   // Rounding at the shared contour must not expose flat teal on solid ground.
   if(wet(image,(sy*image.width+ix)*4)&&bank){
    const edge=wx<(row?.[0]?.[0]??base.width/2)?bank[0]:bank[1];
    if(edge!==undefined)ix=clamp(edge===bank[0]?edge-1:edge,0,image.width-1);
   }
   const sample=(sy*image.width+ix)*4;
   for(let c=0;c<3;c++)rgb[c]+=image.data[sample+c]*weights[n];
  }
  for(let c=0;c<3;c++)data[at+c]=rgb[c];
  data[at+3]=base.data[(Math.floor(wy)*base.width+Math.floor(wx))*4+3];
 }
 return{width,height,data};
}
