import {gameAudio} from '../audio';
import {cabinActorDepth} from '../data/fisher-cabin';
import {createFishingCast} from '../fishing-cast';
import {craftInField,consumeInField} from '../systems/field-inventory';
import {LakeFisherVisit} from '../lake-fisher-visit';
import {preloadDamiaoSprites} from '../damiao-sprites';
import {cabinFloorPoint,cabinAllowsStep} from '../data/fisher-cabin';
import {sampleWaterDepth} from '../swimming';
import {paintedWaterPoint} from '../data/terrain-paint';
import {DEVELOPMENT_TOOLS} from '../development-tools';
import type {MapArea} from '../data/default-maps';
import {setupTreeWind} from '../tree-wind';
import { advanceBackgroundVillage } from '../systems/village-background';
import {fishAtBank} from '../fishing-ui';
import {preloadPetArt} from "../dungeons/pet-sprites";
import {installWorldCompanion,getWorldPetController} from "../dungeons/world-pet-controller";
import {Farming} from '../systems/farming';
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
import {LAKE_CITY_ENTRY,LAKE_CITY_EXIT,LAKE_PROPERTY_ENTRY,LAKE_PROPERTY_EXIT,CITY_LAKE_ENTRY,PROPERTY_LAKE_ENTRY,lakeBlockedPoint,lakeWater,lakePier,lakeBridge,lakeDeckAllowsStep,lakeElevationAllowsStep} from '../data/fishing-lake';
import {FishingLakeWorld,preloadFishingLake} from '../fishing-lake-world';

interface FishingLakeStart{save:SaveData;ui:GameUI;onReturn:(save:SaveData,title?:boolean)=>void;fromCity?:boolean}
export class FishingLakeScene extends Phaser.Scene{
 private state!:SaveData;
 getFishingState():SaveData { return this.state; }
 private ui!:GameUI;
 private onReturn!:FishingLakeStart['onReturn'];
 private player!:Player;
 get companion(){return getWorldPetController(this)?.companion;}
 private world!:FishingLakeWorld;
 private farming!:Farming;
 private fisher?:LakeFisherVisit;
 private daylight!:Daylight;
 private paused=false;
 private leaving=false;
 private fishing=false;
 private readonly propertyPassage=new MapExitPassage();
 private elapsed=0;
 private zoom=1;
 private wheelZoomDistance=0;
 private lastWheelZoomAt=0;
 private readonly passage=new MapExitPassage();
 constructor(){super('Lago');}
 preload():void{preloadFishingLake(this);preloadPetArt(this);preloadDamiaoSprites(this);}
 create(data:FishingLakeStart):void{
  gameAudio.setScene('game');
  setupTreeWind(this);
  this.state=structuredClone(data.save);this.state.activeArea='fishingLake';delete this.state.homePosition;delete this.state.merchantInterior;delete this.state.blacksmithInterior;
  this.ui=data.ui;this.onReturn=data.onReturn;this.paused=false;this.leaving=false;this.elapsed=0;this.passage.reset();this.propertyPassage.reset();this.fishing=false;this.wheelZoomDistance=0;this.lastWheelZoomAt=0;
  this.farming=new Farming(this.state.crops,this.state.preparedSoil,this.state.farmingProgress,this.state.restoredFarmSoil);
  this.world=new FishingLakeWorld(this,this.state.fishingLakeMapEdits);
  const p=this.state.fishingLakePosition,valid=p&&[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!this.movementBlockedPoint(p.x+dx,p.y+dy));
  this.player=new Player(this,this.state.profile,valid?p.x:((this.state.fishingLakeMapEdits?.points?.entry??LAKE_CITY_ENTRY).x+.5)*32,valid?p.y:((this.state.fishingLakeMapEdits?.points?.entry??LAKE_CITY_ENTRY).y+.5)*32,'fishing-lake-player');
  this.player.facing=directionVector(valid?p.direction??'up':'up');this.player.update(0,this.movementBlockedTile,this.movementBlockedPoint,false,this.swimmingPoint,this.allowCabinStep);
  this.fisher=new LakeFisherVisit(this,()=>this.state,()=>this.player,(x,y)=>lakeBlockedPoint(x,y,this.state.fishingLakeMapEdits),value=>this.setPaused(value),()=>this.updateHUD());
  this.zoom=loadCameraZoom();this.daylight=new Daylight(this,3072,2304);this.daylight.update(this.state.time,false,this.state.day);
  this.cameras.main.setBounds(0,0,3072,2304);this.applyCamera();this.cameras.main.fadeIn(SCENE_FADE_MS);
  document.querySelector<HTMLElement>('#ui')!.style.display='';this.ui.showHUD('fishingLake');this.ui.setQuickbar(this.state.quickbar??emptyQuickbar());this.updateHUD();
  const mouse=this.input.mouse,previousWheelDefault=mouse?.preventDefaultWheel;
  if(mouse)mouse.preventDefaultWheel=false;
  this.input.on('pointerdown',this.pointer,this);this.input.keyboard!.on('keydown',this.key,this);this.game.canvas.addEventListener('wheel',this.wheel,{passive:false});this.scale.on('resize',this.applyCamera,this);
  window.addEventListener('pagehide',this.save);window.addEventListener('beforeunload',this.save);window.addEventListener('blur',this.blur);document.addEventListener('visibilitychange',this.visibility);
  this.events.once('shutdown',()=>{if(mouse&&previousWheelDefault!==undefined)mouse.preventDefaultWheel=previousWheelDefault;this.fisher?.destroy();this.fisher=undefined;this.input.off('pointerdown',this.pointer,this);this.daylight.destroy();this.world.destroy();this.input.keyboard?.off('keydown',this.key,this);this.game.canvas.removeEventListener('wheel',this.wheel);this.scale.off('resize',this.applyCamera,this);window.removeEventListener('pagehide',this.save);window.removeEventListener('beforeunload',this.save);window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);});
  installWorldCompanion(
    this,
    () => ({
      save: this.state,
      player: this.player,
      area: "fishingLake",
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
  this.persist();
 }
 private nearFishing():boolean {const x=this.player.x/32,y=this.player.y/32;return lakePier(x,y)||[[-1.5,0],[1.5,0],[0,-1.5],[0,1.5]].some(([dx,dy])=>lakeWater(x+dx,y+dy));}
 private updateHUD():void{
  const resident=this.fisher?.near(),near=this.nearFishing()&&!this.player.isSwimming;
  this.ui.updateHUD({toolConditions:this.state.economy6?.tools,learnedRecipes:this.state.villageProgress?.recipes??[],vigor:this.state.villageProgress?.vigor??100,wateringCan:!!this.state.homeSupplies?.wateringCan,wateringCanWater:this.state.wateringCanWater??0,farmingProgress:this.state.farmingProgress,area:'fishingLake',swimming:this.player.isSwimming,coins:this.state.villageEconomy?.coins??0,inHome:false,name:this.state.profile.name,day:this.state.day,time:this.state.time,inventory:this.state.inventory,tool:'hand',interactionKey:resident||near?'E':null,prompt:resident?'E · Conversar com Damião · comércio e serviços de pesca':near?'E · Pescar · equipe a vara ou a rede pela mochila':'Explore o lago · mirante ao norte · cidade a leste · propriedade ao sul',location:'Lago entre as Serras',harvests:this.state.inventory.turnip,metLia:this.state.metLia,nearWorkbench:false,sheltered:false,shelterReason:'',resourceProgress:'',progress:this.state.progress,playerTile:{x:this.player.x/32,y:this.player.y/32}});
  this.ui.updateCameraZoom(this.zoom,!this.paused);
 }
 private blockedPoint=(x:number,y:number)=>lakeBlockedPoint(x,y,this.state.fishingLakeMapEdits);
 private movementBlockedPoint=(x:number,y:number)=>lakeBlockedPoint(x,y,this.state.fishingLakeMapEdits,true)||!!this.fisher?.sprite.visible&&Math.abs(this.fisher.sprite.x-x)<9&&Math.abs(this.fisher.sprite.y-y)<5;
 private allowCabinStep=(x:number,y:number)=>cabinAllowsStep(this.player,{x,y})&&lakeDeckAllowsStep(this.player,{x,y},(px,py)=>paintedWaterPoint(this.state.fishingLakeMapEdits?.terrain,px,py,(a,b)=>lakeWater(a/32,b/32)))&&lakeElevationAllowsStep(this.player,{x,y});
 private movementBlockedTile=(x:number,y:number)=>this.movementBlockedPoint((x+.5)*32,(y+.5)*32);
 private swimmingPoint=(x:number,y:number)=>lakePier(x/32,y/32)||lakeBridge(x/32,y/32)||cabinFloorPoint(x,y)?0:sampleWaterDepth((px,py)=>!cabinFloorPoint(px,py)&&!lakePier(px/32,py/32)&&!lakeBridge(px/32,py/32)&&paintedWaterPoint(this.state.fishingLakeMapEdits?.terrain,px,py,(x,y)=>lakeWater(x/32,y/32)),x,y);
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
  if(key==='e'&&!this.ui.isModalOpen()&&this.fisher?.open())return;
  if(key==='e'&&this.nearFishing()&&!this.ui.isModalOpen())void this.useVillageItem('fishingRod');
  if(['+','=','-','_','Home'].includes(e.key)&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();this.changeCameraZoom(e.key==='Home'?0:e.key==='-'||e.key==='_'?-1:1);}
 }
 private pointer=(pointer:Phaser.Input.Pointer):void=>{if(!this.paused&&!this.leaving&&!this.ui.isModalOpen()&&pointer.button===0&&this.fisher&&Math.hypot(pointer.worldX-this.fisher.sprite.x,pointer.worldY-this.fisher.sprite.y+24)<42)this.fisher.open();};
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
 async useVillageItem(item:ItemId):Promise<void>{
  if(this.fishing||this.leaving)return;
  if(item!=='fishingRod'&&item!=='net'){const result=consumeInField(this.state,item,saveGame);this.ui.toast(result.message);this.updateHUD();return;}
  if(this.player.isSwimming){this.ui.toast('Saia da água para pescar pela margem ou pelo píer.');return;}
  if(!this.nearFishing()){this.ui.toast('Aproxime-se da margem ou vá até o píer para pescar.');return;}
  this.fishing=true;this.setPaused(true);
  try{this.ui.toast(await fishAtBank(this.state,item==='net',()=>this.updateHUD(),createFishingCast(this,this.player,(x,y)=>this.swimmingPoint(x,y)>0,(x,y)=>!this.movementBlockedPoint(x,y),item==='net')));}finally{this.fishing=false;this.setPaused(false);this.updateHUD();}
 }
 openMapEditor():void{
  if(!DEVELOPMENT_TOOLS||this.leaving)return;
  if(!this.persist())return;const original=structuredClone(this.state);this.setPaused(true);this.ui.showMapEditorMode();this.scene.setVisible(false);this.scene.pause();
  this.scene.launch('Editor',{save:original,area:'fishingLake',onClose:(updated:SaveData|undefined,_area:MapArea)=>{
   this.scene.resume();this.scene.setVisible(true);this.scene.restart({save:updated??original,ui:this.ui,onReturn:this.onReturn,fromCity:true});
  }});
 }
 mainMenu():void{this.ui.closeModal();this.leave(true);}
 captureMap():Promise<string>{
  this.updateHUD();
  const rt=this.make.renderTexture({width:960,height:720},false);rt.camera.setZoom(960/3072).setScroll(0,0).setOrigin(0,0);rt.setOrigin(0);this.children.depthSort();rt.draw([...this.world.objects].sort((a,b)=>(a as Phaser.GameObjects.Image).depth-(b as Phaser.GameObjects.Image).depth));
  return new Promise(resolve=>rt.snapshot(image=>{const url=image instanceof HTMLImageElement?image.src:'';rt.destroy();resolve(url);}));
 }
 persist():boolean{if(!this.player||this.leaving)return false;this.state.activeArea='fishingLake';this.state.quickbar=this.ui.getQuickbar();this.state.crops=this.farming.crops;this.state.fishingLakePosition={x:this.player.x,y:this.player.y,direction:directionFromVector(this.player.facing.x,this.player.facing.y)};return saveGame(this.state);}
 private save=():void=>{this.persist();};
 private blur=():void=>{if(!this.paused&&!this.leaving){this.setPaused(true);this.ui.togglePause();}this.persist();};
 private visibility=():void=>{if(document.hidden)this.blur();};
 private leave(title=false,property=false):void{
  if(this.leaving||!this.persist())return;
  const next=structuredClone(this.state);
  if(!title){next.activeArea=property?'property':'cityForest';
   if(property)next.player={x:(PROPERTY_LAKE_ENTRY.x+.5)*32,y:(PROPERTY_LAKE_ENTRY.y+.5)*32,direction:'down'};
   else next.cityForestPosition={x:(CITY_LAKE_ENTRY.x+.5)*32,y:(CITY_LAKE_ENTRY.y+.5)*32,direction:'right'};
  }
  if(!saveGame(next)){this.ui.toast('Não foi possível salvar. A passagem foi cancelada.');return;}
  this.leaving=true;this.input.keyboard?.resetKeys();this.cameras.main.fadeOut(SCENE_FADE_MS);
  this.time.delayedCall(SCENE_FADE_MS,()=>{
   if(!title&&!property)this.scene.start('AcessoCidade',{save:next,ui:this.ui,onReturn:this.onReturn,fromCity:true});
   else{this.scene.stop();this.onReturn(next,title);}
  });
 }
 update(time:number,ms:number):void{
  if(!this.player)return;this.player.sprite.setDepth(cabinActorDepth(this.player.x,this.player.y));this.daylight.update(this.state.time,false,this.state.day);this.world.update(time);
  if(this.paused||this.leaving||this.ui.isModalOpen()||document.hidden)return;
  const dt=Math.min(ms/1000,.1),before={x:this.player.x,y:this.player.y};this.player.speedMultiplier=this.state.inventory.boots>0?1.08:1;this.player.update(dt,this.movementBlockedTile,this.movementBlockedPoint,true,this.swimmingPoint,this.allowCabinStep);this.player.sprite.setDepth(cabinActorDepth(this.player.x,this.player.y));
  if(this.passage.update(before,this.player,this.state.fishingLakeMapEdits?.points?.exit??LAKE_CITY_EXIT,this.state.fishingLakeMapEdits?.points?.entry??LAKE_CITY_ENTRY)){this.leave();return;}
  if(this.propertyPassage.update(before,this.player,LAKE_PROPERTY_EXIT,LAKE_PROPERTY_ENTRY)){this.leave(false,true);return;}
  this.farming.update(dt);
  Object.assign(this.state,advanceClock(this.state,dt*GAME_MINUTES_PER_SECOND));
  this.state.crops=this.farming.crops;advanceBackgroundVillage(this.state,dt,this.player);this.fisher?.update(dt);
  for(const tree of this.world.trees)tree.setAlpha(this.player.y<tree.y&&Math.abs(this.player.x-tree.x)<65&&this.player.y>tree.y-170?.45:1);
  this.elapsed+=dt;this.updateHUD();if(this.elapsed>5){this.persist();this.elapsed=0;}
 }
}
