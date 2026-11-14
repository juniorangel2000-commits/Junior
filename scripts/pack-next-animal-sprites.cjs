// Atlas compacto: oito direções × (parado + quatro poses). Fontes preservadas.
const fs=require('node:fs'),{PNG}=require('pngjs'),{createHash}=require('node:crypto');const root=process.argv[2]||'public/assets/animals';
for(const kind of ['pig','duck','rabbit','deer','bee']){
 const dir=`${root}/${kind}`,raw=fs.readFileSync(`${dir}/source.png`),source=PNG.sync.read(raw),cell=224,atlas=new PNG({width:cell*5,height:cell*8}),frames=[];
 for(let row=0;row<8;row++){
  const cuts=Array.from({length:5},(_,col)=>{const x0=Math.floor(col*source.width/5),y0=Math.floor(row*source.height/8),x1=Math.floor((col+1)*source.width/5),y1=Math.floor((row+1)*source.height/8);let x=x1,y=y1,right=x0,bottom=y0;for(let py=y0;py<y1;py++)for(let px=x0;px<x1;px++)if(source.data[(py*source.width+px)*4+3]>=200){x=Math.min(x,px);y=Math.min(y,py);right=Math.max(right,px);bottom=Math.max(bottom,py);}return{x,y,width:right-x+1,height:bottom-y+1};});
  const baseline=Math.max(...cuts.map(c=>c.y+c.height));
  for(const[col,c]of cuts.entries()){
   const x=Math.round(cell/2+c.x-(col+.5)*source.width/5),y=202+c.y-baseline;if(x<0||y<0||x+c.width>cell||y+c.height>cell)throw Error(`Recorte excede célula: ${kind}/${row}/${col}`);
   for(let py=0;py<c.height;py++)for(let px=0;px<c.width;px++){const a=((c.y+py)*source.width+c.x+px)*4,b=(((row*cell+y+py)*atlas.width)+col*cell+x+px)*4;if(source.data[a+3]>=200){atlas.data[b]=source.data[a];atlas.data[b+1]=source.data[a+1];atlas.data[b+2]=source.data[a+2];atlas.data[b+3]=255;}}
   frames.push({row,col,x,y,source:c});
  }
 }
 fs.writeFileSync(`${dir}/atlas.png`,PNG.sync.write(atlas));fs.writeFileSync(`${dir}/atlas.json`,JSON.stringify({cell,columns:5,foot:90,source:'source.png',sha256:createHash('sha256').update(raw).digest('hex'),alphaCutoff:200,directions:['down','left','right','up','down-left','down-right','up-left','up-right'],frames},null,2)+'\n');
}
