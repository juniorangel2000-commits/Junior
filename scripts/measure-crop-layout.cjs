// Mede os PNGs sem alterar a arte; mantém o apoio visual igual no jogo e no editor.
const fs=require('node:fs'),path=require('node:path'),{PNG}=require('pngjs');
const root=path.resolve(__dirname,'..'),catalog=JSON.parse(fs.readFileSync(path.join(root,'referencias/cultivos/catalogo.json'))),layouts={};
function measure(key,file){
 const p=PNG.sync.read(fs.readFileSync(file));let left=p.width,top=p.height,right=-1,bottom=-1;
 for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++)if(p.data[(y*p.width+x)*4+3]>=128){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 if(right<left)throw Error('Sprite vazio: '+file);
 let sum=0,weight=0;const band=Math.max(2,Math.round((bottom-top+1)*.12));
 for(let y=bottom-band+1;y<=bottom;y++)for(let x=left;x<=right;x++){const a=p.data[(y*p.width+x)*4+3];if(a>=128){sum+=x*a;weight+=a;}}
 layouts[key]={width:p.width,height:p.height,left,top,right,bottom,rootX:Math.round(sum/weight)};
}
for(const c of catalog)for(let stage=0;stage<4;stage++)measure(`crop-${c.id}-${stage+1}`,path.join(root,'public/assets/visual/crops',c.id,`stage-${stage}.png`));
measure('crop-planted-seed',path.join(root,'public/assets/visual/crops/planted-seed.png'));
fs.writeFileSync(path.join(root,'src/data/crop-sprite-layout.json'),JSON.stringify(layouts,null,2)+'\n');
console.log(Object.keys(layouts).length+' apoios de sprites medidos');
