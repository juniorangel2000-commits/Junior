import Phaser from 'phaser';
import type {SaveData,Tool,ItemId} from '../types';
import type {GameUI} from '../ui';
import {Player} from '../player';
import {gameAudio} from '../audio';
import {saveGame} from '../systems/save';
import {Farming} from '../systems/farming';
import {advanceClock,GAME_MINUTES_PER_SECOND} from '../systems/clock';
import {advanceBackgroundVillage} from '../systems/village-background';
import {craftInField,consumeInField} from '../systems/field-inventory';
import {emptyQuickbar} from '../systems/quickbar';
import {DoorwayPassage,SCENE_FADE_MS} from '../systems/map-transition';
import {directionFromVector,directionVector} from '../character-directions';
import {loadCameraZoom,saveCameraZoom,stepCameraZoom} from '../camera-zoom';
import {installWorldCompanion} from '../dungeons/world-pet-controller';
import {preloadPetArt} from '../dungeons/pet-sprites';
import {MineRoomView,preloadMineRoom} from '../mine-room-view';
import {MINE_ROOM,MINE_NAME,MINE_EXIT,MINE_TUNNELS,MINE_SOLIDS,mineBlockedPoint,mineResumePosition} from '../data/mine-room';
import {highlandMineApproach,highlandResumePosition} from '../data/highland';
interface MineStart{save:SaveData;ui:GameUI;onReturn:(save:SaveData,title?:boolean)=>void}
/** The first mine gallery is an interior of the highland, with its own saved position. */
export class MineScene extends Phaser.Scene{
 private state!:SaveData;private ui!:GameUI;private player!:Player;private view!:MineRoomView;private farming!:Farming;
 private onReturn!:MineStart['onReturn'];private paused=false;private leaving=false;private zoom=1;private elapsed=0;private readonly passage=new DoorwayPassage();
 constructor(){super('Mina');}
 preload():void{preloadMineRoom(this);preloadPetArt(this);}
 getFishingState():SaveData{return this.state;}
 create(data:MineStart):void{
  this.state=structuredClone(data.save);this.state.activeArea='highland';delete this.state.homePosition;delete this.state.merchantInterior;delete this.state.blacksmithInterior;
  this.ui=data.ui;this.onReturn=data.onReturn;this.paused=this.leaving=false;this.elapsed=0;this.passage.reset();gameAudio.setScene('game');gameAudio.setRainAtmosphere(false);
  this.view=new MineRoomView(this);this.farming=new Farming(this.state.crops,this.state.preparedSoil,this.state.farmingProgress,this.state.restoredFarmSoil);
  const p=mineResumePosition(this.state.mineInterior);this.player=new Player(this,this.state.profile,p.x,p.y,'mine-player');this.player.facing=directionVector(p.direction??'up');this.player.update(0,this.blockedTile,mineBlockedPoint,false);
  this.zoom=loadCameraZoom();this.cameras.main.setBounds(0,0,MINE_ROOM.width,MINE_ROOM.height);this.applyCamera();this.cameras.main.fadeIn(SCENE_FADE_MS);
  this.ui.showHUD('highland');document.querySelector<HTMLElement>('#ui')!.dataset.interior='mine';this.ui.setQuickbar(this.state.quickbar??emptyQuickbar());this.updateHUD();
  this.input.keyboard!.on('keydown',this.key,this);this.input.on('pointerdown',this.pointer,this);this.input.on('wheel',this.wheel,this);this.scale.on('resize',this.applyCamera,this);
  window.addEventListener('pagehide',this.save);window.addEventListener('beforeunload',this.save);window.addEventListener('blur',this.blur);document.addEventListener('visibilitychange',this.visibility);
  this.events.once('shutdown',()=>{this.view.destroy();this.input.keyboard?.off('keydown',this.key,this);this.input.off('pointerdown',this.pointer,this);this.input.off('wheel',this.wheel,this);this.scale.off('resize',this.applyCamera,this);window.removeEventListener('pagehide',this.save);window.removeEventListener('beforeunload',this.save);window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);delete document.querySelector<HTMLElement>('#ui')!.dataset.interior;});
  installWorldCompanion(this,()=>({save:this.state,player:this.player,area:'highland',space:'mine',blockedPoint:mineBlockedPoint,enabled:true,canMove:!this.paused&&!this.leaving&&!this.ui.isModalOpen()&&!document.hidden}),this.ui,()=>this.persist());this.persist();
 }
 private blockedTile=(x:number,y:number)=>mineBlockedPoint((x+.5)*32,(y+.5)*32);
 private nearExit():boolean{return Math.abs(this.player.x-MINE_EXIT.x)<MINE_EXIT.halfWidth&&this.player.y>430;}
 private nearTunnel(){return MINE_TUNNELS.find(t=>Math.hypot(this.player.x-t.x,this.player.y-t.y)<43);}
 private nearDeposit(){return MINE_SOLIDS.slice(0,4).find(o=>{
  const x=o.footprint.reduce((sum,p)=>sum+p[0],0)/o.footprint.length*MINE_ROOM.scale,y=o.depth*MINE_ROOM.scale;
  return Math.hypot(this.player.x-x,this.player.y-y)<49;
 });}
 private updateHUD():void{
  const tunnel=this.nearTunnel(),deposit=this.nearDeposit(),exit=this.nearExit();
  this.ui.updateHUD({area:'highland',mapTitle:MINE_NAME,worldMapSize:{width:MINE_ROOM.width/32,height:MINE_ROOM.height/32},mapEditorAvailable:false,worldWeapon:this.state.worldWeapon,toolConditions:this.state.economy6?.tools,learnedRecipes:this.state.villageProgress?.recipes??[],name:this.state.profile.name,day:this.state.day,time:this.state.time,inventory:this.state.inventory,tool:'hand',inHome:false,swimming:false,coins:this.state.villageEconomy?.coins??0,vigor:this.state.villageProgress?.vigor??100,wateringCan:!!this.state.homeSupplies?.wateringCan,wateringCanWater:this.state.wateringCanWater??0,playerTile:{x:this.player.x/32,y:this.player.y/32},interactionKey:tunnel||deposit||exit?'E':null,prompt:exit?'Voltar ao Platô da Nascente':tunnel?.id==='north'?'Entrada das galerias · mineração':tunnel?'Examinar a passagem lateral':deposit?deposit.label+' · examinar':'Galeria de entrada · siga os trilhos para voltar à montanha',location:MINE_NAME,harvests:this.state.inventory.turnip,metLia:this.state.metLia,nearWorkbench:false,sheltered:true,shelterReason:'Interior da mina',resourceProgress:'',farmingProgress:this.farming.progress,progress:this.state.progress});this.ui.updateCameraZoom(this.zoom,!this.paused);
 }
 private interact():void{
  if(this.nearExit()){this.leave();return;}
  const tunnel=this.nearTunnel();
  if(tunnel?.id==='north'){
   this.ui.showSceneEditor(host=>{const panel=document.createElement('section');panel.className='panel camp-dialog';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Mineração');panel.innerHTML='<span class="eyebrow">MINA ANTIGA</span><h2>Mineração</h2><p>Trilhos antigos seguem para as galerias do interior da montanha.</p><button class="button button-primary">Voltar à sala</button>';host.append(panel);panel.querySelector('button')!.onclick=()=>this.ui.closeModal();panel.querySelector('button')!.focus();return()=>panel.remove();});return;
  }
  if(tunnel){this.ui.toast('Uma passagem estreita segue para outra galeria.');return;}
  const deposit=this.nearDeposit();if(deposit)this.ui.toast(deposit.label+' · os minerais estão presos à rocha.');
 }
 private key(e:KeyboardEvent):void{
  if(e.repeat||this.leaving||e.target instanceof HTMLElement&&e.target.matches('input,textarea,select,[contenteditable="true"]'))return;
  const k=e.key.toLowerCase();if(k==='escape'){e.preventDefault();this.ui.togglePause();return;}if(k==='i'){this.ui.toggleInventory(this.state.inventory);return;}if(k==='m'){this.ui.toggleMap();return;}if(k==='c'){this.ui.toggleCrafting(this.state.inventory,false);return;}
  if(this.paused||this.ui.isModalOpen())return;if(k==='e'){e.preventDefault();this.interact();}if(e.key>='1'&&e.key<='9')this.ui.activateSlot(Number(e.key)-1);if(['+','=','-','_','Home'].includes(e.key))this.changeCameraZoom(e.key==='Home'?0:e.key==='-'||e.key==='_'?-1:1);
 }
 private pointer=(p:Phaser.Input.Pointer)=>{if(p.button===0&&!this.paused&&!this.leaving&&!this.ui.isModalOpen())this.interact();};
 private wheel=(_p:Phaser.Input.Pointer,_objects:unknown,_dx:number,dy:number)=>{if(!this.paused&&!this.leaving&&!this.ui.isModalOpen()&&Math.abs(dy)>5)this.changeCameraZoom(dy>0?-1:1);};
 private applyCamera=()=>{this.cameras.main.setZoom(2*this.zoom).startFollow(this.player,true,.12,.12).setRoundPixels(true);};
 changeCameraZoom(d:-1|0|1):void{if(this.paused||this.leaving||this.ui.isModalOpen())return;this.zoom=stepCameraZoom(this.zoom,d);saveCameraZoom(this.zoom);this.applyCamera();this.ui.updateCameraZoom(this.zoom,true,true);}
 setPaused(value:boolean):void{this.paused=value;this.input.keyboard?.resetKeys();if(value)this.persist();}
 selectTool(_tool:Tool):void{}
 craftRecipe(id:string):void{const result=craftInField(this.state,id,saveGame);this.ui.toast(result.message);this.updateHUD();this.ui.refreshCrafting(this.state.inventory,false);}
 async useVillageItem(item:ItemId):Promise<void>{if(this.leaving)return;if(item==='fishingRod'||item==='net'){this.ui.toast('Não há água para pescar nesta galeria.');return;}const result=consumeInField(this.state,item,saveGame);this.ui.toast(result.message);this.updateHUD();}
 openMapEditor():void{}
 async captureMap():Promise<string>{
  const rt=this.make.renderTexture({width:960,height:640},false);rt.camera.setZoom(960/MINE_ROOM.width).setScroll(0,0).setOrigin(0,0);this.children.depthSort();rt.draw(this.children.list.filter(o=>o===this.view.ground||o.getData('mine-occluder')));
  return new Promise(resolve=>rt.snapshot(img=>{const url=img instanceof HTMLImageElement?img.src:'';rt.destroy();resolve(url);}));
 }
 persist():boolean{return this.save();}
 private save=():boolean=>{if(!this.player||this.leaving)return false;this.state.activeArea='highland';this.state.mineInterior={x:this.player.x,y:this.player.y,direction:directionFromVector(this.player.facing.x,this.player.facing.y)};this.state.quickbar=this.ui.getQuickbar();this.state.crops=this.farming.crops.map(c=>({...c}));return saveGame(this.state);};
 private blur=()=>{this.input.keyboard?.resetKeys();this.persist();};private visibility=()=>{if(document.hidden)this.blur();};
 mainMenu():void{this.ui.closeModal();this.leave(true);}
 private leave(title=false):void{
  if(this.leaving||!this.persist())return;const next=structuredClone(this.state);
  if(!title){delete next.mineInterior;const approach=highlandMineApproach(next.highlandMapEdits);next.highlandPosition=highlandResumePosition(approach?{x:approach.x,y:approach.y+36,direction:'down'}:undefined,next.highlandMapEdits);}
  if(!saveGame(next)){this.ui.toast('Não foi possível salvar. A passagem foi cancelada.');return;}
  this.leaving=true;this.input.keyboard?.resetKeys();this.cameras.main.fadeOut(SCENE_FADE_MS);this.time.delayedCall(SCENE_FADE_MS,()=>{if(title){this.scene.stop();this.onReturn(next,true);}else this.scene.start('Serra',{save:next,ui:this.ui,onReturn:this.onReturn});});
 }
 update(_time:number,ms:number):void{
  if(!this.player)return;this.view.update();if(this.paused||this.leaving||this.ui.isModalOpen()||document.hidden)return;
  const dt=Math.min(.1,ms/1000),before={x:this.player.x,y:this.player.y};this.player.speedMultiplier=this.state.inventory.boots>0?1.08:1;this.player.update(dt,this.blockedTile,mineBlockedPoint,true);
  if(this.passage.update(before,this.player,MINE_EXIT)){this.leave();return;}
  this.farming.update(dt);Object.assign(this.state,advanceClock(this.state,dt*GAME_MINUTES_PER_SECOND));this.state.crops=this.farming.crops;advanceBackgroundVillage(this.state,dt,this.player);this.updateHUD();this.elapsed+=dt;if(this.elapsed>=5){this.elapsed=0;this.persist();}
 }
}
