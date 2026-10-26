import Phaser from 'phaser';
import {drawHome,type HomeView,type HomeFurnitureArt} from './home-art';
import {furnitureFootprint,type HomeData} from './systems/home';
import {BLACKSMITH_INTERIOR} from './data/blacksmith-interior';
import {getVisualSettings} from './visual-settings';

/** Every placed fixture is identified by kind, never by its initial ID. */
export function drawBlacksmithInterior(scene:Phaser.Scene,data:HomeData=BLACKSMITH_INTERIOR):HomeView{
 if(!scene.textures.exists('blacksmith-counter-single')){
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=96;
  const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
  c.drawImage(scene.textures.get('blacksmith-counter-left').getSourceImage() as HTMLImageElement,0,0,32,96,0,0,32,96);
  c.drawImage(scene.textures.get('blacksmith-counter-right').getSourceImage() as HTMLImageElement,32,0,32,96,32,0,32,96);
  scene.textures.addCanvas('blacksmith-counter-single',canvas)?.setFilter(0);
 }
 const fixtures:Record<string,HomeFurnitureArt>={
  armorStand:{key:'blacksmith-armor-stand',w:48,h:72},partsShelf:{key:'blacksmith-parts-shelf',w:64,h:56},
  smithWorkbench:{key:'blacksmith-counter',w:64,h:48},anvil:{key:'economy-workshop-anvil',w:40,h:40},
  ironStock:{key:'blacksmith-iron-stock',w:64,h:40},grindstone:{key:'blacksmith-grindstone',w:44,h:52},
  weaponRack:{key:'blacksmith-weapon-rack',w:64,h:64},bellows:{key:'blacksmith-bellows',w:40,h:36},
  coalBin:{key:'blacksmith-coal-bin',w:32,h:32},fireplace:{key:'economy-forge-1',w:72,h:72},
  toolRack:{key:'blacksmith-tool-rack',w:80,h:52,depth:-900},
 };
 const view=drawHome(scene,data,p=>{
  if(p.kind==='counter'){
   const left=data.furniture.some(n=>n.kind==='counter'&&n.y===p.y&&n.x===p.x-1),right=data.furniture.some(n=>n.kind==='counter'&&n.y===p.y&&n.x===p.x+1);
   return{key:`blacksmith-counter-${left&&right?'middle':left?'right':right?'left':'single'}`,w:32,h:48};
  }
  if(p.kind==='tongs'){
   const support=data.furniture.find(n=>['counter','smithWorkbench'].includes(n.kind)&&furnitureFootprint(n).some(t=>t.x===p.x&&t.y===p.y))!;
   return{key:'economy-workshop-tongs',w:20,h:20,offsetX:7,offsetY:-26,depth:(support.y+1)*32+1};
  }
  return fixtures[p.kind];
 });
 for(const image of view.objects){
  if(!image.getData('homeFurnitureId'))continue;
  image.setData('blacksmith-fixture',image.texture.key);
  const piece=data.furniture.find(p=>p.id===image.getData('homeFurnitureId'))!;
  if(piece.kind==='fireplace')image.setData('blacksmith-hearth',true);
 }
 const hearths=view.objects.filter(o=>o.getData('blacksmith-hearth'));
 if(!hearths.length)return view;
 const effects=hearths.map(hearth=>{
 // Reuse the three authored burning-forge frames. The masonry remains still;
 // only the existing fire animation changes, without generating more textures.
 const glow=scene.add.graphics().setPosition(hearth.x,hearth.y-13).setDepth(5003).setBlendMode(Phaser.BlendModes.ADD).setData('blacksmith-hearth-light',true);
 for(let ring=5;ring>0;ring--)glow.fillStyle(0xffb45b,.016).fillEllipse(0,15,ring*24,ring*13);
 glow.fillStyle(0xffd385,.045).fillCircle(0,0,13);
 let elapsed=0;
 const update=(_time:number,delta:number)=>{
  // A doorway timer can destroy the room earlier in the same update event.
  // EventEmitter's current listener snapshot may still call us once afterward.
  if(!hearth.active||!hearth.scene||!glow.active)return;
  if(Number.isFinite(delta))elapsed+=Math.max(0,Math.min(delta,100));
  hearth.setTexture(`economy-forge-${1+Math.floor(elapsed/150)%3}`).setDisplaySize(72,72);
  const settings=getVisualSettings();glow.setVisible(settings.dynamicLighting&&settings.intensity>0).setAlpha(settings.intensity*(.94+Math.sin(elapsed*.008)*.06));
 };
 scene.events.on('update',update);update(0,0);
 return()=>{scene.events.off('update',update);glow.destroy();};
 });
 return{objects:view.objects,destroy:()=>{effects.forEach(destroy=>destroy());view.destroy();}};
}
