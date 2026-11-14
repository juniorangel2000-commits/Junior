import Phaser from 'phaser';
import type {SaveData,Tool,ItemId} from '../types';
import type {GameUI} from '../ui';
import {Player} from '../player';
import {Daylight} from '../daylight';
import {ToolVisual} from '../tool-visual';
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
import {loadCameraZoom,saveCameraZoom,stepCameraZoom,mapCameraZoom} from '../camera-zoom';
import {createGroundRuntime} from '../systems/ground-items';
import {createMineMissionRuntime} from '../systems/mine-missions';
import {bentoSceneWriter} from '../systems/bento-commit';
import {installWorldCompanion} from '../dungeons/world-pet-controller';
import {preloadPetArt} from '../dungeons/pet-sprites';
import {inventoryToolCondition} from '../systems/tool-instances';
import {harvestMeadow,meadowGrowth,chopIpe,ipeStanding} from '../systems/open-fields';
import {HORSE_ID,HORSE_NAME_MAX,TAMING_DAYS,horseTaming,feedHorse,fedToday,settleHorseTaming,applyTamingLoss,tamingPhase,feedingDay,nameHorse,startHorseEscort,transferHorseToProperty,placeBasket,pickUpBasket} from '../systems/horse-taming';
import {releaseAnimalEscort,ANIMAL_BEHAVIOR} from '../systems/animals';
import {OpenFieldsWorld,preloadOpenFields} from '../open-fields-world';
import {FIELDS_SIZE,FIELDS_ENTRY,FIELDS_EXIT,PROPERTY_FIELDS_RETURN,MEADOW_PATCHES,FIELDS_IPES,IPE_REACH,fieldsBlocked,fieldsSafe} from '../data/open-fields';
interface FieldsStart{save:SaveData;ui:GameUI;onReturn:(save:SaveData,title?:boolean)=>void}
export class OpenFieldsScene extends Phaser.Scene{
 private state!:SaveData;private ui!:GameUI;private player!:Player;private world!:OpenFieldsWorld;private daylight!:Daylight;private farming!:Farming;private toolVisual!:ToolVisual;
 private onReturn!:FieldsStart['onReturn'];private paused=false;private leaving=false;private zoom=1;private elapsed=0;private passage=new DoorwayPassage();private swing?:{id:string;age:number;hit:boolean;ipe?:boolean};
 private groundRuntime=createGroundRuntime(()=>this.snapshotState(),saveGame,()=>this.state,()=>this.state.inventory,()=>this.player,()=>'openFields',fieldsBlocked,()=>!this.paused&&!this.leaving&&!this.ui.isModalOpen()&&!document.hidden,()=>this.updateHUD());
 private missionRuntime=createMineMissionRuntime(()=>this.snapshotState(),saveGame,()=>this.state,()=>this.player);
 private bentoRuntime={missions:this.missionRuntime,write:bentoSceneWriter(()=>this.snapshotState(),saveGame)};
 constructor(){super('Campos');}
 preload():void{preloadOpenFields(this);preloadPetArt(this);}
 getGroundItemRuntime(){return this.player?this.groundRuntime:undefined;}
 getMineMissionRuntime=()=>this.missionRuntime;
 getFishingState=()=>this.state;
 create(data:FieldsStart):void{
  this.state=structuredClone(data.save);this.state.activeArea='openFields';delete this.state.homePosition;this.ui=data.ui;this.onReturn=data.onReturn;this.paused=this.leaving=false;this.elapsed=0;this.swing=undefined;this.passage.reset();gameAudio.setScene('game');setupTreeWind(this);
  // Cestas deixadas no chão em dias anteriores: o cavalo comeu enquanto você estava fora.
  const settled=settleHorseTaming(this.state,this.state.day,true),lostOnArrival=!settled.length&&this.horseLost();
  this.world=new OpenFieldsWorld(this,()=>this.state,{horseAte:()=>this.horseAte()});this.farming=new Farming(this.state.crops,this.state.preparedSoil,this.state.farmingProgress,this.state.restoredFarmSoil);
  const saved=this.state.openFieldsPosition,p=saved&&fieldsSafe(saved)?saved:FIELDS_ENTRY;
  this.player=new Player(this,this.state.profile,p.x,p.y,'fields-player');this.player.facing=directionVector(p.direction??'down');this.player.update(0,this.blockedTile,fieldsBlocked,false);
  this.toolVisual=new ToolVisual(this,this.state.profile);this.daylight=new Daylight(this,FIELDS_SIZE.width,FIELDS_SIZE.height);this.zoom=loadCameraZoom();this.cameras.main.setBounds(0,0,FIELDS_SIZE.width,FIELDS_SIZE.height);this.applyCamera();this.cameras.main.fadeIn(SCENE_FADE_MS);
  this.ui.showHUD('openFields');document.querySelector<HTMLElement>('#ui')!.style.display='';this.ui.setQuickbar(this.state.quickbar??emptyQuickbar());this.updateHUD();
  if(settled.length){const last=settled[settled.length-1];this.ui.toast(`Enquanto você estava fora, o cavalo comeu a cesta. ${last.tamed?'Ele confia em você agora!':`Confiança ${horseTaming(this.state).trust}/${TAMING_DAYS}.`}`);}
  else if(lostOnArrival)this.ui.toast('Faltou cesta em um dia: a confiança do cavalo voltou a zero.');
  this.input.keyboard!.on('keydown',this.key,this);this.input.on('wheel',this.wheel,this);this.input.on('pointerdown',this.pointer,this);this.scale.on('resize',this.applyCamera,this);
  window.addEventListener('pagehide',this.save);window.addEventListener('beforeunload',this.save);window.addEventListener('blur',this.blur);document.addEventListener('visibilitychange',this.visibility);
  this.events.once('shutdown',()=>{this.toolVisual.hide();this.daylight.destroy();this.input.keyboard?.off('keydown',this.key,this);this.input.off('wheel',this.wheel,this);this.input.off('pointerdown',this.pointer,this);this.scale.off('resize',this.applyCamera,this);window.removeEventListener('pagehide',this.save);window.removeEventListener('beforeunload',this.save);window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);});
  installWorldCompanion(this,()=>({save:this.state,player:this.player,area:'openFields',space:'outdoors',bounds:FIELDS_SIZE,blockedPoint:fieldsBlocked,enabled:true,canMove:!this.paused&&!this.leaving&&!this.ui.isModalOpen()&&!document.hidden}),this.ui,()=>this.persist());this.persist();
 }
 private blockedTile=(x:number,y:number)=>fieldsBlocked(x*32+16,y*32+16);
 private target(){return MEADOW_PATCHES.filter(p=>Math.hypot(p.x-this.player.x,p.y-this.player.y)<66&&meadowGrowth(this.state,p)>=1).sort((a,b)=>Math.hypot(a.x-this.player.x,a.y-this.player.y)-Math.hypot(b.x-this.player.x,b.y-this.player.y))[0];}
 /** Standing ipês take priority: their trunks sit in clearings away from the capim. */
 private ipeTarget(){return FIELDS_IPES.filter(p=>ipeStanding(this.state,p.id)&&Math.hypot(p.x-this.player.x,p.y-this.player.y)<=IPE_REACH).sort((a,b)=>Math.hypot(a.x-this.player.x,a.y-this.player.y)-Math.hypot(b.x-this.player.x,b.y-this.player.y))[0];}
 private ipePrompt():string{if(!this.state.inventory.hatchet)return'Ipê-amarelo · precisa de machadinha de ferro ou melhor';const t=inventoryToolCondition(this.state.inventory,'hatchet');return t.tier<1?'Ipê-amarelo · sua machadinha de pedra não corta este tronco':'Cortar ipê-amarelo com a machadinha';}
 /** Zera a confiança se faltou cesta em um dia inteiro; avisa uma vez. */
 private horseLost():boolean{return applyTamingLoss(this.state);}
 private horseNear(){const h=this.world?.horse;return h&&Math.hypot(h.brain.x-this.player.x,h.brain.y-this.player.y)<=96?h:undefined;}
 private horsePrompt():{text:string;key:'E'|'G'|null}{
  const t=horseTaming(this.state),name=t.name??'cavalo';
  if(this.state.animalEscort?.id===HORSE_ID)return{text:`Conduzindo ${name} · siga pela passagem ao norte · G solta a corda`,key:'G'};
  if(t.tamed)return t.name?{text:`${t.name} · E carinho · G colocar a corda`,key:'E'}:{text:'Cavalo domado · E dar um nome',key:'E'};
  return{text:`Cavalo selvagem · confiança ${t.trust}/${TAMING_DAYS} · ${tamingPhase(feedingDay(this.state)).label}`,key:null};
 }
 private fieldsHint():string{
  const t=horseTaming(this.state);
  if(!t.tamed&&t.basket&&!fedToday(this.state))return'Afaste-se da cesta: o cavalo só se aproxima com espaço';
  return this.player.y<230?'Propriedade ao norte':'Explore as clareiras · leve capim ao silo para preparar palha';
 }
 private basketNear(){const b=horseTaming(this.state).basket;return b&&Math.hypot(b.x-this.player.x,b.y-this.player.y)<=48?b:undefined;}
 /** Usar a cesta: ela fica no chão à sua frente para o cavalo buscar. */
 private useBasket():void{
  const f=this.player.facing,p={x:this.player.x+f.x*30,y:this.player.y+f.y*30};
  // O cavalo é largo: a cesta precisa de espaço em volta para ele chegar até ela.
  if(!fieldsSafe(p)||Array.from({length:8},(_,i)=>({x:p.x+Math.cos(i*Math.PI/4)*28,y:p.y+Math.sin(i*Math.PI/4)*28})).some(q=>fieldsBlocked(q.x,q.y))){this.ui.toast('Deixe a cesta num lugar mais aberto, longe de troncos, pedras e paredes.');return;}
  this.snapshotState();const r=placeBasket(this.state,p,saveGame);this.ui.toast(r.message);if(r.ok)gameAudio.play('pickup');this.updateHUD();
 }
 private horseAte():void{
  this.snapshotState();if(fedToday(this.state)||!horseTaming(this.state).basket)return;
  const r=feedHorse(this.state);if(!r.ok)return;saveGame(this.state);this.ui.toast(r.message);gameAudio.play('pickup');this.updateHUD();
 }
 private toggleHorseRope():void{
  if(this.state.animalEscort?.id===HORSE_ID){this.snapshotState();if(releaseAnimalEscort(this.state)){saveGame(this.state);this.ui.toast(`Corda solta. ${horseTaming(this.state).name??'O cavalo'} fica nos Campos.`);}this.updateHUD();return;}
  const h=this.horseNear();if(!h){if(this.state.animalEscort)this.ui.toast('Você já está conduzindo um animal.');return;}
  this.snapshotState();const r=startHorseEscort(this.state,h.brain.snapshot());if(r.ok)saveGame(this.state);this.ui.toast(r.message);this.updateHUD();
 }
 private updateHUD():void{if(!this.player)return;const ipe=this.ipeTarget(),horse=ipe?undefined:this.horseNear()??(this.state.animalEscort?.id===HORSE_ID?this.world.horse:undefined),hp=horse?this.horsePrompt():!ipe&&this.basketNear()?{text:'Cesta para o cavalo · E recolher',key:'E' as const}:undefined,p=ipe||hp?undefined:this.target();this.ui.updateHUD({area:'openFields',worldMapSize:{width:96,height:72},worldWeapon:this.state.worldWeapon,toolConditions:this.state.economy6?.tools,learnedRecipes:this.state.villageProgress?.recipes??[],name:this.state.profile.name,day:this.state.day,time:this.state.time,inventory:this.state.inventory,tool:'hand',inHome:false,swimming:false,coins:this.state.villageEconomy?.coins??0,vigor:this.state.villageProgress?.vigor??100,wateringCan:!!this.state.homeSupplies?.wateringCan,wateringCanWater:this.state.wateringCanWater??0,playerTile:{x:this.player.x/32,y:this.player.y/32},interactionKey:ipe||p?'E':hp?hp.key:null,prompt:ipe?this.ipePrompt():hp?hp.text:p?p.kind==='grass'?'Cortar capim com a foice':'Colher '+(p.kind==='herb'?'ervas':'cogumelos'):this.fieldsHint(),location:'Campos Abertos',harvests:this.state.inventory.turnip,metLia:this.state.metLia,nearWorkbench:false,sheltered:false,shelterReason:'',resourceProgress:'',farmingProgress:this.farming.progress,progress:this.state.progress});this.ui.updateCameraZoom(this.shownZoom,!this.paused);}
 private interact():void{
  if(this.swing||this.paused||this.leaving||this.ui.isModalOpen())return;
  if(this.basketNear()&&!this.horseNear()){this.snapshotState();const r=pickUpBasket(this.state,saveGame);if(r.message)this.ui.toast(r.message);this.updateHUD();return;}
  const horse=this.ipeTarget()?undefined:this.horseNear(),t=horseTaming(this.state);
  if(horse&&t.tamed&&this.state.animalEscort?.id!==HORSE_ID){
   if(!t.name){this.ui.askText({eyebrow:'UM NOVO COMPANHEIRO',title:'Como vai se chamar?',text:'O cavalo confia em você. Escolha um nome para ele.',label:'Nome do cavalo',maxLength:HORSE_NAME_MAX,confirm:'Dar o nome',onConfirm:v=>{this.snapshotState();const r=nameHorse(this.state,v,saveGame);if(!r.ok)return r.message;this.ui.toast(r.message);this.updateHUD();}});return;}
   this.ui.toast(`${t.name} encosta a cabeça em você, tranquilo.`);gameAudio.play('pickup');return;
  }
  const ipe=this.ipeTarget();
  if(ipe){
   const t=inventoryToolCondition(this.state.inventory,'hatchet');
   if(!this.state.inventory.hatchet||t.tier<1){this.ui.toast('Este ipê é duro demais. Você precisa de uma machadinha de ferro ou melhor.');return;}
   if(t.durability<=0){this.ui.toast('Repare esta machadinha antes de cortar o ipê.');return;}
   const direction=directionFromVector(ipe.x-this.player.x,ipe.y-this.player.y);this.player.facing=directionVector(direction);this.swing={id:ipe.id,age:0,hit:false,ipe:true};this.toolVisual.playGather('hatchet',direction,this.player,t.tier,this.player.sprite);return;
  }
  const p=this.target();if(!p)return;
  if(p.kind==='grass'){
   if(!this.state.inventory.sickle||inventoryToolCondition(this.state.inventory,'sickle').durability<=0){this.ui.toast('Leve uma foice em boas condições para cortar o capim.');return;}
   const direction=directionFromVector(p.x-this.player.x,p.y-this.player.y);this.player.facing=directionVector(direction);this.swing={id:p.id,age:0,hit:false};this.toolVisual.playGather('sickle',direction,this.player,inventoryToolCondition(this.state.inventory,'sickle').tier);
  }else{this.snapshotState();const result=harvestMeadow(this.state,p.id,this.player,saveGame);if(!result.ok)this.ui.toast(result.message);else gameAudio.play('pickup');this.updateHUD();}
 }
 private key(e:KeyboardEvent):void{if(e.repeat||this.leaving)return;if(e.target instanceof HTMLElement&&e.target.matches('input,textarea,select,[contenteditable="true"]'))return;const k=e.key.toLowerCase();if(k==='escape'){e.preventDefault();this.ui.togglePause();return;}if(k==='i'){this.ui.toggleInventory(this.state.inventory);return;}if(k==='m'){void this.ui.toggleMap();return;}if(k==='c'){this.ui.toggleCrafting(this.state.inventory,false);return;}if(this.paused||this.ui.isModalOpen())return;if(k==='e')this.interact();if(k==='g')this.toggleHorseRope();if(e.key>='1'&&e.key<='9')this.ui.activateSlot(Number(e.key)-1);if(['+','=','-','_','Home'].includes(e.key))this.changeCameraZoom(e.key==='Home'?0:e.key==='-'||e.key==='_'?-1:1);}
 private pointer=(p:Phaser.Input.Pointer)=>{if(p.button===0)this.interact();};
 private wheel=(_p:Phaser.Input.Pointer,_objects:unknown,_dx:number,dy:number)=>{if(!this.paused&&!this.ui.isModalOpen()&&Math.abs(dy)>5)this.changeCameraZoom(dy>0?-1:1);};
 private get shownZoom(){return mapCameraZoom(this.zoom,this.scale.width,this.scale.height,FIELDS_SIZE.width,FIELDS_SIZE.height);}
 private applyCamera=()=>{this.cameras.main.setZoom(2*this.shownZoom).startFollow(this.player,true,.12,.12).setRoundPixels(true);this.ui?.updateCameraZoom(this.shownZoom,!this.paused);};
 changeCameraZoom(d:-1|0|1):void{if(this.paused)return;this.zoom=stepCameraZoom(this.shownZoom,d);saveCameraZoom(this.zoom);this.applyCamera();}
 setPaused(v:boolean):void{this.paused=v;this.input.keyboard?.resetKeys();if(v){this.swing=undefined;this.toolVisual?.hide();this.persist();}}
 selectTool(tool:Tool):void{if(tool==='hatchet'){this.interact();return;}this.ui.toast('Use a foice da mochila ou pressione E perto do capim.');}
 craftRecipe(id:string):void{const r=craftInField(this.state,id,saveGame);this.ui.toast(r.message);this.updateHUD();this.ui.refreshCrafting(this.state.inventory,false);}
 async useVillageItem(item:ItemId):Promise<void>{if(item==='harvestBasket'){this.useBasket();return;}if(item==='sickle'||item==='hatchet'){this.interact();return;}if(item==='fishingRod'||item==='net'){this.ui.toast('Procure um lago ou rio para pescar.');return;}const r=consumeInField(this.state,item,saveGame);this.ui.toast(r.message);this.updateHUD();}
 openMapEditor():void{this.ui.toast('O mapa dos Campos Abertos está disponível na tecla M.');}
 async captureMap():Promise<string>{const rt=this.make.renderTexture({width:1024,height:768},false);rt.camera.setZoom(1/3).setScroll(0,0).setOrigin(0,0);const visible=[...this.world.patches.values()].map(p=>p.visible);for(const p of this.world.patches.values())p.setVisible(true);this.children.depthSort();rt.draw(this.children.list.filter(o=>o!==this.player.sprite&&!this.daylight.contains(o)&&'visible'in o&&o.visible));let i=0;for(const p of this.world.patches.values())p.setVisible(visible[i++]);return new Promise(resolve=>rt.snapshot(img=>{const url=img instanceof HTMLImageElement?img.src:'';rt.destroy();resolve(url);}));}
 persist():boolean{return this.save();}
 private snapshotState():SaveData{this.world.store();this.state.openFieldsPosition={x:this.player.x,y:this.player.y,direction:directionFromVector(this.player.facing.x,this.player.facing.y)};this.state.quickbar=this.ui.getQuickbar();this.state.crops=this.farming.crops.map(c=>({...c}));return this.state;}
 private save=():boolean=>!!this.player&&!this.leaving&&saveGame(this.snapshotState());
 private blur=()=>{this.input.keyboard?.resetKeys();this.swing=undefined;this.toolVisual?.hide();};
 private visibility=()=>{if(document.hidden){this.blur();this.persist();}};
 mainMenu():void{this.ui.closeModal();this.leave(true);}
 private leave(title=false):void{if(this.leaving)return;
  // Com o cavalo na corda, ele precisa estar ao lado para atravessar junto.
  const escorting=this.state.animalEscort?.id===HORSE_ID,horse=this.world.horse;
  if(!title&&escorting&&(!horse||Math.hypot(horse.brain.x-this.player.x,horse.brain.y-this.player.y)>ANIMAL_BEHAVIOR.portalDistance)){this.ui.toast('Espere o cavalo chegar perto antes de atravessar.');return;}
  const next=structuredClone(this.snapshotState());if(!title){next.activeArea='property';next.player={...PROPERTY_FIELDS_RETURN};if(escorting)transferHorseToProperty(next,PROPERTY_FIELDS_RETURN);}if(!saveGame(next)){this.ui.toast('Não foi possível salvar. A passagem foi cancelada.');return;}this.leaving=true;this.cameras.main.fadeOut(SCENE_FADE_MS);this.time.delayedCall(SCENE_FADE_MS,()=>{this.scene.stop();this.onReturn(next,title);});}
 update(_time:number,ms:number):void{
  if(!this.player||this.leaving)return;this.daylight.update(this.state.time,false,this.state.day);if(this.paused||this.ui.isModalOpen()||document.hidden)return;
  const dt=Math.min(.1,ms/1000),before={x:this.player.x,y:this.player.y};this.player.speedMultiplier=this.state.inventory.boots>0?1.08:1;this.player.update(dt,this.blockedTile,fieldsBlocked,!this.swing);this.player.sprite.setDepth(this.player.y);
  if(this.passage.update(before,this.player,FIELDS_EXIT)){this.leave();return;}
  if(this.swing){this.swing.age+=dt;if(this.swing.age>=.22&&!this.swing.hit){this.swing.hit=true;this.snapshotState();if(this.swing.ipe){const r=chopIpe(this.state,this.swing.id,this.player,saveGame);if(r.ok){gameAudio.play('wood');this.world.shakeIpe(this.swing.id);if(r.felled)this.ui.toast(r.message);}else this.ui.toast(r.message);}else{const r=harvestMeadow(this.state,this.swing.id,this.player,saveGame);if(r.ok)gameAudio.play('plant');else this.ui.toast(r.message);}}if(this.swing.age>=.5){this.swing=undefined;this.toolVisual.hide();}}
  this.farming.update(dt,this.state.day);Object.assign(this.state,advanceClock(this.state,dt*GAME_MINUTES_PER_SECOND));this.state.crops=this.farming.crops;advanceBackgroundVillage(this.state,dt,this.player,this.bentoRuntime);if(this.horseLost())this.ui.toast('Faltou cesta em um dia: a confiança do cavalo voltou a zero.');this.world.update(dt,this.player);this.updateHUD();this.elapsed+=dt;if(this.elapsed>=5){this.elapsed=0;this.persist();}
 }
}
