import type Phaser from 'phaser';
import type {SaveData} from './types';
import type {Player} from './player';
import {loadHorseTexture} from './horse-mount';
import {mountProblem,INDOOR_SCENES} from './systems/horse-riding';
import {HORSE_ID,horseTaming} from './systems/horse-taming';
/** Liga a montaria em todos os cenários (docs/construcoes/MONTARIA.md).
 * - V perto do cavalo domado, na Propriedade: monta. V montado: desce.
 * - A cada quadro, o jogador do cenário atual fica montado enquanto `save.riding` existir.
 * - Num cenário fechado (casa, loja, abrigo, mina), o jogador desce e o cavalo volta para casa. */
export type RidingScene=Phaser.Scene&{player?:Player;getFishingState():SaveData;persist():boolean;inHome?:boolean;inShop?:boolean;inBlacksmith?:boolean;
 animals?:{animals:{id:string;x:number;y:number;sprite:{visible:boolean}}[];placeHorse(x:number,y:number):void}};
interface Toaster{toast(message:string):void;isModalOpen():boolean}
const indoors=(s:RidingScene)=>INDOOR_SCENES.includes(s.scene.key)||!!s.inHome||!!s.inShop||!!s.inBlacksmith;
const horseName=(s:SaveData)=>horseTaming(s).name??'o cavalo';
export function installRiding(current:()=>RidingScene|undefined,ui:Toaster):void{
 let loading=false;
 window.addEventListener('keydown',e=>{
  if(e.repeat||e.key.toLowerCase()!=='v'||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.target instanceof HTMLElement&&e.target.matches('input,textarea,select,[contenteditable="true"]'))return;
  const scene=current();if(!scene?.player||ui.isModalOpen()||!scene.sys.isActive())return;
  const s=scene.getFishingState(),p=scene.player;
  if(s.riding){
   delete s.riding;p.dismountHorse();
   if(scene.scene.key==='Vale'&&!scene.inHome){scene.animals?.placeHorse(p.x,p.y+6);ui.toast(`Você desceu de ${horseName(s)}.`);}
   else ui.toast(`Você desceu. ${horseName(s)[0].toUpperCase()+horseName(s).slice(1)} voltou sozinho para a Propriedade.`);
   scene.persist();return;
  }
  if(scene.scene.key!=='Vale'||scene.inHome){ui.toast('Monte no cavalo na Propriedade, perto dele.');return;}
  const problem=mountProblem(s);if(problem){ui.toast(problem);return;}
  const horse=scene.animals?.animals.find(a=>a.id===HORSE_ID&&a.sprite.visible);
  if(!horse||Math.hypot(horse.x-p.x,horse.y-p.y)>56){ui.toast(`Chegue perto de ${horseName(s)} para montar.`);return;}
  if(p.isSwimming)return;
  p.x=horse.x;p.y=horse.y;s.riding=true;
  if(!p.mountHorse()){delete s.riding;return;}
  ui.toast(`Montado em ${horseName(s)} · V para descer · Shift galopa.`);scene.persist();
 });
 return void (function sync(){
  requestAnimationFrame(sync);
  const scene=current();if(!scene?.player||!scene.sys.isActive())return;
  let s:SaveData;try{s=scene.getFishingState();}catch{return;}
  const p=scene.player;
  if(!s.riding){if(p.mounted)p.dismountHorse();return;}
  if(indoors(scene)){delete s.riding;if(p.mounted)p.dismountHorse();ui.toast(`Você desceu para entrar. ${horseName(s)[0].toUpperCase()+horseName(s).slice(1)} voltou para a Propriedade.`);scene.persist();return;}
  if(!p.mounted&&!loading&&!p.isSwimming){loading=true;loadHorseTexture(scene,()=>{loading=false;if(scene.sys.isActive()&&scene.player===p&&s.riding)p.mountHorse();});}
 })();
}
