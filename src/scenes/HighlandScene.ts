import Phaser from 'phaser';
import type {SaveData,Tool,ItemId} from '../types';
import type {GameUI} from '../ui';
import {Player} from '../player';
import {Daylight} from '../daylight';
import {gameAudio} from '../audio';
import {setupTreeWind} from '../tree-wind';
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
import {sampleWaterDepth} from '../swimming';
import {createFishingCast} from '../fishing-cast';
import {fishAtBank} from '../fishing-ui';
import {HighlandWorld,preloadHighland} from '../highland-world';
import {HIGHLAND_LAKE_PASSAGE,highlandResumePosition,HIGHLAND_SIZE,LAKE_HIGHLAND_RETURN,highlandWaterPoint,highlandDeck,highlandAllowsStep,highlandBlockedPoint,highlandMineApproach} from '../data/highland';
import {DEVELOPMENT_TOOLS} from '../development-tools';
import {MINE_ARRIVAL} from '../data/mine-room';
interface HighlandStart{save:SaveData;ui:GameUI;onReturn:(save:SaveData,title?:boolean)=>void}
export class HighlandScene extends Phaser.Scene {
 private state!:SaveData;private ui!:GameUI;private player!:Player;private world!:HighlandWorld;private daylight!:Daylight;private farming!:Farming;
 private onReturn!:HighlandStart['onReturn'];private paused=false;private leaving=false;private fishing=false;private zoom=1;private elapsed=0;private passage=new DoorwayPassage();
 constructor(){super('Serra');}
 preload():void{preloadHighland(this);preloadPetArt(this);}
 getFishingState():SaveData{return this.state;}
 create(data:HighlandStart):void{
  if(data.save.mineInterior){this.leaving=true;this.scene.start('Mina',data);return;}
  this.state=structuredClone(data.save);this.state.activeArea='highland';delete this.state.homePosition;delete this.state.merchantInterior;delete this.state.blacksmithInterior;this.ui=data.ui;this.onReturn=data.onReturn;this.paused=this.leaving=this.fishing=false;this.elapsed=0;this.passage.reset();gameAudio.setScene('game');setupTreeWind(this);
  this.world=new HighlandWorld(this,this.state.highlandMapEdits);this.farming=new Farming(this.state.crops,this.state.preparedSoil,this.state.farmingProgress,this.state.restoredFarmSoil);
  const p=highlandResumePosition(this.state.highlandPosition,this.state.highlandMapEdits);
  this.player=new Player(this,this.state.profile,p.x,p.y,'highland-player');this.player.facing=directionVector(p.direction??'up');this.player.update(0,this.blockedTile,this.movementBlockedPoint,false,this.swimmingPoint,this.allowStep);
  this.daylight=new Daylight(this,HIGHLAND_SIZE.width,HIGHLAND_SIZE.height);this.zoom=loadCameraZoom();this.cameras.main.setBounds(0,0,HIGHLAND_SIZE.width,HIGHLAND_SIZE.height);this.applyCamera();this.cameras.main.fadeIn(SCENE_FADE_MS);
  this.ui.showHUD('highland');document.querySelector<HTMLElement>('#ui')!.style.display='';this.ui.setQuickbar(this.state.quickbar??emptyQuickbar());this.updateHUD();
  this.input.keyboard!.on('keydown',this.key,this);this.input.on('wheel',this.wheel,this);this.input.on('pointerdown',this.pointer,this);this.scale.on('resize',this.applyCamera,this);
  window.addEventListener('pagehide',this.save);window.addEventListener('beforeunload',this.save);window.addEventListener('blur',this.blur);document.addEventListener('visibilitychange',this.visibility);
  this.events.once('shutdown',()=>{this.world.destroy();this.daylight.destroy();this.input.keyboard?.off('keydown',this.key,this);this.input.off('wheel',this.wheel,this);this.input.off('pointerdown',this.pointer,this);this.scale.off('resize',this.applyCamera,this);window.removeEventListener('pagehide',this.save);window.removeEventListener('beforeunload',this.save);window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);});
  installWorldCompanion(this,()=>({save:this.state,player:this.player,area:'highland',space:'outdoors',blockedPoint:this.blockedPoint,enabled:true,canMove:!this.paused&&!this.leaving&&!this.ui.isModalOpen()&&!document.hidden}),this.ui,()=>this.persist());this.persist();
 }
 private blockedPoint=(x:number,y:number)=>highlandBlockedPoint(x,y,this.state.highlandMapEdits);
 private movementBlockedPoint=(x:number,y:number)=>highlandBlockedPoint(x,y,this.state.highlandMapEdits,true);
 private blockedTile=(x:number,y:number)=>this.movementBlockedPoint((x+.5)*32,(y+.5)*32);
 private swimmingPoint=(x:number,y:number)=>highlandDeck(x,y,this.state.highlandMapEdits)?0:sampleWaterDepth((a,b)=>!highlandDeck(a,b,this.state.highlandMapEdits)&&highlandWaterPoint(a,b,this.state.highlandMapEdits),x,y);
 private allowStep=(x:number,y:number)=>highlandAllowsStep(this.player,{x,y},this.state.highlandMapEdits);
 private nearMine():boolean{const p=highlandMineApproach(this.state.highlandMapEdits);return !!p&&Math.hypot(this.player.x-p.x,this.player.y-p.y)<70&&!this.player.isSwimming;}
 private nearFishing():boolean{return !this.player.isSwimming&&[[40,0],[-40,0],[0,40],[0,-40]].some(([dx,dy])=>highlandWaterPoint(this.player.x+dx,this.player.y+dy,this.state.highlandMapEdits));}
 private updateHUD():void{this.ui.updateHUD({area:'highland',worldMapSize:{width:48,height:32},worldWeapon:this.state.worldWeapon,toolConditions:this.state.economy6?.tools,learnedRecipes:this.state.villageProgress?.recipes??[],name:this.state.profile.name,day:this.state.day,time:this.state.time,inventory:this.state.inventory,tool:'hand',inHome:false,swimming:this.player.isSwimming,coins:this.state.villageEconomy?.coins??0,vigor:this.state.villageProgress?.vigor??100,wateringCan:!!this.state.homeSupplies?.wateringCan,wateringCanWater:this.state.wateringCanWater??0,playerTile:{x:this.player.x/32,y:this.player.y/32},interactionKey:this.nearMine()||this.nearFishing()?'E':null,prompt:this.nearMine()?'Entrar na Mina Antiga':this.nearFishing()?'Pescar no rio da serra':this.player.isSwimming?'Nadar · a corrente segue para a queda':Math.hypot(this.player.x-HIGHLAND_LAKE_PASSAGE.x,this.player.y-HIGHLAND_LAKE_PASSAGE.y)<70?'Descer ao Lago entre as Serras':'Ponte elevada · mina a nordeste · escadaria de volta ao lago a sudoeste',location:'Platô da Nascente',harvests:this.state.inventory.turnip,metLia:this.state.metLia,nearWorkbench:false,sheltered:false,shelterReason:'',resourceProgress:'',farmingProgress:this.farming.progress,progress:this.state.progress});this.ui.updateCameraZoom(this.zoom,!this.paused);}
 private interact():void{if(this.nearMine())this.enterMine();else if(this.nearFishing())void this.useVillageItem('fishingRod');}
 private enterMine():void{
  if(this.leaving||!this.persist())return;const next=structuredClone(this.state);next.mineInterior={...MINE_ARRIVAL};
  if(!saveGame(next)){this.ui.toast('Não foi possível salvar. A passagem foi cancelada.');return;}
  this.leaving=true;this.input.keyboard?.resetKeys();this.cameras.main.fadeOut(SCENE_FADE_MS);this.time.delayedCall(SCENE_FADE_MS,()=>this.scene.start('Mina',{save:next,ui:this.ui,onReturn:this.onReturn}));
 }
 private key(e:KeyboardEvent):void{if(e.repeat||this.leaving)return;if(e.key!=='Escape'&&e.target instanceof HTMLElement&&e.target.matches('input,textarea,select,[contenteditable="true"]'))return;const k=e.key.toLowerCase();if(k==='escape'){e.preventDefault();this.ui.togglePause();return;}if(k==='i'){this.ui.toggleInventory(this.state.inventory);return;}if(k==='m'){void this.ui.toggleMap();return;}if(k==='c'){this.ui.toggleCrafting(this.state.inventory,false);return;}if(this.paused||this.ui.isModalOpen())return;if(k==='e')this.interact();if(DEVELOPMENT_TOOLS&&e.key==='F2')this.openMapEditor();if(e.key>='1'&&e.key<='9')this.ui.activateSlot(Number(e.key)-1);if(['+','=','-','_','Home'].includes(e.key))this.changeCameraZoom(e.key==='Home'?0:e.key==='-'||e.key==='_'?-1:1);}
 private pointer=(p:Phaser.Input.Pointer)=>{if(p.button===0&&!this.paused&&!this.ui.isModalOpen())this.interact();};
 private wheel=(_p:Phaser.Input.Pointer,_objects:unknown,_dx:number,dy:number)=>{if(!this.paused&&!this.ui.isModalOpen()&&Math.abs(dy)>5)this.changeCameraZoom(dy>0?-1:1);};
 private applyCamera=()=>{this.cameras.main.setZoom(2*this.zoom).startFollow(this.player,true,.12,.12).setRoundPixels(true);};
 changeCameraZoom(d:-1|0|1):void{if(this.paused)return;this.zoom=stepCameraZoom(this.zoom,d);saveCameraZoom(this.zoom);this.applyCamera();this.ui.updateCameraZoom(this.zoom,true,true);}
 setPaused(value:boolean):void{this.paused=value;this.input.keyboard?.resetKeys();if(value)this.persist();}
 selectTool(_tool:Tool):void{}
 craftRecipe(id:string):void{const r=craftInField(this.state,id,saveGame);this.ui.toast(r.message);this.updateHUD();this.ui.refreshCrafting(this.state.inventory,false);}
 async useVillageItem(item:ItemId):Promise<void>{if(this.fishing||this.leaving)return;if(item!=='fishingRod'&&item!=='net'){const r=consumeInField(this.state,item,saveGame);this.ui.toast(r.message);this.updateHUD();return;}if(!this.nearFishing()){this.ui.toast('Aproxime-se da margem para pescar.');return;}this.fishing=true;this.setPaused(true);try{this.ui.toast(await fishAtBank(this.state,item==='net',()=>this.updateHUD(),createFishingCast(this,this.player,(x,y)=>highlandWaterPoint(x,y,this.state.highlandMapEdits),(x,y)=>!this.movementBlockedPoint(x,y),item==='net')));}finally{this.fishing=false;this.setPaused(false);this.updateHUD();}}
 async captureMap():Promise<string>{const rt=this.make.renderTexture({width:960,height:640},false);rt.camera.setZoom(960/1536).setScroll(0,0).setOrigin(0,0);this.children.depthSort();rt.draw(this.children.list.filter(o=>o!==this.player.sprite&&!this.daylight.contains(o)&&'visible'in o&&o.visible));return new Promise(resolve=>rt.snapshot(img=>{const url=img instanceof HTMLImageElement?img.src:'';rt.destroy();resolve(url);}));}
 openMapEditor():void{if(!DEVELOPMENT_TOOLS||this.leaving||this.ui.isModalOpen())return;this.persist();this.setPaused(true);const original=structuredClone(this.state);this.ui.showMapEditorMode();this.scene.setVisible(false);this.scene.pause();this.scene.launch('Editor',{save:original,area:'highland',onClose:(updated:SaveData|undefined)=>{this.scene.resume();this.scene.setVisible(true);this.scene.restart({save:updated??original,ui:this.ui,onReturn:this.onReturn});}});}
 persist():boolean{return this.save();}
 private save=():boolean=>{if(!this.player||this.leaving)return true;this.state.highlandPosition={x:this.player.x,y:this.player.y,direction:directionFromVector(this.player.facing.x,this.player.facing.y)};this.state.quickbar=this.ui.getQuickbar();this.state.crops=this.farming.crops.map(c=>({...c}));return saveGame(this.state);};
 private blur=()=>this.input.keyboard?.resetKeys();private visibility=()=>{if(document.hidden){this.blur();this.persist();}};
 mainMenu():void{this.ui.closeModal();this.leave(true);}
 private leave(title=false):void{if(this.leaving)return;this.persist();const next=structuredClone(this.state);if(!title){next.activeArea='fishingLake';next.fishingLakePosition={x:(LAKE_HIGHLAND_RETURN.x+.5)*32,y:(LAKE_HIGHLAND_RETURN.y+.5)*32,direction:'down'};}if(!saveGame(next)){this.ui.toast('Não foi possível salvar. A passagem foi cancelada.');return;}this.leaving=true;this.cameras.main.fadeOut(SCENE_FADE_MS);this.time.delayedCall(SCENE_FADE_MS,()=>{this.scene.stop();this.onReturn(next,title);});}
 update(_time:number,ms:number):void{if(!this.player||this.leaving)return;this.daylight.update(this.state.time,false,this.state.day);if(this.paused||this.leaving||this.ui.isModalOpen()||document.hidden)return;const dt=Math.min(.1,ms/1000),before={x:this.player.x,y:this.player.y};this.player.speedMultiplier=this.state.inventory.boots>0?1.08:1;this.player.update(dt,this.blockedTile,this.movementBlockedPoint,true,this.swimmingPoint,this.allowStep);this.player.sprite.setDepth(this.player.y);if(!this.player.isSwimming&&this.passage.update(before,this.player,HIGHLAND_LAKE_PASSAGE)){this.leave();return;}this.farming.update(dt);Object.assign(this.state,advanceClock(this.state,dt*GAME_MINUTES_PER_SECOND));this.state.crops=this.farming.crops;advanceBackgroundVillage(this.state,dt,this.player);for(const t of this.world.trees)t.setAlpha(this.player.y<t.y&&Math.abs(this.player.x-t.x)<45&&this.player.y>t.y-t.displayHeight?.4:1);this.updateHUD();this.elapsed+=dt;if(this.elapsed>=5){this.elapsed=0;this.persist();}}
}
