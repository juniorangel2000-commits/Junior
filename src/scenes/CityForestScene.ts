import {craftInField,consumeInField} from '../systems/field-inventory';
import {villageAccessUnlocked,invitationGateBlocked,VILLAGE_LOCK_MESSAGE} from '../systems/village-introduction';
import {drawVillageInvitationGate} from '../village-invitation-gate';
import {sampleWaterDepth} from '../swimming';
import {paintedWaterPoint} from '../data/terrain-paint';
import {CITY_LAKE_ENTRY,CITY_LAKE_EXIT,LAKE_CITY_ENTRY} from '../data/fishing-lake';
import {DEVELOPMENT_TOOLS} from '../development-tools';
import type {MapArea} from '../data/default-maps';
import {setupTreeWind} from '../tree-wind';
import { advanceBackgroundVillage } from '../systems/village-background';
import {CityTravelTransition} from '../dungeons/city-travel-transition';
import {preloadPetArt} from "../dungeons/pet-sprites";
import {installWorldCompanion,getWorldPetController} from "../dungeons/world-pet-controller";
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
import {CITY_ACCESS,CITY_FOREST_ENTRY,CITY_FOREST_EXIT,VILLAGE_NORTH_ARRIVAL,cityForestWater,cityForestBlockedPoint} from '../data/city-forest';
import {CityForestWorld,preloadCityForest} from '../city-forest-world';

interface CityForestStart{save:SaveData;ui:GameUI;onReturn:(save:SaveData,title?:boolean)=>void;fromCity?:boolean}
export class CityForestScene extends Phaser.Scene{
 private state!:SaveData;
 private ui!:GameUI;
 private onReturn!:CityForestStart['onReturn'];
 private player!:Player;
 get companion(){return getWorldPetController(this)?.companion;}
 private world!:CityForestWorld;
 private farming!:Farming;
 private daylight!:Daylight;
 private paused=false;
 private leaving=false;
 private cityPromptArmed=true;
 private elapsed=0;
 private zoom=1;
 private wheelZoomDistance=0;
 private lastWheelZoomAt=0;
 private readonly passage=new MapExitPassage();
 private readonly lakePassage=new MapExitPassage();
 constructor(){super('AcessoCidade');}
 preload():void{preloadCityForest(this);preloadPetArt(this);}
 create(data:CityForestStart):void{
  setupTreeWind(this);
  this.state=structuredClone(data.save);this.state.activeArea='cityForest';delete this.state.homePosition;delete this.state.merchantInterior;delete this.state.blacksmithInterior;
  this.ui=data.ui;this.onReturn=data.onReturn;this.paused=false;this.leaving=false;this.elapsed=0;this.passage.reset();this.lakePassage.reset();this.wheelZoomDistance=0;this.lastWheelZoomAt=0;
  this.farming=new Farming(this.state.crops,this.state.preparedSoil,this.state.farmingProgress,this.state.restoredFarmSoil);
  this.world=new CityForestWorld(this,this.state.cityForestMapEdits);
  drawVillageInvitationGate(this,this.state,'cityForest',this.state.cityForestMapEdits?.points?.exit);
  const p=this.state.cityForestPosition,valid=p&&[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!this.movementBlockedPoint(p.x+dx,p.y+dy));
  this.player=new Player(this,this.state.profile,valid?p.x:((this.state.cityForestMapEdits?.points?.entry??CITY_FOREST_ENTRY).x+.5)*32,valid?p.y:((this.state.cityForestMapEdits?.points?.entry??CITY_FOREST_ENTRY).y+.5)*32,'city-forest-player');
  this.player.facing=directionVector(valid?p.direction??'up':'up');this.player.update(0,this.movementBlockedTile,this.movementBlockedPoint,false,this.swimmingPoint);
  this.zoom=loadCameraZoom();this.daylight=new Daylight(this,3072,2304);this.daylight.update(this.state.time);
  this.cameras.main.setBounds(0,0,3072,2304);this.applyCamera();this.cameras.main.fadeIn(SCENE_FADE_MS);
  document.querySelector<HTMLElement>('#ui')!.style.display='';this.ui.showHUD('cityForest');this.ui.setQuickbar(this.state.quickbar??emptyQuickbar());this.updateHUD();
  const mouse=this.input.mouse,previousWheelDefault=mouse?.preventDefaultWheel;
  if(mouse)mouse.preventDefaultWheel=false;
  this.input.keyboard!.on('keydown',this.key,this);this.game.canvas.addEventListener('wheel',this.wheel,{passive:false});this.scale.on('resize',this.applyCamera,this);
  window.addEventListener('pagehide',this.save);window.addEventListener('beforeunload',this.save);window.addEventListener('blur',this.blur);document.addEventListener('visibilitychange',this.visibility);
  this.events.once('shutdown',()=>{if(mouse&&previousWheelDefault!==undefined)mouse.preventDefaultWheel=previousWheelDefault;this.daylight.destroy();this.world.destroy();this.input.keyboard?.off('keydown',this.key,this);this.game.canvas.removeEventListener('wheel',this.wheel);this.scale.off('resize',this.applyCamera,this);window.removeEventListener('pagehide',this.save);window.removeEventListener('beforeunload',this.save);window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);});
  installWorldCompanion(
    this,
    () => ({
      save: this.state,
      player: this.player,
      area: "cityForest",
      space: "outdoors",
      blockedPoint: this.blockedPoint,
      forage: true,
      enabled: true,
      canMove:
        !this.paused &&
        !this.leaving &&
        !this.ui.isModalOpen() &&
        !document.hidden,
    }),
    this.ui,
    () => this.persist(),
  );
  this.cityPromptArmed=!data.fromCity;
  if(this.state.dungeonRun)this.enterDungeons();else this.persist();
 }
 private enterLake():void {
  if(this.leaving||!this.persist())return;
  const save=structuredClone(this.state);save.activeArea='fishingLake';save.fishingLakePosition={x:(LAKE_CITY_ENTRY.x+.5)*32,y:(LAKE_CITY_ENTRY.y+.5)*32,direction:'left'};
  if(!saveGame(save))return;
  this.leaving=true;this.input.keyboard?.resetKeys();this.cameras.main.fadeOut(SCENE_FADE_MS);
  this.time.delayedCall(SCENE_FADE_MS,()=>this.scene.start('Lago',{save,ui:this.ui,onReturn:this.onReturn}));
 }
 private nearCity():boolean{return Math.hypot(this.player.x/32-CITY_ACCESS.x,this.player.y/32-CITY_ACCESS.y)<3;}
 private updateHUD():void{
  this.ui.updateHUD({toolConditions:this.state.economy6?.tools,learnedRecipes:this.state.villageProgress?.recipes??[],vigor:this.state.villageProgress?.vigor??100,wateringCan:!!this.state.homeSupplies?.wateringCan,wateringCanWater:this.state.wateringCanWater??0,farmingProgress:this.state.farmingProgress,area:'cityForest',swimming:this.player.isSwimming,coins:this.state.villageEconomy?.coins??0,inHome:false,name:this.state.profile.name,day:this.state.day,time:this.state.time,inventory:this.state.inventory,tool:'hand',interactionKey:null,prompt:!villageAccessUnlocked(this.state)&&this.player.y>67*32?VILLAGE_LOCK_MESSAGE:this.nearCity()?'Siga pela estrada para viajar à cidade':'Lago a oeste · vila ao sul · cidade ao norte',location:'Floresta de Acesso à Cidade',harvests:this.state.inventory.turnip,metLia:this.state.metLia,nearWorkbench:false,sheltered:false,shelterReason:'',resourceProgress:'',progress:this.state.progress,playerTile:{x:this.player.x/32,y:this.player.y/32}});
  this.ui.updateCameraZoom(this.zoom,!this.paused);
 }
 private blockedPoint=(x:number,y:number)=>cityForestBlockedPoint(x,y,this.state.cityForestMapEdits);
 private movementBlockedPoint=(x:number,y:number)=>cityForestBlockedPoint(x,y,this.state.cityForestMapEdits,true)||invitationGateBlocked(this.state,'cityForest',x,y,this.state.cityForestMapEdits?.points?.exit);
 private movementBlockedTile=(x:number,y:number)=>this.movementBlockedPoint((x+.5)*32,(y+.5)*32);
 private swimmingPoint=(x:number,y:number)=>sampleWaterDepth((px,py)=>paintedWaterPoint(this.state.cityForestMapEdits?.terrain,px,py,(x,y)=>cityForestWater(x/32,y/32)),x,y);
 private key(e:KeyboardEvent):void{
  if(e.repeat||this.leaving||e.target instanceof HTMLElement&&e.target.matches('input,textarea,select,[contenteditable="true"]'))return;
  if(DEVELOPMENT_TOOLS&&e.key==='F2'){e.preventDefault();this.openMapEditor();return;}
  const key=e.key.toLowerCase();
  if(key==='escape'){e.preventDefault();this.ui.togglePause();return;}
  if(key==='m'){e.preventDefault();this.updateHUD();this.ui.toggleMap();return;}
  if(key==='i'){e.preventDefault();this.updateHUD();this.ui.toggleInventory(this.state.inventory);return;}
  if(key==='c'){e.preventDefault();this.ui.toggleCrafting(this.state.inventory,false);return;}
  if(key==='b'){e.preventDefault();this.ui.toast('Construa na propriedade.');return;}
  if(this.paused)return;
  if(e.key>='1'&&e.key<='9'){this.ui.activateSlot(Number(e.key)-1);return;}
  if(key==='e'&&this.nearCity()&&!this.ui.isModalOpen())this.askCityTravel();
  if(['+','=','-','_','Home'].includes(e.key)&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();this.changeCameraZoom(e.key==='Home'?0:e.key==='-'||e.key==='_'?-1:1);}
 }
 private applyCamera=():void=>{
  if(!this.player)return;
  this.cameras.main.setBounds(0,0,3072,2304).setZoom(2*this.zoom).startFollow(this.player,false,1,1).centerOn(this.player.x,this.player.y);
 };
 private wheel=(event:WheelEvent):void=>{
  if(this.paused||this.leaving||this.ui.isModalOpen()||event.ctrlKey||event.metaKey||event.altKey||!event.deltaY)return;
  event.preventDefault();
  if(event.timeStamp-this.lastWheelZoomAt>250)this.wheelZoomDistance=0;
  this.lastWheelZoomAt=event.timeStamp;
  const pixels=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?this.scale.height:1);
  if(Math.sign(pixels)!==Math.sign(this.wheelZoomDistance))this.wheelZoomDistance=0;
  this.wheelZoomDistance+=pixels;
  if(Math.abs(this.wheelZoomDistance)<40)return;
  this.changeCameraZoom(this.wheelZoomDistance<0?1:-1);
  this.wheelZoomDistance=0;
 };
 changeCameraZoom(direction:-1|0|1):void{
  if(this.paused||this.leaving||this.ui.isModalOpen())return;
  this.zoom=stepCameraZoom(this.zoom,direction);saveCameraZoom(this.zoom);this.applyCamera();this.ui.updateCameraZoom(this.zoom,true,true);
 }
 setPaused(value:boolean):void{this.paused=value;this.input.keyboard?.resetKeys();if(value)this.persist();this.ui.updateCameraZoom(this.zoom,!value);}
 selectTool(_tool:Tool):void{this.ui.toast('Explore a floresta a pé. A coleta continua disponível nos mapas anteriores.');}
 craftRecipe(id:string):void{const result=craftInField(this.state,id,saveGame);this.ui.toast(result.message);this.updateHUD();this.ui.refreshCrafting(this.state.inventory,false);}
 async useVillageItem(item:ItemId):Promise<void>{if(this.leaving)return;const result=consumeInField(this.state,item,saveGame);this.ui.toast(result.message);this.updateHUD();}
 openMapEditor():void{
  if(!DEVELOPMENT_TOOLS||this.leaving)return;
  if(!this.persist())return;const original=structuredClone(this.state);this.setPaused(true);this.ui.showMapEditorMode();this.scene.setVisible(false);this.scene.pause();
  this.scene.launch('Editor',{save:original,area:'cityForest',onClose:(updated:SaveData|undefined,_area:MapArea)=>{
   this.scene.resume();this.scene.setVisible(true);this.scene.restart({save:updated??original,ui:this.ui,onReturn:this.onReturn,fromCity:true});
  }});
 }
 mainMenu():void{this.ui.closeModal();this.leave(true);}
 captureMap():Promise<string>{
  this.updateHUD();
  const rt=this.make.renderTexture({width:960,height:720},false);rt.camera.setZoom(960/3072).setScroll(0,0).setOrigin(0,0);rt.setOrigin(0);this.children.depthSort();rt.draw([...this.world.objects].sort((a,b)=>(a as Phaser.GameObjects.Image).depth-(b as Phaser.GameObjects.Image).depth));
  return new Promise(resolve=>rt.snapshot(image=>{const url=image instanceof HTMLImageElement?image.src:'';rt.destroy();resolve(url);}));
 }
 persist():boolean{if(!this.player||this.leaving)return false;this.state.activeArea='cityForest';this.state.crops=this.farming.crops;this.state.cityForestPosition={x:this.player.x,y:this.player.y,direction:directionFromVector(this.player.facing.x,this.player.facing.y)};return saveGame(this.state);}
 private save=():void=>{this.persist();};
 private blur=():void=>{if(!this.paused&&!this.leaving){this.setPaused(true);this.ui.togglePause();}this.persist();};
 private visibility=():void=>{if(document.hidden)this.blur();};
 private enterDungeons():void{
  if(this.leaving||!this.persist())return;this.leaving=true;const ui=this.ui,onReturn=this.onReturn;
  const save=structuredClone(this.state);
  const start=(travel?:CityTravelTransition):void=>{
   this.scene.start('Dungeons',{save,ui,travel,onReturn:(next:SaveData,title=false)=>{if(title)onReturn(next,true);else this.scene.start('AcessoCidade',{save:next,ui,onReturn,fromCity:true});}});
  };
  if(save.dungeonRun){start();return;}
  const travel=new CityTravelTransition(save.profile,()=>{
   // Let the first video frame paint before starting the scene loader.
   requestAnimationFrame(()=>setTimeout(()=>start(travel),0));
  },()=>{
   travel.destroy();this.scene.stop('Dungeons');
   this.scene.start('AcessoCidade',{save,ui,onReturn,fromCity:true});
  });
 }
 private askCityTravel():void{
  if(this.leaving||this.ui.isModalOpen())return;
  this.cityPromptArmed=false;
  this.input.keyboard?.resetKeys();
  this.ui.confirmCityTravel(()=>this.enterDungeons());
 }
 private leave(title=false):void{
  if(!title&&!villageAccessUnlocked(this.state)){this.ui.toast(VILLAGE_LOCK_MESSAGE);return;}
  if(this.leaving)return;this.persist();this.leaving=true;
  if(!title){this.state.activeArea='village';this.state.villagePosition={x:(VILLAGE_NORTH_ARRIVAL.x+.5)*32,y:(VILLAGE_NORTH_ARRIVAL.y+.5)*32,direction:'down'};delete this.state.cityForestPosition;saveGame(this.state);}
  this.cameras.main.fadeOut(SCENE_FADE_MS);this.time.delayedCall(SCENE_FADE_MS,()=>{const state=structuredClone(this.state);this.scene.stop();this.onReturn(state,title);});
 }
 update(time:number,ms:number):void{
  if(!this.player)return;this.daylight.update(this.state.time);this.world.update(time);
  if(this.paused||this.leaving||this.ui.isModalOpen()||document.hidden)return;
  const dt=Math.min(ms/1000,.1),before={x:this.player.x,y:this.player.y};this.player.speedMultiplier=this.state.inventory.boots>0?1.08:1;this.player.update(dt,this.movementBlockedTile,this.movementBlockedPoint,true,this.swimmingPoint);
  if(this.lakePassage.update(before,this.player,CITY_LAKE_EXIT,CITY_LAKE_ENTRY)){this.enterLake();return;}
  const distance=Math.hypot(this.player.x/32-CITY_ACCESS.x,this.player.y/32-CITY_ACCESS.y);
  if(distance>4)this.cityPromptArmed=true;
  if(this.cityPromptArmed&&distance<3){this.askCityTravel();return;}
  if(this.passage.update(before,this.player,this.state.cityForestMapEdits?.points?.exit??CITY_FOREST_EXIT,this.state.cityForestMapEdits?.points?.entry??CITY_FOREST_ENTRY)){this.leave();return;}
  if(Math.hypot(this.player.x-before.x,this.player.y-before.y)>.1)gameAudio.play('step');
  this.farming.update(dt);
  Object.assign(this.state,advanceClock(this.state,dt*GAME_MINUTES_PER_SECOND));
    advanceBackgroundVillage(this.state, dt);
  for(const tree of this.world.trees)tree.setAlpha(this.player.y<tree.y&&Math.abs(this.player.x-tree.x)<65&&this.player.y>tree.y-170?.45:1);
  this.elapsed+=dt;this.updateHUD();if(this.elapsed>5){this.persist();this.elapsed=0;}
 }
}
