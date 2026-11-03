import {createGroundRuntime} from '../systems/ground-items';
import {preloadMineGalleryArt} from '../mine-gallery-art';
import {forgottenGalleryFloor} from '../data/mine-quest-geometry';
import {MineMissionView,preloadMineMissionArt} from '../mine-mission-view';
import {ensureMineMissions,visitMineMissionTargets} from '../systems/mine-missions';
import {createMineMissionRuntime} from '../systems/mine-missions';
import {bentoSceneWriter} from '../systems/bento-commit';
import {BentoTravelView,preloadBentoTravel} from '../bento-travel-view';
import {showMiningEntry} from '../mining-entry-menu';
import {returnToMineHall,upgradeMineAccess} from '../systems/mining-access';
import {beginMineExpedition} from '../systems/underground-renewal';
import {MINING_ENTRY,MINING_EXIT,MINING_HEIGHT,MINING_NAME} from '../data/mining-entry';
import {ensureMineHazards,UndergroundHazards,registerMineNoise,mineSegmentClear,type MineHazardEvent} from '../systems/underground-hazards';
import {recoverMineDefeat} from '../systems/underground-recovery';
import {MINE_HAZARDS} from '../data/underground-hazards';
import {UndergroundHazardArt,preloadMineHazards} from '../underground-hazard-art';
import {UndergroundLighting} from '../underground-lighting';
import {hasEquippedSword} from '../systems/world-sword';
import {resumeMineExpedition,finishMineExpedition} from '../systems/underground-renewal';
import {mineMaterialAt} from '../systems/underground-geology';
import {canMine} from '../systems/mining';
import {METAL_NAMES} from '../data/economy-balance';
import {preloadMineMinerals} from '../underground-mineral-art';
import Phaser from 'phaser';
import type {SaveData,Tool,ItemId,ResourceNode,TilePoint} from '../types';
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
import {loadCameraZoom,saveCameraZoom,stepCameraZoom,mapCameraZoom} from '../camera-zoom';
import {installWorldCompanion} from '../dungeons/world-pet-controller';
import {preloadPetArt} from '../dungeons/pet-sprites';
import {MineRoomView,preloadMineRoom} from '../mine-room-view';
import {UndergroundView} from '../underground-view';
import {UNDERGROUND,mineDepth,inMineEntrance} from '../data/underground-layout';
import {ensureUnderground,undergroundBlocked,undergroundArrival,nearbyMineBlock,mineBlockNode,mineTargetVisible,excavateMineBlock} from '../systems/underground';
import {ToolUse} from '../systems/tool-use';
import {ToolVisual} from '../tool-visual';
import {toolCondition} from '../systems/economy';
import {MINE_ROOM,MINE_NAME,MINE_EXIT,MINE_TUNNELS,MINE_SOLIDS} from '../data/mine-room';
import {highlandMineApproach,highlandResumePosition} from '../data/highland';
interface MineStart{save:SaveData;ui:GameUI;onReturn:(save:SaveData,title?:boolean)=>void}
/** Shared exploration controls for the separate reception room and continuous mining scene. */
export class MineScene extends Phaser.Scene{
 private groundRuntime=createGroundRuntime(()=>this.snapshotState(),saveGame,()=>this.state,()=>this.state.inventory,()=>this.player,()=>this.miningMode?'mining':'mine',(x,y)=>this.blockedPoint(x,y),()=>!this.paused&&!this.leaving&&!this.ui.isModalOpen()&&!document.hidden,()=>{this.updateHUD();});
 getGroundItemRuntime(){return this.player?this.groundRuntime:undefined;}
 private mineMissionRuntime=createMineMissionRuntime(()=>this.snapshotState(),saveGame,()=>this.state,()=>this.player);
 getMineMissionRuntime=()=>this.mineMissionRuntime;
 private bentoWorkRuntime={missions:this.mineMissionRuntime,write:bentoSceneWriter(()=>this.snapshotState(),saveGame),onMineImpact:(target:TilePoint,changed:readonly TilePoint[],depleted:boolean)=>{if(this.miningMode&&this.view instanceof UndergroundView){this.view.refresh([...changed]);this.view.impact(target);gameAudio.play(depleted?'pickup':'stone');}},onBentoDefense:(_point:TilePoint,hits:number)=>{gameAudio.play(hits?'combat-hit':'sword-swing');}};
 private state!:SaveData;private ui!:GameUI;private player!:Player;private view!:UndergroundView|MineRoomView;private toolUse=new ToolUse();private toolVisual?:ToolVisual;private farming!:Farming;
 private hazards!:UndergroundHazards;private hazardArt?:UndergroundHazardArt;private darkness?:UndergroundLighting;private incapacitated=false;
 private onReturn!:MineStart['onReturn'];private paused=false;private leaving=false;private zoom=1;private elapsed=0;private readonly passage=new DoorwayPassage();
 private bentoTravelView?:BentoTravelView;private missionView?:MineMissionView;private missionElapsed=0;
 constructor(private readonly sceneKey='Mina'){super(sceneKey);}
 private get miningMode(){return this.sceneKey==='Mineracao';}
 preload():void{preloadBentoTravel(this);if(this.miningMode){preloadMineGalleryArt(this);preloadMineMissionArt(this);preloadMineHazards(this);preloadMineMinerals(this);if(!this.textures.exists('mine-terrain-materials'))this.load.image('mine-terrain-materials','assets/visual/mine/subterranean-textures.png');}preloadMineRoom(this);preloadPetArt(this);}
 getFishingState():SaveData{return this.state;}
 create(data:MineStart):void{
  this.state=structuredClone(data.save);this.state.activeArea='highland';delete this.state.homePosition;delete this.state.merchantInterior;delete this.state.blacksmithInterior;delete this.state.communityInterior;
  this.ui=data.ui;this.onReturn=data.onReturn;this.paused=this.leaving=false;this.elapsed=0;this.passage.reset();gameAudio.setScene('game');gameAudio.setRainAtmosphere(false);
  ensureUnderground(this.state);upgradeMineAccess(this.state);if(this.miningMode){this.state.miningInterior=true;resumeMineExpedition(this.state);ensureMineHazards(this.state.underground!,this.state.bentoTravel?.trip?.area==='mining'?[this.state.bentoTravel.trip]:[]);}this.hazards=new UndergroundHazards(()=>this.state.underground!);this.incapacitated=false;this.toolUse=new ToolUse();this.toolVisual=new ToolVisual(this,this.state.profile);
  this.view=this.miningMode?new UndergroundView(this,()=>this.state.underground!,false):new MineRoomView(this,{x:UNDERGROUND.entryX,y:UNDERGROUND.entryY});this.hazardArt=this.miningMode?new UndergroundHazardArt(this,()=>this.state.underground!):undefined;this.darkness=this.miningMode?new UndergroundLighting(this,()=>this.state.underground!):undefined;this.farming=new Farming(this.state.crops,this.state.preparedSoil,this.state.farmingProgress,this.state.restoredFarmSoil);
  const saved=this.state.mineInterior,p=saved&&!this.blockedPoint(saved.x,saved.y)?saved:this.miningMode?MINING_ENTRY:undergroundArrival();this.player=new Player(this,this.state.profile,p.x,p.y,'mine-player');this.player.facing=directionVector(p.direction??'up');this.player.update(0,this.blockedTile,this.blockedPoint,false);
  this.zoom=loadCameraZoom();if(this.miningMode)this.cameras.main.setBounds(0,0,UNDERGROUND.width*32,MINING_HEIGHT);else this.cameras.main.setBounds(UNDERGROUND.entryX,UNDERGROUND.entryY,MINE_ROOM.width,MINE_ROOM.height);this.applyCamera();this.cameras.main.fadeIn(SCENE_FADE_MS);
  this.bentoTravelView=new BentoTravelView(this,()=>this.state,()=>this.player,()=>this.miningMode?'mining':'mine',this.ui,undefined,this.bentoWorkRuntime);this.events.once('shutdown',()=>this.bentoTravelView?.destroy());if(this.miningMode){ensureMineMissions(this.state);this.missionView=new MineMissionView(this,()=>this.state,this.mineMissionRuntime,()=>!this.paused&&!this.incapacitated&&!this.ui.isModalOpen()&&!this.leaving&&!this.toolUse.active,m=>this.ui.toast(m));this.events.once('shutdown',()=>{this.missionView?.destroy();this.missionView=undefined;});}this.missionElapsed=0;this.ui.showHUD('highland');document.querySelector<HTMLElement>('#ui')!.dataset.interior=this.miningMode?'mining':'mine';this.ui.setQuickbar(this.state.quickbar??emptyQuickbar());this.updateHUD();
  this.input.keyboard!.on('keydown',this.key,this);this.input.on('pointerdown',this.pointer,this);this.input.on('wheel',this.wheel,this);this.scale.on('resize',this.applyCamera,this);
  window.addEventListener('pagehide',this.save);window.addEventListener('beforeunload',this.save);window.addEventListener('blur',this.blur);document.addEventListener('visibilitychange',this.visibility);
  this.events.once('shutdown',()=>{this.toolUse.cancel();this.toolVisual?.hide();this.view.destroy();this.hazardArt?.destroy();this.darkness?.destroy();this.input.keyboard?.off('keydown',this.key,this);this.input.off('pointerdown',this.pointer,this);this.input.off('wheel',this.wheel,this);this.scale.off('resize',this.applyCamera,this);window.removeEventListener('pagehide',this.save);window.removeEventListener('beforeunload',this.save);window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);delete document.querySelector<HTMLElement>('#ui')!.dataset.interior;});
  installWorldCompanion(this,()=>({save:this.state,player:this.player,area:'highland',space:'mine',bounds:{width:UNDERGROUND.width*32,height:UNDERGROUND.height*32},blockedPoint:this.blockedPoint,enabled:true,canMove:!this.paused&&!this.leaving&&!this.ui.isModalOpen()&&!document.hidden}),this.ui,()=>this.persist());this.persist();if(this.miningMode&&this.hazards.health<=0)this.time.delayedCall(0,()=>this.defeat());
 }
 private blockedPoint=(x:number,y:number)=>!!this.bentoTravelView?.blocks(x,y)||(this.miningMode?y>=MINING_HEIGHT||undergroundBlocked(this.state.underground!,x,y):!inMineEntrance(x,y)||y<UNDERGROUND.entryY+158||undergroundBlocked(this.state.underground!,x,y));
 private blockedTile=(x:number,y:number)=>this.blockedPoint((x+.5)*32,(y+.5)*32);
 private get localPlayer(){return{x:this.player.x-UNDERGROUND.entryX,y:this.player.y-UNDERGROUND.entryY};}
 private node(){return this.miningMode?nearbyMineBlock(this.state.underground!,this.player,this.player.facing):undefined;}
 private nearExit():boolean{return this.miningMode?Math.abs(this.player.x-MINING_EXIT.x)<MINING_EXIT.halfWidth&&this.player.y>MINING_EXIT.y-48:Math.abs(this.localPlayer.x-MINE_EXIT.x)<MINE_EXIT.halfWidth&&this.localPlayer.y>430;}
 private nearTunnel(){return this.miningMode?undefined:MINE_TUNNELS.find(t=>Math.hypot(this.localPlayer.x-t.x,this.localPlayer.y-t.y)<43);}
 private nearDeposit(){return MINE_SOLIDS.slice(0,4).find(o=>{
  const x=o.footprint.reduce((sum,p)=>sum+p[0],0)/o.footprint.length*MINE_ROOM.scale,y=o.depth*MINE_ROOM.scale;
  return Math.hypot(this.localPlayer.x-x,this.localPlayer.y-y)<49;
 });}
 private updateHUD():void{
  const mission=this.missionView?.nearest(),tunnel=this.nearTunnel(),deposit=this.nearDeposit(),exit=this.nearExit(),node=this.node(),depth=mineDepth(Math.floor(this.player.y/32)),location=inMineEntrance(this.player.x,this.player.y)?MINE_NAME:this.miningMode&&forgottenGalleryFloor(Math.floor(this.player.x/32),Math.floor(this.player.y/32))?'Galeria esquecida':({surface:'Galerias superficiais',middle:'Galerias intermediárias',deep:'Galerias profundas',extreme:'Galerias extremas'}[depth]);
  const material=node?mineMaterialAt(this.state.underground!,node.x,node.y):'stone',label=material==='stone'?'Rocha':`Veio de ${METAL_NAMES[material]}`;
  this.ui.updateHUD({health:this.miningMode?{current:this.hazards.health,max:MINE_HAZARDS.maxHealth,contaminated:this.hazards.exposure}:undefined,area:'highland',mapTitle:this.miningMode?MINING_NAME:MINE_NAME,worldMapSize:this.miningMode?{width:UNDERGROUND.width,height:175}:{width:24,height:16},mapEditorAvailable:false,worldWeapon:this.state.worldWeapon,toolConditions:this.state.economy6?.tools,learnedRecipes:this.state.villageProgress?.recipes??[],name:this.state.profile.name,day:this.state.day,time:this.state.time,inventory:this.state.inventory,tool:this.state.equippedTool,inHome:false,swimming:false,coins:this.state.villageEconomy?.coins??0,vigor:this.state.villageProgress?.vigor??100,wateringCan:!!this.state.homeSupplies?.wateringCan,wateringCanWater:this.state.wateringCanWater??0,playerTile:this.miningMode?{x:this.player.x/32,y:this.player.y/32}:{x:this.localPlayer.x/32,y:this.localPlayer.y/32},interactionKey:mission||tunnel||deposit||exit||node?'E':null,prompt:mission?`${mission.label} · examinar`:node?(this.state.equippedTool==='pickaxe'?`${label} · escavar`:`${label} · equipe a picareta`):exit?(this.miningMode?'Voltar à Mina Antiga':'Voltar ao Platô da Nascente'):tunnel?.id==='north'?'Abrir menu de mineração':tunnel?'Examinar a passagem lateral':deposit?deposit.label+' · examinar':inMineEntrance(this.player.x,this.player.y)?'Galeria de entrada · siga os trilhos para voltar à montanha':(hasEquippedSword(this.state)?'Espaço · atacar | Picareta · abrir caminhos':'Explore as galerias ou use a picareta para abrir caminhos'),location,harvests:this.state.inventory.turnip,metLia:this.state.metLia,nearWorkbench:false,sheltered:true,shelterReason:'Interior da mina',resourceProgress:'',farmingProgress:this.farming.progress,progress:this.state.progress,...this.bentoTravelView?.hud});this.ui.updateCameraZoom(this.shownZoom,!this.paused);
 }
 private interact():void{if(this.bentoTravelView?.talk())return;
  if(this.toolUse.active)return;
  if(this.miningMode&&hasEquippedSword(this.state)&&this.state.underground!.hazards!.zombies.some(z=>z.hp>0&&Math.hypot(z.x-this.player.x,z.y-this.player.y)<74&&mineSegmentClear(this.state.underground!,this.player,z))){this.attack();return;}
  if(this.missionView?.interact())return;
  const node=this.node();if(node){this.startMining(node);return;}
  if(this.nearExit()){if(this.miningMode)this.returnHall();else this.leave();return;}
  const tunnel=this.nearTunnel();
  if(tunnel?.id==='north'){showMiningEntry(this.ui,this.state,()=>this.enterMining());return;}
  if(tunnel){this.ui.toast('Uma passagem estreita segue para outra galeria.');return;}
  const deposit=this.nearDeposit();if(deposit)this.ui.toast(deposit.label+' · os minerais estão presos à rocha.');
 }
 private key(e:KeyboardEvent):void{
  if(e.repeat||this.leaving||e.target instanceof HTMLElement&&e.target.matches('input,textarea,select,[contenteditable="true"]'))return;
  const k=e.key.toLowerCase();if(k==='escape'){e.preventDefault();this.ui.togglePause();return;}if(k==='i'){this.ui.toggleInventory(this.state.inventory);return;}if(k==='m'){this.ui.toggleMap();return;}if(k==='c'){this.ui.toggleCrafting(this.state.inventory,false);return;}
  if(this.paused||this.incapacitated||this.ui.isModalOpen())return;if(this.miningMode&&e.code==='Space'){e.preventDefault();this.attack();return;}if(k==='e'){e.preventDefault();this.interact();}if(e.key>='1'&&e.key<='9')this.ui.activateSlot(Number(e.key)-1);if(['+','=','-','_','Home'].includes(e.key))this.changeCameraZoom(e.key==='Home'?0:e.key==='-'||e.key==='_'?-1:1);
 }
 private pointer=(p:Phaser.Input.Pointer)=>{
  if(p.button!==0||this.paused||this.incapacitated||this.leaving||this.ui.isModalOpen()||this.toolUse.active)return;
  if(!this.miningMode){this.interact();return;}
  if(hasEquippedSword(this.state)&&[...this.state.underground!.hazards!.zombies,...this.state.underground!.hazards!.bats].some(z=>z.hp>0&&Math.hypot(z.x-p.worldX,z.y-p.worldY)<30)){this.attack(p);return;}
  const node=mineBlockNode(this.state.underground!,Math.floor(p.worldX/32),Math.floor(p.worldY/32));
  if(node){this.startMining(node);return;}if(hasEquippedSword(this.state)){this.attack(p);return;}if(inMineEntrance(this.player.x,this.player.y))this.interact();
 };
 private startMining(node:ResourceNode):void{
  if(this.state.equippedTool!=='pickaxe'||this.state.inventory.pickaxe<1){this.ui.toast('Equipe sua picareta para escavar.');return;}
  if(!mineTargetVisible(this.state.underground!,this.player,node)){this.ui.toast('Aproxime-se da rocha por um caminho livre.');return;}
  const mineral=mineMaterialAt(this.state.underground!,node.x,node.y);if(mineral!=='stone'&&!canMine(this.state,mineral)){this.ui.toast('Você precisa de uma picareta melhor para extrair este minério.');return;}
  if(toolCondition(this.state,'pickaxe').durability<=0){this.ui.toast('Repare a picareta na ferraria antes de escavar.');return;}
  const dx=node.x*32+16-this.player.x,dy=node.y*32+16-this.player.y,d=Math.max(1,Math.hypot(dx,dy));this.player.facing={x:dx/d,y:dy/d};
  this.toolUse.start({tool:'pickaxe',direction:directionFromVector(dx,dy),target:node});
 }
 private hitMiningBlock(target:TilePoint):void{
  this.state.mineInterior={x:this.player.x,y:this.player.y,direction:directionFromVector(this.player.facing.x,this.player.facing.y)};
  let events:MineHazardEvent[]=[];const result=excavateMineBlock(this.state,this.player,target,'pickaxe',draft=>{events=registerMineNoise(draft.underground!,{x:this.player.x,y:this.player.y});return saveGame(draft);});
  if(result.ok){this.hazardEvents(events);if(this.view instanceof UndergroundView){this.view.refresh(result.changed??[]);this.view.impact(target);}gameAudio.play(result.depleted?'pickup':'stone');}
  this.ui.toast(result.message);this.updateHUD();
 }
 private enterMining():void{
  if(this.leaving||!this.persist())return;const next=structuredClone(this.state),result=beginMineExpedition(next,saveGame);
  if(!result.ok){this.ui.toast(result.message);return;}this.transitionTo('Mineracao',next);
 }
 private returnHall():void{
  if(this.leaving||!this.persist())return;const next=structuredClone(this.state);if(!returnToMineHall(next,saveGame)){this.ui.toast('Não foi possível salvar. O retorno foi cancelado.');return;}this.transitionTo('Mina',next);
 }
 private transitionTo(key:'Mina'|'Mineracao',save:SaveData):void{
  this.leaving=true;this.toolUse.cancel();this.toolVisual?.hide();this.input.keyboard?.resetKeys();this.cameras.main.fadeOut(SCENE_FADE_MS);this.time.delayedCall(SCENE_FADE_MS,()=>this.scene.start(key,{save,ui:this.ui,onReturn:this.onReturn}));
 }
 private attack(pointer?:Phaser.Input.Pointer):void{
  if(this.toolUse.active||this.paused||this.incapacitated)return;
  const dx=pointer?pointer.worldX-this.player.x:this.player.facing.x,dy=pointer?pointer.worldY-this.player.y:this.player.facing.y;
  const result=this.hazards.attack(this.state,this.player,Math.atan2(dy,dx));
  if(!result.effect){if(!hasEquippedSword(this.state))this.ui.toast('Equipe sua espada no inventário para se defender.');return;}
  this.hazardArt?.swing(result.effect);gameAudio.play(result.hits?'combat-hit':'sword-swing');this.persist();
 }
 private hazardEvents(events:MineHazardEvent[]):void{
  for(const e of events){
   if(e==='gas-enter')this.ui.toast('Ar contaminado! Saia da névoa para respirar.');
   if(e==='gas-leave')this.ui.toast('Você voltou a respirar ar limpo.');
   if(e==='collapse-warning'){gameAudio.play('cave-rumble');this.ui.toast('O teto está cedendo! Saia da área marcada.');}
   if(e==='collapse-impact'){gameAudio.play('cave-impact');this.cameras.main.shake(160,.003);}
   if(e==='hurt'){gameAudio.play('combat-hit');this.cameras.main.flash(70,135,43,30);}
  }
 }
 private defeat():void{
  if(this.incapacitated||this.leaving)return;this.incapacitated=true;this.ui.setGameplayLocked(true);this.toolUse.cancel();this.toolVisual?.hide();this.input.keyboard?.resetKeys();this.persist();
  this.cameras.main.fadeOut(SCENE_FADE_MS);this.time.delayedCall(SCENE_FADE_MS,()=>this.returnAfterDefeat());
 }
 private returnAfterDefeat():void{
  if(!recoverMineDefeat(this.state,saveGame)){this.ui.toast('Não foi possível salvar. Tente novamente.');this.time.delayedCall(0,()=>this.ui.showDialogue('Retornar para casa',['Não foi possível salvar o retorno. Seus dados foram preservados.'],()=>this.returnAfterDefeat()));return;}
  const next=structuredClone(this.state);this.leaving=true;this.scene.stop();this.onReturn(next);
 }
 private wheel=(_p:Phaser.Input.Pointer,_objects:unknown,_dx:number,dy:number)=>{if(!this.paused&&!this.leaving&&!this.ui.isModalOpen()&&Math.abs(dy)>5)this.changeCameraZoom(dy>0?-1:1);};
 private get shownZoom():number{return mapCameraZoom(this.zoom,this.scale.width,this.scale.height,this.miningMode?UNDERGROUND.width*32:MINE_ROOM.width,this.miningMode?MINING_HEIGHT:MINE_ROOM.height);}
 private applyCamera=()=>{this.cameras.main.setZoom(2*this.shownZoom).startFollow(this.player,true,.12,.12).setRoundPixels(true);this.ui?.updateCameraZoom(this.shownZoom,!this.paused);};
 changeCameraZoom(d:-1|0|1):void{if(this.paused||this.leaving||this.ui.isModalOpen())return;this.zoom=stepCameraZoom(this.shownZoom,d);saveCameraZoom(this.zoom);this.applyCamera();this.ui.updateCameraZoom(this.shownZoom,true,true);}
 setPaused(value:boolean):void{this.paused=value;if(value){this.toolUse.cancel();this.toolVisual?.hide();}this.input.keyboard?.resetKeys();if(value)this.persist();}
 selectTool(tool:Tool):void{if((tool==='pickaxe'||tool==='hatchet'||tool==='hoe')&&this.state.inventory[tool]<1){this.ui.toast('Você ainda não possui essa ferramenta.');return;}this.toolUse.cancel();this.toolVisual?.hide();this.state.equippedTool=tool;this.updateHUD();}
 craftRecipe(id:string):void{const result=craftInField(this.state,id,saveGame);this.ui.toast(result.message);this.updateHUD();this.ui.refreshCrafting(this.state.inventory,false);}
 async useVillageItem(item:ItemId):Promise<void>{if(this.leaving)return;if(item==='fishingRod'||item==='net'){this.ui.toast('Não há água para pescar nesta galeria.');return;}const result=consumeInField(this.state,item,saveGame);this.ui.toast(result.message);this.updateHUD();}
 openMapEditor():void{}
 async captureMap():Promise<string>{
  const width=this.miningMode?800:768,height=this.miningMode?875:512,rt=this.make.renderTexture({width,height},false);
  rt.camera.setZoom(this.miningMode?800/(UNDERGROUND.width*32):1).setScroll(this.miningMode?0:UNDERGROUND.entryX,this.miningMode?0:UNDERGROUND.entryY).setOrigin(0,0);this.children.depthSort();rt.draw(this.children.list.filter(o=>o===this.view.ground||o.getData('mine-occluder')||o.getData('mine-terrain')||o.getData('mine-tracks')||o.getData('mine-decoration')||o.getData('mine-cracks')));
  return new Promise(resolve=>rt.snapshot(img=>{const url=img instanceof HTMLImageElement?img.src:'';rt.destroy();resolve(url);}));
 }
 persist():boolean{return this.save();}
 private save=():boolean=>!!this.player&&!this.leaving&&saveGame(this.snapshotState());
 private snapshotState():SaveData{this.state.activeArea='highland';if(this.miningMode)this.state.miningInterior=true;else delete this.state.miningInterior;this.state.mineCollisionRevision=2;this.state.mineInterior={x:this.player.x,y:this.player.y,direction:directionFromVector(this.player.facing.x,this.player.facing.y)};this.state.quickbar=this.ui.getQuickbar();this.state.crops=this.farming.crops.map(c=>({...c}));return this.state;}
 private blur=()=>{this.toolUse.cancel();this.toolVisual?.hide();this.input.keyboard?.resetKeys();this.persist();};private visibility=()=>{if(document.hidden)this.blur();};
 mainMenu():void{this.ui.closeModal();this.leave(true);}
 private leave(title=false):void{
  if(this.leaving||!this.persist())return;const next=structuredClone(this.state);
  if(!title){finishMineExpedition(next);const approach=highlandMineApproach(next.highlandMapEdits);next.highlandPosition=highlandResumePosition(approach?{x:approach.x,y:approach.y+36,direction:'down'}:undefined,next.highlandMapEdits);}
  if(!saveGame(next)){this.ui.toast('Não foi possível salvar. A passagem foi cancelada.');return;}
  this.leaving=true;this.toolUse.cancel();this.toolVisual?.hide();this.input.keyboard?.resetKeys();this.cameras.main.fadeOut(SCENE_FADE_MS);this.time.delayedCall(SCENE_FADE_MS,()=>{if(title){this.scene.stop();this.onReturn(next,true);}else this.scene.start('Serra',{save:next,ui:this.ui,onReturn:this.onReturn});});
 }
 update(_time:number,ms:number):void{
  if(!this.player)return;this.view.update(this.player);this.darkness?.update(this.player,Math.min(.1,ms/1000),this.state.inventory.lantern>0);if(this.paused||this.incapacitated||this.leaving||this.ui.isModalOpen()||document.hidden){this.hazardArt?.update(this.player,0);return;}
  const dt=Math.min(.1,ms/1000),before={x:this.player.x,y:this.player.y};this.player.speedMultiplier=this.state.inventory.boots>0?1.08:1;this.player.update(dt,this.blockedTile,this.blockedPoint,!this.toolUse.active);
  if(this.miningMode)this.hazardEvents(this.hazards.advance(dt,this.player,this.state.bentoTravel?.trip?.area==='mining'?this.state.bentoTravel.trip:undefined));this.hazardArt?.update(this.player,dt);if(this.miningMode&&this.hazards.health<=0){this.updateHUD();this.defeat();return;}
  const strike=this.toolUse.advance(dt);if(strike)this.hitMiningBlock(strike.target);
  const active=this.toolUse.current;if(active)this.toolVisual?.show('pickaxe',active.direction,this.player.x,this.player.y,this.toolUse,toolCondition(this.state,'pickaxe').tier,this.player.sprite);else this.toolVisual?.hide();
  if(this.miningMode?this.passage.update(before,this.player,MINING_EXIT):this.passage.update({x:before.x-UNDERGROUND.entryX,y:before.y-UNDERGROUND.entryY},this.localPlayer,MINE_EXIT)){if(this.miningMode)this.returnHall();else this.leave();return;}
  this.farming.update(dt);Object.assign(this.state,advanceClock(this.state,dt*GAME_MINUTES_PER_SECOND));this.state.crops=this.farming.crops;advanceBackgroundVillage(this.state,dt,this.player,this.bentoWorkRuntime);this.bentoTravelView?.update();if(this.miningMode){this.missionElapsed+=dt;if(this.missionElapsed>=.25){this.missionElapsed=0;const r=visitMineMissionTargets(this.mineMissionRuntime);if(r.ok)this.ui.toast(r.message);}this.missionView?.update();}this.updateHUD();this.elapsed+=dt;if(this.elapsed>=5){this.elapsed=0;this.persist();}
 }
}
