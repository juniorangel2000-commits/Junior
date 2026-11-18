import type Phaser from 'phaser';
import type {SaveData} from './types';
import type {Player} from './player';
import type {SocialNpc} from './data/npc-social';
import {VILLAGE_NPCS} from './data/village';
import {characterFrame,directionFromVector} from './character-directions';
import {merchantTexture} from './economy-art';
import {VillageInteractionUI} from './village-ui';
import {VillageNpcOverlays} from './village-npc-overlays';
import {createSocialRuntime,openSocialConversation,respondSocial,type SocialRuntime} from './systems/npc-social';
import {completeStoryPart,storyStatus} from './systems/npc-stories';
import {answerConversation,collectPendingRewards,giftChoices,giveGift} from './systems/npc-gifts';
import {propertyVisitor,visitingProperty,visitGiftReceived,propertyVisitDialogue,receiveVisitGift,PROPERTY_VISIT,PROPERTY_VISIT_SPOT} from './systems/property-visits';
import {saveGame} from './systems/save';
import {preloadAugustoSprites,AUGUSTO_WALK_FRAMES,AUGUSTO_DISPLAY,AUGUSTO_ORIGIN_Y} from './augusto-sprites';
import {preloadRosaSprites,ROSA_WALK_FRAMES,ROSA_DISPLAY,ROSA_ORIGIN_Y} from './rosa-sprites';
import {preloadTobiasSprites,TOBIAS_WALK_FRAMES,TOBIAS_DISPLAY,TOBIAS_ORIGIN_Y} from './tobias-sprites';
import {preloadAmeliaSprites,AMELIA_WALK_FRAMES,AMELIA_DISPLAY,AMELIA_ORIGIN_Y} from './amelia-sprites';
import {preloadNiloSprites,NILO_WALK_FRAMES,NILO_DISPLAY,NILO_ORIGIN_Y} from './nilo-sprites';
import {preloadCelinaSprites,CELINA_WALK_FRAMES,CELINA_DISPLAY,CELINA_ORIGIN_Y} from './celina-sprites';
import {preloadIcaroSprites,ICARO_WALK_FRAMES,ICARO_DISPLAY,ICARO_ORIGIN_Y} from './icaro-sprites';

interface Look{preload:(s:Phaser.Scene)=>void;frames:number;display:number;origin:number}
const LOOKS:Partial<Record<SocialNpc,Look>>={
 augusto:{preload:preloadAugustoSprites,frames:AUGUSTO_WALK_FRAMES,display:AUGUSTO_DISPLAY,origin:AUGUSTO_ORIGIN_Y},
 rosa:{preload:preloadRosaSprites,frames:ROSA_WALK_FRAMES,display:ROSA_DISPLAY,origin:ROSA_ORIGIN_Y},
 tobias:{preload:preloadTobiasSprites,frames:TOBIAS_WALK_FRAMES,display:TOBIAS_DISPLAY,origin:TOBIAS_ORIGIN_Y},
 amelia:{preload:preloadAmeliaSprites,frames:AMELIA_WALK_FRAMES,display:AMELIA_DISPLAY,origin:AMELIA_ORIGIN_Y},
 nilo:{preload:preloadNiloSprites,frames:NILO_WALK_FRAMES,display:NILO_DISPLAY,origin:NILO_ORIGIN_Y},
 celina:{preload:preloadCelinaSprites,frames:CELINA_WALK_FRAMES,display:CELINA_DISPLAY,origin:CELINA_ORIGIN_Y},
 icaro:{preload:preloadIcaroSprites,frames:ICARO_WALK_FRAMES,display:ICARO_DISPLAY,origin:ICARO_ORIGIN_Y},
};

export interface PropertyVisitHost{
 state:()=>SaveData;snapshot:()=>SaveData;player:()=>Player;
 visible:()=>boolean;pause:(value:boolean)=>void;toast:(message:string)=>void;
 syncInventory:(inventory:SaveData['inventory'])=>void;
}
/** Morador que passa a tarde na propriedade (src/systems/property-visits.ts). As imagens
 * dele só são carregadas no dia da visita, porque a Propriedade não carrega a vila. */
export class PropertyVisit {
 private sprite?:Phaser.GameObjects.Sprite;
 private id?:SocialNpc;
 private loading?:SocialNpc;
 private ready=new Set<SocialNpc>();
 private announced=0;
 private panel:VillageInteractionUI;
 private overlays:VillageNpcOverlays;
 private runtime:SocialRuntime;
 constructor(private scene:Phaser.Scene,private host:PropertyVisitHost){
  this.runtime=createSocialRuntime(host.snapshot,saveGame,host.state,inv=>host.syncInventory(inv));
  const rt=this.runtime;
  this.panel=new VillageInteractionUI({
   onSocialOpen:id=>{const c=openSocialConversation(rt,id),r=collectPendingRewards(rt,id);return r.length?{...c,reward:r.join(' ')}:c;},
   onSocialResponse:(id,tone)=>respondSocial(rt,id,tone),
   onAnswer:(id,conversation,tone)=>answerConversation(rt,id,conversation,tone),
   getStory:id=>storyStatus(host.state(),id),onStory:id=>completeStoryPart(rt,id),
   getGiftChoices:id=>giftChoices(host.state(),id),onGift:(id,item)=>giveGift(rt,id,item),
   locationLabel:'SUA PROPRIEDADE',returnLabel:'voltar à propriedade',
   getDialogueAction:id=>!visitGiftReceived(host.state())&&visitingProperty(id,host.state())?{label:'Receber presente',complete:()=>receiveVisitGift(rt,id as SocialNpc)}:undefined,
   canTrade:()=>false,isInside:()=>false,
   getAvailability:()=>({message:`Visitando a sua propriedade · até as ${String(Math.floor(PROPERTY_VISIT.end/60)).padStart(2,'0')}:${String(PROPERTY_VISIT.end%60).padStart(2,'0')}`,canGuide:false}),
   getPortrait:id=>{try{return scene.textures.getBase64(`village-npc-${id}`,characterFrame('down',0,LOOKS[id as SocialNpc]?.frames??0));}catch{return'';}},
   getServices:()=>[],
   getInventory:()=>host.state().inventory,getEconomy:()=>host.state().villageEconomy!,getDay:()=>host.state().day,
   onTrade:()=>({ok:false,reason:'invalid-economy',message:'Compras e vendas só na loja, na vila.'}) as never,
   onClose:()=>host.pause(false),
  });
  this.overlays=new VillageNpcOverlays(scene,()=>({actors:this.sprite&&this.id&&this.sprite.visible?[{id:this.id,name:VILLAGE_NPCS.find(n=>n.id===this.id)!.name,role:'De visita',sprite:this.sprite}]:[],blocked:this.panel.isOpen,speech:this.speech()}));
  scene.events.on('update',this.update,this);
 }
 get visitor():SocialNpc|undefined{return this.sprite?.visible?this.id:undefined;}
 private speech(){
  const s=this.host.state();if(!this.id||!this.sprite?.visible||visitGiftReceived(s))return;
  return Math.hypot(this.sprite.x-this.host.player().x,this.sprite.y-this.host.player().y)<220?{id:this.id,text:'Oi! Vim fazer uma visita.'}:undefined;
 }
 near():boolean{const p=this.host.player();return !!this.sprite?.visible&&Math.hypot(this.sprite.x-p.x,this.sprite.y-p.y)<76;}
 /** Abre a conversa com o visitante se o jogador estiver perto. */
 interact():boolean{
  if(!this.near()||!this.id||this.panel.isOpen)return false;
  const npc=VILLAGE_NPCS.find(n=>n.id===this.id)!,look=LOOKS[this.id]!,p=this.host.player();
  this.host.pause(true);this.sprite!.setFrame(characterFrame(directionFromVector(p.x-this.sprite!.x,p.y-this.sprite!.y),0,look.frames));
  this.panel.open({...npc,dialogue:propertyVisitDialogue(this.host.state(),this.id)});
  return true;
 }
 private ensureSprite(id:SocialNpc):boolean{
  const look=LOOKS[id];if(!look)return false;
  if(this.id===id&&this.sprite)return true;
  const key=`village-npc-${id}`;
  if(!this.scene.textures.exists(key)){
   // Montar a textura antes das imagens-fonte carregarem dá o quadradinho vazio.
   if(!this.ready.has(id)){
    if(this.loading!==id){this.loading=id;look.preload(this.scene);this.scene.load.once('complete',()=>{this.ready.add(id);if(this.loading===id)this.loading=undefined;});this.scene.load.start();}
    return false;
   }
   merchantTexture(this.scene,id);
  }
  this.sprite?.destroy();this.id=id;
  this.sprite=this.scene.add.sprite(PROPERTY_VISIT_SPOT.x,PROPERTY_VISIT_SPOT.y,key,characterFrame('down',0,look.frames)).setOrigin(.5,look.origin).setDisplaySize(look.display,look.display).setDepth(PROPERTY_VISIT_SPOT.y);
  return true;
 }
 private update():void{
  const s=this.host.state();if(!s)return;
  const id=visitingProperty(propertyVisitor(s)??'',s)?propertyVisitor(s):undefined;
  const show=!!id&&this.host.visible()&&this.ensureSprite(id);
  this.sprite?.setVisible(show);
  if(show&&this.announced!==s.day){this.announced=s.day;this.host.toast(`${VILLAGE_NPCS.find(n=>n.id===id)!.name} veio visitar você! Está perto da porta de casa.`);}
  if(show&&!this.panel.isOpen&&this.sprite){const p=this.host.player(),d=Math.hypot(p.x-this.sprite.x,p.y-this.sprite.y);if(d<140)this.sprite.setFrame(characterFrame(directionFromVector(p.x-this.sprite.x,p.y-this.sprite.y),0,LOOKS[id!]!.frames));}
 }
 destroy():void{this.scene.events.off('update',this.update,this);this.overlays.destroy();this.panel.destroy();this.sprite?.destroy();}
}
