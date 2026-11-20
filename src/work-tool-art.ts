import Phaser from 'phaser';
import art from '../public/assets/visual/tools/work/art.json';
import {playerMiningMetal} from './data/player-mining';
import {minToolTier} from './data/economy-balance';
type WorkTool=keyof typeof art.tools;
export function preloadWorkTools(scene:Phaser.Scene):void{
 for(const [tool,a]of Object.entries(art.tools))if(!scene.textures.exists('work-tool-source-'+tool))scene.load.image('work-tool-source-'+tool,a.file);
}
/** Arte exclusiva do movimento: os ícones do inventário permanecem intactos. */
export function workToolArt(scene:Phaser.Scene,tool:WorkTool,tier:number){
 const a=art.tools[tool],level=Math.max(minToolTier(tool),Math.min(3,Number.isFinite(tier)?Math.floor(tier):0));
 const source='work-tool-source-'+tool,key=`work-tool-${tool}-${level}`;
 if(!scene.textures.exists(source))return;
 if(!scene.textures.exists(key)){
  const texture=scene.textures.createCanvas(key,a.width,a.height);if(!texture)return;
  const context=texture.context;context.drawImage(scene.textures.get(source).getSourceImage() as HTMLImageElement,0,0);
  const pixels=context.getImageData(0,0,a.width,a.height);
  for(let y=0;y<350;y++)for(let x=0;x<a.width;x++){
   const i=(y*a.width+x)*4;if(!pixels.data[i+3])continue;
   const [r,g,b]=playerMiningMetal(pixels.data[i],pixels.data[i+1],pixels.data[i+2],level);
   pixels.data[i]=r;pixels.data[i+1]=g;pixels.data[i+2]=b;
  }
  context.putImageData(pixels,0,0);texture.refresh().setFilter(Phaser.Textures.FilterMode.NEAREST);
 }
 return{...a,key};
}
