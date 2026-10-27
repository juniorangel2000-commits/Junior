import {createSmithLayout,resolveSmithLayout,smithFits,smithBlocked,smithNavigation,smithSpawn,smithDoor,type SmithLayout} from '../systems/smith-layout';
import {drawSmithLayout,type SmithView} from '../smith-layout-art';
import {mountSmithEditor} from '../smith-layout-editor';
import {BENTO_WALK_FRAMES,BENTO_DISPLAY,bentoSourceKey} from '../bento-sprites';
import {AUGUSTO_WALK_FRAMES,AUGUSTO_DISPLAY,AUGUSTO_ORIGIN_Y,augustoSourceKey} from '../augusto-sprites';
import {ROSA_WALK_FRAMES,ROSA_DISPLAY,ROSA_ORIGIN_Y,rosaSourceKey} from '../rosa-sprites';
import {TOBIAS_WALK_FRAMES,TOBIAS_DISPLAY,TOBIAS_ORIGIN_Y} from '../tobias-sprites';
import {BentoRoutine} from '../systems/bento-routine';
import {VillageNpcOverlays} from '../village-npc-overlays';
import {MerchantDailyRoutine,dailyMerchant,merchantPeriod,MERCHANT_SMALL_TALK,MERCHANT_DAILY_PLAN,type RoutineId,type RoutineArea,type RoutineEnvironment} from '../systems/merchant-routine';
import {BLACKSMITH_DOOR,BLACKSMITH_OUTSIDE} from '../data/blacksmith-interior';
import {notifyReadyOrders} from '../systems/economy';
import {markMinerals} from '../economy-visuals';
import {openBlacksmithPanel} from '../blacksmith-panel';
import {useConsumable} from '../systems/consumables';
import {fishAtBank} from '../fishing-ui';
import {updateVillageEquipment} from '../village-equipment';
import Phaser from 'phaser';
import {listVillageServices,performVillageService} from '../systems/village-services';
import {VillageWorld} from '../village-world';
import {VILLAGE_NAME,VILLAGE_NPCS,villagePixelPoint,type VillageNPC} from '../data/village';
import {createVillageEconomy,meetVillager,isMerchantOpen} from '../data/village-commerce';
import {trade} from '../systems/commerce';
import {VillageInteractionUI} from '../village-ui';
import {Inventory} from '../systems/inventory';
import {saveGame} from '../systems/save';
import {Farming} from '../systems/farming';
import {craft} from '../systems/crafting';
import {advanceClock,GAME_MINUTES_PER_SECOND} from '../systems/clock';
import {MapExitPassage,DoorwayPassage,SCENE_FADE_MS} from '../systems/map-transition';
import {Player} from '../player';
import {merchantTexture} from '../economy-art';
import {characterFrame,directionFromVector,directionVector} from '../character-directions';
import {CHARACTER_WIDTH,CHARACTER_HEIGHT} from '../character-sprites';
import {Daylight} from '../daylight';
import {gameAudio} from '../audio';
import {loadCameraZoom,saveCameraZoom,stepCameraZoom} from '../camera-zoom';
import {emptyQuickbar} from '../systems/quickbar';
import type {SaveData,Tool} from '../types';
import type {GameUI} from '../ui';
import {MerchantGuide,merchantDoor,merchantOutside,merchantCanTrade,type ResidentId,type ShopResident} from '../systems/merchant-visit';
import {merchantRoomBlocked,merchantRoomFits,resolveMerchantLayout,validMerchantLayout,merchantRoomConnected,MERCHANT_ROOM_ASSETS,MERCHANT_ROOM_ENTRY,MERCHANT_ROOM_OWNER,MERCHANT_ROOM_EXIT,MERCHANT_ROOM_SIZE,merchantRoomNavigation} from '../data/merchant-rooms';
import {drawMerchantInterior} from '../merchant-interior';
import {freeArrival,actorsOverlap} from '../systems/actor-arrival';
import {DEVELOPMENT_TOOLS} from '../development-tools';
import type {MapArea} from '../data/default-maps';

export interface VillageStart {save:SaveData;ui:GameUI;onReturn:(save:SaveData,title?:boolean)=>void}
type Villager={data:VillageNPC;sprite:Phaser.GameObjects.Sprite;frames:number};

/** Town state travels through the same save as the farm, without replacing its
 * outdoor position, crops, resource fields or animal population. */
export class VillageScene extends Phaser.Scene {
 private state!:SaveData;
 private ui!:GameUI;
 private world!:VillageWorld;
 private player!:Player;
 private daylight!:Daylight;
 private inventory!:Inventory;
 private farming!:Farming;
 private shop?:VillageInteractionUI;
 private villagers:Villager[]=[];
 private onReturn!:VillageStart['onReturn'];
 private paused=false;
 private leaving=false;
 private zoom=1;
 private bentoRoutine=new BentoRoutine();
 private smithLayout=createSmithLayout();
 private editingRoom=false;
 private inBlacksmith=false;
 private roomView?:SmithView;
 private merchantRoom?:ResidentId;
 private merchantView?:SmithView;
 private merchantLayouts=new Map<ResidentId,SmithLayout>();
 private residents=new Map<ResidentId,ShopResident>();
 private guide?:MerchantGuide;
 private routines=new Map<RoutineId,MerchantDailyRoutine>();
 private npcOverlays?:VillageNpcOverlays;
 private speech?:{id:RoutineId;text:string};
 private readonly merchantPassage=new DoorwayPassage();
 private get inShop():boolean{return this.inBlacksmith||!!this.merchantRoom;}
 private get roomOwner():ResidentId|undefined{return this.inBlacksmith?'bento':this.merchantRoom;}
 private changingRoom=false;
 private readonly homePassage=new DoorwayPassage();
 private elapsed=0;
 private hudElapsed=0;
 private readonly exitPassage=new MapExitPassage();
 constructor(){super('Vila');}

 create(data:VillageStart):void {
  this.state=structuredClone(data.save);this.state.activeArea='village';delete this.state.homePosition;
  this.state.villageEconomy??=createVillageEconomy();this.ui=data.ui;this.onReturn=data.onReturn;
  this.smithLayout=resolveSmithLayout(this.state.blacksmithScene);this.editingRoom=false;
  this.bentoRoutine=new BentoRoutine(this.state.blacksmithScene?this.state.bentoRoutine:undefined,smithNavigation(this.smithLayout));this.inBlacksmith=false;this.changingRoom=false;this.homePassage.reset();
  this.merchantRoom=undefined;this.merchantView=undefined;this.guide=undefined;this.merchantPassage.reset();this.residents=new Map((this.state.shopResidents??[]).map(p=>[p.id,structuredClone(p)]));
  this.merchantLayouts=new Map(VILLAGE_NPCS.filter(n=>n.id!=='bento').map(n=>[n.id,resolveMerchantLayout(n.id,this.state.merchantScenes?.[n.id])]));
  this.paused=false;this.leaving=false;this.elapsed=0;this.hudElapsed=0;this.exitPassage.reset();
  this.zoom=loadCameraZoom();this.inventory=new Inventory(this.state.inventory);
  this.farming=new Farming(this.state.crops,this.state.preparedSoil,this.state.farmingProgress,this.state.restoredFarmSoil);
  this.world=new VillageWorld(this,this.state.villageMapEdits);this.createVillagers();this.createDailyRoutines();
  const saved=this.state.villagePosition,entry=villagePixelPoint(this.world.entry());
  const valid=saved&&![[-7,-5],[7,-5],[-7,3],[7,3]].some(([dx,dy])=>this.blockedPoint(saved.x+dx,saved.y+dy));
  this.player=new Player(this,this.state.profile,valid?saved.x:entry.x,valid?saved.y:entry.y,'village-player');
  this.player.facing=directionVector(valid?saved.direction??'right':'right');this.player.update(0,this.blocked,undefined,false);
  this.daylight=new Daylight(this,3072,2304);this.daylight.update(this.state.time);this.world.updateLighting(this.state.time);
  if(this.state.blacksmithInterior)this.setBlacksmithRoom(true,this.state.blacksmithScene?this.state.blacksmithInterior:undefined);
  else if(this.state.merchantInterior)this.setMerchantRoom(this.state.merchantInterior.owner,this.state.merchantInterior);
  this.applyCamera();this.cameras.main.fadeIn(SCENE_FADE_MS);
  this.shop=new VillageInteractionUI({
   canTrade:id=>this.canTrade(id),isInside:id=>merchantCanTrade(id,this.roomOwner),getAvailability:id=>dailyMerchant(id)?this.routines.get(id)?.availability(this.state):undefined,onGuide:id=>this.beginGuide(id),
   getPortrait:id=>id==='bento'?this.textures.getBase64(bentoSourceKey('down')):id==='augusto'?this.textures.getBase64(augustoSourceKey('down')):id==='rosa'?this.textures.getBase64(rosaSourceKey('down')):id==='tobias'?this.textures.getBase64('village-npc-tobias',characterFrame('down',0,TOBIAS_WALK_FRAMES)):this.textures.getBase64(`village-npc-${id}`,0),
   onBlacksmith:()=>{this.shop?.close();this.setPaused(true);openBlacksmithPanel(()=>({...this.state,inventory:{...this.inventory.data}}),change=>{const before=structuredClone(this.state);this.state.inventory={...this.inventory.data};const r=change(this.state);if(r.ok){Object.assign(this.inventory.data,this.state.inventory);if(!this.persist()){this.state=before;Object.assign(this.inventory.data,before.inventory);return{ok:false,message:'Falha ao salvar. A operação foi revertida.'};}this.updateHUD();}return r;},()=>this.setPaused(false));},
   getServices:npc=>listVillageServices(npc),
   onService:id=>{const previous=structuredClone(this.state);const previousStock={...this.inventory.data};this.state.inventory={...this.inventory.data};this.state.crops=this.farming.crops.map(c=>({...c}));const result=performVillageService(this.state,id);if(result.ok){Object.assign(this.inventory.data,this.state.inventory);this.farming=new Farming(this.state.crops,this.state.preparedSoil,this.state.farmingProgress,this.state.restoredFarmSoil);const x=this.player.x,y=this.player.y;this.player.sprite.destroy();this.player=new Player(this,this.state.profile,x,y,'village-player');this.applyCamera();if(!this.persist()){this.state=previous;Object.assign(this.inventory.data,previousStock);return{ok:false,message:'Falha ao salvar. A operação foi revertida.'};}this.updateHUD();}return result;},
   getInventory:()=>this.inventory.data,getEconomy:()=>this.state.villageEconomy!,getDay:()=>this.state.day,
   onTrade:(merchant,side,item,quantity)=>{
    const owner=VILLAGE_NPCS.find(n=>n.merchantId===merchant);if(!owner||!this.canTrade(owner.id))return{ok:false,reason:'invalid-economy',message:owner&&dailyMerchant(owner.id)?this.routines.get(owner.id)?.availability(this.state).message??'Compre e venda dentro do comércio desse morador.':'Compre e venda dentro do comércio desse morador.'};
    const before=structuredClone(this.state);const stockBefore={...this.inventory.data};
    const result=trade(merchant,side,item,quantity,this.inventory,this.state.villageEconomy!,this.state.day);
    if(result.ok){Object.assign(this.state.inventory,this.inventory.data);if(!this.persist()){this.state=before;Object.assign(this.inventory.data,stockBefore);return{ok:false,reason:'invalid-economy',message:'Falha ao salvar. A operação foi revertida.'};}this.updateHUD();gameAudio.play('craft');}
    return result;
   },
   onClose:()=>{this.paused=false;this.input.keyboard?.resetKeys();this.updateHUD();},
  });
  document.querySelector<HTMLElement>('#ui')!.style.display='';this.ui.setQuickbar(this.state.quickbar??emptyQuickbar());
  this.ui.showHUD('village');this.updateHUD();
  this.npcOverlays=new VillageNpcOverlays(this,()=>({actors:this.villagers.map(n=>({id:n.data.id,name:n.data.name,role:n.data.role,sprite:n.sprite})),blocked:this.paused||this.leaving||this.changingRoom||!!this.shop?.isOpen||this.ui.isModalOpen(),speech:this.inShop?undefined:this.speech}));
  this.input.keyboard!.on('keydown',this.key,this);this.input.on('wheel',this.wheel,this);
  this.input.on('pointerdown',this.pointer,this);this.scale.on('resize',this.applyCamera,this);
  window.addEventListener('pagehide',this.save);window.addEventListener('beforeunload',this.save);
  window.addEventListener('blur',this.blur);document.addEventListener('visibilitychange',this.visibility);
  this.events.once('shutdown',()=>{
   this.leaving=true;this.npcOverlays?.destroy();this.npcOverlays=undefined;this.shop?.destroy();this.shop=undefined;this.roomView?.destroy();this.roomView=undefined;this.merchantView?.destroy();this.merchantView=undefined;this.daylight?.destroy();this.world?.destroy();
   this.input.keyboard?.off('keydown',this.key,this);this.input.off('wheel',this.wheel,this);this.input.off('pointerdown',this.pointer,this);
   this.scale.off('resize',this.applyCamera,this);window.removeEventListener('pagehide',this.save);window.removeEventListener('beforeunload',this.save);
   window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);
  });
  this.persist();
 }
 private canTrade(id:ResidentId):boolean {
  return merchantCanTrade(id,this.roomOwner)&&(!dailyMerchant(id)||this.routines.get(id)?.isServing(this.state)===true);
 }
 private createDailyRoutines():void {
  this.routines=new Map();this.speech=undefined;
  for(const id of ['augusto','bento','rosa','tobias'] as const){
   const npc=this.villagers.find(n=>n.data.id===id)!;
   const shop=id==='bento'?this.bentoRoutine.state.area==='blacksmith-home':this.residents.get(id)!.shop;
   const nav=id==='bento'?smithNavigation(this.smithLayout):merchantRoomNavigation(id,this.merchantLayouts.get(id));
   const direction=id==='bento'?this.bentoRoutine.state.direction:this.residents.get(id)!.direction;
   const routine=new MerchantDailyRoutine(id,{x:npc.sprite.x,y:npc.sprite.y,direction,shop},nav,this.state.villageRoutines?.[id]);
   const s=routine.state,blocked=s.area==='shop'?(x:number,y:number)=>id==='bento'?smithBlocked(this.smithLayout,x,y):merchantRoomBlocked(id,x,y,this.merchantLayouts.get(id)):this.world.isBlockedPoint;
   const free=freeArrival(s,blocked,[]);if(free)Object.assign(s,free);
   this.routines.set(id,routine);this.syncRoutine(id,0);
  }
 }
 private spaceActors(owner:RoutineId,area:RoutineArea):{x:number;y:number}[]{
  const actors=this.villagers.filter(n=>n.data.id!==owner&&(n.data.id==='bento'?(area==='shop'?owner==='bento'&&this.bentoRoutine.state.area==='blacksmith-home':this.bentoRoutine.state.area==='village'):(area==='shop'?n.data.id===owner&&!!this.residents.get(n.data.id)?.shop:!this.residents.get(n.data.id)?.shop))).map(n=>({x:n.sprite.x,y:n.sprite.y}));
  if(this.player&&(area==='shop'?this.roomOwner===owner:!this.inShop))actors.push({x:this.player.x,y:this.player.y});return actors;
 }
 private routineEnvironment(id:RoutineId):RoutineEnvironment {
  const nav=this.routines.get(id)!.navigation;
  const actors={shop:this.spaceActors(id,'shop'),village:this.spaceActors(id,'village')};
  const scenery=(area:RoutineArea,x:number,y:number)=>area==='shop'?!nav.validPosition!(x,y):[[-7,-5],[7,-5],[-7,3],[7,3]].some(([dx,dy])=>this.world.isBlockedPoint(x+dx,y+dy));
  const outsideBlocked=(x:number,y:number)=>this.world.isBlocked(x,y)||actors.village.some(a=>Math.floor(a.x/32)===x&&Math.floor(a.y/32)===y);
  return {
   blocked:(area,x,y)=>area==='village'?outsideBlocked(x,y):nav.isBlocked(x,y)||actors.shop.some(a=>actorsOverlap({x:(x+.5)*8,y:(y+.5)*8},a)),
   cellBlocked:(area,x,y)=>area==='village'?outsideBlocked(x,y):!!nav.cellBlocked?.(x,y)||nav.isBlocked(x,y)||actors.shop.some(a=>a.x>x*8-20&&a.x<(x+1)*8+20&&a.y>y*8-12&&a.y<(y+1)*8+12),
   fits:(area,x,y)=>!scenery(area,x,y)&&!actors[area].some(a=>actorsOverlap({x,y},a)),
   arrival:(area,p)=>freeArrival(p,(x,y)=>scenery(area,x,y),actors[area]),
  };
 }
 private syncRoutine(id:RoutineId,phase:number):void {
  const s=this.routines.get(id)!.state,npc=this.villagers.find(n=>n.data.id===id)!;
  if(id==='bento')Object.assign(this.bentoRoutine.state,{x:s.x,y:s.y,direction:s.direction,area:s.area==='shop'?'blacksmith-home':'village',stop:s.area==='shop'?4:0,wait:0,doorway:false});
  else Object.assign(this.residents.get(id)!,{x:s.x,y:s.y,direction:s.direction,shop:s.area==='shop'});
  npc.sprite.setPosition(s.x,s.y).setDepth(s.y).setFrame(characterFrame(s.direction,phase,npc.frames));
 }
 private updateDailyRoutines(seconds:number):void {
  for(const [id,routine] of this.routines){if(this.guide?.owner===id)continue;const step=routine.step(seconds,this.state,this.routineEnvironment(id));this.syncRoutine(id,step.phase);}
  const a=this.routines.get('augusto')!,b=this.routines.get('bento')!;
  if(!this.guide&&merchantPeriod('augusto',this.state.time)==='break'&&a.state.area==='village'&&b.state.area==='village'&&a.state.socialDay!==this.state.day&&b.state.socialDay!==this.state.day&&a.activity==='plaza'&&b.activity==='plaza'&&Math.hypot(a.state.x-b.state.x,a.state.y-b.state.y)<70){a.socialize(this.state);b.socialize(this.state);}
  const social=a.state.socialUntil>this.state.day*1440+this.state.time&&b.state.socialUntil>this.state.day*1440+this.state.time;
  this.speech=undefined;
  if(social){
   const speaker=a.state.socialUntil-(this.state.day*1440+this.state.time)>MERCHANT_DAILY_PLAN.socialMinutes/2?'augusto':'bento';
   this.speech={id:speaker,text:MERCHANT_SMALL_TALK[(this.state.day-1)%MERCHANT_SMALL_TALK.length][speaker==='augusto'?0:1]};
   for(const id of ['augusto','bento'] as const){const npc=this.villagers.find(n=>n.data.id===id)!,peer=id==='augusto'?b.state:a.state,own=this.routines.get(id)!.state;own.direction=directionFromVector(peer.x-own.x,peer.y-own.y);npc.sprite.setFrame(characterFrame(own.direction,0,npc.frames));}
  }
 }
 private createVillagers():void {
  this.villagers=VILLAGE_NPCS.map(npc=>{
   const frames=npc.id==='bento'?BENTO_WALK_FRAMES:npc.id==='augusto'?AUGUSTO_WALK_FRAMES:npc.id==='rosa'?ROSA_WALK_FRAMES:npc.id==='tobias'?TOBIAS_WALK_FRAMES:0,key=merchantTexture(this,npc.id),p=villagePixelPoint(npc);
   const sprite=this.add.sprite(p.x,p.y,key,characterFrame(npc.direction,0,frames)).setOrigin(.5,npc.id==='augusto'?AUGUSTO_ORIGIN_Y:npc.id==='rosa'?ROSA_ORIGIN_Y:npc.id==='tobias'?TOBIAS_ORIGIN_Y:1).setDisplaySize(npc.id==='bento'?BENTO_DISPLAY:npc.id==='augusto'?AUGUSTO_DISPLAY:npc.id==='rosa'?ROSA_DISPLAY:npc.id==='tobias'?TOBIAS_DISPLAY:CHARACTER_WIDTH,npc.id==='augusto'?AUGUSTO_DISPLAY:npc.id==='rosa'?ROSA_DISPLAY:npc.id==='tobias'?TOBIAS_DISPLAY:CHARACTER_HEIGHT).setDepth(p.y);
   if(npc.id==='bento'){const b=this.bentoRoutine.state;if(b.area==='village'){const free=freeArrival(b,this.world.isBlockedPoint,[]);if(free)Object.assign(b,free);}sprite.setPosition(b.x,b.y).setDepth(b.y).setFrame(characterFrame(b.direction,0,frames)).setVisible(b.area==='village');}
   else{const resident=this.residents.get(npc.id)??{id:npc.id,...p,direction:npc.direction,shop:false};if(!resident.shop){const free=freeArrival(resident,this.world.isBlockedPoint,[]);if(free)Object.assign(resident,free);}this.residents.set(npc.id,resident);sprite.setPosition(resident.x,resident.y).setDepth(resident.y).setFrame(characterFrame(resident.direction,0,frames)).setVisible(!resident.shop);}
   return {data:npc,sprite,frames};
  });
 }
 private blocked=(x:number,y:number):boolean=>(this.inBlacksmith?smithBlocked(this.smithLayout,x*32+16,y*32+16):this.merchantRoom?merchantRoomBlocked(this.merchantRoom,x*32+16,y*32+16,this.merchantLayouts.get(this.merchantRoom)):this.world.isBlocked(x,y))||this.villagers.some(n=>n.sprite.visible&&Math.floor(n.sprite.x/32)===x&&Math.floor(n.sprite.y/32)===y);
 private blockedPoint=(x:number,y:number):boolean=>(this.inBlacksmith?smithBlocked(this.smithLayout,x,y):this.merchantRoom?merchantRoomBlocked(this.merchantRoom,x,y,this.merchantLayouts.get(this.merchantRoom)):this.world.isBlockedPoint(x,y))||this.villagers.some(n=>n.sprite.visible&&Math.abs(n.sprite.x-x)<10&&Math.abs(n.sprite.y-y)<6);
 private nearest():Villager|undefined {
  return this.villagers.filter(n=>n.sprite.visible&&Math.hypot(n.sprite.x-this.player.x,n.sprite.y-this.player.y)<78)
   .sort((a,b)=>Math.hypot(a.sprite.x-this.player.x,a.sprite.y-this.player.y)-Math.hypot(b.sprite.x-this.player.x,b.sprite.y-this.player.y))[0];
 }
 private beginGuide(id:ResidentId):void {
  if(this.inShop||this.leaving)return;const npc=this.villagers.find(n=>n.data.id===id);if(!npc?.sprite.visible)return;
  const routine=dailyMerchant(id)?this.routines.get(id):undefined;if(routine&&!routine.availability(this.state).canGuide){this.ui.toast(routine.availability(this.state).message);return;}
  const blocked=(x:number,y:number)=>this.world.isBlocked(x,y)||this.villagers.some(n=>n!==npc&&n.sprite.visible&&Math.floor(n.sprite.x/32)===x&&Math.floor(n.sprite.y/32)===y);
  if(!MerchantGuide.canStart(id,npc.sprite,blocked)){this.ui.toast('O caminho até a loja está bloqueado. Libere a passagem e tente novamente.');return;}
  if(id==='bento'||this.guide?.owner==='bento')this.bentoRoutine.setRoom(smithNavigation(this.smithLayout));
  routine?.guided(this.state,npc.sprite,false);this.guide=new MerchantGuide(id);this.setPaused(false);this.ui.toast(`${npc.data.name}: venha comigo até ${npc.data.role.toLowerCase()}. Vou esperar se você ficar para trás.`);
 }
 private completeGuide(id:ResidentId):void {
  if(this.guide?.owner!==id)return;const npc=this.villagers.find(n=>n.data.id===id)!;
  if(id==='bento'){const nav=smithNavigation(this.smithLayout),point=nav.stops.map(p=>({x:p.x*8+4,y:p.y*8+4})).find(p=>smithFits(this.smithLayout,p.x,p.y))??nav.entry;
   Object.assign(this.bentoRoutine.state,{...point,area:'blacksmith-home',stop:4,wait:60,direction:'down',doorway:false});this.bentoRoutine.setRoom(nav);npc.sprite.setPosition(point.x,point.y).setDepth(point.y);
  }else{const resident=this.residents.get(id)!;Object.assign(resident,MERCHANT_ROOM_OWNER,{shop:true,direction:'down'});npc.sprite.setPosition(resident.x,resident.y).setDepth(resident.y);}
  if(dailyMerchant(id)){const routine=this.routines.get(id)!;const free=this.routineEnvironment(id).arrival('shop',npc.sprite);if(free)npc.sprite.setPosition(free.x,free.y);routine.guided(this.state,npc.sprite,true);this.syncRoutine(id,0);}
  npc.sprite.setFrame(characterFrame('down',0,npc.frames));this.guide=undefined;
 }
 private setMerchantRoom(id?:ResidentId,position?:{x:number;y:number;direction?:import('../character-directions').CharacterDirection}):void {
  const previous=this.merchantRoom;this.merchantRoom=id;this.inBlacksmith=false;this.merchantPassage.reset();this.homePassage.reset();this.world.setVisible(!id);
  this.merchantView?.destroy();this.merchantView=id?drawMerchantInterior(this,id,this.merchantLayouts.get(id)):undefined;
  const p=position??(id?MERCHANT_ROOM_ENTRY:merchantOutside(previous!));this.player.x=p.x;this.player.y=p.y;this.player.facing=directionVector(position?.direction??(id?'up':'down'));
  for(const npc of this.villagers){npc.sprite.setVisible(this.sameRoom(npc));}
  const free=freeArrival(this.player,(x,y)=>id?merchantRoomBlocked(id,x,y,this.merchantLayouts.get(id)):this.world.isBlockedPoint(x,y),this.villagers.filter(n=>n.sprite.visible).map(n=>n.sprite));if(free){this.player.x=free.x;this.player.y=free.y;}
  this.input.keyboard?.resetKeys();this.player.update(0,this.blocked,this.blockedPoint,false);this.daylight.update(this.state.time,!!id);this.applyCamera();
 }
 private changeMerchantRoom(id?:ResidentId):void {
  if(this.changingRoom)return;this.persist();this.changingRoom=true;this.cameras.main.fadeOut(SCENE_FADE_MS);
  this.time.delayedCall(SCENE_FADE_MS,()=>{if(this.leaving)return;if(id)this.completeGuide(id);this.guide=undefined;this.setMerchantRoom(id);this.changingRoom=false;this.cameras.main.fadeIn(SCENE_FADE_MS);gameAudio.play('door');this.updateHUD();this.persist();});
 }
 private interact():void {
  if(this.paused||this.leaving||this.changingRoom||this.ui.isModalOpen()||this.shop?.isOpen)return;
  const npc=this.nearest();if(!npc)return;
  npc.sprite.setFrame(characterFrame(directionFromVector(this.player.x-npc.sprite.x,this.player.y-npc.sprite.y),0,npc.frames));
  meetVillager(this.state.villageEconomy!,npc.data.id);this.setPaused(true);this.shop!.open(npc.data);this.persist();
 }
 private pointer=(pointer:Phaser.Input.Pointer):void=>{
  if(pointer.button!==0||this.paused||this.ui.isModalOpen())return;
  if(this.villagers.some(n=>Math.hypot(n.sprite.x-pointer.worldX,n.sprite.y-28-pointer.worldY)<44))this.interact();
 };
 setPaused(paused:boolean):void {this.paused=paused;this.input.keyboard?.resetKeys();if(paused)this.persist();this.ui.updateCameraZoom(this.zoom,!paused);}
 selectTool(tool:Tool):void {
  if(tool!=='hand'){this.ui.toast('Na vila, aproxime-se dos moradores e use E para conversar.');return;}
  this.state.equippedTool='hand';this.updateHUD();
 }
 craftRecipe(id:string):void {
  if(!this.ui.isCraftingOpen())return;
  if(id!=='cord'&&!this.state.villageProgress?.recipes.includes(id)){this.ui.toast('Use sua bancada na propriedade para fabricar esse item.');return;}
  const result=craft(id,this.inventory,false,this.state.villageProgress);this.ui.toast(result.message);
  if(result.ok){this.persist();this.updateHUD();}this.ui.refreshCrafting(this.inventory.data,false);
 }
 openMapEditor():void {
  if(!DEVELOPMENT_TOOLS||this.changingRoom||this.leaving)return;
  if(this.inShop){this.openHomeMenu();return;}
  this.shop?.close();this.persist();const original=structuredClone(this.state);this.setPaused(true);this.ui.showMapEditorMode();this.scene.setVisible(false);this.scene.pause();
  this.scene.launch('Editor',{save:original,area:'village',onClose:(updated:SaveData|undefined,_area:MapArea)=>{this.scene.resume();this.scene.setVisible(true);this.scene.restart({save:updated??original,ui:this.ui,onReturn:this.onReturn});}});
 }
 /** Only the new carpentry remains open to authoring. The three completed
  * interiors have no editing entry points, even in development builds. */
 openHomeMenu():void {
  if(!DEVELOPMENT_TOOLS||this.merchantRoom!=='tobias'||this.changingRoom||this.leaving||this.shop?.isOpen)return;
  if(this.editingRoom){this.ui.closeModal();return;}if(this.ui.isModalOpen())this.ui.closeModal();this.editingRoom=true;this.applyCamera();
  this.ui.showSceneEditor(host=>{const dispose=mountSmithEditor(host,()=>this.merchantLayouts.get('tobias')!,()=>this.merchantView,data=>this.editCarpentryLayout(data),()=>this.ui.closeModal(),{title:'Editar carpintaria do Tobias',fileName:'After-Rain-Carpintaria-Editada.json',assets:MERCHANT_ROOM_ASSETS});return()=>{dispose();this.editingRoom=false;this.applyCamera();};});
 }
 private editCarpentryLayout(data:SmithLayout):string|null {
  if(this.merchantRoom!=='tobias')return 'A edição deste comércio foi finalizada.';
  const redraw=()=>{this.merchantView?.destroy();this.merchantView=drawMerchantInterior(this,'tobias',this.merchantLayouts.get('tobias'));};
  if(!validMerchantLayout(data)||!merchantRoomConnected('tobias',data)){redraw();return 'Mantenha a entrada e o atendimento livres.';}
  if(!merchantRoomFits('tobias',this.player.x,this.player.y,data)||this.villagers.some(n=>n.sprite.visible&&!merchantRoomFits('tobias',n.sprite.x,n.sprite.y,data))){redraw();return 'Mova o personagem ou o morador antes de ocupar esse espaço.';}
  const before=this.merchantLayouts.get('tobias')!,save=structuredClone(this.state);this.merchantLayouts.set('tobias',structuredClone(data));this.routines.get('tobias')?.setRoom(merchantRoomNavigation('tobias',data));
  if(!this.persist()){this.merchantLayouts.set('tobias',before);this.state=save;this.routines.get('tobias')?.setRoom(merchantRoomNavigation('tobias',before));redraw();return 'Falha ao salvar. A edição foi revertida.';}redraw();return null;
 }
 mainMenu():void {this.shop?.close();this.ui.closeModal();this.leave(true);}
 private applyCamera():void {
  if(!this.player)return;
  const w=this.inShop?576:3072,h=this.merchantRoom?MERCHANT_ROOM_SIZE.height:this.inBlacksmith?352:2304;
  const viewport=this.editingRoom?Math.max(400,this.scale.width-340):this.scale.width;this.cameras.main.setViewport(0,0,viewport,this.scale.height);
  const base=this.inShop?Math.min(viewport/(w+64),this.scale.height/(h+64)):2;
  const camera=this.cameras.main;camera.setBackgroundColor(this.inShop?'#26302c':'#526b3e').setZoom(base*this.zoom);
  if(this.inShop){camera.removeBounds().stopFollow();this.centerInteriorCamera();}
  else camera.setBounds(0,0,w,h).startFollow(this.player,false,1,1).centerOn(this.player.x,this.player.y);
 }
 private centerInteriorCamera():void {
  const c=this.cameras.main,w=576,h=this.merchantRoom?384:352;
  const halfW=c.width/c.zoom/2,halfH=c.height/c.zoom/2;
  c.centerOn(halfW*2>=w?w/2:Phaser.Math.Clamp(this.player.x,halfW,w-halfW),halfH*2>=h?h/2:Phaser.Math.Clamp(this.player.y,halfH,h-halfH));
 }
 private sameRoom(npc:Villager):boolean{return npc.data.id==='bento'?!this.merchantRoom&&(this.bentoRoutine.state.area==='blacksmith-home')===this.inBlacksmith:this.residents.get(npc.data.id)?.shop?this.merchantRoom===npc.data.id:!this.inShop;}
 private setBlacksmithRoom(inside:boolean,position?:SaveData['blacksmithInterior']):void {
  this.inBlacksmith=inside;this.homePassage.reset();this.world.setVisible(!inside);
  this.roomView?.destroy();this.roomView=inside?drawSmithLayout(this,this.smithLayout):undefined;
  for(const npc of this.villagers){npc.sprite.setVisible(this.sameRoom(npc));}
  const p=position??(inside?smithSpawn(this.smithLayout):BLACKSMITH_OUTSIDE);
  this.player.x=p.x;this.player.y=p.y;this.player.facing=directionVector(position?.direction??(inside?'up':'down'));
  // A resident standing in the doorway must never strand the arriving player.
  const free=freeArrival(this.player,(x,y)=>inside?smithBlocked(this.smithLayout,x,y):this.world.isBlockedPoint(x,y),this.villagers.filter(n=>n.sprite.visible).map(n=>n.sprite));if(free){this.player.x=free.x;this.player.y=free.y;}
  this.input.keyboard?.resetKeys();this.player.update(0,this.blocked,this.blockedPoint,false);
  this.daylight.update(this.state.time,inside);this.applyCamera();
 }
 private changeBlacksmithRoom():void {
  if(this.changingRoom)return;this.persist();this.changingRoom=true;
  this.cameras.main.fadeOut(SCENE_FADE_MS);
  this.time.delayedCall(SCENE_FADE_MS,()=>{
   if(this.leaving)return;if(!this.inBlacksmith)this.completeGuide('bento');this.guide=undefined;this.setBlacksmithRoom(!this.inBlacksmith);this.changingRoom=false;
   this.cameras.main.fadeIn(SCENE_FADE_MS);gameAudio.play('door');this.updateHUD();this.persist();
  });
 }
 changeCameraZoom(direction:-1|0|1):void {
  if(this.paused||this.leaving)return;this.zoom=stepCameraZoom(this.zoom,direction);saveCameraZoom(this.zoom);this.applyCamera();this.ui.updateCameraZoom(this.zoom,true);
 }
  async useVillageItem(item:import('../types').ItemId):Promise<void>{
    if(this.inShop){this.ui.toast('Use os equipamentos de exploração fora do comércio.');return;}
    this.state.inventory={...this.inventory.data};this.state.crops=this.farming.crops.map(c=>({...c}));
    const point={x:Math.floor(this.player.x/32+this.player.facing.x),y:Math.floor(this.player.y/32+this.player.facing.y)};
    const water=(x:number,y:number)=>this.world.waterPointAt(x,y);
    const near=Array.from({length:7},(_,a)=>a-3).some(dx=>Array.from({length:7},(_,a)=>a-3).some(dy=>water(this.player.x+dx*16,this.player.y+dy*16)));
    if(item==='waterPump'&&!near){this.ui.toast('Instale a bomba perto de um rio ou lago.');return;}
    if(item==='fishingRod'||item==='net'){
      if(this.player.isSwimming||!near){this.ui.toast('Fique em terra firme, perto da água, para pescar.');return;}
      this.setPaused(true);const message=await fishAtBank(this.state,item==='net',()=>{Object.assign(this.inventory.data,this.state.inventory);this.persist();});this.setPaused(false);this.ui.toast(message);
    }else{const result=useConsumable(this.state,item,point,(x,y)=>this.world.isBlocked(x,y));if(result.ok){Object.assign(this.inventory.data,this.state.inventory);this.farming=new Farming(this.state.crops,this.state.preparedSoil,this.state.farmingProgress,this.state.restoredFarmSoil);this.persist();}this.ui.toast(result.message);}
    this.updateHUD();
  }

 captureMap():Promise<string> {
  this.updateHUD();const rt=this.make.renderTexture(this.inShop?{width:1152,height:this.merchantRoom?768:704}:{width:960,height:720},false);rt.camera.setZoom(this.inShop?2:960/3072).setScroll(0,0).setOrigin(0,0);
  this.children.depthSort();rt.draw(this.children.list.filter(o=>o!==this.player.sprite&&!this.daylight.contains(o)&&'visible'in o&&o.visible));
  return new Promise(resolve=>rt.snapshot(image=>{const url=image instanceof HTMLImageElement?image.src:'';rt.destroy();resolve(url);}));
 }
 private updateHUD():void {
  this.state.crops=this.farming.crops;updateVillageEquipment(this,this.state,this.player,this.inShop);notifyReadyOrders(this.state,m=>this.ui.toast(m));markMinerals(this,this.world.resources);
  const npc=this.nearest(),nearExit=!this.inShop&&Math.abs(this.player.x-64)<70&&Math.abs(this.player.y-1680)<32,location=this.inBlacksmith?'Ferraria de Bento':this.merchantRoom?`${VILLAGE_NPCS.find(n=>n.id===this.merchantRoom)!.role} · ${VILLAGE_NPCS.find(n=>n.id===this.merchantRoom)!.name}`:VILLAGE_NAME;
  this.ui.updateHUD({toolConditions:this.state.economy6?.tools,learnedRecipes:this.state.villageProgress?.recipes??[],vigor:this.state.villageProgress?.vigor??100,area:'village',coins:this.state.villageEconomy!.coins,inHome:this.inShop,mapEditorAvailable:!this.inShop||this.merchantRoom==='tobias',interiorEditor:this.merchantRoom==='tobias',swimming:false,name:this.state.profile.name,
   day:this.state.day,time:this.state.time,inventory:this.inventory.data,tool:'hand',wateringCan:!!this.state.homeSupplies?.wateringCan,wateringCanWater:this.state.wateringCanWater??0,
   playerTile:{x:this.player.x/32,y:this.player.y/32},interiorMapSize:this.inShop?{width:18,height:this.merchantRoom?12:11}:undefined,interactionKey:npc?'E':null,prompt:npc?`Conversar com ${npc.data.name}${this.canTrade(npc.data.id)?' · comprar e vender':' · conversa e serviços'}`:this.guide?`Siga ${VILLAGE_NPCS.find(n=>n.id===this.guide!.owner)!.name} até a loja`:this.inShop?'Caminhe pela porta ao sul para sair':nearExit?'Siga a seta para voltar à propriedade':'Explore a praça e converse com os moradores',
   location,harvests:this.inventory.data.turnip,metLia:this.state.metLia,nearWorkbench:false,sheltered:this.inShop,shelterReason:this.inShop?location:'',resourceProgress:'',farmingProgress:this.farming.progress,progress:this.state.progress});
  this.ui.updateCameraZoom(this.zoom,!this.paused&&!this.shop?.isOpen);
 }
 persist():boolean {
  if(!this.player||this.leaving)return false;
  this.state.quickbar=this.ui.getQuickbar();this.state.inventory={...this.inventory.data};
  const position={x:this.player.x,y:this.player.y,direction:directionFromVector(this.player.facing.x,this.player.facing.y)};
  if(this.inBlacksmith){this.state.blacksmithInterior=position;delete this.state.merchantInterior;}
  else if(this.merchantRoom){this.state.merchantInterior={owner:this.merchantRoom,...position};delete this.state.blacksmithInterior;}
  else{this.state.villagePosition=position;delete this.state.blacksmithInterior;delete this.state.merchantInterior;}
  this.state.shopResidents=[...this.residents.values()].map(p=>({...p}));
  this.state.merchantScenes=Object.fromEntries([...this.merchantLayouts].map(([id,data])=>[id,structuredClone(data)]));
  this.state.bentoRoutine=structuredClone(this.bentoRoutine.state);
  this.state.villageRoutines=Object.fromEntries([...this.routines].map(([id,r])=>[id,structuredClone(r.state)]));
  this.state.blacksmithScene=structuredClone(this.smithLayout);
  this.state.blacksmithLayoutRevision=3;
  this.state.crops=this.farming.crops.map(c=>({...c}));return saveGame(this.state);
 }
 private save=():void=>{this.persist();};
 private blur=():void=>{if(!this.paused&&!this.leaving){this.setPaused(true);this.ui.togglePause();}this.persist();};
 private visibility=():void=>{if(document.hidden)this.blur();};
 private key(e:KeyboardEvent):void {
  if(e.repeat||this.leaving||this.shop?.isOpen)return;
  if(e.key!=='Escape'&&e.target instanceof HTMLElement&&e.target.matches('input,textarea,select,[contenteditable="true"]'))return;
  const key=e.key.toLowerCase();
  if(DEVELOPMENT_TOOLS&&e.key==='F2'){e.preventDefault();this.openMapEditor();return;}
  if(key==='escape'){e.preventDefault();if(this.editingRoom){this.ui.closeModal();return;}if(!this.ui.dismissTopToolbar())this.ui.togglePause();return;}
  if(key==='h'&&this.merchantRoom==='tobias'){e.preventDefault();this.openHomeMenu();return;}
  if(key==='m'){e.preventDefault();this.updateHUD();this.ui.toggleMap();return;}
  if(key==='i'){this.ui.toggleInventory(this.inventory.data);return;}
  if(key==='c'){this.ui.toggleCrafting(this.inventory.data,false);return;}
  if(key==='b'){this.ui.toast('Construa na sua propriedade. As lojas da vila vendem materiais.');return;}
  if(this.paused)return;
  if(key==='e'){e.preventDefault();this.interact();}
  else if(e.key==='+'||e.key==='=')this.changeCameraZoom(1);
  else if(e.key==='-'||e.key==='_')this.changeCameraZoom(-1);
  else if(e.key==='Home')this.changeCameraZoom(0);
  else if(e.key>='1'&&e.key<='9')this.ui.activateSlot(Number(e.key)-1);
 }
 private wheel=(_p:unknown,_objects:unknown,_dx:number,dy:number):void=>{if(!this.paused&&!this.shop?.isOpen)this.changeCameraZoom(dy<0?1:-1);};
 private leave(title=false):void {
  if(this.leaving)return;this.persist();this.leaving=true;
  if(!title){this.state.activeArea='property';delete this.state.villagePosition;delete this.state.blacksmithInterior;delete this.state.merchantInterior;}
  saveGame(this.state);this.cameras.main.fadeOut(SCENE_FADE_MS);
  this.time.delayedCall(SCENE_FADE_MS,()=>{const state=structuredClone(this.state);this.scene.stop();this.onReturn(state,title);});
 }
 update(time:number,ms:number):void {
  if(!this.player)return;this.daylight.update(this.state.time,this.inShop);this.world.update(time);this.world.updateLighting(this.state.time);
  if(this.paused||this.leaving||this.changingRoom||this.shop?.isOpen||this.ui.isModalOpen()||document.hidden)return;
  const delta=Math.min(ms/1000,.1),previous={x:this.player.x,y:this.player.y};this.player.speedMultiplier=this.state.inventory.boots>0?1.08:1;this.player.update(delta,this.blocked,this.blockedPoint);
  if(this.inShop)this.centerInteriorCamera();
  if(!this.merchantRoom&&this.homePassage.update(previous,this.player,this.inBlacksmith?smithDoor(this.smithLayout):BLACKSMITH_DOOR)){this.changeBlacksmithRoom();return;}
  if(this.merchantRoom){if(this.merchantPassage.update(previous,this.player,MERCHANT_ROOM_EXIT)){this.changeMerchantRoom();return;}}
  else if(!this.inShop){const near=VILLAGE_NPCS.find(n=>n.id!=='bento'&&Math.hypot(this.player.x-merchantDoor(n.id).x,this.player.y-merchantDoor(n.id).y)<80);if(near){if(this.merchantPassage.update(previous,this.player,merchantDoor(near.id))){this.changeMerchantRoom(near.id);return;}}else this.merchantPassage.reset();}
  if(!this.inShop&&this.exitPassage.update(previous,this.player,this.world.exit(),this.world.entry())){this.leave();return;}
  if(Math.hypot(this.player.x-previous.x,this.player.y-previous.y)>.1)gameAudio.play('step');
  this.farming.update(delta);Object.assign(this.state,advanceClock(this.state,delta*GAME_MINUTES_PER_SECOND));
  for(const tree of this.world.trees)tree.setAlpha(this.player.y<tree.y&&Math.abs(this.player.x-tree.x)<tree.displayWidth*.4&&this.player.y>tree.y-tree.displayHeight*.85?.42:1);
  this.updateDailyRoutines(delta);
  if(this.guide&&!this.inShop){const guide=this.guide,npc=this.villagers.find(n=>n.data.id===guide.owner)!;
   const blocked=(x:number,y:number)=>this.world.isBlocked(x,y)||this.villagers.some(n=>n!==npc&&n.sprite.visible&&Math.floor(n.sprite.x/32)===x&&Math.floor(n.sprite.y/32)===y);
   const step=guide.step(delta,npc.sprite,this.player,blocked);let x=step.x,y=step.y;
   if(actorsOverlap(step,this.player)){x=npc.sprite.x;y=npc.sprite.y;step.phase=0;}
   if(step.arrived){const side=freeArrival({x:x+26,y},this.world.isBlockedPoint,[this.player,...this.villagers.filter(n=>n!==npc&&n.sprite.visible).map(n=>n.sprite)]);if(side&&Math.hypot(side.x-x,side.y-y)<64){x=side.x;y=side.y;}}
   npc.sprite.setPosition(x,y).setDepth(y).setFrame(characterFrame(step.waiting?directionFromVector(this.player.x-x,this.player.y-y):step.direction,npc.frames?step.phase:0,npc.frames));
   if(guide.owner==='bento')Object.assign(this.bentoRoutine.state,{x,y,direction:step.direction});else Object.assign(this.residents.get(guide.owner)!,{x,y,direction:step.direction});
   if(dailyMerchant(guide.owner))Object.assign(this.routines.get(guide.owner)!.state,{x,y,direction:step.direction});
  }
  for(const npc of this.villagers)npc.sprite.setVisible(this.sameRoom(npc)&&(!npc.data.merchantId||isMerchantOpen(npc.data.merchantId,this.state.day)));

  this.hudElapsed+=delta;if(this.hudElapsed>.1){this.updateHUD();this.hudElapsed=0;}
  this.elapsed+=delta;if(this.elapsed>5){this.persist();this.elapsed=0;}
 }
}
