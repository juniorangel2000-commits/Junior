import {WorldCompanion} from '../dungeons/world-companion';
import {DUNGEON_ART} from '../dungeons/art';
import {Farming} from '../systems/farming';
import {gameAudio} from '../audio';
import {emptyQuickbar} from '../systems/quickbar';
import Phaser from 'phaser';
import type {SaveData,Tool,ItemId} from '../types';
import type {GameUI} from '../ui';
import {Player} from '../player';
import {Daylight} from '../daylight';
import {saveGame} from '../systems/save';
import {advanceClock,GAME_MINUTES_PER_SECOND} from '../systems/clock';
import {directionFromVector,directionVector} from '../character-directions';
import {MapExitPassage,SCENE_FADE_MS} from '../systems/map-transition';
import {loadCameraZoom,saveCameraZoom,stepCameraZoom} from '../camera-zoom';
import {CITY_ACCESS,CITY_FOREST_ENTRY,CITY_FOREST_EXIT,VILLAGE_NORTH_ARRIVAL,cityForestBlockedPoint,cityForestBlockedTile} from '../data/city-forest';
import {CityForestWorld,preloadCityForest} from '../city-forest-world';

interface CityForestStart{save:SaveData;ui:GameUI;onReturn:(save:SaveData,title?:boolean)=>void}
export class CityForestScene extends Phaser.Scene{
 private state!:SaveData;
 private ui!:GameUI;
 private onReturn!:CityForestStart['onReturn'];
 private player!:Player;
 private companion?:WorldCompanion;
 private world!:CityForestWorld;
 private farming!:Farming;
 private daylight!:Daylight;
 private paused=false;
 private leaving=false;
 private elapsed=0;
 private zoom=1;
 private readonly passage=new MapExitPassage();
 constructor(){super('AcessoCidade');}
 preload():void{preloadCityForest(this);const data=this.sys.settings.data as CityForestStart;if(data.save?.dungeons?.selectedPet&&!this.textures.exists('dungeon-pets'))this.load.image('dungeon-pets-source',DUNGEON_ART.pets.file);}
 create(data:CityForestStart):void{
  this.state=structuredClone(data.save);this.state.activeArea='cityForest';delete this.state.homePosition;delete this.state.merchantInterior;delete this.state.blacksmithInterior;
  this.ui=data.ui;this.onReturn=data.onReturn;this.paused=false;this.leaving=false;this.elapsed=0;this.passage.reset();
  this.farming=new Farming(this.state.crops,this.state.preparedSoil,this.state.farmingProgress,this.state.restoredFarmSoil);
  this.world=new CityForestWorld(this);
  const p=this.state.cityForestPosition,valid=p&&[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!cityForestBlockedPoint(p.x+dx,p.y+dy));
  this.player=new Player(this,this.state.profile,valid?p.x:(CITY_FOREST_ENTRY.x+.5)*32,valid?p.y:(CITY_FOREST_ENTRY.y+.5)*32,'city-forest-player');
  this.player.facing=directionVector(valid?p.direction??'up':'up');this.player.update(0,cityForestBlockedTile,cityForestBlockedPoint,false);
  this.companion?.destroy();this.companion=undefined;
  if(this.state.dungeons?.pets.some(p=>p.id===this.state.dungeons?.selectedPet))this.companion=new WorldCompanion(this,this.state,this.player,text=>this.ui.toast(text));
  this.zoom=loadCameraZoom();this.daylight=new Daylight(this,3072,2304);this.daylight.update(this.state.time);
  this.cameras.main.setBounds(0,0,3072,2304);this.applyCamera();this.cameras.main.fadeIn(SCENE_FADE_MS);
  document.querySelector<HTMLElement>('#ui')!.style.display='';this.ui.showHUD('cityForest');this.ui.setQuickbar(this.state.quickbar??emptyQuickbar());this.updateHUD();
  this.input.keyboard!.on('keydown',this.key,this);this.input.on('wheel',this.wheel,this);this.scale.on('resize',this.applyCamera,this);
  window.addEventListener('pagehide',this.save);window.addEventListener('beforeunload',this.save);window.addEventListener('blur',this.blur);document.addEventListener('visibilitychange',this.visibility);
  this.events.once('shutdown',()=>{this.companion?.destroy();this.companion=undefined;this.daylight.destroy();this.world.destroy();this.input.keyboard?.off('keydown',this.key,this);this.input.off('wheel',this.wheel,this);this.scale.off('resize',this.applyCamera,this);window.removeEventListener('pagehide',this.save);window.removeEventListener('beforeunload',this.save);window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);});
  if(this.state.dungeonRun)this.enterDungeons();else this.persist();
 }
 private nearCity():boolean{return Math.hypot(this.player.x/32-CITY_ACCESS.x,this.player.y/32-CITY_ACCESS.y)<3;}
 private updateHUD():void{
  this.ui.updateHUD({area:'cityForest',coins:this.state.villageEconomy?.coins??0,inHome:false,name:this.state.profile.name,day:this.state.day,time:this.state.time,inventory:this.state.inventory,tool:'hand',interactionKey:this.nearCity()?'E':null,prompt:this.nearCity()?'E · Viajar para a cidade':'Explore as trilhas · caminho ao sul retorna à vila',location:'Floresta de Acesso à Cidade',harvests:this.state.inventory.turnip,metLia:this.state.metLia,nearWorkbench:false,sheltered:false,shelterReason:'',resourceProgress:'',progress:this.state.progress,playerTile:{x:this.player.x/32,y:this.player.y/32}});
  this.ui.updateCameraZoom(this.zoom,!this.paused);
 }
 private key(e:KeyboardEvent):void{
  if(e.repeat||this.leaving||e.target instanceof HTMLElement&&e.target.matches('input,textarea,select,[contenteditable="true"]'))return;
  const key=e.key.toLowerCase();
  if(key==='escape'){e.preventDefault();this.ui.togglePause();return;}
  if(this.paused)return;
  if(key==='e'&&this.nearCity())this.enterDungeons();
  if(key==='m')this.ui.toggleMap();
  if(e.key==='+'||e.key==='=')this.changeCameraZoom(1);if(e.key==='-')this.changeCameraZoom(-1);
 }
 private applyCamera=():void=>{this.cameras.main.setZoom(this.zoom).startFollow(this.player.sprite,true,.16,.16);};
 private wheel=(_p:unknown,_o:unknown,_x:number,y:number):void=>{if(!this.paused)this.changeCameraZoom(y<0?1:-1);};
 changeCameraZoom(direction:-1|0|1):void{this.zoom=stepCameraZoom(this.zoom,direction);saveCameraZoom(this.zoom);this.applyCamera();this.ui.updateCameraZoom(this.zoom,!this.paused);}
 setPaused(value:boolean):void{this.paused=value;this.input.keyboard?.resetKeys();if(value)this.persist();this.ui.updateCameraZoom(this.zoom,!value);}
 selectTool(_tool:Tool):void{this.ui.toast('Explore a floresta a pé. A coleta continua disponível nos mapas anteriores.');}
 craftRecipe(_id:string):void{this.ui.toast('Use a bancada na propriedade.');}
 async useVillageItem(_item:ItemId):Promise<void>{this.ui.toast('Use esse item na propriedade ou nos comércios.');}
 openMapEditor():void{this.ui.toast('Este cenário está em preparação; o editor permanece disponível nos mapas anteriores.');}
 mainMenu():void{this.ui.closeModal();this.leave(true);}
 captureMap():Promise<string>{
  const rt=this.make.renderTexture({width:960,height:720},false);rt.camera.setZoom(960/3072);rt.setOrigin(0);this.children.depthSort();rt.draw([...this.world.objects].sort((a,b)=>(a as Phaser.GameObjects.Image).depth-(b as Phaser.GameObjects.Image).depth));
  return new Promise(resolve=>rt.snapshot(image=>{const url=image instanceof HTMLImageElement?image.src:'';rt.destroy();resolve(url);}));
 }
 persist():boolean{if(!this.player||this.leaving)return false;this.state.activeArea='cityForest';this.state.crops=this.farming.crops;this.state.cityForestPosition={x:this.player.x,y:this.player.y,direction:directionFromVector(this.player.facing.x,this.player.facing.y)};return saveGame(this.state);}
 private save=():void=>{this.persist();};
 private blur=():void=>{if(!this.paused&&!this.leaving){this.setPaused(true);this.ui.togglePause();}this.persist();};
 private visibility=():void=>{if(document.hidden)this.blur();};
 private enterDungeons():void{
  if(this.leaving||!this.persist())return;this.leaving=true;const ui=this.ui,onReturn=this.onReturn;
  this.scene.start('Dungeons',{save:structuredClone(this.state),ui,onReturn:(save:SaveData,title=false)=>{if(title)onReturn(save,true);else this.scene.start('AcessoCidade',{save,ui,onReturn});}});
 }
 private leave(title=false):void{
  if(this.leaving)return;this.persist();this.leaving=true;
  if(!title){this.state.activeArea='village';this.state.villagePosition={x:(VILLAGE_NORTH_ARRIVAL.x+.5)*32,y:(VILLAGE_NORTH_ARRIVAL.y+.5)*32,direction:'down'};delete this.state.cityForestPosition;saveGame(this.state);}
  this.cameras.main.fadeOut(SCENE_FADE_MS);this.time.delayedCall(SCENE_FADE_MS,()=>{const state=structuredClone(this.state);this.scene.stop();this.onReturn(state,title);});
 }
 update(time:number,ms:number):void{
  if(!this.player)return;this.daylight.update(this.state.time);this.world.update(time);
  if(this.paused||this.leaving||this.ui.isModalOpen()||document.hidden)return;
  const dt=Math.min(ms/1000,.1),before={x:this.player.x,y:this.player.y};this.player.update(dt,cityForestBlockedTile,cityForestBlockedPoint);
  if(this.passage.update(before,this.player,CITY_FOREST_EXIT,CITY_FOREST_ENTRY)){this.leave();return;}
  if(Math.hypot(this.player.x-before.x,this.player.y-before.y)>.1)gameAudio.play('step');
  this.companion?.update(dt,this.player);
  this.farming.update(dt);
  Object.assign(this.state,advanceClock(this.state,dt*GAME_MINUTES_PER_SECOND));
  for(const tree of this.world.trees)tree.setAlpha(this.player.y<tree.y&&Math.abs(this.player.x-tree.x)<65&&this.player.y>tree.y-170?.45:1);
  this.elapsed+=dt;this.updateHUD();if(this.elapsed>5){this.persist();this.elapsed=0;}
 }
}
