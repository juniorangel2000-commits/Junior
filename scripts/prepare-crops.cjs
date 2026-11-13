const fs=require('node:fs'),path=require('node:path'),{PNG}=require('pngjs');
const root=path.resolve(__dirname,'..'),catalog=JSON.parse(fs.readFileSync(path.join(root,'referencias/cultivos/catalogo.json'))),sources=new Map();
const sizes=[144,40,72,112,160,144];
for(const p of catalog){if(!sources.has(p.batch))sources.set(p.batch,PNG.sync.read(fs.readFileSync(path.join(root,'referencias/cultivos',p.batch+'.png'))));const src=sources.get(p.batch);if(src.width!==1536||src.height!==1024)throw Error('Atlas inválido');const dir=path.join(root,'public/assets/visual/crops',p.id);fs.mkdirSync(dir,{recursive:true});
 for(let col=0;col<6;col++){const cell=new PNG({width:256,height:256});PNG.bitblt(src,cell,col*256,p.row*256,256,256,0,0);let left=256,top=256,right=-1,bottom=-1;
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4;cell.data[i+3]=cell.data[i+3]>=160?255:0;if(cell.data[i+3]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}
  if(right<left)throw Error('Sprite vazio: '+p.id+' '+col);const out=new PNG({width:192,height:192}),scale=Math.min(sizes[col]/(right-left+1),sizes[col]/(bottom-top+1)),w=Math.max(1,Math.round((right-left+1)*scale)),h=Math.max(1,Math.round((bottom-top+1)*scale)),ox=Math.floor((192-w)/2),oy=col===0||col===5?Math.floor((192-h)/2):180-h;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=((top+Math.min(bottom-top,Math.floor(y/scale)))*256+left+Math.min(right-left,Math.floor(x/scale)))*4;cell.data.copy(out.data,((oy+y)*192+ox+x)*4,i,i+4);}
  fs.writeFileSync(path.join(dir,col===0?'seed.png':col===5?'harvest.png':`stage-${col-1}.png`),PNG.sync.write(out));
 }
}console.log(catalog.length+' plantas, '+catalog.length*6+' sprites preparados');
