import {preloadMeadowGrass,setupMeadowGrass,meadowGrassFrame,MEADOW_GRASS_TEXTURE,MEADOW_GRASS_RATIO} from './meadow-grass-art';
import {meadowPatchesInRect} from './systems/meadow-visibility';
import {IPE_ART} from './data/ipe-art';
import {HorseIdleCycle} from './systems/horse-idle';
import {HORSE_ID,TAMING_DAYS,horseTaming,horseLeftFields,tamingPhase,feedingDay,fedToday} from './systems/horse-taming';
import {ANIMAL_BEHAVIOR} from './systems/animals';
import {readTerrainSprites} from './terrain-sprites';
import {paintFieldsFloor} from './open-fields-ground';
import {drawExitSign} from './exit-signs';
import {drawBridges} from './bridge-art';
import {addWaterMotion} from './water-motion';
import {FIELDS_BRIDGES} from './data/bridges';
import Phaser from 'phaser';
import type {SaveData} from './types';
import {FIELDS_SIZE,FIELDS_PROPS,FIELDS_SHED,FIELDS_ANIMALS,MEADOW_PATCHES,FIELDS_IPES,fieldsSafe,fieldsWater,fieldsRiverEdge,FIELDS_COAST_SIGN,FIELDS_NORTH_SIGN} from './data/open-fields';
import {meadowGrowth,ipeStanding,createFieldAnimalBrain} from './systems/open-fields';
import {wildSpawns,wildTaken} from './systems/wild-spawns';
import {wildAnimal} from './data/wild-animals';
import {domesticAnimal} from './data/domestic-animals';
import type {AnimalKind} from './data/ancient-forest';
import type {AnimalBrain} from './systems/animals';
import {animalSprite,setupAnimalArt} from './forest-art';
import {preloadAnimalSprites,updateAnimalSprite,animalRopeAnchor} from './animal-sprites';
import {CowRestCycle} from './systems/cow-rest';
import {trapSwarmed} from './systems/beekeeping';
import {drawValleySeams} from './valley-seams';
export function preloadOpenFields(scene:Phaser.Scene){
 preloadMeadowGrass(scene);
 if(!scene.textures.exists('fields-ipe'))scene.load.image('fields-ipe','assets/visual/open-fields/ipe-yellow.png');
 for(const key of ['shed'])if(!scene.textures.exists('fields-'+key))scene.load.image('fields-'+key,`assets/visual/open-fields/${key}.png`);
 if(!scene.textures.exists('fields-harvest-basket'))scene.load.image('fields-harvest-basket','assets/visual/crops/harvest-basket.png');
 if(!scene.textures.exists('fields-empty-hive'))scene.load.image('fields-empty-hive','assets/visual/kitchen/empty-hive.png');
 if(!scene.textures.exists('fields-swarmed-hive'))scene.load.image('fields-swarmed-hive','assets/visual/machines/beehive-icon.png');
 if(!scene.textures.exists('forest-animals-source'))scene.load.image('forest-animals-source','assets/visual/forest/animals.png');
 preloadAnimalSprites(scene);
}
/** A arte mantém seus pixels originais; o recorte remove só a margem transparente. */
export function ensureIpeTexture(scene:Phaser.Scene):void{
 if(!scene.textures.exists('fields-ipe'))return;
 const texture=scene.textures.get('fields-ipe'),f=IPE_ART.frame;
 if(!texture.has('tree'))texture.add('tree',0,f.x,f.y,f.width,f.height);
 texture.setFilter(0);
}
type FieldAnimal={brain:AnimalBrain;sprite:Phaser.GameObjects.Sprite;rest?:CowRestCycle;idle?:HorseIdleCycle;shadow:Phaser.GameObjects.Ellipse};
export interface OpenFieldsHooks{horseAte?:()=>void}
export class OpenFieldsWorld{
 readonly trees:Phaser.GameObjects.Image[]=[];
 readonly ipes=new Map<string,Phaser.GameObjects.Image>();
 readonly ipeStumps=new Map<string,Phaser.GameObjects.Image>();
 readonly patches=new Map<string,Phaser.GameObjects.Image>();
 readonly animals:FieldAnimal[]=[];
 private rope!:Phaser.GameObjects.Graphics;
 /** Soltos longe de casa (da Costa): correm até a descida para a praia e somem (preview.48). */
 private readonly returning=new Map<string,{target:{x:number;y:number};time:number}>();
 runHome(id:string,exit:{x:number;y:number}):void{if(this.animals.some(a=>a.brain.id===id))this.returning.set(id,{target:exit,time:0});}
 private horseUi:Phaser.GameObjects.Graphics;
 private basket:Phaser.GameObjects.Image;
 /** Colmeias junto aos ipês, por id. */
 private hives=new Map<number,Phaser.GameObjects.Image>();
 private horseLabel:Phaser.GameObjects.Text;
 private roof:Phaser.GameObjects.Image;
 private elapsed=0;
 private visiblePatches=new Set<string>();
 constructor(private scene:Phaser.Scene,private state:()=>SaveData,private hooks:OpenFieldsHooks={}){
  drawExitSign(scene,FIELDS_NORTH_SIGN.exit,FIELDS_NORTH_SIGN.entry);
  if(!scene.textures.exists('fields-floor')){const canvas=document.createElement('canvas');canvas.width=FIELDS_SIZE.width;canvas.height=FIELDS_SIZE.height;paintFieldsFloor(canvas.getContext('2d')!,readTerrainSprites(scene)!);scene.textures.addCanvas('fields-floor',canvas)!.setFilter(0);}
  scene.add.image(0,0,'fields-floor').setOrigin(0).setDepth(-100);
  drawValleySeams(scene,'openFields',fieldsWater);
  // Rio que vem da propriedade e segue para a Costa: água animada e as mesmas pontes da propriedade.
  addWaterMotion(scene,(x,y)=>fieldsWater((x+.5)*32,(y+.5)*32),fieldsWater,{...FIELDS_SIZE,alpha:.32,opacity:(x,y)=>.3+.7*Math.min(1,-fieldsRiverEdge(x,y)/40)});
  drawBridges(scene,FIELDS_BRIDGES);
  drawExitSign(scene,FIELDS_COAST_SIGN.exit,FIELDS_COAST_SIGN.entry);
  ensureIpeTexture(scene);setupMeadowGrass(scene);
  for(const p of FIELDS_IPES){
   this.ipeStumps.set(p.id,scene.add.image(p.x,p.y+4,'forest-detail-stump').setOrigin(.5,1).setDisplaySize(46,34).setDepth(p.y));
   const image=scene.add.image(p.x,p.y,'fields-ipe','tree').setOrigin(IPE_ART.originX,1).setDisplaySize(p.width,p.height).setDepth(p.y);this.ipes.set(p.id,image);this.trees.push(image);
  }
  for(const p of FIELDS_PROPS){const image=scene.add.image(p.x,p.y,p.texture).setOrigin(.5,1).setDisplaySize(p.width,p.height).setDepth(p.y);if(p.tree)this.trees.push(image);}
  // Crop in texture coordinates; keep original generated pixels unchanged on disk.
  const tex=scene.textures.get('fields-shed');if(!tex.has('trim'))tex.add('trim',0,125,140,1140,785);
  this.roof=scene.add.image(FIELDS_SHED.x,FIELDS_SHED.y,'fields-shed','trim').setOrigin(.5,1).setDisplaySize(FIELDS_SHED.width,FIELDS_SHED.height).setDepth(FIELDS_SHED.y);
  // Front posts remain opaque while the roof fades over a player inside.
  if(!tex.has('left-post')){tex.add('left-post',0,235,500,110,415);tex.add('right-post',0,1040,500,115,415);}
  scene.add.image(FIELDS_SHED.x-70,FIELDS_SHED.y,'fields-shed','left-post').setOrigin(.5,1).setDisplaySize(21,92).setDepth(FIELDS_SHED.y+1);
  scene.add.image(FIELDS_SHED.x+71,FIELDS_SHED.y,'fields-shed','right-post').setOrigin(.5,1).setDisplaySize(22,92).setDepth(FIELDS_SHED.y+1);
  for(const p of MEADOW_PATCHES){const texture=p.kind==='grass'?MEADOW_GRASS_TEXTURE:p.kind==='herb'?'ecology-herbs':'forest-detail-mushrooms';this.patches.set(p.id,scene.add.image(p.x,p.y,texture,p.kind==='grass'?p.variant*4:undefined).setVisible(false).setOrigin(.5,1).setDisplaySize(p.size,p.kind==='grass'?p.size*MEADOW_GRASS_RATIO:p.size).setDepth(p.y));}
  setupAnimalArt(scene);
  const s0=state(),escortId=s0.animalEscort?.area==='openFields'?s0.animalEscort.id:undefined;
  const today=wildSpawns('openFields',s0.day,wildTaken(s0));
  const led=escortId&&escortId!==HORSE_ID&&!today.some(a=>a.id===escortId)?(()=>{const k=domesticAnimal(escortId),p=s0.openFields?.animals?.find(a=>a.id===escortId);return k&&p?[{id:escortId,kind:k.kind,x:p.x,y:p.y}]:[];})():[];
  const defs:{id:string;kind:AnimalKind;x:number;y:number}[]=[...FIELDS_ANIMALS,...today,...led];
  for(const d of defs){if(d.id===HORSE_ID&&horseLeftFields(s0))continue;
   // Os soltos nascem no ponto sorteado do dia; só o cavalo, os coelhos e quem está na corda retomam a posição salva.
   const wild=!!wildAnimal(d.id),saved=wild&&d.id!==escortId?undefined:s0.openFields?.animals?.find(a=>a.id===d.id),p=saved&&fieldsSafe(saved)?saved:d;
   const brain=createFieldAnimalBrain(d,p);if(saved&&p===saved)brain.restore(saved);
   if(!this.placeSafely(brain))continue;
   const big=d.kind==='horse'||d.kind==='cow',sprite=animalSprite(scene,d.kind,brain.x,brain.y),shadow=scene.add.ellipse(brain.x,brain.y,d.kind==='horse'?56:d.kind==='cow'?42:d.kind==='sheep'?30:17,big?(d.kind==='horse'?15:12):d.kind==='sheep'?9:5,0x29271d,.16);
   this.animals.push({brain,sprite,shadow,...(d.kind==='horse'?{idle:new HorseIdleCycle(d.id)}:{}),...(d.kind==='cow'?{rest:new CowRestCycle(d.id)}:{})});
  }
  this.basket=scene.add.image(0,0,'fields-harvest-basket').setOrigin(.5,.85).setDisplaySize(32,29).setVisible(false);
  this.horseUi=scene.add.graphics().setDepth(10000);
  this.rope=scene.add.graphics();
  this.horseLabel=scene.add.text(0,0,'',{fontFamily:'Georgia, serif',fontSize:'11px',color:'#fff4d6',stroke:'#2d2418',strokeThickness:3}).setOrigin(.5,1).setDepth(10001).setVisible(false);
  this.update(0,{x:0,y:0});
 }
 /** Afasta do ponto sorteado se ele estiver ocupado (outro bicho ou obstáculo). */
 private placeSafely(brain:AnimalBrain):boolean{
  const ok=(x:number,y:number)=>brain.canStand(x,y)&&fieldsSafe({x,y})&&this.animals.every(a=>Math.hypot(a.brain.x-x,a.brain.y-y)>brain.radius+a.brain.radius+4);
  if(ok(brain.x,brain.y))return true;
  for(let r=24;r<=240;r+=24)for(let i=0;i<12;i++){const x=brain.x+Math.cos(i*Math.PI/6)*r,y=brain.y+Math.sin(i*Math.PI/6)*r;if(ok(x,y)){brain.x=x;brain.y=y;return true;}}
  return false;
 }
 /** O animal solto mais perto, ao alcance da corda (não o cavalo, que tem doma própria). */
 nearestWild(player:{x:number;y:number}):FieldAnimal|undefined{
  return this.animals.filter(a=>wildAnimal(a.brain.id)&&!this.returning.has(a.brain.id)&&a.sprite.visible&&Math.hypot(a.brain.x-player.x,a.brain.y-player.y)<=ANIMAL_BEHAVIOR.catchRadius&&a.brain.lineClear(a.brain,player))
   .sort((a,b)=>Math.hypot(a.brain.x-player.x,a.brain.y-player.y)-Math.hypot(b.brain.x-player.x,b.brain.y-player.y))[0];
 }
 led(id:string|undefined):FieldAnimal|undefined{return id?this.animals.find(a=>a.brain.id===id):undefined;}
 get horse():FieldAnimal|undefined{return this.animals.find(a=>a.brain.id===HORSE_ID);}
 /** Cesta no chão que o cavalo aceita buscar agora, conforme a fase da doma. */
 private basketFor(s:SaveData,player:{x:number;y:number},clearance:number){
  const t=horseTaming(s),b=t.basket;if(!b||t.tamed||fedToday(s)||Math.hypot(b.x-player.x,b.y-player.y)<clearance)return;
  return b;
 }
 private updateHorse(a:FieldAnimal,dt:number,player:{x:number;y:number;leftHandPosition?:{x:number;y:number}},brains:AnimalBrain[],s:SaveData,grass:boolean):void{
  const t=horseTaming(s),escort=s.animalEscort?.id===HORSE_ID&&s.animalEscort.area==='openFields',range=Math.hypot(a.brain.x-player.x,a.brain.y-player.y),phase=tamingPhase(feedingDay(s));
  a.brain.fleeRadius=t.tamed||escort?0:phase.flee;a.brain.resting=false;
  let target:{x:number;y:number}|undefined,arrival=32,led=false;
  if(escort){target=player;led=true;arrival=ANIMAL_BEHAVIOR.followDistance;}
  // Domado, ele vem até você por conta própria.
  else if(t.tamed){if(range>60&&range<420){
   // Domado e você longe: termina o que estava fazendo (até a cesta) e vem até você.
   if(a.idle?.locked)a.idle.finish();else{target=player;led=true;arrival=36;}}}
  else if(!a.idle?.locked){const basket=this.basketFor(s,player,phase.clearance);
   // Come ao alcançar a cesta com a cabeça; o corpo largo não precisa pisar nela.
   if(basket){if(Math.hypot(basket.x-a.brain.x,basket.y-a.brain.y)<44){this.hooks.horseAte?.();a.idle?.eatBasket(a.brain.direction);}else{target=basket;led=true;arrival=26;}}}
  if(!led)a.idle?.update(dt,!a.brain.moving&&a.brain.mode==='idle',!t.tamed&&range<phase.flee,a.brain.direction,grass);
  if(a.idle?.locked){a.brain.resting=true;a.brain.hold(a.idle.direction);}
  else a.brain.update(dt,target??player,brains,led,arrival,escort);
  a.shadow.setPosition(a.brain.x,a.brain.y).setDepth(a.brain.y-.2);
  if(!updateAnimalSprite(a.sprite,a.brain,dt,a.idle?.frame()))a.sprite.setPosition(a.brain.x,a.brain.y).setDepth(a.brain.y).setFlipX(a.brain.direction.includes('left'));
  this.drawHorseUi(a,s,range);
  if(escort){const head=animalRopeAnchor(a.sprite,a.brain),hand=player.leftHandPosition??player,g=this.horseUi;
   for(const [width,color]of [[1.8,0x4b351f],[.9,0xb58b52]] as const){g.lineStyle(width,color,.95).beginPath();g.moveTo(hand.x,hand.y);g.lineTo(head.x,head.y);g.strokePath();}
   g.setDepth(Math.min(player.y,a.brain.y)-.1);}else this.horseUi.setDepth(10000);
 }
 /** Barra de confiança (7 dias) sobre o cavalo selvagem e o nome sobre o domado. */
 private drawHorseUi(a:FieldAnimal,s:SaveData,range:number):void{
  const t=horseTaming(s),g=this.horseUi,x=a.brain.x,y=a.brain.y-a.sprite.displayHeight*.5-8;g.clear();
  this.horseLabel.setVisible(t.tamed&&!!t.name&&range<520);if(this.horseLabel.visible)this.horseLabel.setText(t.name!).setPosition(x,y+6);
  if(t.tamed||range>520||!t.trust&&!t.basket)return;
  const w=9,gap=2,total=TAMING_DAYS*w+(TAMING_DAYS-1)*gap,left=Math.round(x-total/2);
  g.fillStyle(0x2d2418,.85).fillRoundedRect(left-3,y-3,total+6,w-1+6,3);
  for(let i=0;i<TAMING_DAYS;i++)g.fillStyle(i<t.trust?0xf0c34a:0x6b5a3d,1).fillRect(left+i*(w+gap),y,w,w-1);
 }
 /** A short sway on each blow; the trunk base stays planted. */
 shakeIpe(id:string):void{const t=this.ipes.get(id);if(!t?.visible)return;this.scene.tweens.killTweensOf(t);t.setRotation(0);this.scene.tweens.add({targets:t,rotation:{from:.045,to:0},duration:260,ease:'Sine.easeOut'});}
 store():void{const s=this.state();s.openFields??={version:1,cut:{}};s.openFields.animals=this.animals.filter(a=>!this.returning.has(a.brain.id)).map(a=>a.brain.snapshot());}
 update(dt:number,player:{x:number;y:number;leftHandPosition?:{x:number;y:number}}):void{
  this.elapsed+=dt;const s=this.state(),view=this.scene.cameras.main.worldView;
  const visible=meadowPatchesInRect(view.x-90,view.y-30,view.right+90,view.bottom+90),ids=new Set(visible.map(p=>p.id));
  for(const id of this.visiblePatches)if(!ids.has(id))this.patches.get(id)!.setVisible(false);
  this.visiblePatches=ids;
  for(const p of visible){const img=this.patches.get(p.id)!,growth=meadowGrowth(s,p);if(!img.visible)img.setVisible(true);
   const scale=p.kind==='grass'?.24+.76*growth:growth>=1?1:.25;img.setDisplaySize(p.size*scale,(p.kind==='grass'?p.size*MEADOW_GRASS_RATIO:p.size)*scale).setAlpha(p.kind==='grass'?.8+.2*growth:growth>=1?1:.25);
   if(p.kind==='grass'){const frame=growth>=1?meadowGrassFrame(p.variant,this.elapsed,p.x,p.y):p.variant*4;if(String(img.frame.name)!==String(frame))img.setFrame(frame);}
   // At most lower legs are occluded by nearby blades, never the head.
   if(p.kind==='grass'&&Math.abs(player.x-p.x)<25&&Math.abs(player.y-p.y)<20)img.setAlpha(.65);
  }
  const placed=horseTaming(s).basket;this.basket.setVisible(!!placed);if(placed)this.basket.setPosition(placed.x,placed.y).setDepth(placed.y);
  const traps=s.beekeeping?.traps??[],live=new Set(traps.map(t=>t.id));
  for(const[id,img]of this.hives)if(!live.has(id)){img.destroy();this.hives.delete(id);}
  for(const t of traps){const key=trapSwarmed(t,s.day)?'fields-swarmed-hive':'fields-empty-hive';let img=this.hives.get(t.id);
   if(!img){img=this.scene.add.image(t.x,t.y,key).setOrigin(.5,.9);this.hives.set(t.id,img);}
   if(img.texture.key!==key)img.setTexture(key);img.setDisplaySize(22,22*img.height/img.width).setPosition(t.x,t.y).setDepth(t.y);}
  for(const p of FIELDS_IPES){const standing=ipeStanding(s,p.id);this.ipes.get(p.id)!.setVisible(standing);this.ipeStumps.get(p.id)!.setVisible(!standing);}
  this.roof.setAlpha(player.x>FIELDS_SHED.x-62&&player.x<FIELDS_SHED.x+62&&player.y>FIELDS_SHED.y-70&&player.y<FIELDS_SHED.y+3?.32:1);
  for(const t of this.trees)t.setAlpha(player.y<t.y&&player.y>t.y-t.displayHeight*.75&&Math.abs(player.x-t.x)<t.displayWidth*.38?.45:1);
  const brains=this.animals.map(a=>a.brain);
  const grassNear=(b:AnimalBrain)=>meadowPatchesInRect(b.x-56,b.y-56,b.x+56,b.y+56).some(p=>p.kind==='grass'&&Math.hypot(p.x-b.x,p.y-b.y)<56&&meadowGrowth(s,p)>=1);
  let ropeTo:FieldAnimal|undefined;
  for(const a of [...this.animals]){
   const back=this.returning.get(a.brain.id);
   if(back){back.time+=dt;a.brain.fleeRadius=0;a.brain.sprint=true;a.brain.update(dt,back.target,brains,true,12,false);
    a.shadow.setPosition(a.brain.x,a.brain.y).setDepth(a.brain.y-.2);if(!updateAnimalSprite(a.sprite,a.brain,dt))a.sprite.setPosition(a.brain.x,a.brain.y).setDepth(a.brain.y).setFlipX(a.brain.direction.includes('left'));
    if(Math.hypot(a.brain.x-back.target.x,a.brain.y-back.target.y)<40||back.time>14){a.sprite.destroy();a.shadow.destroy();this.animals.splice(this.animals.indexOf(a),1);this.returning.delete(a.brain.id);}
    continue;}
   if(a.brain.id===HORSE_ID){this.updateHorse(a,dt,player,brains,s,grassNear(a.brain));continue;}const near=Math.hypot(a.brain.x-player.x,a.brain.y-player.y)<ANIMAL_BEHAVIOR.detectionRadius;
   a.rest?.update(dt,!near,a.brain.canStand(a.brain.x,a.brain.y),a.brain.direction,!a.brain.moving&&a.brain.mode==='idle');a.brain.resting=!!a.rest?.locked;
   a.idle?.update(dt,!a.brain.moving&&a.brain.mode==='idle',Math.hypot(a.brain.x-player.x,a.brain.y-player.y)<196,a.brain.direction,grassNear(a.brain));
   if(a.idle?.locked)a.brain.resting=true;
   // Na corda (preview.48): segue o jogador e não foge; solto de novo, volta a fugir normalmente.
   const led=s.animalEscort?.area==='openFields'&&s.animalEscort.id===a.brain.id;a.brain.fleeRadius=led?0:undefined;
   if(led){a.brain.resting=false;a.rest?.update(dt,false,false,a.brain.direction,false);a.brain.update(dt,player,brains,true,ANIMAL_BEHAVIOR.followDistance,true);}
   else if(a.idle?.locked)a.brain.hold(a.idle.direction);else if(a.rest?.locked)a.brain.hold(a.rest.direction);else a.brain.update(dt,player,brains);
   a.shadow.setPosition(a.brain.x,a.brain.y).setDepth(a.brain.y-.2);
   if(!updateAnimalSprite(a.sprite,a.brain,dt,a.idle?.frame()??a.rest?.frame()))a.sprite.setPosition(a.brain.x,a.brain.y).setDepth(a.brain.y).setFlipX(a.brain.direction.includes('left'));
   if(led)ropeTo=a;
  }
  const g=this.rope;g.clear();if(!ropeTo)return;
  const head=animalRopeAnchor(ropeTo.sprite,ropeTo.brain),hand=player.leftHandPosition??player;
  g.setDepth(Math.min(player.y,ropeTo.brain.y)-.1);
  for(const [width,color]of [[1.8,0x4b351f],[.9,0xb58b52]] as const){g.lineStyle(width,color,.95).beginPath();g.moveTo(hand.x,hand.y);g.lineTo(head.x,head.y);g.strokePath();}
 }
}
