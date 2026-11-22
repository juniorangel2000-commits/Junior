import type Phaser from 'phaser';
import type {SaveData} from './types';
import {campfiresIn,nearCampfire,placeCampfire,pickUpCampfire,type PlacedCampfire} from './systems/placed-campfires';
/** Fogueiras montadas no chão em todos os cenários ao ar livre (src/systems/placed-campfires.ts).
 * - Desenha as fogueiras do cenário atual, acesas, com luz à noite.
 * - Perto de uma: mostra "E · cozinhar"; E abre o caderno da fogueira (com o botão de recolher). */
export type CampfireScene=Phaser.Scene&{player?:{x:number;y:number;facing?:{x:number;y:number};mounted?:boolean;isSwimming?:boolean};getFishingState():SaveData;persist():boolean;
 syncInventory?(inventory:SaveData['inventory']):void;inHome?:boolean;inShop?:boolean;inBlacksmith?:boolean};
interface Ui{toast(message:string):void;isModalOpen():boolean;showCookbook(save:()=>SaveData,cook:(id:string)=>{ok:boolean;message:string},options:{station:'campfire';onPickUp?:()=>{ok:boolean;message:string};onClose?:()=>void}):void}
const SPACES:Record<string,string>={Vale:'property',Floresta:'forest',Campos:'openFields',Vila:'village',AcessoCidade:'cityForest',Lago:'fishingLake',Serra:'highland',Acampamento:'survivorCamp',Pantano:'swamp',Ruinas:'ruins',Estacao:'railway',Costa:'coast',Pomar:'orchard'};
const KEY='campfire-lit',ANIM='campfire-lit-burn',FRAME={w:487,h:545},WIDTH=30;
/** O lugar da fogueira no cenário atual, ou nada se for um lugar fechado. */
export function campfireSpace(scene:CampfireScene):string|undefined{
 if(scene.inHome||scene.inShop||scene.inBlacksmith)return undefined;
 return SPACES[scene.scene.key];
}
function ensure(scene:Phaser.Scene,done:()=>void):void{
 if(scene.textures.exists(KEY)){done();return;}
 scene.load.spritesheet(KEY,'assets/visual/kitchen/campfire-lit.png',{frameWidth:FRAME.w,frameHeight:FRAME.h});
 scene.load.once('complete',done);scene.load.start();
}
const commit=(scene:CampfireScene,s:SaveData,before:SaveData,change:()=>{ok:boolean;message:string})=>{
 const r=change();if(!r.ok)return r;
 scene.syncInventory?.(s.inventory);
 let saved=false;try{saved=scene.persist();}catch{saved=false;}
 if(!saved){s.inventory=before.inventory;if(before.campfires)s.campfires=before.campfires;else delete s.campfires;scene.syncInventory?.(s.inventory);return{ok:false,message:'Não foi possível salvar. A fogueira ficou como estava.'};}
 return r;
};
/** Monta a fogueira na frente do personagem (usar o item). */
export function placeCampfireInScene(scene:CampfireScene,blocked:(x:number,y:number)=>boolean):{ok:boolean;message:string}{
 const space=campfireSpace(scene),p=scene.player;
 if(!space||!p)return{ok:false,message:'Monte a fogueira ao ar livre.'};
 if(p.isSwimming)return{ok:false,message:'Saia da água para montar a fogueira.'};
 const s=scene.getFishingState(),before=structuredClone(s);
 return commit(scene,s,before,()=>placeCampfire(s,space,p,blocked));
}
export function installCampfires(current:()=>CampfireScene|undefined,ui:Ui,cook:(scene:CampfireScene,id:string)=>{ok:boolean;message:string}):void{
 const views=new WeakMap<Phaser.Scene,{sprites:Map<string,Phaser.GameObjects.Sprite>;label?:Phaser.GameObjects.Text;loading?:boolean}>();
 const near=():{scene:CampfireScene;fire:PlacedCampfire}|undefined=>{
  const scene=current(),space=scene&&campfireSpace(scene);if(!scene||!space||!scene.player||!scene.sys.isActive())return;
  let s:SaveData;try{s=scene.getFishingState();}catch{return;}
  const fire=nearCampfire(s,space,scene.player);return fire?{scene,fire}:undefined;
 };
 window.addEventListener('keydown',e=>{
  if(e.repeat||e.key.toLowerCase()!=='e'||e.ctrlKey||e.metaKey||e.altKey||ui.isModalOpen())return;
  if(e.target instanceof HTMLElement&&e.target.matches('input,textarea,select,[contenteditable="true"]'))return;
  const hit=near();if(!hit)return;
  // Perto da fogueira, E é dela: o cenário não recebe esta tecla.
  e.preventDefault();e.stopImmediatePropagation();
  const {scene,fire}=hit;
  ui.showCookbook(()=>scene.getFishingState(),id=>cook(scene,id),{station:'campfire',onPickUp:()=>{
   const s=scene.getFishingState(),before=structuredClone(s);const r=commit(scene,s,before,()=>pickUpCampfire(s,fire));if(r.ok)ui.toast(r.message);return r;}});
 },true);
 return void (function sync(){
  requestAnimationFrame(sync);
  const scene=current();if(!scene||!scene.sys.isActive())return;
  let view=views.get(scene);if(!view){view={sprites:new Map()};views.set(scene,view);}
  const space=campfireSpace(scene);let s:SaveData|undefined;try{s=scene.getFishingState();}catch{s=undefined;}
  const fires=space&&s?campfiresIn(s,space):[];
  if(fires.length&&!scene.textures.exists(KEY)){if(!view.loading){view.loading=true;ensure(scene,()=>{view!.loading=false;});}return;}
  const live=new Set<string>();
  for(const f of fires){
   const id=`${f.x},${f.y}`;live.add(id);let sp=view.sprites.get(id);
   if(!sp?.active){
    if(!scene.anims.exists(ANIM))scene.anims.create({key:ANIM,frames:scene.anims.generateFrameNumbers(KEY,{start:0,end:2}),frameRate:7,repeat:-1});
    sp=scene.add.sprite(f.x,f.y,KEY,0).setOrigin(.5,.9).setDepth(f.y).setScale(WIDTH/FRAME.w).setData('fixture-light',{radius:60,always:true,strength:1.1});sp.play(ANIM);view.sprites.set(id,sp);
   }
  }
  for(const [id,sp] of view.sprites)if(!live.has(id)){sp.destroy();view.sprites.delete(id);}
  // "E · cozinhar" sobre a fogueira mais perto.
  const hit=space&&s&&scene.player?nearCampfire(s,space,scene.player):undefined;
  if(hit&&!ui.isModalOpen()){
   if(!view.label?.active)view.label=scene.add.text(0,0,'E · cozinhar',{fontFamily:'Georgia,serif',fontSize:'11px',color:'#fff6d8',backgroundColor:'#3b2a1acc',padding:{x:5,y:2}}).setOrigin(.5,1).setResolution(2);
   view.label.setPosition(hit.x,hit.y-30).setDepth(hit.y+500).setVisible(true);
  }else view.label?.setVisible(false);
 })();
}
