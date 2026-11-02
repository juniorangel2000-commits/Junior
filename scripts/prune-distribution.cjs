const fs=require('node:fs'),path=require('node:path');
// Historical previews/reference material; originals remain in public/ and in Git.
const PRUNED_PATHS=[
 'dev/augusto/previas','dev/augusto/referencias','dev/augusto/validacao',
 'dev/augusto/index.html','dev/augusto/animacao.html','dev/augusto/LEIA-ME.md',
 'dev/vila-v31/auditoria.json','dev/vila-v31/validacao-tecnica.json',
 'dev/vila-v31/bento/originais','dev/vila-v31/bento/previa-auditoria.png',
 'dev/vila-v31/bento/interior-reconstruido-parcial.png',
 'assets/visual/village/plaza/piso-quadrado.png',
 'assets/visual/village/plaza/piso-pedras-pequenas.png',
 'assets/visual/village/plaza/piso-intertravado.png',
 'assets/visual/village/paving.png','assets/visual/characters/lia.png',
 'assets/visual/property/homestead-mossy-cliff.png',
 // Ground authoring inputs stay in the repository; only the detailed bake ships.
 'assets/visual/highland/terrain.png',
 'assets/visual/highland/terrain-sections',
 'assets/visual/highland/ground-detailed.json',
];
function excludedAsset(file){return PRUNED_PATHS.some(p=>file===p||file.startsWith(p+'/'));}
function size(file){const stat=fs.statSync(file);return stat.isDirectory()?fs.readdirSync(file).reduce((n,name)=>n+size(path.join(file,name)),0):stat.size;}
function pruneDistribution(root){
 const removed=[];
 for(const relative of PRUNED_PATHS){const target=path.join(root,relative);if(!fs.existsSync(target))continue;const bytes=size(target);fs.rmSync(target,{recursive:true});removed.push({file:relative,bytes});}
 return {removed,bytes:removed.reduce((n,f)=>n+f.bytes,0)};
}
if(require.main===module){const report=pruneDistribution(path.resolve(__dirname,'../dist'));console.log(`Pacote: ${(report.bytes/1024/1024).toFixed(2)} MiB de prévias e referências antigas excluídos da distribuição. Originais preservados.`);}
module.exports={PRUNED_PATHS,excludedAsset,pruneDistribution};
