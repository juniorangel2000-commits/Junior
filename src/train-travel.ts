import type Phaser from 'phaser';
import type {SaveData,TilePoint} from './types';
import type {GameUI} from './ui';
import {saveGame} from './systems/save';
import {advanceClock} from './systems/clock';
import {projectDone} from './systems/projects';
import {SCENE_FADE_MS} from './systems/map-transition';

/** Trem do Vale (obra da Estação, preview.48): três paradas, passagem de 30 coroas e meia hora de
 * viagem. Viajar salva a partida no destino e retoma o jogo por lá, como ao "Continuar". */
export type TrainStop='village'|'railway'|'coast';
export const TRAIN_FARE=30,TRAIN_MINUTES=30;
const T=32;
export const TRAIN_STOPS:Readonly<Record<TrainStop,{name:string;stop:TilePoint;arrive:TilePoint;position:'villagePosition'|'railwayPosition'|'coastPosition'}>>={
 village:{name:'Vila',stop:{x:49,y:41},arrive:{x:50,y:42},position:'villagePosition'},
 railway:{name:'Estação',stop:{x:50,y:35},arrive:{x:50,y:36},position:'railwayPosition'},
 coast:{name:'Costa das Marés',stop:{x:31,y:6},arrive:{x:31,y:7},position:'coastPosition'},
};
export const trainRunning=(s:Pick<SaveData,'projects'|'day'>)=>projectDone(s,'vale-estacao');
export const atTrainStop=(s:Pick<SaveData,'projects'|'day'>,here:TrainStop,p:TilePoint)=>trainRunning(s)&&Math.hypot(p.x-(TRAIN_STOPS[here].stop.x+.5)*T,p.y-(TRAIN_STOPS[here].stop.y+.5)*T)<56;
/** `arrive`: ladrilho livre ao lado do ponto, onde o jogador desce do trem (a Vila tem um obstáculo logo abaixo do ponto). */
/** Placa provisória do ponto do trem (poste e tabuleta). */
export function drawTrainSign(scene:Phaser.Scene,here:TrainStop):Phaser.GameObjects.Graphics{
 const p=TRAIN_STOPS[here].stop,x=(p.x+.5)*T,y=(p.y+.5)*T-6,g=scene.add.graphics().setDepth(y);
 g.fillStyle(0x4a3220).fillRect(x-2,y-30,4,30);g.fillStyle(0x7a5232).fillRect(x-16,y-40,32,14);g.fillStyle(0xe8d6a8).fillRect(x-13,y-37,26,8);
 g.fillStyle(0x3a2a1a).fillRect(x-9,y-34,18,2);return g;
}
/** Escolha do destino e viagem. */
export function offerTrain(scene:Phaser.Scene,ui:GameUI,state:()=>SaveData,here:TrainStop,snapshot:()=>SaveData):void{
 const s=state();if(s.animalEscort){ui.toast('Solte a corda antes de embarcar no trem.');return;}
 const dests=(Object.keys(TRAIN_STOPS) as TrainStop[]).filter(d=>d!==here);
 ui.chooseOption('O TREM DO VALE','Para onde?',`Passagem: ${TRAIN_FARE} coroas. A viagem leva meia hora.`,dests.map(d=>({label:TRAIN_STOPS[d].name,run:()=>travel(scene,ui,snapshot(),d)})));
}
function travel(scene:Phaser.Scene,ui:GameUI,current:SaveData,to:TrainStop):void{
 const next=structuredClone(current),economy=next.villageEconomy;
 if(!economy||economy.coins<TRAIN_FARE){ui.toast(`A passagem custa ${TRAIN_FARE} coroas.`);return;}
 economy.coins-=TRAIN_FARE;Object.assign(next,advanceClock(next,TRAIN_MINUTES));
 for(const k of ['homePosition','merchantInterior','blacksmithInterior','communityInterior','ruinsCellarPosition','railwayHallPosition'] as const)delete next[k];
 next.activeArea=to;const stop=TRAIN_STOPS[to];next[stop.position]={x:(stop.arrive.x+.5)*T,y:(stop.arrive.y+.5)*T,direction:'down'};
 if(!saveGame(next)){ui.toast('Não foi possível salvar. A viagem foi cancelada.');return;}
 scene.input.keyboard?.resetKeys();scene.cameras.main.fadeOut(SCENE_FADE_MS);
 scene.time.delayedCall(SCENE_FADE_MS,()=>{
  const mgr=scene.game.scene;
  for(const s of mgr.getScenes(false))if(s.scene.key!=='Vale'&&(s.scene.isActive()||s.scene.isSleeping()||s.scene.isPaused()))s.scene.stop();
  (mgr.getScene('Vale') as unknown as {resumeAfterTravel():void}).resumeAfterTravel();
 });
}
