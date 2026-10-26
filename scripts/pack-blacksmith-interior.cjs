// Mechanical atlas extraction: leave the generated original untouched.
const fs=require('node:fs'),{PNG}=require('pngjs');
const source='docs/cenarios/vila-refinada/fontes/ferraria-interior-objetos.png',im=PNG.sync.read(fs.readFileSync(source));
const entries=[['armor-stand',0,0,610,720,96,144],['tool-rack',610,0,1254,720,160,104],['counter',0,720,682,1254,128,96],['parts-shelf',682,720,1254,1254,128,112]],sprites=[];
for(const[id,x0,y0,x1,y1,w,h]of entries){
 let l=x1,r=x0,t=y1,b=y0;
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(im.data[(y*im.width+x)*4+3]>=180){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
 if(r<l)throw Error('Empty asset: '+id);
 const sw=r-l+1,sh=b-t+1,scale=Math.min((w-4)/sw,(h-4)/sh),dw=Math.round(sw*scale),dh=Math.round(sh*scale),ox=Math.floor((w-dw)/2),oy=h-2-dh,out=new PNG({width:w,height:h});
 for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){
  const a=((t+Math.min(sh-1,Math.floor(y/scale)))*im.width+l+Math.min(sw-1,Math.floor(x/scale)))*4,k=((oy+y)*w+ox+x)*4;
  if(im.data[a+3]<180)continue;out.data.set([im.data[a],im.data[a+1],im.data[a+2],255],k);
 }
 fs.writeFileSync(`public/assets/visual/village/blacksmith-${id}.png`,PNG.sync.write(out));sprites.push({id,width:w,height:h,worldWidth:w/2,worldHeight:h/2,sourceBounds:{x:l,y:t,width:sw,height:sh}});
}
fs.writeFileSync('public/assets/visual/village/blacksmith-interior.manifest.json',JSON.stringify({source,sprites},null,2));console.log('Packed four original blacksmith shop fixtures.');
