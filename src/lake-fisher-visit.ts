import {ensureFisherTravel} from './systems/fisher-travel';
import {villageAccessUnlocked,needsDamiaoIntroduction,receiveDamiaoIntroduction,DAMIAO_INTRODUCTION} from './systems/village-introduction';
import type Phaser from 'phaser';
import type {SaveData} from './types';
import type {Player} from './player';
import {VILLAGE_NPCS} from './data/village';
import {damiaoAtLake,FISHER_LAKE_HOURS} from './data/fisher-schedule';
import {damiaoTexture,DAMIAO_DISPLAY,DAMIAO_ORIGIN_Y,DAMIAO_WALK_FRAMES} from './damiao-sprites';
import {characterFrame,directionFromVector} from './character-directions';
import {cabinActorDepth} from './data/fisher-cabin';
import {VillageInteractionUI} from './village-ui';
import {VillageNpcOverlays} from './village-npc-overlays';
import {listVillageServices} from './systems/village-services';
import {fisherTrade,fisherService} from './systems/fisher-transactions';
import {saveGame} from './systems/save';

const npc={...VILLAGE_NPCS.find(n=>n.id==='damiao')!,dialogue:[
 'Esta cabana já enfrentou muita chuva. Da varanda eu preparo as linhas e observo o movimento do lago.',
 'Pela manhã fico entre a cabana e o píer. Depois das 11:30 volto para a vila; à tarde sigo minha rotina por lá.',
 'Trouxe alguma captura? Também tenho materiais, aulas de pesca e a encomenda do peixe raro.',
]};
export class LakeFisherVisit {
 readonly sprite:Phaser.GameObjects.Sprite;
 private panel:VillageInteractionUI;
 private overlays:VillageNpcOverlays;

 private speech?:{id:string;text:string};
 constructor(scene:Phaser.Scene,private state:()=>SaveData,private player:()=>Player,_blocked:(x:number,y:number)=>boolean,pause:(value:boolean)=>void,changed:()=>void){
  const travel=ensureFisherTravel(state()),start=travel;
  this.sprite=scene.add.sprite(start.x,start.y,damiaoTexture(scene),characterFrame(start.direction,0,DAMIAO_WALK_FRAMES)).setOrigin(.5,DAMIAO_ORIGIN_Y).setDisplaySize(DAMIAO_DISPLAY,DAMIAO_DISPLAY).setDepth(start.y).setVisible(start.area==='fishingLake');
  this.panel=new VillageInteractionUI({
   locationLabel:'CABANA DO LAGO',returnLabel:'voltar ao lago',
   getDialogueAction:()=>needsDamiaoIntroduction(state())?{label:'Receber vara de pesca',complete:()=>{const result=receiveDamiaoIntroduction(state(),saveGame);if(result.ok)changed();return result;}}:undefined,
   canTrade:()=>villageAccessUnlocked(state())&&damiaoAtLake(state()),isInside:()=>true,
   getAvailability:()=>({message:needsDamiaoIntroduction(state())?'Tenho um presente e uma indicação para você':'Cabana do lago · '+FISHER_LAKE_HOURS.label,canGuide:false}),
   getPortrait:()=>scene.textures.getBase64('village-npc-damiao',characterFrame('down',0,DAMIAO_WALK_FRAMES)),
   getServices:()=>villageAccessUnlocked(state())?listVillageServices('damiao',state()):[],
   onService:id=>{const result=fisherService(state(),id,saveGame);if(result.ok)changed();return result;},
   getInventory:()=>state().inventory,getEconomy:()=>state().villageEconomy!,getDay:()=>state().day,
   onTrade:(merchant,side,item,quantity)=>{const result=fisherTrade(state(),merchant,side,item,quantity,saveGame);if(result.ok)changed();return result;},
   onClose:()=>pause(false),
  });
  this.overlays=new VillageNpcOverlays(scene,()=>({actors:[{id:npc.id,name:npc.name,role:'Cabana de pesca',sprite:this.sprite}],blocked:this.panel.isOpen,speech:this.speech}));
  this.open=()=>{if(!this.near())return false;pause(true);this.speech=undefined;this.sprite.setFrame(characterFrame(directionFromVector(player().x-this.sprite.x,player().y-this.sprite.y),0,DAMIAO_WALK_FRAMES));this.panel.open(needsDamiaoIntroduction(state())?{...npc,dialogue:DAMIAO_INTRODUCTION}:npc);return true;};
 }
 readonly open:()=>boolean;
 near():boolean{return this.sprite.visible&&!this.player().isSwimming&&Math.hypot(this.sprite.x-this.player().x,this.sprite.y-this.player().y)<76;}

 update(_seconds:number):void{
  const s=ensureFisherTravel(this.state());this.sprite.setVisible(s.area==='fishingLake');if(!this.sprite.visible||this.panel.isOpen)return;
  this.sprite.setPosition(s.x,s.y).setDepth(cabinActorDepth(s.x,s.y)).setFrame(characterFrame(s.direction,s.moving?1+Math.floor(s.distance/5.3)%8:0,DAMIAO_WALK_FRAMES));
  this.speech=needsDamiaoIntroduction(this.state())?{id:'damiao',text:'Olá, viajante! Pode subir para conversar.'}:undefined;
 }

 destroy():void{this.overlays.destroy();this.panel.destroy();this.sprite.destroy();}
}
