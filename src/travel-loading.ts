import type Phaser from 'phaser';
import type {SaveData} from './types';
import {mountWorldLoading} from './world-loading';
/** Tela de carregamento com o cavalo em toda troca de cenário (preview.42, pedido do Junior).
 * Fica numa camada própria por cima do jogo, independente do HUD: aparece quando o cenário de
 * destino começa a carregar, acompanha o carregamento e sai quando o cenário está montado,
 * depois de um tempo mínimo para a viagem não virar um piscar. Enquanto ela está na tela, o
 * cenário fica pausado para o personagem não andar escondido. */
// Entrar em casa (Interior) é só uma porta: não tem a viagem a cavalo.
const AREAS:Record<string,string>={Vale:'property',Floresta:'forest',Campos:'openFields',Vila:'village',AcessoCidade:'cityForest',
 Lago:'fishingLake',Serra:'highland',Acampamento:'survivorCamp',Pantano:'swamp',Ruinas:'ruins',Estacao:'railway',Costa:'coast',Pomar:'orchard',Mina:'highland',Mineracao:'highland',Dungeons:'cityForest'};
const LABELS:Record<string,string>={Mina:'Descendo à mina…',Mineracao:'Descendo à mina…',Dungeons:'Partindo em expedição…'};
export const TRAVEL_MIN_MS=900;
type Info={character?:string;area:string;time?:number};
/** O que mostrar ao chegar no cenário `key` com o save `save`. */
export function travelInfo(key:string,save:Partial<SaveData>|undefined):Info|undefined{
 const area=AREAS[key];if(!area)return undefined;
 return{character:save?.profile?.characterId,area,time:save?.time};
}
export function travelLabel(key:string):string{return LABELS[key]??'Viajando…';}

export function installTravelLoading(game:Phaser.Game,options:{isTitle():boolean}):void{
 let layer:HTMLDivElement|undefined,control:{setProgress(v:number):void}|undefined,shownAt=0,hideTimer=0;
 const paused=new Set<Phaser.Scene>();let lastStarted='';
 const show=(key:string,save:Partial<SaveData>|undefined)=>{
  const info=travelInfo(key,save);if(!info)return false;
  window.clearTimeout(hideTimer);
  if(!layer){layer=document.createElement('div');layer.className='travel-loading';document.body.append(layer);}
  layer.classList.remove('leaving');control=mountWorldLoading(layer,travelLabel(key),info);shownAt=performance.now();
  return true;
 };
 const hide=()=>{
  window.clearTimeout(hideTimer);
  hideTimer=window.setTimeout(()=>{
   for(const s of paused)if(s.sys.isPaused())s.sys.resume();paused.clear();
   const l=layer;if(!l)return;control?.setProgress(1);l.classList.add('leaving');
   window.setTimeout(()=>{if(l.classList.contains('leaving')){l.remove();if(layer===l)layer=undefined;}},320);
  },Math.max(0,TRAVEL_MIN_MS-(performance.now()-shownAt)));
 };
 const hold=(scene:Phaser.Scene)=>{if(!layer||layer.classList.contains('leaving'))return;if(!scene.sys.isPaused()){scene.sys.pause();paused.add(scene);}};
 const watch=(scene:Phaser.Scene)=>{
  const key=scene.sys.settings.key,ev=scene.sys.events;
  ev.on('start',()=>{
   lastStarted=key;if(!AREAS[key])return;
   // A primeira entrada no Vale (abrir o jogo ou carregar a partida) já tem a tela própria.
   if(key==='Vale'||options.isTitle())return;
   const data=scene.sys.settings.data as {save?:SaveData}|undefined;
   if(!show(key,data?.save))return;
   const progress=(v:number)=>control?.setProgress(v);
   scene.load.on('progress',progress);scene.load.once('complete',()=>scene.load.off('progress',progress));
  });
  if(!AREAS[key])return;
  ev.on('create',()=>{if(layer&&!layer.classList.contains('leaving')){hold(scene);hide();}});
  // Voltar para um cenário que estava dormindo (a propriedade) não carrega nada: só a viagem.
  // Espera o cenário terminar de acordar (ele recarrega o save e decide se volta ao título).
  ev.on('wake',()=>{
   const from=lastStarted;
   window.setTimeout(()=>{
    if(options.isTitle()||from==='Interior'||!scene.sys.isActive())return;
    const s=(scene as unknown as {state?:SaveData}).state;
    if(show(key,s)){control?.setProgress(1);hold(scene);hide();}
   },0);
  });
  ev.on('shutdown',()=>{paused.delete(scene);});
 };
 const scenes=()=>game.scene.scenes as Phaser.Scene[];
 if(scenes().length)scenes().forEach(watch);else game.events.once('ready',()=>scenes().forEach(watch));
}
