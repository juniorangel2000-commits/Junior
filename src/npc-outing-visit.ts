import Phaser from 'phaser';
import type {SaveData} from './types';
import type {Player} from './player';
import type {SocialNpc} from './data/npc-social';
import {VILLAGE_NPCS} from './data/village';
import {AREA_NAMES} from './data/area-names';
import {characterFrame,directionFromVector,type CharacterDirection} from './character-directions';
import {merchantTexture} from './economy-art';
import {VillageInteractionUI} from './village-ui';
import {VillageNpcOverlays} from './village-npc-overlays';
import {createSocialRuntime,openSocialConversation,respondSocial,type SocialRuntime} from './systems/npc-social';
import {completeStoryPart,storyStatus} from './systems/npc-stories';
import {answerConversation,collectPendingRewards,giftChoices,giveGift} from './systems/npc-gifts';
import {BEACH_FIRE,outingsAt,outingDialogue,outingGiftReceived,outingMessage,receiveOutingGift,onOuting,type NpcOuting,type OutingArea} from './systems/npc-outings';
import {saveGame} from './systems/save';
import {preloadRosaSprites,ROSA_WALK_FRAMES,ROSA_DISPLAY,ROSA_ORIGIN_Y} from './rosa-sprites';
import {preloadTobiasSprites,TOBIAS_WALK_FRAMES,TOBIAS_DISPLAY,TOBIAS_ORIGIN_Y} from './tobias-sprites';
import {preloadAmeliaSprites,AMELIA_WALK_FRAMES,AMELIA_DISPLAY,AMELIA_ORIGIN_Y} from './amelia-sprites';
import {preloadNiloSprites,NILO_WALK_FRAMES,NILO_DISPLAY,NILO_ORIGIN_Y} from './nilo-sprites';
import {preloadCelinaSprites,CELINA_WALK_FRAMES,CELINA_DISPLAY,CELINA_ORIGIN_Y} from './celina-sprites';
import {preloadIcaroSprites,ICARO_WALK_FRAMES,ICARO_DISPLAY,ICARO_ORIGIN_Y} from './icaro-sprites';
import {preloadDamiaoSprites,damiaoTexture,DAMIAO_WALK_FRAMES,DAMIAO_DISPLAY,DAMIAO_ORIGIN_Y} from './damiao-sprites';
import {festivalNow,festivalContestDone,enterFestivalContest} from './systems/festivals';
import {preloadAugustoSprites,AUGUSTO_WALK_FRAMES,AUGUSTO_DISPLAY,AUGUSTO_ORIGIN_Y} from './augusto-sprites';
import {preloadBentoSprites,BENTO_WALK_FRAMES,BENTO_DISPLAY} from './bento-sprites';
import {preloadHelenaSprites,HELENA_WALK_FRAMES,HELENA_DISPLAY,HELENA_ORIGIN_Y} from './helena-sprites';

interface Look{preload:(s:Phaser.Scene)=>void;texture:(s:Phaser.Scene)=>string;frames:number;display:number;origin:number}
const merchant=(id:SocialNpc)=>(s:Phaser.Scene)=>{merchantTexture(s,id);return`village-npc-${id}`;};
const LOOKS:Partial<Record<SocialNpc,Look>>={
 rosa:{preload:preloadRosaSprites,texture:merchant('rosa'),frames:ROSA_WALK_FRAMES,display:ROSA_DISPLAY,origin:ROSA_ORIGIN_Y},
 tobias:{preload:preloadTobiasSprites,texture:merchant('tobias'),frames:TOBIAS_WALK_FRAMES,display:TOBIAS_DISPLAY,origin:TOBIAS_ORIGIN_Y},
 amelia:{preload:preloadAmeliaSprites,texture:merchant('amelia'),frames:AMELIA_WALK_FRAMES,display:AMELIA_DISPLAY,origin:AMELIA_ORIGIN_Y},
 nilo:{preload:preloadNiloSprites,texture:merchant('nilo'),frames:NILO_WALK_FRAMES,display:NILO_DISPLAY,origin:NILO_ORIGIN_Y},
 celina:{preload:preloadCelinaSprites,texture:merchant('celina'),frames:CELINA_WALK_FRAMES,display:CELINA_DISPLAY,origin:CELINA_ORIGIN_Y},
 icaro:{preload:preloadIcaroSprites,texture:merchant('icaro'),frames:ICARO_WALK_FRAMES,display:ICARO_DISPLAY,origin:ICARO_ORIGIN_Y},
 damiao:{preload:preloadDamiaoSprites,texture:damiaoTexture,frames:DAMIAO_WALK_FRAMES,display:DAMIAO_DISPLAY,origin:DAMIAO_ORIGIN_Y},
 augusto:{preload:preloadAugustoSprites,texture:merchant('augusto'),frames:AUGUSTO_WALK_FRAMES,display:AUGUSTO_DISPLAY,origin:AUGUSTO_ORIGIN_Y},
 bento:{preload:preloadBentoSprites,texture:merchant('bento'),frames:BENTO_WALK_FRAMES,display:BENTO_DISPLAY,origin:.96},
 helena:{preload:preloadHelenaSprites,texture:merchant('helena'),frames:HELENA_WALK_FRAMES,display:HELENA_DISPLAY,origin:HELENA_ORIGIN_Y},
};

export interface OutingHost{
 state:()=>SaveData;snapshot:()=>SaveData;player:()=>Player;
 pause:(value:boolean)=>void;
 syncInventory:(inventory:SaveData['inventory'])=>void;
}
interface Worker{outing:NpcOuting;sprite:Phaser.GameObjects.Sprite;look:Look;direction:CharacterDirection}

/** Moradores trabalhando num cenário fora da vila (src/systems/npc-outings.ts). As imagens
 * de cada um só são carregadas quando ele está no cenário. */
export class NpcOutingVisit {
 private workers=new Map<SocialNpc,Worker>();
 private loading=new Set<SocialNpc>();
 private ready=new Set<SocialNpc>();
 private panel:VillageInteractionUI;
 private overlays:VillageNpcOverlays;
 private runtime:SocialRuntime;
 private talking?:NpcOuting;
 private elapsed=0;
 constructor(private scene:Phaser.Scene,private area:OutingArea,private host:OutingHost){
  this.runtime=createSocialRuntime(host.snapshot,saveGame,host.state,inv=>host.syncInventory(inv));
  const rt=this.runtime;
  this.panel=new VillageInteractionUI({
   onSocialOpen:id=>{const c=openSocialConversation(rt,id),r=collectPendingRewards(rt,id);return r.length?{...c,reward:r.join(' ')}:c;},
   onSocialResponse:(id,tone)=>respondSocial(rt,id,tone),
   onAnswer:(id,conversation,tone)=>answerConversation(rt,id,conversation,tone),
   getStory:id=>storyStatus(host.state(),id),onStory:id=>completeStoryPart(rt,id),
   getGiftChoices:id=>giftChoices(host.state(),id),onGift:(id,item)=>giveGift(rt,id,item),
   locationLabel:AREA_NAMES[area].toUpperCase(),returnLabel:`voltar a ${AREA_NAMES[area]}`,
   getDialogueAction:id=>{
    const fest=festivalNow(host.state());
    if(fest&&fest.host===id&&!festivalContestDone(host.state(),fest))return{label:`Participar: ${fest.contest.name}`,complete:()=>enterFestivalContest(rt,fest)};
    if(fest)return undefined;
    return onOuting(id,host.state())&&!outingGiftReceived(host.state(),id)?{label:'Receber presente',complete:()=>receiveOutingGift(rt,id as SocialNpc)}:undefined;},
   canTrade:()=>false,isInside:()=>false,
   getAvailability:()=>({message:this.talking?outingMessage(this.talking):'',canGuide:false}),
   getPortrait:id=>{try{return scene.textures.getBase64(`village-npc-${id}`,characterFrame('down',0,LOOKS[id as SocialNpc]?.frames??0));}catch{return'';}},
   getServices:()=>[],
   getInventory:()=>host.state().inventory,getEconomy:()=>host.state().villageEconomy!,getDay:()=>host.state().day,
   onTrade:()=>({ok:false,reason:'invalid-economy',message:'Compras e vendas só na loja, na vila.'}) as never,
   onClose:()=>{this.talking=undefined;host.pause(false);},
  });
  this.overlays=new VillageNpcOverlays(scene,()=>({
   actors:[...this.workers.values()].filter(w=>w.sprite.visible).map(w=>({id:w.outing.id,name:VILLAGE_NPCS.find(n=>n.id===w.outing.id)!.name,role:w.outing.activity,sprite:w.sprite})),
   blocked:this.panel.isOpen,speech:this.speech(),
  }));
  if(area==='coast')this.fire=this.makeFire();
  scene.events.on('update',this.update,this);
 }
 private fire?:Phaser.GameObjects.Container;
 private makeFire():Phaser.GameObjects.Container{
  const g=this.scene.add.graphics();
  g.fillStyle(0x3a2616,1).fillEllipse(0,4,46,16);
  g.fillStyle(0x6a4428,1);for(const a of [-.6,.6,0])g.fillRect(-20+a*10,-2+Math.abs(a)*3,40,6);
  const flame=this.scene.add.graphics();
  const c=this.scene.add.container(BEACH_FIRE.x,BEACH_FIRE.y,[g,flame]).setDepth(BEACH_FIRE.y).setVisible(false);
  c.setData('fixture-light',{offsetX:0,offsetY:-14,radius:60,strength:1,always:true}).setData('flame',flame);
  return c;
 }
 private nearest():Worker|undefined{
  const p=this.host.player();let best:Worker|undefined,dist=76;
  for(const w of this.workers.values()){const d=Math.hypot(w.sprite.x-p.x,w.sprite.y-p.y);if(w.sprite.visible&&d<dist){best=w;dist=d;}}
  return best;
 }
 private speech(){
  const s=this.host.state(),p=this.host.player();
  const fest=festivalNow(s);
  if(fest){const host=this.workers.get(fest.host);if(host?.sprite.visible&&!festivalContestDone(s,fest)&&Math.hypot(host.sprite.x-p.x,host.sprite.y-p.y)<220)return{id:fest.host,text:`${fest.contest.name}! Venha participar.`};return;}
  for(const w of this.workers.values())if(w.sprite.visible&&!outingGiftReceived(s,w.outing.id)&&Math.hypot(w.sprite.x-p.x,w.sprite.y-p.y)<200)return{id:w.outing.id,text:'Oi! Vem cá, tenho uma coisa para você.'};
 }
 /** Nome de quem está perto, para a dica de interação da cena. */
 nearName():string|undefined{const w=this.nearest();return w&&VILLAGE_NPCS.find(n=>n.id===w.outing.id)?.name;}
 /** Ponto ocupado por um morador (para o jogador não atravessar). */
 blocks(x:number,y:number):boolean{for(const w of this.workers.values())if(w.sprite.visible&&Math.abs(x-w.sprite.x)<12&&y>w.sprite.y-10&&y<w.sprite.y+4)return true;return false;}
 interact():boolean{
  const w=this.nearest();if(!w||this.panel.isOpen)return false;
  const npc=VILLAGE_NPCS.find(n=>n.id===w.outing.id)!,p=this.host.player();
  this.host.pause(true);this.talking=w.outing;
  w.sprite.setFrame(characterFrame(directionFromVector(p.x-w.sprite.x,p.y-w.sprite.y),0,w.look.frames));
  this.panel.open({...npc,dialogue:outingDialogue(this.host.state(),w.outing)});
  return true;
 }
 private ensure(o:NpcOuting):Worker|undefined{
  const existing=this.workers.get(o.id);if(existing)return existing;
  const look=LOOKS[o.id];if(!look)return;
  if(!this.ready.has(o.id)&&!this.scene.textures.exists(`village-npc-${o.id}`)){
   // Montar a textura antes das imagens-fonte carregarem dá o quadradinho vazio.
   if(!this.loading.has(o.id)){this.loading.add(o.id);look.preload(this.scene);this.scene.load.once('complete',()=>{this.loading.delete(o.id);this.ready.add(o.id);});this.scene.load.start();}
   return;
  }
  const key=look.texture(this.scene);
  const sprite=this.scene.add.sprite(o.spot.x,o.spot.y,key,characterFrame(o.facing,0,look.frames)).setOrigin(.5,look.origin).setDisplaySize(look.display,look.display).setDepth(o.spot.y);
  const w={outing:o,sprite,look,direction:o.facing};this.workers.set(o.id,w);return w;
 }
 private update(_time:number,ms:number):void{
  const s=this.host.state();if(!s)return;
  this.elapsed+=Math.min(.1,Math.max(0,ms/1000));
  const here=new Set(outingsAt(this.area,s).map(o=>o.id));
  if(this.fire){
   const on=festivalNow(s)?.place==='coast';this.fire.setVisible(on);
   if(on){const f=this.fire.getData('flame') as Phaser.GameObjects.Graphics,t=this.elapsed*8;f.clear();
    for(const [k,col] of [[1,0xe0702a],[.7,0xf0a83a],[.4,0xfbe27a]] as const){const h=(26+4*Math.sin(t+k*3))*k;f.fillStyle(col,1).fillTriangle(-12*k,0,12*k,0,2*Math.sin(t*1.3+k),-h);}}
  }
  for(const o of outingsAt(this.area,s))this.ensure(o);
  const p=this.host.player();
  for(const w of this.workers.values()){
   const present=here.has(w.outing.id);w.sprite.setVisible(present);if(!present||this.panel.isOpen)continue;
   // Trabalhando: olha para o serviço; quando o jogador chega perto, vira para ele.
   const close=Math.hypot(p.x-w.sprite.x,p.y-w.sprite.y)<140;
   w.direction=close?directionFromVector(p.x-w.sprite.x,p.y-w.sprite.y):w.outing.facing;
   const working=!close&&Math.floor(this.elapsed*1.5+w.outing.spot.x)%4===0;
   w.sprite.setFrame(characterFrame(w.direction,working?1:0,w.look.frames));
  }
 }
 destroy():void{this.scene.events.off('update',this.update,this);this.fire?.destroy();this.overlays.destroy();this.panel.destroy();for(const w of this.workers.values())w.sprite.destroy();this.workers.clear();}
}
