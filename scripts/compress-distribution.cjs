// Comprime as imagens da distribuição (dist/) em WebP sem perda, mantendo o nome .png.
// Os originais em public/ não mudam. O navegador (e o Electron) decodifica a imagem pelo
// conteúdo, não pela extensão, então o código e os manifestos continuam apontando para
// os mesmos caminhos. Só pixels totalmente transparentes podem mudar de cor escondida,
// o que não aparece na tela. Cada arquivo só é trocado quando fica menor.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const PNG_SIGNATURE=Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
const isPng=(data)=>data.length>8&&data.subarray(0,8).equals(PNG_SIGNATURE);
const isWebp=(data)=>data.length>12&&data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP';
function listPngs(dir,out=[]){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory())listPngs(file,out);else if(entry.name.toLowerCase().endsWith('.png'))out.push(file);
 }
 return out;
}
/** Converte um PNG em WebP sem perda; devolve o novo conteúdo só se for menor. */
async function compressPng(sharp,data,effort=6){
 if(!isPng(data))return undefined;
 const meta=await sharp(data).metadata();
 // 16 bits por canal perderia precisão em WebP (8 bits): fica como PNG.
 if(meta.depth&&meta.depth!=='uchar')return undefined;
 const out=await sharp(data).webp({lossless:true,effort}).toBuffer();
 return out.length<data.length?out:undefined;
}
async function compressDistribution(root,{effort=6,concurrency=Math.max(1,os.cpus().length-1)}={}){
 let sharp;try{sharp=require('sharp');}catch{return{skipped:'sharp indisponível',files:0,before:0,after:0};}
 const files=listPngs(root);let before=0,after=0,converted=0,next=0;
 const worker=async()=>{while(next<files.length){const file=files[next++];const data=fs.readFileSync(file);before+=data.length;
  const out=await compressPng(sharp,data,effort);if(out){fs.writeFileSync(file,out);after+=out.length;converted++;}else after+=data.length;}};
 await Promise.all(Array.from({length:concurrency},worker));
 return{files:files.length,converted,before,after};
}
if(require.main===module){
 const started=Date.now();
 compressDistribution(path.resolve(__dirname,'../dist')).then(r=>{
  if(r.skipped){console.log(`Imagens: compressão pulada (${r.skipped}).`);return;}
  const mb=n=>(n/1024/1024).toFixed(1);
  console.log(`Imagens: ${r.converted} de ${r.files} PNG comprimidos em WebP sem perda, ${mb(r.before)} MiB → ${mb(r.after)} MiB (${((Date.now()-started)/1000).toFixed(0)} s).`);
 }).catch(e=>{console.error(e);process.exit(1);});
}
module.exports={compressDistribution,compressPng,isPng,isWebp,listPngs};
