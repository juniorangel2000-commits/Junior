const fs=require('node:fs'),{PNG}=require('pngjs'),{createHash}=require('node:crypto');const root='public/assets/visual/machines/';
const read=p=>PNG.sync.read(fs.readFileSync(root+p)),hash=p=>createHash('sha256').update(fs.readFileSync(root+p)).digest('hex');
function bounds(p,x,y,w,h){let l=x+w,t=y+h,r=x,b=y;for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++)if(p.data[(py*p.width+px)*4+3]>=200){l=Math.min(l,px);r=Math.max(r,px);t=Math.min(t,py);b=Math.max(b,py);}return{x:l,y:t,width:r-l+1,height:b-t+1};}
function copy(p,f,out,x,y){for(let py=0;py<f.height;py++)for(let px=0;px<f.width;px++){const s=((f.y+py)*p.width+f.x+px)*4,d=((y+py)*out.width+x+px)*4;if(p.data[s+3]>=200){out.data[d]=p.data[s];out.data[d+1]=p.data[s+1];out.data[d+2]=p.data[s+2];out.data[d+3]=255;}}}
const machine=read('source.png'),frames={};
for(const[col,kind]of ['cheesePress','butterChurn','spinningWheel','loom','stoneMill'].entries()){
 const cuts=Array.from({length:3},(_,row)=>{const x=Math.floor(col*machine.width/5),y=Math.floor(row*machine.height/3);return bounds(machine,x,y,Math.floor((col+1)*machine.width/5)-x,Math.floor((row+1)*machine.height/3)-y);});
 const width=Math.max(...cuts.map(c=>c.width))+8,height=Math.max(...cuts.map(c=>c.height))+8,atlas=new PNG({width:width*3,height});
 cuts.forEach((c,i)=>{copy(machine,c,atlas,i*width+Math.floor((width-c.width)/2),height-c.height-4);if(i===0){const icon=new PNG({width:c.width,height:c.height});copy(machine,c,icon,0,0);fs.writeFileSync(root+kind+'-icon.png',PNG.sync.write(icon));}});
 fs.writeFileSync(root+kind+'.png',PNG.sync.write(atlas));frames[kind]={width,height,cuts};
}
const products=read('products-source.png'),icons={};
for(const[i,name]of ['cheese','goatCheese','butter','yarn','flour','cornmeal','oatFlakes','cloth'].entries()){
 const col=i%4,row=Math.floor(i/4),x=Math.floor(col*products.width/4),y=Math.floor(row*products.height/2),c=bounds(products,x,y,Math.floor((col+1)*products.width/4)-x,Math.floor((row+1)*products.height/2)-y),icon=new PNG({width:c.width,height:c.height});copy(products,c,icon,0,0);fs.writeFileSync(root+name+'.png',PNG.sync.write(icon));icons[name]=c;
}
fs.writeFileSync(root+'art.json',JSON.stringify({alphaCutoff:200,sourceSha256:hash('source.png'),productsSha256:hash('products-source.png'),frames,icons},null,2)+'\n');
