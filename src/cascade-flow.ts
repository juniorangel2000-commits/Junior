export const isCascadeFoam=(x:number,y:number,r:number,g:number,b:number,a:number)=>x>=850&&x<=1100&&y>=600&&y<=840&&r>165&&g>185&&b>185&&b>=r*.95&&a>180;
/** Re-sample the painted water into seamless flowing ribbons, leaving rocks untouched. */
export class CascadeFlow {
 readonly width=300;
 readonly height=650;
 readonly x=810;
 readonly y=200;
 readonly pixels:Uint8ClampedArray;
 private readonly mask:Uint8Array;
 private readonly column:Uint8Array;
 private readonly fall:Uint8ClampedArray;
 private readonly foam:Array<{x:number;y:number;r:number;g:number;b:number}>=[];
 private readonly river:Uint8ClampedArray;
 constructor(source:{width:number;height:number;data:Uint8ClampedArray}){
  const count=this.width*this.height;this.pixels=new Uint8ClampedArray(count*4);this.mask=new Uint8Array(count);this.column=new Uint8Array(count);
  const water=(i:number)=>source.data[i+3]>180&&source.data[i+2]>=source.data[i]*.98&&source.data[i+1]>=source.data[i]*1.01&&source.data[i+2]>=source.data[i+1]*.89;
  for(let sy=600;sy<=840;sy++)for(let sx=850;sx<=1100;sx++){const i=(sy*source.width+sx)*4;if(isCascadeFoam(sx,sy,source.data[i],source.data[i+1],source.data[i+2],source.data[i+3]))this.foam.push({x:sx-this.x,y:sy-this.y,r:source.data[i],g:source.data[i+1],b:source.data[i+2]});}
  const channel=(y:number)=>{const stops=[[205,847,27],[250,891,50],[300,939,43],[360,956,45],[410,962,45],[590,964,47],[760,969,49],[830,968,82]];let i=0;while(i<stops.length-2&&y>stops[i+1][0])i++;const a=stops[i],b=stops[i+1],t=Math.max(0,Math.min(1,(y-a[0])/(b[0]-a[0])));return{center:a[1]+(b[1]-a[1])*t,half:a[2]+(b[2]-a[2])*t};};
  for(let y=0;y<this.height;y++)for(let x=0;x<this.width;x++){
   const sx=x+this.x,sy=y+this.y,i=y*this.width+x,at=(sy*source.width+sx)*4,c=channel(sy),u=(sx-c.center)/c.half;
   if(Math.abs(u)>1||!water(at))continue;
   const feather=Math.min(1,(1-Math.abs(u))*c.half/2,(this.height-1-y)/12,y/6);
   this.mask[i]=Math.round(Math.max(0,feather)*255);this.column[i]=Math.round((u+1)*.5*95);
  }
  const makeTile=(top:number,span:number)=>{
   const tile=new Uint8ClampedArray(96*256*3);
   // Each sample's wrap occurs only when its blending weight is zero.
   for(let row=0;row<256;row++){
    const phase=row/256,weight=Math.sin(Math.PI*phase)**2,ys=[top+Math.floor(phase*span),top+Math.floor(((phase+.5)%1)*span)];
    for(let x=0;x<96;x++)for(let k=0;k<3;k++){
     const sample=(sy:number)=>{const c=channel(sy),sx=Math.round(c.center+(x/95*2-1)*c.half*.92),at=(sy*source.width+sx)*4;return water(at)?source.data[at+k]:[100,166,170][k];};
     tile[(row*96+x)*3+k]=sample(ys[0])*weight+sample(ys[1])*(1-weight);
    }
   }return tile;
  };
  this.fall=makeTile(450,220);this.river=makeTile(270,115);
 }
 update(milliseconds:number):void{
  const seconds=milliseconds/1000;this.pixels.fill(0);
  for(let y=0;y<this.height;y++){
   const sy=y+this.y,fall=sy>=410,tile=fall?this.fall:this.river;
   // Flow accelerates through the lip into the vertical fall; no row is left static.
   const phase=fall?Math.sqrt(Math.max(0,sy-390))*19-seconds*225:(sy-200)*1.7-seconds*58;
   const row=((Math.floor(phase)%256)+256)%256;
   for(let x=0;x<this.width;x++){
    const i=y*this.width+x,at=i*4,alpha=this.mask[i];this.pixels[at+3]=alpha;if(!alpha)continue;
    const column=Math.max(0,Math.min(95,this.column[i]+Math.round(Math.sin(seconds*2.4+sy*.045)*.7))),sample=(row*96+column)*3;
    for(let k=0;k<3;k++)this.pixels[at+k]=tile[sample+k];
   }
  }
  // The original white spray is removed from the ridge; each fleck now has a life cycle.
  for(const p of this.foam){
   const phase=((seconds*.8+p.x*.013+p.y*.007)%1+1)%1,spread=(p.x-155)/70;
   const x=Math.round(p.x+spread*phase*7+Math.sin(seconds*3+p.y*.09)*1.5),y=Math.round(p.y+phase*11-Math.sin(phase*Math.PI)*5);
   if(x<0||x>=this.width||y<0||y>=this.height)continue;
   const i=(y*this.width+x)*4,alpha=Math.round(Math.sin(phase*Math.PI)*235);if(alpha<this.pixels[i+3]&&this.pixels[i]>190)continue;
   this.pixels[i]=p.r;this.pixels[i+1]=p.g;this.pixels[i+2]=p.b;this.pixels[i+3]=Math.max(this.pixels[i+3],alpha);
  }

 }
}
