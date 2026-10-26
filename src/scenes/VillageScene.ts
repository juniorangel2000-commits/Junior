import {createSmithLayout,upgradeSmithFinish,validSmithLayout,smithFits,smithBlocked,smithConnected,smithNavigation,smithSpawn,smithDoor,type SmithLayout} from '../systems/smith-layout';
import {drawSmithLayout,type SmithView} from '../smith-layout-art';
import {mountSmithEditor} from '../smith-layout-editor';
import {BENTO_WALK_FRAMES,BENTO_DISPLAY,bentoSourceKey} from '../bento-sprites';
import {BentoRoutine} from '../systems/bento-routine';
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
import {VILLAGE_ENTRY,VILLAGE_EXIT,VILLAGE_NAME,VILLAGE_NPCS,villagePixelPoint,type VillageNPC} from '../data/village';
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

export interface VillageStart {save:SaveData;ui:GameUI;onReturn:(save:SaveData,title?:boolean)=>void}
type Villager={data:VillageNPC;sprite:Phaser.GameObjects.Sprite;label:Phaser.GameObjects.Text;frames:number};

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
 private changingRoom=false;
 private readonly homePassage=new DoorwayPassage();
 private elapsed=0;
 private hudElapsed=0;
 private readonly exitPassage=new MapExitPassage();
 constructor(){super('Vila');}

 create(data:VillageStart):void {
  this.state=structuredClone(data.save);this.state.activeArea='village';delete this.state.homePosition;
  this.state.villageEconomy??=createVillageEconomy();this.ui=data.ui;this.onReturn=data.onReturn;
  this.smithLayout=upgradeSmithFinish(this.state.blacksmithScene??createSmithLayout());this.editingRoom=false;
  this.bentoRoutine=new BentoRoutine(this.state.blacksmithScene?this.state.bentoRoutine:undefined,smithNavigation(this.smithLayout));this.inBlacksmith=false;this.changingRoom=false;this.homePassage.reset();
  this.paused=false;this.leaving=false;this.elapsed=0;this.hudElapsed=0;this.exitPassage.reset();
  this.zoom=loadCameraZoom();this.inventory=new Inventory(this.state.inventory);
  this.farming=new Farming(this.state.crops,this.state.preparedSoil,this.state.farmingProgress,this.state.restoredFarmSoil);
  this.world=new VillageWorld(this);this.createVillagers();
  const saved=this.state.villagePosition,entry=villagePixelPoint(VILLAGE_ENTRY);
  const valid=saved&&![[-7,-5],[7,-5],[-7,3],[7,3]].some(([dx,dy])=>this.blockedPoint(saved.x+dx,saved.y+dy));
  this.player=new Player(this,this.state.profile,valid?saved.x:entry.x,valid?saved.y:entry.y,'village-player');
  this.player.facing=directionVector(valid?saved.direction??'right':'right');this.player.update(0,this.blocked,undefined,false);
  this.daylight=new Daylight(this,3072,2304);this.daylight.update(this.state.time);this.world.updateLighting(this.state.time);
  if(this.state.blacksmithInterior)this.setBlacksmithRoom(true,this.state.blacksmithScene?this.state.blacksmithInterior:undefined);
  this.applyCamera();this.cameras.main.fadeIn(SCENE_FADE_MS);
  this.shop=new VillageInteractionUI({
   getPortrait:id=>id==='bento'?this.textures.getBase64(bentoSourceKey('down')):this.textures.getBase64(`village-npc-${id}`,0),
   onBlacksmith:()=>{this.shop?.close();this.setPaused(true);openBlacksmithPanel(()=>({...this.state,inventory:{...this.inventory.data}}),change=>{const before=structuredClone(this.state);this.state.inventory={...this.inventory.data};const r=change(this.state);if(r.ok){Object.assign(this.inventory.data,this.state.inventory);if(!this.persist()){this.state=before;Object.assign(this.inventory.data,before.inventory);return{ok:false,message:'Falha ao salvar. A operação foi revertida.'};}this.updateHUD();}return r;},()=>this.setPaused(false));},
   getServices:npc=>listVillageServices(npc),
   onService:id=>{const previous=structuredClone(this.state);const previousStock={...this.inventory.data};this.state.inventory={...this.inventory.data};this.state.crops=this.farming.crops.map(c=>({...c}));const result=performVillageService(this.state,id);if(result.ok){Object.assign(this.inventory.data,this.state.inventory);this.farming=new Farming(this.state.crops,this.state.preparedSoil,this.state.farmingProgress,this.state.restoredFarmSoil);const x=this.player.x,y=this.player.y;this.player.sprite.destroy();this.player=new Player(this,this.state.profile,x,y,'village-player');this.applyCamera();if(!this.persist()){this.state=previous;Object.assign(this.inventory.data,previousStock);return{ok:false,message:'Falha ao salvar. A operação foi revertida.'};}this.updateHUD();}return result;},
   getInventory:()=>this.inventory.data,getEconomy:()=>this.state.villageEconomy!,getDay:()=>this.state.day,
   onTrade:(merchant,side,item,quantity)=>{
    const before=structuredClone(this.state);const stockBefore={...this.inventory.data};
    const result=trade(merchant,side,item,quantity,this.inventory,this.state.villageEconomy!,this.state.day);
    if(result.ok){Object.assign(this.state.inventory,this.inventory.data);if(!this.persist()){this.state=before;Object.assign(this.inventory.data,stockBefore);return{ok:false,reason:'invalid-economy',message:'Falha ao salvar. A operação foi revertida.'};}this.updateHUD();gameAudio.play('craft');}
    return result;
   },
   onClose:()=>{this.paused=false;this.input.keyboard?.resetKeys();this.updateHUD();},
  });
  document.querySelector<HTMLElement>('#ui')!.style.display='';this.ui.setQuickbar(this.state.quickbar??emptyQuickbar());
  this.ui.showHUD('village');this.updateHUD();
  this.input.keyboard!.on('keydown',this.key,this);this.input.on('wheel',this.wheel,this);
  this.input.on('pointerdown',this.pointer,this);this.scale.on('resize',this.applyCamera,this);
  window.addEventListener('pagehide',this.save);window.addEventListener('beforeunload',this.save);
  window.addEventListener('blur',this.blur);document.addEventListener('visibilitychange',this.visibility);
  this.events.once('shutdown',()=>{
   this.leaving=true;this.shop?.destroy();this.shop=undefined;this.roomView?.destroy();this.roomView=undefined;this.daylight?.destroy();this.world?.destroy();
   this.input.keyboard?.off('keydown',this.key,this);this.input.off('wheel',this.wheel,this);this.input.off('pointerdown',this.pointer,this);
   this.scale.off('resize',this.applyCamera,this);window.removeEventListener('pagehide',this.save);window.removeEventListener('beforeunload',this.save);
   window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);
  });
  this.persist();
 }
 private createVillagers():void {
  this.villagers=VILLAGE_NPCS.map(npc=>{
   const frames=npc.id==='bento'?BENTO_WALK_FRAMES:0,key=merchantTexture(this,npc.id),p=villagePixelPoint(npc);
   const sprite=this.add.sprite(p.x,p.y,key,characterFrame(npc.direction,0,frames)).setOrigin(.5,1).setDisplaySize(npc.id==='bento'?BENTO_DISPLAY:CHARACTER_WIDTH,CHARACTER_HEIGHT).setDepth(p.y);
   const label=this.add.text(p.x,p.y-CHARACTER_HEIGHT-5,`${npc.name}\n${npc.role}`,{fontFamily:'Georgia',fontSize:'11px',align:'center',color:'#fff1cf',stroke:'#293b28',strokeThickness:3}).setOrigin(.5,1).setDepth(p.y+1);
   if(npc.id==='bento'){const b=this.bentoRoutine.state;sprite.setPosition(b.x,b.y).setDepth(b.y).setFrame(characterFrame(b.direction,0,frames)).setVisible(b.area==='village');label.setVisible(false);}
   return {data:npc,sprite,label,frames};
  });
 }
 private blocked=(x:number,y:number):boolean=>(this.inBlacksmith?smithBlocked(this.smithLayout,x*32+16,y*32+16):this.world.isBlocked(x,y))||this.villagers.some(n=>n.sprite.visible&&Math.floor(n.sprite.x/32)===x&&Math.floor(n.sprite.y/32)===y);
 private blockedPoint=(x:number,y:number):boolean=>(this.inBlacksmith?smithBlocked(this.smithLayout,x,y):this.world.isBlockedPoint(x,y))||this.villagers.some(n=>n.sprite.visible&&Math.abs(n.sprite.x-x)<10&&Math.abs(n.sprite.y-y)<6);
 private nearest():Villager|undefined {
  return this.villagers.filter(n=>n.sprite.visible&&Math.hypot(n.sprite.x-this.player.x,n.sprite.y-this.player.y)<78)
   .sort((a,b)=>Math.hypot(a.sprite.x-this.player.x,a.sprite.y-this.player.y)-Math.hypot(b.sprite.x-this.player.x,b.sprite.y-this.player.y))[0];
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
 openMapEditor():void {this.ui.toast('O editor de desenvolvimento da propriedade e da floresta continua disponível ao voltar.');}
 openHomeMenu():void {
  if(!this.inBlacksmith||this.changingRoom||this.leaving||this.shop?.isOpen){this.ui.toast('Entre na ferraria e pressione H para editar.');return;}
  if(this.editingRoom){this.ui.closeModal();return;}
  if(this.ui.isModalOpen())this.ui.closeModal();this.editingRoom=true;this.applyCamera();
  this.ui.showSceneEditor(host=>{const dispose=mountSmithEditor(host,()=>this.smithLayout,()=>this.roomView,data=>this.editSmithLayout(data),()=>this.ui.closeModal());return()=>{dispose();this.editingRoom=false;this.applyCamera();};});
 }
 private editSmithLayout(data:SmithLayout):string|null {
  const fail=(message:string)=>{this.roomView?.destroy();this.roomView=drawSmithLayout(this,this.smithLayout);return message;};
  if(!validSmithLayout(data)||!smithConnected(data))return fail('Mantenha a estrutura válida e a passagem da entrada livre.');
  const b=this.bentoRoutine.state;if(!smithFits(data,this.player.x,this.player.y)||b.area==='blacksmith-home'&&!smithFits(data,b.x,b.y))return fail('Mova o personagem ou Bento antes de ocupar esse espaço.');
  const before=this.smithLayout,save=structuredClone(this.state);this.smithLayout=structuredClone(data);this.bentoRoutine.setRoom(smithNavigation(this.smithLayout));
  if(!this.persist()){this.smithLayout=before;this.state=save;this.bentoRoutine.setRoom(smithNavigation(before));return fail('Falha ao salvar. A edição foi revertida.');}
  this.roomView?.destroy();this.roomView=drawSmithLayout(this,this.smithLayout);return null;
 }

 mainMenu():void {this.shop?.close();this.ui.closeModal();this.leave(true);}
 private applyCamera():void {
  if(!this.player)return;
  const w=this.inBlacksmith?576:3072,h=this.inBlacksmith?352:2304;
  const viewport=this.editingRoom?Math.max(400,this.scale.width-340):this.scale.width;this.cameras.main.setViewport(0,0,viewport,this.scale.height);
  const base=this.inBlacksmith?Math.min(viewport/(w+64),this.scale.height/(h+64)):2;
  const camera=this.cameras.main;camera.setBackgroundColor(this.inBlacksmith?'#26302c':'#526b3e').setZoom(base*this.zoom);
  if(this.inBlacksmith){camera.removeBounds().stopFollow();this.centerInteriorCamera();}
  else camera.setBounds(0,0,w,h).startFollow(this.player,false,1,1).centerOn(this.player.x,this.player.y);
 }
 private centerInteriorCamera():void {
  const c=this.cameras.main,w=576,h=352;
  const halfW=c.width/c.zoom/2,halfH=c.height/c.zoom/2;
  c.centerOn(halfW*2>=w?w/2:Phaser.Math.Clamp(this.player.x,halfW,w-halfW),halfH*2>=h?h/2:Phaser.Math.Clamp(this.player.y,halfH,h-halfH));
 }
 private sameRoom(npc:Villager):boolean{return npc.data.id==='bento'?(this.bentoRoutine.state.area==='blacksmith-home')===this.inBlacksmith:!this.inBlacksmith;}
 private setBlacksmithRoom(inside:boolean,position?:SaveData['blacksmithInterior']):void {
  this.inBlacksmith=inside;this.homePassage.reset();this.world.setVisible(!inside);
  this.roomView?.destroy();this.roomView=inside?drawSmithLayout(this,this.smithLayout):undefined;
  for(const npc of this.villagers){npc.sprite.setVisible(this.sameRoom(npc));npc.label.setVisible(false);}
  const p=position??(inside?smithSpawn(this.smithLayout):BLACKSMITH_OUTSIDE);
  this.player.x=p.x;this.player.y=p.y;this.player.facing=directionVector(position?.direction??(inside?'up':'down'));
  // A resident standing in the doorway must never strand the arriving player.
  if([[-7,-5],[7,-5],[-7,3],[7,3]].some(([dx,dy])=>this.blockedPoint(this.player.x+dx,this.player.y+dy))){
   const options=inside?[smithSpawn(this.smithLayout),{x:245,y:290},{x:230,y:290}]:[{x:1818,y:1054},{x:1862,y:1054}];
   const free=options.find(p=>[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!this.blockedPoint(p.x+dx,p.y+dy)));
   if(free){this.player.x=free.x;this.player.y=free.y;}
  }
  this.input.keyboard?.resetKeys();this.player.update(0,this.blocked,this.blockedPoint,false);
  this.daylight.update(this.state.time,inside);this.applyCamera();
 }
 private changeBlacksmithRoom():void {
  if(this.changingRoom)return;this.persist();this.changingRoom=true;
  this.cameras.main.fadeOut(SCENE_FADE_MS);
  this.time.delayedCall(SCENE_FADE_MS,()=>{
   if(this.leaving)return;this.setBlacksmithRoom(!this.inBlacksmith);this.changingRoom=false;
   this.cameras.main.fadeIn(SCENE_FADE_MS);gameAudio.play('door');this.updateHUD();this.persist();
  });
 }
 changeCameraZoom(direction:-1|0|1):void {
  if(this.paused||this.leaving)return;this.zoom=stepCameraZoom(this.zoom,direction);saveCameraZoom(this.zoom);this.applyCamera();this.ui.updateCameraZoom(this.zoom,true);
 }
  async useVillageItem(item:import('../types').ItemId):Promise<void>{
    if(this.inBlacksmith){this.ui.toast('Use os equipamentos de exploração fora da loja de Bento.');return;}
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
  this.updateHUD();const rt=this.make.renderTexture(this.inBlacksmith?{width:1152,height:704}:{width:960,height:720},false);rt.camera.setZoom(this.inBlacksmith?2:960/3072).setScroll(0,0).setOrigin(0,0);
  this.children.depthSort();rt.draw(this.children.list.filter(o=>o!==this.player.sprite&&!this.daylight.contains(o)&&'visible'in o&&o.visible));
  return new Promise(resolve=>rt.snapshot(image=>{const url=image instanceof HTMLImageElement?image.src:'';rt.destroy();resolve(url);}));
 }
 private updateHUD():void {
  this.state.crops=this.farming.crops;updateVillageEquipment(this,this.state,this.player);notifyReadyOrders(this.state,m=>this.ui.toast(m));markMinerals(this,this.world.resources);
  const npc=this.nearest(),nearExit=!this.inBlacksmith&&Math.abs(this.player.x-64)<70&&Math.abs(this.player.y-1680)<32;
  this.ui.updateHUD({toolConditions:this.state.economy6?.tools,learnedRecipes:this.state.villageProgress?.recipes??[],vigor:this.state.villageProgress?.vigor??100,area:'village',coins:this.state.villageEconomy!.coins,inHome:this.inBlacksmith,swimming:false,name:this.state.profile.name,
   day:this.state.day,time:this.state.time,inventory:this.inventory.data,tool:'hand',wateringCan:!!this.state.homeSupplies?.wateringCan,wateringCanWater:this.state.wateringCanWater??0,
   playerTile:{x:this.player.x/32,y:this.player.y/32},interiorMapSize:this.inBlacksmith?{width:18,height:11}:undefined,interactionKey:npc?'E':null,prompt:npc?`Conversar com ${npc.data.name}${npc.data.merchantId?' · comprar e vender':''}`:this.inBlacksmith?'H: editar interior · caminhe pela porta ao sul para sair':nearExit?'Siga a seta para voltar à propriedade':'Explore a praça e converse com os moradores',
   location:this.inBlacksmith?'Ferraria de Bento':VILLAGE_NAME,harvests:this.inventory.data.turnip,metLia:this.state.metLia,nearWorkbench:false,sheltered:this.inBlacksmith,shelterReason:this.inBlacksmith?'Ferraria de Bento':'',resourceProgress:'',farmingProgress:this.farming.progress,progress:this.state.progress});
  this.ui.updateCameraZoom(this.zoom,!this.paused&&!this.shop?.isOpen);
 }
 persist():boolean {
  if(!this.player||this.leaving)return false;
  this.state.quickbar=this.ui.getQuickbar();this.state.inventory={...this.inventory.data};
  const position={x:this.player.x,y:this.player.y,direction:directionFromVector(this.player.facing.x,this.player.facing.y)};
  if(this.inBlacksmith)this.state.blacksmithInterior=position;
  else{this.state.villagePosition=position;delete this.state.blacksmithInterior;}
  this.state.bentoRoutine=structuredClone(this.bentoRoutine.state);
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
  if(key==='escape'){e.preventDefault();if(this.editingRoom){this.ui.closeModal();return;}if(!this.ui.dismissTopToolbar())this.ui.togglePause();return;}
  if(key==='h'){e.preventDefault();this.openHomeMenu();return;}
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
  if(!title){this.state.activeArea='property';delete this.state.villagePosition;delete this.state.blacksmithInterior;}
  saveGame(this.state);this.cameras.main.fadeOut(SCENE_FADE_MS);
  this.time.delayedCall(SCENE_FADE_MS,()=>{const state=structuredClone(this.state);this.scene.stop();this.onReturn(state,title);});
 }
 update(time:number,ms:number):void {
  if(!this.player)return;this.daylight.update(this.state.time,this.inBlacksmith);this.world.update(time);this.world.updateLighting(this.state.time);
  if(this.paused||this.leaving||this.changingRoom||this.shop?.isOpen||this.ui.isModalOpen()||document.hidden)return;
  const delta=Math.min(ms/1000,.1),previous={x:this.player.x,y:this.player.y};this.player.speedMultiplier=this.state.inventory.boots>0?1.08:1;this.player.update(delta,this.blocked,this.blockedPoint);
  if(this.inBlacksmith)this.centerInteriorCamera();
  if(this.homePassage.update(previous,this.player,this.inBlacksmith?smithDoor(this.smithLayout):BLACKSMITH_DOOR)){this.changeBlacksmithRoom();return;}
  if(!this.inBlacksmith&&this.exitPassage.update(previous,this.player,VILLAGE_EXIT,VILLAGE_ENTRY)){this.leave();return;}
  if(Math.hypot(this.player.x-previous.x,this.player.y-previous.y)>.1)gameAudio.play('step');
  this.farming.update(delta);Object.assign(this.state,advanceClock(this.state,delta*GAME_MINUTES_PER_SECOND));
  for(const tree of this.world.trees)tree.setAlpha(this.player.y<tree.y&&Math.abs(this.player.x-tree.x)<tree.displayWidth*.4&&this.player.y>tree.y-tree.displayHeight*.85?.42:1);
  const bento=this.villagers.find(n=>n.data.id==='bento');
  if(bento){
   const blocked=(x:number,y:number)=>this.world.isBlocked(x,y)||this.villagers.some(n=>n!==bento&&Math.floor(n.sprite.x/32)===x&&Math.floor(n.sprite.y/32)===y);
   const nearPlayer=this.sameRoom(bento)&&Math.hypot(bento.sprite.x-this.player.x,bento.sprite.y-this.player.y)<68;
   const step=this.bentoRoutine.step(delta,nearPlayer,blocked);
   bento.sprite.setPosition(step.x,step.y).setDepth(step.y).setFrame(characterFrame(nearPlayer?directionFromVector(this.player.x-step.x,this.player.y-step.y):step.direction,step.phase,bento.frames));
   bento.label.setPosition(step.x,step.y-CHARACTER_HEIGHT-5).setDepth(step.y+1);
  }
  for(const npc of this.villagers)npc.sprite.setVisible(this.sameRoom(npc)&&(!npc.data.merchantId||isMerchantOpen(npc.data.merchantId,this.state.day)));
  const nearest=this.nearest();for(const npc of this.villagers)npc.label.setVisible(npc.sprite.visible&&(npc===nearest||Math.hypot(npc.sprite.x-this.player.x,npc.sprite.y-this.player.y)<220));
  this.hudElapsed+=delta;if(this.hudElapsed>.1){this.updateHUD();this.hudElapsed=0;}
  this.elapsed+=delta;if(this.elapsed>5){this.persist();this.elapsed=0;}
 }
}
