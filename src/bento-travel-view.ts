import {showBentoExpedition,bentoExpeditionStatus} from './bento-expedition-menu';
import type {BentoWorkRuntime} from './systems/bento-commit';
import type Phaser from 'phaser';
import {preloadBentoWorkArt,bentoWorkPose} from './bento-work-art';
import type {SaveData,TilePoint,HudData} from './types';
import type {GameUI} from './ui';
import {preloadBentoSprites,bentoTexture,BENTO_WALK_FRAMES,BENTO_DISPLAY} from './bento-sprites';
import {CHARACTER_HEIGHT} from './character-sprites';
import {characterFrame,directionFromVector} from './character-directions';
import {BENTO_WEEKLY_PLAN} from './data/bento-schedule';
import type {BentoTravelArea} from './systems/bento-travel-state';
import {bentoAvailability} from './systems/bento-schedule';
export const preloadBentoTravel=(scene:Phaser.Scene)=>{if(!scene.textures.exists('village-npc-bento'))preloadBentoSprites(scene);preloadBentoWorkArt(scene);};
/** Reuses the village's one Bento sprite there; other maps render the same saved identity. */
export class BentoTravelView{
 readonly sprite:Phaser.GameObjects.Sprite;
 constructor(private scene:Phaser.Scene,private save:()=>SaveData,private player:()=>TilePoint,private area:()=>BentoTravelArea|undefined,private ui:GameUI,private existing?:Phaser.GameObjects.Sprite,private runtime?:BentoWorkRuntime){
  this.sprite=existing??scene.add.sprite(0,0,bentoTexture(scene),0).setOrigin(.5,1).setDisplaySize(BENTO_DISPLAY,CHARACTER_HEIGHT).setVisible(false).setData('bento-travel',true);
  if(!existing)this.sprite.setInteractive({useHandCursor:true}).on('pointerdown',(_p:unknown,_x:unknown,_y:unknown,event:Phaser.Types.Input.EventData)=>{if(this.talk())event.stopPropagation();});
  this.update();
 }
 get hud():Partial<Pick<HudData,'prompt'|'interactionKey'>>{return this.near&&!this.save().bentoTravel?.trip?.purpose?{prompt:'Conversar com Bento · expedição',interactionKey:'E'}:{};}
 get near():boolean{return!!this.save().bentoTravel?.trip&&this.sprite.visible&&Math.hypot(this.sprite.x-this.player().x,this.sprite.y-this.player().y)<78;}
 blocks(x:number,y:number):boolean{return!!this.save().bentoTravel?.trip&&this.sprite.visible&&Math.abs(this.sprite.x-x)<10&&Math.abs(this.sprite.y-y)<6;}
 private lastNotice?:string;
 update():void{
  const party=this.save().bentoExpedition?.party,notice=party?.status==='ended'?party.reason:undefined;if(notice&&this.lastNotice!==notice&&this.lastNotice!==undefined)this.ui.toast(bentoExpeditionStatus(this.save()));this.lastNotice=notice??'active';
  const trip=this.save().bentoTravel?.trip;
  if(!trip){this.sprite.clearTint();if(this.sprite.texture.key!==bentoTexture(this.scene))this.restore();if(!this.existing)this.sprite.setVisible(false);else this.sprite.setAlpha(1);return;}
  const visible=trip.area===this.area();this.sprite.setVisible(visible);if(!visible){return;}
  if((this.save().bentoExpedition?.grace??0)>0)this.sprite.setTint(0xdbad8a);else this.sprite.clearTint();
  const phase=trip.moving?1+Math.floor(trip.distance/5.3)%BENTO_WALK_FRAMES:0;
  const alpha=trip.transition==='out'?Math.max(0,trip.wait/BENTO_WEEKLY_PLAN.portalPause):trip.transition==='in'?1-trip.wait/BENTO_WEEKLY_PLAN.portalPause:1;
  const pose=bentoWorkPose(this.save());
  if(pose&&this.scene.textures.exists(pose.key))this.sprite.setTexture(pose.key,pose.frame).setOrigin(.5,pose.originY).setDisplaySize(BENTO_DISPLAY,CHARACTER_HEIGHT);
  else this.restore(characterFrame(trip.direction,phase,BENTO_WALK_FRAMES));
  this.sprite.setPosition(trip.x,trip.y).setDepth(trip.y).setAlpha(Math.max(0,Math.min(1,alpha)));
 }
 private restore(frame=0):void{this.sprite.setTexture(bentoTexture(this.scene),frame).setOrigin(.5,1).setDisplaySize(BENTO_DISPLAY,CHARACTER_HEIGHT);}
 talk(ui=this.ui):boolean{
  if(!this.near||ui.isModalOpen())return false;const save=this.save(),trip=save.bentoTravel!.trip!;
  trip.direction=directionFromVector(this.player().x-trip.x,this.player().y-trip.y);trip.moving=false;this.update();if(trip.purpose==='rescue'){ui.showDialogue('Bento',[trip.blocked?'Preciso de uma passagem livre para voltar à oficina.': 'Vá com calma hoje. Estou voltando para a oficina; quando chegar, volto ao atendimento.']);return true;}if(trip.purpose==='workshop'){this.restore(characterFrame(trip.direction,0,BENTO_WALK_FRAMES));return false;}
  if(this.runtime){showBentoExpedition(ui,this.save,this.player,this.runtime,this.scene.textures.getBase64(bentoTexture(this.scene),0));return true;}
  const status=bentoAvailability(save).message;
  const detail=trip.leg==='unload'?'Trouxe alguns materiais da mina. Vou guardá-los nos meus depósitos para cuidar das ferramentas da oficina.':trip.leg==='survey'||trip.leg==='explore'||trip.leg==='inspect'?'Estou examinando as galerias mais próximas. Sempre confiro as passagens antes de avançar.':trip.leg.includes('back')||trip.leg==='settle'?'Estou voltando para a oficina. Quando retomar o atendimento, podemos cuidar das suas ferramentas.':'Hoje vou até a Mina Antiga. Vou seguir pela estrada, contornar o lago e subir pela escada da serra.';
  ui.showDialogue('Bento',[trip.blocked?'A passagem está impedida. Vou esperar um caminho livre.':detail,status]);return true;
 }
 destroy():void{if(!this.existing)this.sprite.destroy();}
}
