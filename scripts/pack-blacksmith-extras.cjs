// Extract authored sprites without altering the generated source atlas.
const fs=require('node:fs'),{PNG}=require('pngjs');
const source='docs/cenarios/vila-refinada/fontes/ferraria-objetos-adicionais.png',im=PNG.sync.read(fs.readFileSync(source)),root='public/assets/visual/village';
const entries=[['counter-long',0,0,665,520,256,96],['weapon-rack',665,0,1070,520,128,128],['bellows',1070,0,1536,520,80,72],['grindstone',0,520,600,1024,88,104],['coal-bin',600,520,1020,1024,64,64],['iron-stock',1020,520,1536,1024,128,80]],sprites=[];
for(const[id,x0,y0,x1,y1,w,h]of entries){
 let l=x1,r=x0,t=y1,b=y0;
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(im.data[(y*im.width+x)*4+3]>=180){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
 if(r<l)throw Error('Empty asset: '+id);
 const sw=r-l+1,sh=b-t+1,margin=id==='counter-long'?0:4,scale=Math.min((w-margin)/sw,(h-4)/sh),dw=Math.round(sw*scale),dh=Math.round(sh*scale),ox=Math.floor((w-dw)/2),oy=h-2-dh,out=new PNG({width:w,height:h});
 for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){
  const a=((t+Math.min(sh-1,Math.floor(y/scale)))*im.width+l+Math.min(sw-1,Math.floor(x/scale)))*4,k=((oy+y)*w+ox+x)*4;
  if(im.data[a+3]>=180)out.data.set([im.data[a],im.data[a+1],im.data[a+2],255],k);
 }
 fs.writeFileSync(`${root}/blacksmith-${id}.png`,PNG.sync.write(out));sprites.push({id,width:w,height:h,worldWidth:w/2,worldHeight:h/2,sourceBounds:{x:l,y:t,width:sw,height:sh}});
 if(id==='counter-long'){
  // All modules share one tabletop/front silhouette. Only the two end caps
  // contain outer iron brackets; the middle can repeat without a transparent gap.
  for(const[part,x]of [['left',0],['middle',64],['right',192]]){
   const tile=new PNG({width:64,height:96});PNG.bitblt(out,tile,x,0,64,96,0,0);fs.writeFileSync(`${root}/blacksmith-counter-${part}.png`,PNG.sync.write(tile));
  }
 }
}
fs.writeFileSync(`${root}/blacksmith-extras.manifest.json`,JSON.stringify({source,modules:{width:64,height:96,worldWidth:32,worldHeight:48,parts:['left','middle','right']},sprites},null,2));console.log('Packed six fixtures and three counter modules.');
