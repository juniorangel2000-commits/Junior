// Empacota os recortes originais, sem redimensionar/desenhar o animal. Reproduzível.
const fs=require('node:fs'),{PNG}=require('pngjs'),{createHash}=require('node:crypto');
const hash=b=>createHash('sha256').update(b).digest('hex'),read=p=>PNG.sync.read(fs.readFileSync(p));
function bounds(p,x0,y0,w,h){let left=x0+w,top=y0+h,right=x0,bottom=y0;for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++)if(p.data[(y*p.width+x)*4+3]>=200){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}return{x:left,y:top,width:right-left+1,height:bottom-top+1};}
function copy(source,rect,target,x,y){for(let py=0;py<rect.height;py++)for(let px=0;px<rect.width;px++){const si=((rect.y+py)*source.width+rect.x+px)*4,tx=x+px,ty=y+py;if(tx<0||tx>=target.width||ty<0||ty>=target.height)throw Error('Recorte fora do atlas');const di=(ty*target.width+tx)*4;if(source.data[si+3]>=200){target.data[di]=source.data[si];target.data[di+1]=source.data[si+1];target.data[di+2]=source.data[si+2];target.data[di+3]=255;}}}
for(const kind of ['sheep','goat']){
 const dir=`public/assets/animals/${kind}`,file=fs.readFileSync(`${dir}/source.png`),source=PNG.sync.read(file),cell=224,atlas=new PNG({width:cell*9,height:cell*8}),frames=[];
 for(let row=0;row<8;row++){
  const rects=Array.from({length:5},(_,col)=>{const x=Math.floor(col*source.width/5),y=Math.floor(row*source.height/8);return bounds(source,x,y,Math.floor((col+1)*source.width/5)-x,Math.floor((row+1)*source.height/8)-y);});
  const baseline=Math.max(...rects.map(r=>r.y+r.height));
  for(let col=0;col<9;col++){
   const pose=col===0?0:Math.floor((col-1)/2)+1,rect=rects[pose],center=(pose+.5)*source.width/5;
   const x=Math.round(cell/2+rect.x-center),y=202+rect.y-baseline;
   copy(source,rect,atlas,col*cell+x,row*cell+y);frames.push({row,col,pose,source:rect,x,y});
  }
 }
 fs.writeFileSync(`${dir}/atlas.png`,PNG.sync.write(atlas));
 fs.writeFileSync(`${dir}/atlas.json`,JSON.stringify({cell,foot:90,alphaCutoff:200,source:'source.png',sha256:hash(file),directions:['down','left','right','up','down-left','down-right','up-left','up-right'],walkPoses:4,frames},null,2)+'\n');
}
const p='public/assets/visual/farm/products/',source=read(p+'aprisco-source.png');
const frames=[];for(const[index,name]of ['shears','wool','goat-milk'].entries()){
 const x=Math.floor(index*source.width/3),right=Math.floor((index+1)*source.width/3),rect=bounds(source,x,0,right-x,source.height),icon=new PNG({width:rect.width,height:rect.height});copy(source,rect,icon,0,0);fs.writeFileSync(p+name+'.png',PNG.sync.write(icon));frames.push({name,...rect});
}
fs.writeFileSync(p+'aprisco-assets.json',JSON.stringify({source:'aprisco-source.png',sha256:hash(fs.readFileSync(p+'aprisco-source.png')),frames},null,2)+'\n');
