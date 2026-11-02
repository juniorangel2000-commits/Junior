// Rebuild collision/rendering shoreline together after replacing the terrain artwork.
const fs=require('node:fs'),crypto=require('node:crypto'),{PNG}=require('pngjs');
const bytes=fs.readFileSync('public/assets/visual/highland/terrain.png'),png=PNG.sync.read(bytes),{width,height,data}=png;
const mask=new Uint8Array(width*height),queue=[];
const wet=(x,y)=>{if(x<0||x>=width||y<0||y>=height)return false;const i=(y*width+x)*4,[r,g,b]=data.subarray(i,i+3);return b>r*1.35&&g>r*1.3&&b>=g*.9;};
for(const y of [0])for(let x=600;x<1100;x++)if(wet(x,y)){const n=y*width+x;mask[n]=1;queue.push(n);}
for(let i=0;i<queue.length;i++){const n=queue[i],x=n%width,y=Math.floor(n/width);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy,k=b*width+a;if(!mask[k]&&wet(a,b)){mask[k]=1;queue.push(k);}}}
const rows=[];for(let y=0;y<height;y++){const runs=[];for(let x=0;x<width;x++)if(mask[y*width+x]){const start=x;while(x+1<width&&mask[y*width+x+1])x++;runs.push([start,x+1]);}rows.push(runs);}
fs.writeFileSync('src/data/highland-river-contour.json',JSON.stringify({width,height,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),rows})+'\n');
console.log({width,height,waterPixels:queue.length});
