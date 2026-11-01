import type Phaser from 'phaser';
import type {SaveData} from './types';
import type {Player} from './player';
import {VILLAGE_NPCS} from './data/village';
import {fisherAtLake,FISHER_LAKE_HOURS} from './data/fisher-schedule';
import {CABIN_FISHER_STOP} from './data/fisher-cabin';
import {lakeFisherPose} from './systems/lake-fisher';
import {damiaoTexture,DAMIAO_DISPLAY,DAMIAO_ORIGIN_Y,DAMIAO_WALK_FRAMES} from './damiao-sprites';
import {characterFrame,directionFromVector} from './character-directions';
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
 private routeTime:number;
 private moving=false;
 private speech?:{id:string;text:string};
 constructor(scene:Phaser.Scene,private state:()=>SaveData,private player:()=>Player,private blocked:(x:number,y:number)=>boolean,pause:(value:boolean)=>void,changed:()=>void){
  this.routeTime=state().time;const pose=lakeFisherPose(this.routeTime),start=this.fits(pose)?pose:CABIN_FISHER_STOP;
  this.sprite=scene.add.sprite(start.x,start.y,damiaoTexture(scene),characterFrame('down',0,DAMIAO_WALK_FRAMES)).setOrigin(.5,DAMIAO_ORIGIN_Y).setDisplaySize(DAMIAO_DISPLAY,DAMIAO_DISPLAY).setDepth(start.y).setVisible(fisherAtLake(state().time));
  this.panel=new VillageInteractionUI({
   locationLabel:'CABANA DO LAGO',returnLabel:'voltar ao lago',
   canTrade:()=>fisherAtLake(state().time),isInside:()=>true,
   getAvailability:()=>({message:'Cabana do lago · '+FISHER_LAKE_HOURS.label,canGuide:false}),
   getPortrait:()=>scene.textures.getBase64('village-npc-damiao',characterFrame('down',0,DAMIAO_WALK_FRAMES)),
   getServices:()=>listVillageServices('damiao'),
   onService:id=>{const result=fisherService(state(),id,saveGame);if(result.ok)changed();return result;},
   getInventory:()=>state().inventory,getEconomy:()=>state().villageEconomy!,getDay:()=>state().day,
   onTrade:(merchant,side,item,quantity)=>{const result=fisherTrade(state(),merchant,side,item,quantity,saveGame);if(result.ok)changed();return result;},
   onClose:()=>pause(false),
  });
  this.overlays=new VillageNpcOverlays(scene,()=>({actors:[{id:npc.id,name:npc.name,role:'Cabana de pesca',sprite:this.sprite}],blocked:this.panel.isOpen,speech:this.speech}));
  this.open=()=>{if(!this.near())return false;pause(true);this.moving=false;this.speech=undefined;this.sprite.setFrame(characterFrame(directionFromVector(player().x-this.sprite.x,player().y-this.sprite.y),0,DAMIAO_WALK_FRAMES));this.panel.open(npc);return true;};
 }
 readonly open:()=>boolean;
 near():boolean{return this.sprite.visible&&!this.player().isSwimming&&Math.hypot(this.sprite.x-this.player().x,this.sprite.y-this.player().y)<76;}
 private fits(p:{x:number;y:number}):boolean{return [[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!this.blocked(p.x+dx,p.y+dy));}
 update(seconds:number):void{
  this.sprite.setVisible(fisherAtLake(this.state().time));if(!this.sprite.visible||this.panel.isOpen)return;
  const next=lakeFisherPose(this.routeTime+seconds);
  const player=this.player(),overlap=Math.abs(next.x-player.x)<17&&Math.abs(next.y-player.y)<11;
  if(this.fits(next)&&!overlap){this.routeTime+=seconds;this.sprite.setPosition(next.x,next.y).setDepth(next.y);this.moving=next.moving;this.sprite.setFrame(characterFrame(next.direction,next.phase,DAMIAO_WALK_FRAMES));}
  else{this.moving=false;this.sprite.setFrame(characterFrame(next.direction,0,DAMIAO_WALK_FRAMES));}
  const lines=['Vou preparar as linhas aqui na varanda.','Com calma dá para enxergar os peixes perto da margem.','Se trouxer peixe raro, passe para conversar comigo.'];
  this.speech=!this.moving&&Math.floor(this.routeTime)%32<7?{id:'damiao',text:lines[Math.floor(this.routeTime/32)%lines.length]}:undefined;
 }
 destroy():void{this.overlays.destroy();this.panel.destroy();this.sprite.destroy();}
}
