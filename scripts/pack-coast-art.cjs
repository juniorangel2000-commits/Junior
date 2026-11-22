const fs=require('node:fs');
const path=require('node:path');
const {PNG}=require('pngjs');

const root=path.resolve(__dirname,'..');
const read=name=>PNG.sync.read(fs.readFileSync(path.join(root,'referencias/cenarios/costa-das-mares',name+'.png')));
const output=path.join(root,'public/assets/visual/coast');
const save=(name,image)=>fs.writeFileSync(path.join(output,name+'.png'),PNG.sync.write(image));
fs.mkdirSync(output,{recursive:true});

function cut(name,source,[left,top,right,bottom]){
  let x0=right,y0=bottom,x1=left,y1=top;
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
    if(source.data[(y*source.width+x)*4+3]<76)continue;
    x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
  }
  if(x1<x0||y1<y0)throw new Error('Sem arte: '+name);
  const w=x1-x0+1,h=y1-y0+1,sprite=new PNG({width:w+4,height:h+4});
  PNG.bitblt(source,sprite,x0,y0,w,h,2,2);
  for(let i=0;i<sprite.data.length;i+=4)if(sprite.data[i+3]<48)sprite.data.fill(0,i,i+4);
  save(name,sprite);
  return sprite;
}
const built=read('construcoes'),nature=read('natureza'),pierSource=read('pier');
for(const [name,box] of Object.entries({
  hut:[0,0,458,530],boat:[1080,0,1536,530],
  'net-rack':[0,544,482,1024],'broken-fence':[482,544,1100,1024],lantern:[1100,544,1536,1024],
}))cut(name,built,box);
for(const [name,box] of Object.entries({
  rocks:[0,0,525,512],driftwood:[525,0,1024,512],'tall-grass':[1024,0,1536,512],
  groundcover:[0,512,530,1024],shells:[530,512,1000,1024],'dune-grass':[1000,512,1536,1024],
}))cut(name,nature,box);
const pier=cut('pier',pierSource,[0,0,pierSource.width,pierSource.height]);
const nearRail=new PNG({width:pier.width,height:pier.height}),strip=Math.floor(pier.height*.62);
PNG.bitblt(pier,nearRail,0,strip,pier.width,pier.height-strip,0,strip);
save('pier-front',nearRail);
