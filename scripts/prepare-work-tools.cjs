// Recorta a fonte nativa sem reduzir pixels. A escala só é aplicada no renderer.
const fs=require('node:fs'),{PNG}=require('pngjs'),{createHash}=require('node:crypto');
const root='public/assets/visual/tools/work',bytes=fs.readFileSync(root+'/source.png'),p=PNG.sync.read(bytes);
if(p.width!==2172||p.height!==724)throw Error('Fonte inesperada');
const tools={};
for(const [index,tool]of ['hoe','shovel','sickle'].entries()){
 const cell=new PNG({width:724,height:724});PNG.bitblt(p,cell,index*724,0,724,724,0,0);
 for(let i=3;i<cell.data.length;i+=4)cell.data[i]=cell.data[i]>=200?255:0;
 // Empunhadura: centro do cabo na faixa inferior, antes da extremidade.
 let sum=0,n=0;for(let y=560;y<620;y++)for(let x=0;x<724;x++){const i=(y*724+x)*4;if(cell.data[i+3]){sum+=x;n++;}}
 if(!n)throw Error('Cabo ausente: '+tool);
 const grip=[Math.round(sum/n),590],file=`assets/visual/tools/work/${tool}.png`;
 fs.writeFileSync('public/'+file,PNG.sync.write(cell));tools[tool]={file,width:724,height:724,grip,scale:tool==='sickle'?.045:.05};
}
fs.writeFileSync(root+'/art.json',JSON.stringify({sourceSha256:createHash('sha256').update(bytes).digest('hex'),tools},null,2)+'\n');
