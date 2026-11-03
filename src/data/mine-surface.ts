/** Join opposite texture borders during atlas construction. Interior brushwork
 * stays intact; neighbouring world cells sample the same continuous surface. */
export function joinMineTextureEdges(data:Uint8ClampedArray,width:number,height:number,band=8):void{
 const join=(a:number,b:number,t:number)=>{for(let k=0;k<3;k++){const x=data[a+k],y=data[b+k];data[a+k]=x*(1-t)+y*t;data[b+k]=y*(1-t)+x*t;}};
 const bx=Math.min(band,Math.floor(width/2)),by=Math.min(band,Math.floor(height/2));
 for(let y=0;y<height;y++)for(let x=0;x<bx;x++)join((y*width+x)*4,(y*width+width-1-x)*4,(1-x/bx)/2);
 for(let x=0;x<width;x++)for(let y=0;y<by;y++)join((y*width+x)*4,((height-1-y)*width+x)*4,(1-y/by)/2);
}
