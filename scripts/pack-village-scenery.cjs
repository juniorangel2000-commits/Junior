// Atlas extraction only: transparent padding/alpha and display scale. The
// generated source sheet and the author's original lamp remain unchanged.
const fs=require('node:fs'),path=require('node:path'),{PNG}=require('pngjs');
const source=process.argv[2]??'docs/cenarios/vila-refinada/fontes/objetos.png',im=PNG.sync.read(fs.readFileSync(source)),root='public/assets/visual/village';fs.mkdirSync(root,{recursive:true});
const rows=[0,520,im.height],cuts=[[0,440,746,1195,im.width],[0,374,756,1176,im.width]];
const configs=[['bench',124,88],['flowerpot',58,72],['planter',128,80],['crates',76,108],['barrel',56,76],['sacks',82,84],['woodpile',108,76],['basket',68,60]];
const manifest=[];
for(const [i,[id,w,h]]of configs.entries()){
 const row=Math.floor(i/4),col=i%4,x0=cuts[row][col],x1=cuts[row][col+1],y0=rows[row],y1=rows[row+1];let l=x1,r=x0,t=y1,b=y0;
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(im.data[(y*im.width+x)*4+3]>=180){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
 if(r<l)throw Error('Empty '+id);
 const sw=r-l+1,sh=b-t+1,scale=Math.min((w-8)/sw,(h-8)/sh),dw=Math.round(sw*scale),dh=Math.round(sh*scale),ox=Math.floor((w-dw)/2),oy=h-4-dh,out=new PNG({width:w,height:h});
 for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){const a=((t+Math.min(sh-1,Math.floor(y/scale)))*im.width+l+Math.min(sw-1,Math.floor(x/scale)))*4,k=((oy+y)*w+ox+x)*4;if(im.data[a+3]<180)continue;out.data[k]=im.data[a];out.data[k+1]=im.data[a+1];out.data[k+2]=im.data[a+2];out.data[k+3]=255;}
 fs.writeFileSync(path.join(root,id+'.png'),PNG.sync.write(out));manifest.push({id,width:w,height:h,worldWidth:w/2,worldHeight:h/2,sourceBounds:{x:l,y:t,width:sw,height:sh}});
}
fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({source,lamp:'Original PNG (20×80), unchanged',sprites:manifest},null,2));console.log('Packed',manifest.length,'scenery sprites.');
