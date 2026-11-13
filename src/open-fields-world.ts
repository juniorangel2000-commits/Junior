import {readTerrainSprites} from './terrain-sprites';
import {paintFieldsFloor} from './open-fields-ground';
import {drawExitSign} from './exit-signs';
import Phaser from 'phaser';
import type {SaveData} from './types';
import {FIELDS_SIZE,FIELDS_PROPS,FIELDS_SHED,FIELDS_ANIMALS,MEADOW_PATCHES,FIELDS_IPES,fieldsBlocked,fieldsSafe} from './data/open-fields';
import {meadowGrowth,ipeStanding} from './systems/open-fields';
import {AnimalBrain} from './systems/animals';
import {animalSprite,setupAnimalArt} from './forest-art';
import {preloadAnimalSprites,updateAnimalSprite} from './animal-sprites';
import {CowRestCycle} from './systems/cow-rest';
export function preloadOpenFields(scene:Phaser.Scene){
 for(const key of ['shed'])if(!scene.textures.exists('fields-'+key))scene.load.image('fields-'+key,`assets/visual/open-fields/${key}.png`);
 if(!scene.textures.exists('forest-animals-source'))scene.load.image('forest-animals-source','assets/visual/forest/animals.png');
 preloadAnimalSprites(scene);
}
/** Golden ipê canopy: foliage of an existing tree is remapped to a warm yellow
 * ramp by luminance; trunk, outline and shadow pixels keep their colours. */
export function ensureIpeTexture(scene:Phaser.Scene):void{
 if(scene.textures.exists('fields-ipe')||!scene.textures.exists('asset-tree-1'))return;
 const source=scene.textures.get('asset-tree-1').getSourceImage() as HTMLCanvasElement|HTMLImageElement,canvas=document.createElement('canvas');
 canvas.width=source.width;canvas.height=source.height;const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;c.drawImage(source,0,0);
 const img=c.getImageData(0,0,canvas.width,canvas.height),d=img.data,ramp=[[92,52,14],[168,104,18],[226,162,30],[250,206,72],[255,236,150]];
 for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];if(!d[i+3]||g<=r*1.04||g<=b*1.08)continue;
  const l=Math.min(.999,Math.max(0,(.3*r+.59*g+.11*b)/200)),k=l*(ramp.length-1),j=Math.floor(k),t=k-j;
  for(let n=0;n<3;n++)d[i+n]=Math.round(ramp[j][n]*(1-t)+ramp[Math.min(ramp.length-1,j+1)][n]*t);
  // Sparse blossoms brighten the canopy without changing its silhouette.
  if(((i>>2)*2654435761>>>0)%23===0&&l>.35){d[i]=255;d[i+1]=242;d[i+2]=178;}
 }
 c.putImageData(img,0,0);scene.textures.addCanvas('fields-ipe',canvas)!.setFilter(0);
}
export class OpenFieldsWorld{
 readonly trees:Phaser.GameObjects.Image[]=[];
 readonly ipes=new Map<string,Phaser.GameObjects.Image>();
 readonly ipeStumps=new Map<string,Phaser.GameObjects.Image>();
 readonly patches=new Map<string,Phaser.GameObjects.Image>();
 readonly animals:{brain:AnimalBrain;sprite:Phaser.GameObjects.Sprite;rest?:CowRestCycle;shadow:Phaser.GameObjects.Ellipse}[]=[];
 private roof:Phaser.GameObjects.Image;
 private elapsed=0;
 constructor(private scene:Phaser.Scene,private state:()=>SaveData){
  drawExitSign(scene,{x:48,y:2},{x:48,y:4});
  if(!scene.textures.exists('fields-floor')){const canvas=document.createElement('canvas');canvas.width=FIELDS_SIZE.width;canvas.height=FIELDS_SIZE.height;paintFieldsFloor(canvas.getContext('2d')!,readTerrainSprites(scene)!);scene.textures.addCanvas('fields-floor',canvas)!.setFilter(0);}
  scene.add.image(0,0,'fields-floor').setOrigin(0).setDepth(-100);
  ensureIpeTexture(scene);
  for(const p of FIELDS_IPES){
   this.ipeStumps.set(p.id,scene.add.image(p.x,p.y+4,'forest-detail-stump').setOrigin(.5,1).setDisplaySize(46,34).setDepth(p.y));
   const image=scene.add.image(p.x,p.y,'fields-ipe').setOrigin(.5,1).setDisplaySize(p.width,p.height).setDepth(p.y);this.ipes.set(p.id,image);this.trees.push(image);
  }
  for(const p of FIELDS_PROPS){const image=scene.add.image(p.x,p.y,p.texture).setOrigin(.5,1).setDisplaySize(p.width,p.height).setDepth(p.y);if(p.tree)this.trees.push(image);}
  // Crop in texture coordinates; keep original generated pixels unchanged on disk.
  const tex=scene.textures.get('fields-shed');if(!tex.has('trim'))tex.add('trim',0,125,140,1140,785);
  this.roof=scene.add.image(FIELDS_SHED.x,FIELDS_SHED.y,'fields-shed','trim').setOrigin(.5,1).setDisplaySize(FIELDS_SHED.width,FIELDS_SHED.height).setDepth(FIELDS_SHED.y);
  // Front posts remain opaque while the roof fades over a player inside.
  if(!tex.has('left-post')){tex.add('left-post',0,235,500,110,415);tex.add('right-post',0,1040,500,115,415);}
  scene.add.image(FIELDS_SHED.x-70,FIELDS_SHED.y,'fields-shed','left-post').setOrigin(.5,1).setDisplaySize(21,92).setDepth(FIELDS_SHED.y+1);
  scene.add.image(FIELDS_SHED.x+71,FIELDS_SHED.y,'fields-shed','right-post').setOrigin(.5,1).setDisplaySize(22,92).setDepth(FIELDS_SHED.y+1);
  for(const p of MEADOW_PATCHES){const texture=p.kind==='grass'?`nature-tall-grass-${p.variant}`:p.kind==='herb'?'ecology-herbs':'forest-detail-mushrooms';this.patches.set(p.id,scene.add.image(p.x,p.y,texture).setOrigin(.5,1).setDisplaySize(p.size,p.kind==='grass'?p.size*.8:p.size).setDepth(p.y));}
  setupAnimalArt(scene);
  for(const d of FIELDS_ANIMALS){const saved=state().openFields?.animals?.find(a=>a.id===d.id),p=saved&&fieldsSafe(saved)?saved:d;
   const brain=new AnimalBrain(d.id,d.kind,p.x,p.y,d.kind==='rabbit',(tx,ty)=>fieldsBlocked(tx*32+16,ty*32+16),84,()=>0,fieldsBlocked);if(saved&&p===saved)brain.restore(saved);
   const sprite=animalSprite(scene,d.kind,brain.x,brain.y),shadow=scene.add.ellipse(brain.x,brain.y,d.kind==='cow'?42:17,d.kind==='cow'?12:5,0x29271d,.16);
   this.animals.push({brain,sprite,shadow,...(d.kind==='cow'?{rest:new CowRestCycle(d.id)}:{})});
  }
  this.update(0,{x:0,y:0});
 }
 /** A short sway on each blow; the trunk base stays planted. */
 shakeIpe(id:string):void{const t=this.ipes.get(id);if(!t?.visible)return;this.scene.tweens.killTweensOf(t);t.setRotation(0);this.scene.tweens.add({targets:t,rotation:{from:.045,to:0},duration:260,ease:'Sine.easeOut'});}
 store():void{const s=this.state();s.openFields??={version:1,cut:{}};s.openFields.animals=this.animals.map(a=>a.brain.snapshot());}
 update(dt:number,player:{x:number;y:number}):void{
  this.elapsed+=dt;const s=this.state(),view=this.scene.cameras.main.worldView;
  for(const p of MEADOW_PATCHES){const img=this.patches.get(p.id)!,growth=meadowGrowth(s,p),visible=p.x>view.x-90&&p.x<view.right+90&&p.y>view.y-30&&p.y<view.bottom+90;img.setVisible(visible);if(!visible)continue;
   const scale=p.kind==='grass'?.24+.76*growth:growth>=1?1:.25;img.setDisplaySize(p.size*scale,(p.kind==='grass'?p.size*.8:p.size)*scale).setAlpha(p.kind==='grass'?.8+.2*growth:growth>=1?1:.25);
   img.setRotation(p.kind==='grass'?Math.sin(this.elapsed*1.5+p.x*.018+p.y*.01)*.035*growth:0);
   // At most lower legs are occluded by nearby blades, never the head.
   if(p.kind==='grass'&&Math.abs(player.x-p.x)<25&&Math.abs(player.y-p.y)<20)img.setAlpha(.65);
  }
  for(const p of FIELDS_IPES){const standing=ipeStanding(s,p.id);this.ipes.get(p.id)!.setVisible(standing);this.ipeStumps.get(p.id)!.setVisible(!standing);}
  this.roof.setAlpha(player.x>FIELDS_SHED.x-62&&player.x<FIELDS_SHED.x+62&&player.y>FIELDS_SHED.y-70&&player.y<FIELDS_SHED.y+3?.32:1);
  for(const t of this.trees)t.setAlpha(player.y<t.y&&player.y>t.y-t.displayHeight*.75&&Math.abs(player.x-t.x)<t.displayWidth*.38?.45:1);
  const brains=this.animals.map(a=>a.brain);
  for(const a of this.animals){const near=Math.hypot(a.brain.x-player.x,a.brain.y-player.y)<85;
   a.rest?.update(dt,!near,a.brain.canStand(a.brain.x,a.brain.y),a.brain.direction,!a.brain.moving&&a.brain.mode==='idle');a.brain.resting=!!a.rest?.locked;
   if(a.rest?.locked)a.brain.hold(a.rest.direction);else a.brain.update(dt,player,brains);
   a.shadow.setPosition(a.brain.x,a.brain.y).setDepth(a.brain.y-.2);
   if(!updateAnimalSprite(a.sprite,a.brain,dt,a.rest?.frame()))a.sprite.setPosition(a.brain.x,a.brain.y).setDepth(a.brain.y).setFlipX(a.brain.direction.includes('left'));
  }
 }
}
