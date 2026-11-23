import Phaser from 'phaser';
import type {SaveData,Tool,ItemId,TilePoint} from '../types';
import type {GameUI} from '../ui';
import {Player} from '../player';
import {gameAudio} from '../audio';
import {saveGame} from '../systems/save';
import {Inventory} from '../systems/inventory';
import {advanceClock,GAME_MINUTES_PER_SECOND} from '../systems/clock';
import {advanceBackgroundVillage} from '../systems/village-background';
import {craftInField,consumeInField} from '../systems/field-inventory';
import {emptyQuickbar} from '../systems/quickbar';
import {DoorwayPassage,SCENE_FADE_MS} from '../systems/map-transition';
import {directionVector} from '../character-directions';
import {loadCameraZoom,saveCameraZoom,stepCameraZoom,mapCameraZoom} from '../camera-zoom';
import {createMineMissionRuntime} from '../systems/mine-missions';
import {bentoSceneWriter} from '../systems/bento-commit';
import {playerSpeedFactor,spendVigor} from '../systems/food-effects';
import {Daylight} from '../daylight';
import {GreenhouseFarm,greenhouseLevel,greenhouseRoom,greenhousePlots,greenhouseDoor,greenhouseBarrel} from '../systems/greenhouse';
import {cropSpriteLayout} from '../crop-layout';
import {CROP_CATALOG} from '../data/crop-catalog';
import {cropDefinition,type CropId} from '../data/crops';
import {WATER_CAPACITY} from '../data/watering-can';
import {cropStatus} from '../systems/farming';

const T=32;
interface GreenhouseStart{save:SaveData;ui:GameUI;onReturn:(save:SaveData,title?:boolean)=>void}
/** Interior da estufa (preview.48). A propriedade dorme enquanto você está aqui; o save guarda você
 * na porta, do lado de fora. Arte provisória desenhada por código: piso de pedra, paredes de vidro. */
export class GreenhouseScene extends Phaser.Scene{
 private state!:SaveData;private ui!:GameUI;private player!:Player;private farm!:GreenhouseFarm;private onReturn!:GreenhouseStart['onReturn'];
 private level=1;private paused=false;private leaving=false;private zoom=1;private elapsed=0;private passage=new DoorwayPassage();
 private soil?:Phaser.GameObjects.Graphics;private crops:Phaser.GameObjects.Image[]=[];private daylight?:Daylight;
 private missionRuntime=createMineMissionRuntime(()=>this.snapshotState(),saveGame,()=>this.state,()=>this.player);
 private bentoRuntime={missions:this.missionRuntime,write:bentoSceneWriter(()=>this.snapshotState(),saveGame)};
 constructor(){super('Estufa');}
 getGroundItemRuntime(){return undefined;}
 getMineMissionRuntime=()=>this.missionRuntime;
 getFishingState=()=>this.state;
 private get room(){return greenhouseRoom(this.level);}
 create(data:GreenhouseStart):void{
  this.state=structuredClone(data.save);this.ui=data.ui;this.onReturn=data.onReturn;this.paused=this.leaving=false;this.elapsed=0;this.passage.reset();this.crops=[];gameAudio.setScene('game');
  this.level=Math.max(1,greenhouseLevel(this.state));
  this.farm=new GreenhouseFarm(this.state.greenhouse?.crops??[],this.level);this.farm.update(0,this.state.day);
  this.drawRoom();this.soil=this.add.graphics().setDepth(-900);this.refreshCrops();
  const door=greenhouseDoor(this.level);this.player=new Player(this,this.state.profile,(door.x+.5)*T,(door.y-.5)*T,'greenhouse-player');this.player.facing=directionVector('up');this.player.update(0,this.blockedTile,this.blocked,false);
  this.zoom=loadCameraZoom();const w=this.room.width*T,h=this.room.height*T;this.cameras.main.setBounds(0,0,w,h).setBackgroundColor('#1d2a22');this.applyCamera();this.cameras.main.fadeIn(SCENE_FADE_MS);
  this.daylight=new Daylight(this,w,h);this.daylight.update(this.state.time,'shelter',this.state.day);
  this.ui.showHUD();document.querySelector<HTMLElement>('#ui')!.style.display='';this.ui.setQuickbar(this.state.quickbar??emptyQuickbar());this.updateHUD();
  this.input.keyboard!.on('keydown',this.key,this);this.input.on('wheel',this.wheel,this);this.scale.on('resize',this.applyCamera,this);
  window.addEventListener('pagehide',this.save);window.addEventListener('beforeunload',this.save);
  this.events.once('shutdown',()=>{this.daylight?.destroy();this.daylight=undefined;for(const c of this.crops)c.destroy();this.crops=[];this.input.keyboard?.off('keydown',this.key,this);this.input.off('wheel',this.wheel,this);this.scale.off('resize',this.applyCamera,this);window.removeEventListener('pagehide',this.save);window.removeEventListener('beforeunload',this.save);});
  this.persist();
 }
 /** Piso de pedra, moldura de madeira e vidro no fundo e nas laterais, barril d'água ao lado da porta. */
 private drawRoom():void{
  const {width:W,height:H}=this.room,g=this.add.graphics().setDepth(-1000),door=greenhouseDoor(this.level),barrel=greenhouseBarrel(this.level);
  g.fillStyle(0x8a8676).fillRect(0,0,W*T,H*T);
  for(let y=2;y<H-1;y++)for(let x=1;x<W-1;x++){g.fillStyle((x+y)%2?0x9a9585:0x928d7e).fillRect(x*T,y*T,T,T);g.fillStyle(0x7b776a).fillRect(x*T,y*T+T-1,T,1).fillRect(x*T+T-1,y*T,1,T);}
  // Parede de vidro do fundo (duas fileiras) e laterais.
  g.fillStyle(0xa9d6d9,.85).fillRect(0,0,W*T,2*T);g.fillStyle(0xd8f1ef,.6);for(let x=0;x<W*T;x+=48)g.fillRect(x+6,6,10,2*T-14);
  g.fillStyle(0x6b4a2e);for(let x=0;x<=W*T;x+=48)g.fillRect(x-2,0,4,2*T);g.fillRect(0,2*T-4,W*T,4).fillRect(0,0,W*T,4);
  g.fillStyle(0xa9d6d9,.7).fillRect(0,2*T,T,(H-2)*T).fillRect((W-1)*T,2*T,T,(H-2)*T);
  g.fillStyle(0x6b4a2e).fillRect(T-3,2*T,3,(H-2)*T).fillRect((W-1)*T,2*T,3,(H-2)*T);
  // Parede sul com a porta.
  g.fillStyle(0x6b4a2e).fillRect(0,(H-1)*T,W*T,T);g.fillStyle(0x4a3220).fillRect(door.x*T,(H-1)*T,T,T);
  g.fillStyle(0xc49a5c).fillRect(door.x*T+4,(H-1)*T+4,T-8,T-6);
  // Barril d'água.
  const bx=barrel.x*T,by=barrel.y*T;g.fillStyle(0x5a3b22).fillEllipse(bx+16,by+18,26,26);g.fillStyle(0x3d7fa0).fillEllipse(bx+16,by+12,20,9);g.fillStyle(0x2d2016).fillRect(bx+4,by+14,24,2).fillRect(bx+4,by+22,24,2);
  this.add.zone(W*T/2,T,1,1).setData('fixture-light',{radius:200,always:true,strength:.6});
 }
 private refreshCrops():void{
  const g=this.soil!;g.clear();for(const c of this.crops)c.destroy();this.crops=[];
  for(const p of greenhousePlots(this.level)){const crop=this.farm.cropAt(p.x,p.y);g.fillStyle(crop?.watered?0x4a3423:0x6e5137).fillRect(p.x*T+2,p.y*T+2,T-4,T-4);g.fillStyle(0x5a4130).fillRect(p.x*T+2,p.y*T+T-5,T-4,3);}
  for(const c of this.farm.crops){if(!this.textures.exists(cropSpriteLayout(c).texture))continue;const l=cropSpriteLayout(c);
   this.crops.push(this.add.image(c.x*T+l.x,c.y*T+l.y,l.texture).setOrigin(l.originX,l.originY).setDisplaySize(l.width,l.height).setDepth(c.y*T+l.depth));}
 }
 private blocked=(x:number,y:number)=>{const {width:W,height:H}=this.room,tx=Math.floor(x/T),ty=Math.floor(y/T),door=greenhouseDoor(this.level),b=greenhouseBarrel(this.level);
  if(x<T+4||x>(W-1)*T-4||y<2*T+6)return true;if(ty>=H-1)return tx!==door.x;return tx===b.x&&ty===b.y;};
 private blockedTile=(x:number,y:number)=>this.blocked(x*T+16,y*T+16);
 private doorExit(){const d=greenhouseDoor(this.level);return{x:(d.x+.5)*T,y:(this.room.height-.35)*T,halfWidth:T/2,depth:14,direction:'down' as const};}
 /** Canteiro à frente do jogador (ou sob os pés). */
 private plotNear():TilePoint|undefined{
  const p=this.player,plots=greenhousePlots(this.level);
  return plots.map(t=>({t,d:Math.hypot((t.x+.5)*T-p.x,(t.y+.5)*T-(p.y-8))})).filter(x=>x.d<34).sort((a,b)=>a.d-b.d)[0]?.t;
 }
 private barrelDistance(){const b=greenhouseBarrel(this.level);return Math.hypot((b.x+.5)*T-this.player.x,(b.y+.5)*T-this.player.y);}
 /** O barril ganha do canteiro quando está mais perto. */
 private nearBarrel(){const d=this.barrelDistance(),t=this.plotNear();return d<46&&(!t||d<Math.hypot((t.x+.5)*T-this.player.x,(t.y+.5)*T-(this.player.y-8)));}
 private seedToPlant():CropId|undefined{
  const pick=this.state.selectedCrop as CropId|undefined,has=(id:CropId)=>(this.state.inventory[cropDefinition(id).seed as ItemId]??0)>0;
  if(pick&&has(pick))return pick;return CROP_CATALOG.map(c=>c.id as CropId).find(has);
 }
 private plotPrompt(t:TilePoint):string{
  const c=this.farm.cropAt(t.x,t.y);
  if(!c){const s=this.seedToPlant();return s?`E · plantar ${cropDefinition(s).name.toLowerCase()} (qualquer estação)`:'Canteiro vazio · traga sementes';}
  if(c.growth>=1)return`E · colher ${cropDefinition(c.crop as CropId).name.toLowerCase()}`;
  if(!c.watered)return this.state.homeSupplies?.wateringCan?`E · regar · ${cropStatus(c)}`:cropStatus(c);
  return cropStatus(c);
 }
 private updateHUD():void{if(!this.player)return;const barrel=this.nearBarrel(),t=barrel?undefined:this.plotNear();
  this.ui.updateHUD({itemQuality:this.state.itemQuality,area:'property',worldWeapon:this.state.worldWeapon,toolConditions:this.state.economy6?.tools,learnedRecipes:this.state.villageProgress?.recipes??[],name:this.state.profile.name,day:this.state.day,time:this.state.time,inventory:this.state.inventory,tool:'hand',inHome:true,swimming:false,coins:this.state.villageEconomy?.coins??0,vigor:this.state.villageProgress?.vigor??100,wateringCan:!!this.state.homeSupplies?.wateringCan,wateringCanWater:this.state.wateringCanWater??0,playerTile:{x:this.player.x/T,y:this.player.y/T},
   interactionKey:t||barrel?'E':null,prompt:t?this.plotPrompt(t):barrel?`Barril d'água · E enche o regador (${this.state.wateringCanWater??0}/${WATER_CAPACITY})`:`Estufa · ${this.farm.crops.length}/${greenhousePlots(this.level).length} canteiros plantados · cresce em qualquer estação`,
   location:'Estufa',mapTitle:'Estufa',interiorMapSize:{width:this.room.width,height:this.room.height},harvests:this.state.inventory.turnip,metLia:this.state.metLia,nearWorkbench:false,sheltered:true,shelterReason:'Estufa',resourceProgress:'',farmingProgress:this.farm.progress,progress:this.state.progress});
  this.ui.updateCameraZoom(this.shownZoom,!this.paused);}
 private interact():void{if(this.paused||this.leaving||this.ui.isModalOpen())return;
  const barrel=this.nearBarrel(),t=barrel?undefined:this.plotNear();
  if(!t){if(barrel){if(!this.state.homeSupplies?.wateringCan){this.ui.toast('Pegue o regador em casa primeiro.');return;}if((this.state.wateringCanWater??0)>=WATER_CAPACITY){this.ui.toast('O regador já está cheio.');return;}this.state.wateringCanWater=WATER_CAPACITY;gameAudio.play('water');this.ui.toast(`Regador cheio · ${WATER_CAPACITY} regas.`);this.persist();this.updateHUD();}return;}
  const inv=new Inventory(this.state.inventory),c=this.farm.cropAt(t.x,t.y);let r:{ok:boolean;message:string};
  if(!c){const seed=this.seedToPlant();if(!seed){this.ui.toast('Traga sementes na mochila para plantar.');return;}r=this.farm.plant(t.x,t.y,inv,this.state.day,seed);if(r.ok)gameAudio.play('plant');}
  else if(c.growth>=1){r=this.farm.harvest(t.x,t.y,inv);if(r.ok)gameAudio.play('pickup');}
  else if(!c.watered){
   if(!this.state.homeSupplies?.wateringCan){this.ui.toast('Pegue o regador em casa para regar.');return;}
   if(!((this.state.wateringCanWater??0)>0)){this.ui.toast("O regador está vazio · encha no barril d'água.");return;}
   r=this.farm.water(t.x,t.y);if(r.ok){this.state.wateringCanWater=(this.state.wateringCanWater??0)-1;if(this.state.wateringCanWater%2===0)spendVigor(this.state,1);gameAudio.play('water');}
  }else{this.ui.toast(cropStatus(c));return;}
  this.state.inventory=inv.data;this.ui.toast(r.message);this.refreshCrops();this.persist();this.updateHUD();
 }
 private key(e:KeyboardEvent):void{if(e.repeat||this.leaving)return;if(e.target instanceof HTMLElement&&e.target.matches('input,textarea,select,[contenteditable="true"]'))return;const k=e.key.toLowerCase();if(k==='escape'){e.preventDefault();this.ui.togglePause();return;}if(k==='i'){this.ui.toggleInventory(this.state.inventory);return;}if(k==='c'){this.ui.toggleCrafting(this.state.inventory,false);return;}if(this.paused||this.ui.isModalOpen())return;if(k==='e')this.interact();if(e.key>='1'&&e.key<='9')this.ui.activateSlot(Number(e.key)-1);if(['+','=','-','_','Home'].includes(e.key))this.changeCameraZoom(e.key==='Home'?0:e.key==='-'||e.key==='_'?-1:1);}
 private wheel=(_p:Phaser.Input.Pointer,_o:unknown,_dx:number,dy:number)=>{if(!this.paused&&!this.ui.isModalOpen()&&Math.abs(dy)>5)this.changeCameraZoom(dy>0?-1:1);};
 private get shownZoom(){return mapCameraZoom(this.zoom,this.scale.width,this.scale.height,this.room.width*T,this.room.height*T);}
 private applyCamera=()=>{if(!this.player)return;this.cameras.main.setZoom(2*this.shownZoom).startFollow(this.player,true,.12,.12).setRoundPixels(true);this.ui?.updateCameraZoom(this.shownZoom,!this.paused);};
 changeCameraZoom(d:-1|0|1):void{if(this.paused)return;this.zoom=stepCameraZoom(this.shownZoom,d);saveCameraZoom(this.zoom);this.applyCamera();}
 setPaused(v:boolean):void{this.paused=v;this.input.keyboard?.resetKeys();if(v)this.persist();}
 selectTool(tool:Tool):void{if(tool!=='hand')this.ui.toast('Na estufa, use E nos canteiros: planta, rega e colhe.');}
 craftRecipe(id:string):void{const r=craftInField(this.state,id,saveGame);this.ui.toast(r.message);this.updateHUD();this.ui.refreshCrafting(this.state.inventory,false);}
 async useVillageItem(item:ItemId):Promise<void>{const r=consumeInField(this.state,item,saveGame);this.ui.toast(r.message);this.updateHUD();}
 openMapEditor():void{this.ui.toast('O editor de mapa fica disponível na propriedade.');}
 async captureMap():Promise<string>{const rt=this.make.renderTexture({width:this.room.width*T,height:this.room.height*T},false);this.children.depthSort();rt.draw(this.children.list.filter(o=>'visible'in o&&o.visible));return new Promise(resolve=>rt.snapshot(img=>{const url=img instanceof HTMLImageElement?img.src:'';rt.destroy();resolve(url);}));}
 persist():boolean{return this.save();}
 /** Fora da cena, o jogador conta como estando na porta da estufa, do lado de fora. */
 private snapshotState():SaveData{
  const g=this.state.greenhouse;this.state.activeArea='property';delete this.state.homePosition;
  if(g){this.state.player={x:(g.x+.5)*T,y:(g.y+1.5)*T,direction:'down'};this.state.greenhouse={...g,crops:this.farm.crops.map(c=>({...c}))};}
  this.state.quickbar=this.ui.getQuickbar();return this.state;
 }
 private save=():boolean=>!!this.player&&!this.leaving&&saveGame(this.snapshotState());
 mainMenu():void{this.ui.closeModal();this.leave(true);}
 private leave(title=false):void{if(this.leaving)return;const next=structuredClone(this.snapshotState());if(!saveGame(next)){this.ui.toast('Não foi possível salvar. A saída foi cancelada.');return;}this.leaving=true;this.cameras.main.fadeOut(SCENE_FADE_MS);this.time.delayedCall(SCENE_FADE_MS,()=>{this.scene.stop();this.onReturn(next,title);});}
 update(_time:number,ms:number):void{
  if(this.state)this.daylight?.update(this.state.time,'shelter',this.state.day);
  if(!this.player||this.leaving)return;if(this.paused||this.ui.isModalOpen()||document.hidden)return;
  const dt=Math.min(.1,ms/1000),before={x:this.player.x,y:this.player.y},day=this.state.day;this.player.speedMultiplier=playerSpeedFactor(this.state);
  this.player.update(dt,this.blockedTile,this.blocked,true);this.player.sprite.setDepth(this.player.y);
  if(this.passage.update(before,this.player,this.doorExit())){this.leave();return;}
  Object.assign(this.state,advanceClock(this.state,dt*GAME_MINUTES_PER_SECOND));if(this.state.day!==day){this.farm.update(0,this.state.day);this.refreshCrops();}
  advanceBackgroundVillage(this.state,dt,this.player,this.bentoRuntime);
  this.elapsed+=dt;if(this.elapsed>=.15)this.updateHUD();if(this.elapsed>=5){this.elapsed=0;this.persist();}
 }
}
