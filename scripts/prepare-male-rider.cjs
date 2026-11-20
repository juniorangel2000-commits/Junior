const fs=require('node:fs');
const {PNG}=require('pngjs');
const source=PNG.sync.read(fs.readFileSync('referencias/personagens/montaria/masculino-proposta.png'));
if(source.width!==1536||source.height!==1024)throw Error('Esperado 4 × 2 quadros de 384 × 512');
for(let i=0;i<source.data.length;i+=4){
  if(source.data[i+3]<200)source.data.fill(0,i,i+4);
  else source.data[i+3]=255;
}
fs.writeFileSync('public/assets/animals/horse-rider/farmer-male-seated.png',PNG.sync.write(source));
