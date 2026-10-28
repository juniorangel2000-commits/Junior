import {niloTexture,preloadNiloSprites} from './nilo-sprites';
import {AUGUSTO_SHOP} from './data/augusto-shop';
import {bentoTexture,preloadBentoSprites} from './bento-sprites';
import {augustoTexture,preloadAugustoSprites} from './augusto-sprites';
import {rosaTexture,preloadRosaSprites} from './rosa-sprites';
import {tobiasTexture,preloadTobiasSprites} from './tobias-sprites';
import {ameliaTexture,preloadAmeliaSprites} from './amelia-sprites';
import {ROSA_SHOP} from './data/rosa-shop';
import {TOBIAS_SHOP} from './data/tobias-shop';
import {AMELIA_SHOP} from './data/amelia-shop';
import {NILO_SHOP} from './data/nilo-shop';
import oreFrames from '../public/assets/visual/economy/deposits/rochas-detalhadas.json';
import {preloadMerchantRooms} from './merchant-interior';
import type Phaser from 'phaser';
import {ECONOMY_ART_ROOT as ROOT,ART_TOOL_IDS,TOOL_MATERIALS,MERCHANT_ART_IDS,NPC_ART_DIRECTIONS,tierToolIcon,mineralTexture} from './data/economy-art';
import {CHARACTER_DIRECTIONS} from './character-directions';

/** Dedicated art is loaded beside the original assets; none of the supplied art is replaced. */
export function preloadEconomyArt(scene:Phaser.Scene):void{
 preloadBentoSprites(scene);
 preloadAugustoSprites(scene);
 preloadRosaSprites(scene);
 preloadTobiasSprites(scene);
 preloadAmeliaSprites(scene);
 preloadNiloSprites(scene);
 scene.load.image(ROSA_SHOP.texture,ROSA_SHOP.file);
 scene.load.image(TOBIAS_SHOP.texture,TOBIAS_SHOP.file);
 scene.load.image(AMELIA_SHOP.texture,AMELIA_SHOP.file);
 scene.load.image(NILO_SHOP.texture,NILO_SHOP.file);
 scene.load.image('detailed-ore-atlas',`${ROOT}/deposits/rochas-detalhadas.png`);
 scene.load.image(AUGUSTO_SHOP.texture,AUGUSTO_SHOP.file);
 preloadMerchantRooms(scene);
 for(const metal of ['iron','gold','blackMetal'] as const)scene.load.image(mineralTexture(metal),`${ROOT}/deposits/${metal}.png`);
 for(const tool of ART_TOOL_IDS)for(const [tier,material]of TOOL_MATERIALS.entries())scene.load.image(`economy-tool-${material}-${tool}`,tierToolIcon(tool,tier));
 for(const id of ['anvil','tongs'])scene.load.image(`economy-workshop-${id}`,`${ROOT}/workshop/${id}.png`);
 for(let frame=0;frame<4;frame++)scene.load.image(`economy-forge-${frame}`,`${ROOT}/forge/frame-${frame}.png`);
 for(const id of MERCHANT_ART_IDS)for(const direction of NPC_ART_DIRECTIONS)scene.load.image(`economy-npc-${id}-${direction}`,`${ROOT}/npcs/${id}-${direction}.png`);
}

/** Supplied animation sets use their own atlas. Other merchants retain their
 * original four views, without inventing walk frames. */
export function merchantTexture(scene:Phaser.Scene,id:string):string{
 if(id==='bento')return bentoTexture(scene);
 if(id==='augusto')return augustoTexture(scene);
 if(id==='rosa')return rosaTexture(scene);
 if(id==='tobias')return tobiasTexture(scene);
 if(id==='amelia')return ameliaTexture(scene);
 if(id==='nilo')return niloTexture(scene);
 const key=`village-npc-${id}`;
 if(scene.textures.exists(key))return key;
 const canvas=document.createElement('canvas');canvas.width=192*8;canvas.height=256;
 const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
 for(const [i,direction]of CHARACTER_DIRECTIONS.entries()){
  const view=direction==='up'||direction.startsWith('up-')?'up':direction==='down'||direction.startsWith('down-')?'down':direction;
  const image=scene.textures.get(`economy-npc-${id}-${view}`).getSourceImage() as HTMLImageElement;
  c.drawImage(image,i*192,0,192,256);
 }
 const texture=scene.textures.addCanvas(key,canvas);texture?.setFilter(0);
 for(let frame=0;frame<8;frame++)texture?.add(frame,0,frame*192,0,192,256);
 return key;
}

/** Atlas frames are registered on demand, once per texture manager. */
export function detailedOreFrame(scene:Phaser.Scene,metal:string){
 const frame=oreFrames.find(f=>f.metal===metal);if(!frame||!scene.textures.exists('detailed-ore-atlas'))return;
 const t=scene.textures.get('detailed-ore-atlas');if(!t.has(metal))t.add(metal,0,frame.x,frame.y,frame.width,frame.height);t.setFilter(0);return frame;
}
