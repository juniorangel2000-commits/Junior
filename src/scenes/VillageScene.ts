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
import {MapExitPassage,SCENE_FADE_MS} from '../systems/map-transition';
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
 private elapsed=0;
 private hudElapsed=0;
 private readonly exitPassage=new MapExitPassage();
 constructor(){super('Vila');}

 create(data:VillageStart):void {
  this.state=structuredClone(data.save);this.state.activeArea='village';delete this.state.homePosition;
  this.state.villageEconomy??=createVillageEconomy();this.ui=data.ui;this.onReturn=data.onReturn;
  this.paused=false;this.leaving=false;this.elapsed=0;this.hudElapsed=0;this.exitPassage.reset();
  this.zoom=loadCameraZoom();this.inventory=new Inventory(this.state.inventory);
  this.farming=new Farming(this.state.crops,this.state.preparedSoil,this.state.farmingProgress,this.state.restoredFarmSoil);
  this.world=new VillageWorld(this);this.createVillagers();
  const saved=this.state.villagePosition,entry=villagePixelPoint(VILLAGE_ENTRY);
  const valid=saved&&![[-7,-5],[7,-5],[-7,3],[7,3]].some(([dx,dy])=>this.blocked(Math.floor((saved.x+dx)/32),Math.floor((saved.y+dy)/32)));
  this.player=new Player(this,this.state.profile,valid?saved.x:entry.x,valid?saved.y:entry.y,'village-player');
  this.player.facing=directionVector(valid?saved.direction??'right':'right');this.player.update(0,this.blocked,undefined,false);
  this.daylight=new Daylight(this,3072,2304);this.daylight.update(this.state.time);this.world.updateLighting(this.state.time);
  this.applyCamera();this.cameras.main.fadeIn(SCENE_FADE_MS);
  this.shop=new VillageInteractionUI({
   getPortrait:id=>this.textures.getBase64(`village-npc-${id}`,0),
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
   this.leaving=true;this.shop?.destroy();this.shop=undefined;this.daylight?.destroy();this.world?.destroy();
   this.input.keyboard?.off('keydown',this.key,this);this.input.off('wheel',this.wheel,this);this.input.off('pointerdown',this.pointer,this);
   this.scale.off('resize',this.applyCamera,this);window.removeEventListener('pagehide',this.save);window.removeEventListener('beforeunload',this.save);
   window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);
  });
  this.persist();
 }
 private createVillagers():void {
  this.villagers=VILLAGE_NPCS.map(npc=>{
   const frames=0,key=merchantTexture(this,npc.id),p=villagePixelPoint(npc);
   const sprite=this.add.sprite(p.x,p.y,key,characterFrame(npc.direction,0,frames)).setOrigin(.5,1).setDisplaySize(CHARACTER_WIDTH,CHARACTER_HEIGHT).setDepth(p.y);
   const label=this.add.text(p.x,p.y-CHARACTER_HEIGHT-5,`${npc.name}\n${npc.role}`,{fontFamily:'Georgia',fontSize:'11px',align:'center',color:'#fff1cf',stroke:'#293b28',strokeThickness:3}).setOrigin(.5,1).setDepth(p.y+1);
   return {data:npc,sprite,label,frames};
  });
 }
 private blocked=(x:number,y:number):boolean=>this.world.isBlocked(x,y)||VILLAGE_NPCS.some(n=>(!n.merchantId||isMerchantOpen(n.merchantId,this.state.day))&&n.x===x&&n.y===y);
 private nearest():Villager|undefined {
  return this.villagers.filter(n=>n.sprite.visible&&Math.hypot(n.sprite.x-this.player.x,n.sprite.y-this.player.y)<78)
   .sort((a,b)=>Math.hypot(a.sprite.x-this.player.x,a.sprite.y-this.player.y)-Math.hypot(b.sprite.x-this.player.x,b.sprite.y-this.player.y))[0];
 }
 private interact():void {
  if(this.paused||this.leaving||this.ui.isModalOpen()||this.shop?.isOpen)return;
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
 mainMenu():void {this.shop?.close();this.ui.closeModal();this.leave(true);}
 private applyCamera():void {
  if(!this.player)return;
  this.cameras.main.setBounds(0,0,3072,2304).setZoom(2*this.zoom).startFollow(this.player,false,1,1).centerOn(this.player.x,this.player.y);
 }
 changeCameraZoom(direction:-1|0|1):void {
  if(this.paused||this.leaving)return;this.zoom=stepCameraZoom(this.zoom,direction);saveCameraZoom(this.zoom);this.applyCamera();this.ui.updateCameraZoom(this.zoom,true);
 }
  async useVillageItem(item:import('../types').ItemId):Promise<void>{
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
  this.updateHUD();const rt=this.make.renderTexture({width:960,height:720},false);rt.camera.setZoom(960/3072).setScroll(0,0).setOrigin(0,0);
  this.children.depthSort();rt.draw(this.children.list.filter(o=>o!==this.player.sprite&&!this.daylight.contains(o)&&'visible'in o&&o.visible));
  return new Promise(resolve=>rt.snapshot(image=>{const url=image instanceof HTMLImageElement?image.src:'';rt.destroy();resolve(url);}));
 }
 private updateHUD():void {
  this.state.crops=this.farming.crops;updateVillageEquipment(this,this.state,this.player);notifyReadyOrders(this.state,m=>this.ui.toast(m));markMinerals(this,this.world.resources);
  const npc=this.nearest(),nearExit=Math.abs(this.player.x-64)<70&&Math.abs(this.player.y-1680)<32;
  this.ui.updateHUD({toolConditions:this.state.economy6?.tools,learnedRecipes:this.state.villageProgress?.recipes??[],vigor:this.state.villageProgress?.vigor??100,area:'village',coins:this.state.villageEconomy!.coins,inHome:false,swimming:false,name:this.state.profile.name,
   day:this.state.day,time:this.state.time,inventory:this.inventory.data,tool:'hand',wateringCan:!!this.state.homeSupplies?.wateringCan,wateringCanWater:this.state.wateringCanWater??0,
   playerTile:{x:this.player.x/32,y:this.player.y/32},interactionKey:npc?'E':null,prompt:npc?`Conversar com ${npc.data.name}${npc.data.merchantId?' · comprar e vender':''}`:nearExit?'Siga a seta para voltar à propriedade':'Explore a praça e converse com os moradores',
   location:VILLAGE_NAME,harvests:this.inventory.data.turnip,metLia:this.state.metLia,nearWorkbench:false,sheltered:false,shelterReason:'',resourceProgress:'',farmingProgress:this.farming.progress,progress:this.state.progress});
  this.ui.updateCameraZoom(this.zoom,!this.paused&&!this.shop?.isOpen);
 }
 persist():boolean {
  if(!this.player||this.leaving)return false;
  this.state.quickbar=this.ui.getQuickbar();this.state.inventory={...this.inventory.data};
  this.state.villagePosition={x:this.player.x,y:this.player.y,direction:directionFromVector(this.player.facing.x,this.player.facing.y)};
  this.state.crops=this.farming.crops.map(c=>({...c}));return saveGame(this.state);
 }
 private save=():void=>{this.persist();};
 private blur=():void=>{if(!this.paused&&!this.leaving){this.setPaused(true);this.ui.togglePause();}this.persist();};
 private visibility=():void=>{if(document.hidden)this.blur();};
 private key(e:KeyboardEvent):void {
  if(e.repeat||this.leaving||this.shop?.isOpen)return;
  if(e.key!=='Escape'&&e.target instanceof HTMLElement&&e.target.matches('input,textarea,select,[contenteditable="true"]'))return;
  const key=e.key.toLowerCase();
  if(key==='escape'){e.preventDefault();if(!this.ui.dismissTopToolbar())this.ui.togglePause();return;}
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
  if(!title){this.state.activeArea='property';delete this.state.villagePosition;}
  saveGame(this.state);this.cameras.main.fadeOut(SCENE_FADE_MS);
  this.time.delayedCall(SCENE_FADE_MS,()=>{const state=structuredClone(this.state);this.scene.stop();this.onReturn(state,title);});
 }
 update(time:number,ms:number):void {
  if(!this.player)return;this.daylight.update(this.state.time);this.world.update(time);this.world.updateLighting(this.state.time);
  if(this.paused||this.leaving||this.shop?.isOpen||this.ui.isModalOpen()||document.hidden)return;
  const delta=Math.min(ms/1000,.1),previous={x:this.player.x,y:this.player.y};this.player.speedMultiplier=this.state.inventory.boots>0?1.08:1;this.player.update(delta,this.blocked);
  if(this.exitPassage.update(previous,this.player,VILLAGE_EXIT,VILLAGE_ENTRY)){this.leave();return;}
  if(Math.hypot(this.player.x-previous.x,this.player.y-previous.y)>.1)gameAudio.play('step');
  this.farming.update(delta);Object.assign(this.state,advanceClock(this.state,delta*GAME_MINUTES_PER_SECOND));
  for(const tree of this.world.trees)tree.setAlpha(this.player.y<tree.y&&Math.abs(this.player.x-tree.x)<tree.displayWidth*.4&&this.player.y>tree.y-tree.displayHeight*.85?.42:1);
  const nearest=this.nearest();for(const npc of this.villagers){const available=!npc.data.merchantId||isMerchantOpen(npc.data.merchantId,this.state.day);npc.sprite.setVisible(available);npc.label.setVisible(available&&(npc===nearest||Math.hypot(npc.sprite.x-this.player.x,npc.sprite.y-this.player.y)<220));}
  this.hudElapsed+=delta;if(this.hudElapsed>.1){this.updateHUD();this.hudElapsed=0;}
  this.elapsed+=delta;if(this.elapsed>5){this.persist();this.elapsed=0;}
 }
}
