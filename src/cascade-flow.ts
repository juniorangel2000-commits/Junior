type PixelSource = {width:number;height:number;data:Uint8ClampedArray};
const clamp = (n:number) => Math.max(0,Math.min(1,n));
export function cascadeChannel(y:number):{center:number;half:number}{
 const points=[[205,847,27],[250,891,50],[300,939,43],[360,956,45],[410,962,45]];
 let i=0;while(i<points.length-2&&y>points[i+1][0])i++;const a=points[i],b=points[i+1],t=clamp((y-a[0])/(b[0]-a[0]));return{center:a[1]+(b[1]-a[1])*t,half:a[2]+(b[2]-a[2])*t};
}
/** Only these painted water pixels are replaced; surrounding scenery stays original. */
export function cascadePaintMask(x:number,y:number,r:number,g:number,b:number,a:number):boolean {
 if(x<810||x>1110||y<200||y>840||a<160)return false;
 const water=b>=r*.95&&g>=r*.98&&b>=g*.87;
 if(y<410){const c=cascadeChannel(y);return water&&Math.abs(x-c.center)<c.half+3;}
 const curtain=x>=914&&x<=1014&&y<=805;
 const foam=x>=850&&x<=1100&&y>=600&&r>70&&g>85&&b>90&&b>=r*.95;
 return curtain&&(water||x>=928&&x<=997)||foam;
}

/** New water, not scrolling pieces or foam sampled from the old waterfall PNG. */
export class CascadeFlow {
 readonly width=300;
 readonly height=650;
 readonly x=810;
 readonly y=200;
 readonly pixels=new Uint8ClampedArray(this.width*this.height*4);
 private material?:PixelSource;
 private readonly riverMask=new Uint8Array(this.width*210);
 constructor(source:PixelSource,material?:PixelSource,private readonly riverMaterial?:PixelSource){
  if(material){const data=new Uint8ClampedArray(material.data.length);for(let y=0;y<material.height;y++){const phase=y/material.height,w=Math.sin(Math.PI*phase)**2,other=(y+Math.floor(material.height/2))%material.height;for(let x=0;x<material.width;x++)for(let k=0;k<4;k++)data[(y*material.width+x)*4+k]=material.data[(y*material.width+x)*4+k]*w+material.data[(other*material.width+x)*4+k]*(1-w);}this.material={width:material.width,height:material.height,data};}
  for(let y=0;y<210;y++)for(let x=0;x<this.width;x++){
   const sx=this.x+x,sy=this.y+y,i=(sy*source.width+sx)*4;
   if(cascadePaintMask(sx,sy,source.data[i],source.data[i+1],source.data[i+2],source.data[i+3]))this.riverMask[y*this.width+x]=255;
  }
 }
 update(milliseconds:number):void {
  const seconds=milliseconds/1000;this.pixels.fill(0);
  this.drawRiver(seconds);
  this.drawCurtain(seconds);
  this.drawLip(seconds);
  this.drawImpact(seconds);
 }
 private put(x:number,y:number,r:number,g:number,b:number,alpha:number):void {
  x=Math.round(x);y=Math.round(y);if(x<0||x>=this.width||y<0||y>=this.height)return;
  const i=(y*this.width+x)*4,a=clamp(alpha/255),old=this.pixels[i+3]/255,total=a+old*(1-a);
  if(total===0)return;
  this.pixels[i]=(r*a+this.pixels[i]*old*(1-a))/total;
  this.pixels[i+1]=(g*a+this.pixels[i+1]*old*(1-a))/total;
  this.pixels[i+2]=(b*a+this.pixels[i+2]*old*(1-a))/total;
  this.pixels[i+3]=total*255;
 }
 private drawRiver(time:number):void {
  for(let y=0;y<210;y++)for(let x=0;x<this.width;x++){
   if(!this.riverMask[y*this.width+x])continue;
   const travel=y-time*45,c=cascadeChannel(y+this.y),u=(x+this.x-c.center)/c.half;
   const ripple=Math.sin(travel*.19+Math.sin(x*.07)*1.7)*.5+.5;
   const detail=Math.sin(x*.38+travel*.09)*.5+.5;
   const light=Math.max(0,ripple-.76)*80*(.35+detail*.65);
   const material=this.riverMaterial;
   if(material){
    const sx=((Math.floor((u+1)*material.width*.5)%material.width)+material.width)%material.width,sy=((Math.floor(travel)%material.height)+material.height)%material.height,i=(sy*material.width+sx)*4;
    this.put(x,y,material.data[i]*.86+7+light*.3,material.data[i+1]*.86+14+light*.3,material.data[i+2]*.86+15+light*.3,250);
   }else this.put(x,y,47+detail*13+light,108+detail*17+light,117+detail*17+light,248);
  }
 }
 private drawCurtain(time:number):void {
  const top=207,bottom=604;
  for(let y=top;y<=bottom;y++){
   const t=(y-top)/(bottom-top),center=152+5*t+Math.sin(y*.04-time*2)*.7,half=40+3*t+Math.sin(y*.09-time*5)*.7;
   const travel=Math.sqrt(y-top+40)*18-time*190;
   for(let x=Math.floor(center-half-2);x<=center+half+2;x++){
    const u=(x-center)/half,side=clamp((1-Math.abs(u))*half/2);
    const lip=clamp((y-top-u*u*2+1)/3),landing=clamp((bottom-y+Math.sin(x*.43)*4+Math.sin(time*7+x*.8)*2)/10);
    if(side*lip*landing===0)continue;
    const wave=Math.sin(u*11+travel*.045)*.5+.5;
    const thread=Math.max(0,Math.sin(u*58+Math.sin(travel*.025+u*4)*.8))**12;
    const pulse=.3+.7*(Math.sin(travel*.13+u*17)*.5+.5);
    const sheen=thread*pulse*105;
    const material=this.material;
    if(material){
     const sx=Math.min(material.width-1,Math.max(0,Math.floor((u+1)*.5*(material.width-1)))),sy=((Math.floor(travel)%material.height)+material.height)%material.height,i=(sy*material.width+sx)*4;
     this.put(x,y,material.data[i]*.92+wave*5,material.data[i+1]*.92+wave*6,material.data[i+2]*.92+wave*6,side*lip*landing*245);
    }else this.put(x,y,65+wave*28+sheen,133+wave*24+sheen*.8,143+wave*22+sheen*.75,side*lip*landing*250);
   }
  }
 }
 private drawLip(time:number):void {
  for(let x=110;x<=194;x++){
   const u=(x-152)/42,edge=clamp((1-Math.abs(u))*10),crest=206+u*u*3;
   for(let y=Math.floor(crest)-2;y<=Math.ceil(crest)+4;y++){
    const distance=(y-crest)/4,shape=Math.max(0,1-distance*distance),moving=Math.sin(x*.32-time*6)*.5+.5;
    this.put(x,y,89+moving*62,155+moving*48,166+moving*42,shape*edge*175);
   }
  }
 }
 private ellipse(cx:number,cy:number,rx:number,ry:number,r:number,g:number,b:number,alpha:number):void {
  for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){
   const d=((x-cx)/rx)**2+((y-cy)/ry)**2;if(d<1)this.put(x,y,r,g,b,alpha*clamp((1-d)*3));
  }
 }
 private drawImpact(time:number):void {
  const cx=157,cy=607;
  this.ellipse(cx,cy+4,62+Math.sin(time*2)*2,14+Math.sin(time*1.5),103,173,176,85);
  for(let i=0;i<72;i++){
   const phase=(time*(.43+i%5*.035)+i*.6180339)%1,angle=i*2.39996;
   const radius=9+phase*(24+i%7*4),x=cx+Math.cos(angle)*radius;
   const y=cy+Math.sin(angle)*radius*.23-Math.sin(phase*Math.PI)*(3+i%4);
   const alpha=Math.sin(phase*Math.PI)*185;
   this.ellipse(x,y,1.3+(i%3)*.7, .65+(i%2)*.4,211,239,232,alpha);
  }
  // Small broken ripples move away from the impact, rather than a fixed foam outline.
  for(let i=0;i<3;i++){
   const p=(time*.45+i/3)%1,rx=22+p*62,ry=4+p*12;
   for(let j=0;j<54;j++){
    const angle=.1+j/53*2.9;if((j+i*3)%11<3)continue;
    this.put(cx+Math.cos(angle)*rx,cy+5+Math.sin(angle)*ry,173,216,208,(1-p)*110);
   }
  }
 }
}
