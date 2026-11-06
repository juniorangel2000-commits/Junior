const fs=require('node:fs'),path=require('node:path'),{PNG}=require('pngjs');
const root=path.resolve(__dirname,'..'),source=PNG.sync.read(fs.readFileSync(path.join(root,'referencias/fazenda/palha-original.png')));let left=source.width,top=source.height,right=0,bottom=0;
for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++)if(source.data[(y*source.width+x)*4+3]>100){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);}
const result=new PNG({width:128,height:128}),w=right-left,h=bottom-top,scale=112/Math.max(w,h),dw=Math.round(w*scale),dh=Math.round(h*scale),ox=Math.floor((128-dw)/2),oy=Math.floor((128-dh)/2);
for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){const sx=left+Math.min(w-1,Math.floor(x/scale)),sy=top+Math.min(h-1,Math.floor(y/scale)),i=(sy*source.width+sx)*4,j=((oy+y)*128+ox+x)*4;for(let c=0;c<4;c++)result.data[j+c]=source.data[i+c];}
fs.writeFileSync(path.join(root,'public/assets/visual/farm/hay.png'),PNG.sync.write(result));console.log('Hay icon packed, transparent 128×128');
