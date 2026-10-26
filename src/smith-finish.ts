/** Runtime finishes retain the original PNGs and the brown timber palette. */
export const SMITH_WALL_COLOR=[38,48,44] as const;
export function finishSmithPixel(r:number,g:number,b:number,a:number,x:number,y:number,shade:number):readonly number[]{
 // Remove the rectangular black matte under the four stone supports only.
 if((x<86||x>976)&&y>=558)return[r,g,b,0];
 const foot=(x<86||x>976||x>365&&x<414||x>480&&x<526)&&y>540;
 if(foot&&Math.max(r,g,b)<12)return[r,g,b,0];
 const plaster=x>=50&&x<=63&&y>=120&&y<=478||x>=1007&&x<=1013&&y>=120&&y<=478;
 if(a&&plaster){const s=Math.max(0,Math.min(1,shade));return[r,g,b].map((c,i)=>Math.round(c*(1-s)+SMITH_WALL_COLOR[i]*s)).concat(a);}
 return[r,g,b,a];
}

/** Only the plaster connected to the crop perimeter is recolored, never enclosed wood/glass. */
export function finishSmithWindow(data:Uint8ClampedArray,width:number,height:number,shade:number):Uint8ClampedArray{
 const out=new Uint8ClampedArray(data),seen=new Uint8Array(width*height),queue:number[]=[];
 const visit=(p:number)=>{if(seen[p])return;seen[p]=1;const i=p*4,r=data[i],g=data[i+1],b=data[i+2];if(data[i+3]&&r>=g&&g>b&&g>65&&b>35)queue.push(p);};
 for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x);}for(let y=0;y<height;y++){visit(y*width);visit(y*width+width-1);}
 for(let n=0;n<queue.length;n++){const p=queue[n],i=p*4,x=p%width,y=Math.floor(p/width);for(let c=0;c<3;c++)out[i+c]=Math.round(data[i+c]*(1-shade)+SMITH_WALL_COLOR[c]*shade);if(x)visit(p-1);if(x<width-1)visit(p+1);if(y)visit(p-width);if(y<height-1)visit(p+width);}
 return out;
}
