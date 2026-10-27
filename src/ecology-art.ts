import type Phaser from 'phaser';
import manifest from '../public/assets/visual/ecology/manifest.json';
import treeManifest from '../public/assets/visual/ecology/tree-stages.json';
import stumpManifest from '../public/assets/visual/ecology/tree-stumps.json';
import soilManifest from '../public/assets/visual/ecology/tree-soil.json';
const icons=new Map<string,string>();
const packs=[
 {key:'ecology-source',file:'herbal-trees.png',frames:manifest.frames.filter(r=>!r.id.includes('seedling')&&!r.id.includes('young')),width:128,height:128,center:false},
 {key:'tree-stages-source',file:'tree-stages-refined.png',frames:treeManifest.frames.filter(r=>!r.id.endsWith('stump')),width:256,height:256,center:false},
 {key:'tree-stumps-source',file:'tree-stumps-wide.png',frames:stumpManifest.frames,width:256,height:256,center:false},
 {key:'tree-soil-source',file:'tree-soil.png',frames:[soilManifest.frame],width:128,height:80,center:true},
];
export const ecologyIcon=(id:string)=>icons.get(id);
export function preloadEcologyArt(scene:Phaser.Scene):void{
 for(const p of packs)if(p.frames.some(r=>!scene.textures.exists('ecology-'+r.id)))scene.load.image(p.key,'assets/visual/ecology/'+p.file);
}
/** Native PNGs stay intact. Logical canvases are fitted once, with no smoothing. */
export function setupEcologyArt(scene:Phaser.Scene):void{
 for(const p of packs){
  if(!scene.textures.exists(p.key))continue;const source=scene.textures.get(p.key).getSourceImage() as HTMLImageElement;
  for(const r of p.frames){
   const key='ecology-'+r.id;if(scene.textures.exists(key))continue;
   const canvas=document.createElement('canvas');canvas.width=p.width;canvas.height=p.height;const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
   const scale=Math.min((p.width-8)/r.width,(p.height-8)/r.height),w=Math.round(r.width*scale),h=Math.round(r.height*scale);
   c.drawImage(source,r.x,r.y,r.width,r.height,Math.round((p.width-w)/2),p.center?Math.round((p.height-h)/2):p.height-4-h,w,h);scene.textures.addCanvas(key,canvas)?.setFilter(0);
   if(['herbs','oakSeed','pineSeed','herbalTonic','fungalInfusion'].includes(r.id))icons.set(r.id==='herbs'?'herb':r.id,canvas.toDataURL('image/png'));
  }
  // Gameplay needs only the small finished textures, not the large source atlas.
  scene.textures.remove(p.key);
 }
}
