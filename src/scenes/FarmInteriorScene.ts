import Phaser from 'phaser';
import type {SaveData,Tool,ItemId} from '../types';
import type {GameUI} from '../ui';
import {Player} from '../player';
import {ToolVisual} from '../tool-visual';
import {gameAudio} from '../audio';
import {saveGame} from '../systems/save';
import {Farming} from '../systems/farming';
import {advanceClock,GAME_MINUTES_PER_SECOND} from '../systems/clock';
import {advanceBackgroundVillage} from '../systems/village-background';
import {craftInField,consumeInField} from '../systems/field-inventory';
import {emptyQuickbar} from '../systems/quickbar';
import {DoorwayPassage,SCENE_FADE_MS} from '../systems/map-transition';
import {directionVector} from '../character-directions';
import {loadCameraZoom,saveCameraZoom,stepCameraZoom,mapCameraZoom} from '../camera-zoom';
import {createMineMissionRuntime} from '../systems/mine-missions';
import {bentoSceneWriter} from '../systems/bento-commit';
import {AnimalBrain} from '../systems/animals';
import {animalSprite,setupAnimalArt} from '../forest-art';
import {updateAnimalSprite} from '../animal-sprites';
import {domesticAnimal} from '../data/domestic-animals';
import {ANIMAL_NAMES} from '../data/ancient-forest';
import {FARM_BUILDINGS} from '../data/farm-buildings';
import {FARM_INTERIORS,interiorBlocked,interiorSafe,interiorSpawn,interiorExit,interiorSize,type FarmInteriorLayout} from '../data/farm-interiors';
import {animalsInside,farmDoorExit} from '../systems/farm-interior';
import type {FarmSite} from '../systems/farm-construction';
import {drawFarmInterior,preloadFarmInteriorArt,type InteriorView} from '../farm-interior-art';
import {processAnimalProduction,productionSummary,fillTrough,collectEgg,canMilk,milkCow,milkReady,MILKING_SECONDS,TROUGH_CAPACITY} from '../systems/animal-production';
interface InteriorStart{save:SaveData;ui:GameUI;siteId:number;onReturn:(save:SaveData,title?:boolean)=>void}
interface InteriorAnimal{id:string;brain:AnimalBrain;sprite:Phaser.GameObjects.Sprite;shadow:Phaser.GameObjects.Ellipse;badge?:Phaser.GameObjects.Image}
/** Interior do galinheiro ou do curral. A Propriedade fica dormindo enquanto você está aqui;
 * o save guarda você do lado de fora da porta, então recarregar o jogo te deixa na entrada. */
export class FarmInteriorScene extends Phaser.Scene{
 private state!:SaveData;private ui!:GameUI;private player!:Player;private farming!:Farming;private toolVisual!:ToolVisual;private view?:InteriorView;
 private siteId=0;private layout!:FarmInteriorLayout;private onReturn!:InteriorStart['onReturn'];private paused=false;private leaving=false;private zoom=1;private elapsed=0;private passage=new DoorwayPassage();
 private animals:InteriorAnimal[]=[];private animalsShown=false;
 /** Ordenha em andamento: o jogador fica parado com o balde até terminar. */
 private milking?:{animal:InteriorAnimal;left:number;pail:Phaser.GameObjects.Image};
 private missionRuntime=createMineMissionRuntime(()=>this.snapshotState(),saveGame,()=>this.state,()=>this.player);
 private bentoRuntime={missions:this.missionRuntime,write:bentoSceneWriter(()=>this.snapshotState(),saveGame)};
 constructor(){super('Interior');}
 preload():void{preloadFarmInteriorArt(this);}
 getGroundItemRuntime(){return undefined;}
 getMineMissionRuntime=()=>this.missionRuntime;
 getFishingState=()=>this.state;
 private get site():FarmSite|undefined{return this.state.farmConstruction?.sites.find(s=>s.id===this.siteId);}
 private get name(){const s=this.site;return s?FARM_BUILDINGS[s.kind].name:'Construção';}
 create(data:InteriorStart):void{
  this.state=structuredClone(data.save);this.ui=data.ui;this.onReturn=data.onReturn;this.siteId=data.siteId;this.paused=this.leaving=false;this.elapsed=0;this.milking=undefined;this.passage.reset();this.animals=[];this.animalsShown=false;gameAudio.setScene('game');
  const site=this.site,layout=site&&FARM_INTERIORS[site.kind];
  if(!site||!layout){this.time.delayedCall(0,()=>{this.scene.stop();this.onReturn(this.state);});return;}
  this.layout=layout;processAnimalProduction(this.state);this.view=drawFarmInterior(this,site.kind);this.refreshFixtures();setupAnimalArt(this);
  this.farming=new Farming(this.state.crops,this.state.preparedSoil,this.state.farmingProgress,this.state.restoredFarmSoil);
  const p=interiorSpawn(layout);this.player=new Player(this,this.state.profile,p.x,p.y,'interior-player');this.player.facing=directionVector('up');this.player.update(0,this.blockedTile,this.blocked,false);
  this.toolVisual=new ToolVisual(this,this.state.profile);this.zoom=loadCameraZoom();const size=interiorSize(layout);this.cameras.main.setBounds(0,0,size.width,size.height).setBackgroundColor('#2b1f15');this.applyCamera();this.cameras.main.fadeIn(SCENE_FADE_MS);
  this.ui.showHUD();document.querySelector<HTMLElement>('#ui')!.style.display='';this.ui.setQuickbar(this.state.quickbar??emptyQuickbar());this.syncAnimals();this.updateHUD();
  this.input.keyboard!.on('keydown',this.key,this);this.input.on('wheel',this.wheel,this);this.scale.on('resize',this.applyCamera,this);
  window.addEventListener('pagehide',this.save);window.addEventListener('beforeunload',this.save);window.addEventListener('blur',this.blur);document.addEventListener('visibilitychange',this.visibility);
  this.events.once('shutdown',()=>{this.clearAnimals();this.view?.destroy();this.view=undefined;this.toolVisual?.hide();this.input.keyboard?.off('keydown',this.key,this);this.input.off('wheel',this.wheel,this);this.scale.off('resize',this.applyCamera,this);window.removeEventListener('pagehide',this.save);window.removeEventListener('beforeunload',this.save);window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);});
  this.persist();
 }
 private blocked=(x:number,y:number)=>interiorBlocked(this.layout,x,y);
 private blockedTile=(x:number,y:number)=>interiorBlocked(this.layout,x*32+16,y*32+16);
 private clearAnimals():void{this.stopMilking();for(const a of this.animals){a.sprite.destroy();a.shadow.destroy();a.badge?.destroy();}this.animals=[];}
 private refreshFixtures():void{const s=this.site;if(s)this.view?.refresh({eggs:s.eggs??[],trough:s.trough??0});}
 /** Gota de leite acima das vacas prontas para a ordenha. */
 private refreshBadges():void{for(const a of this.animals){const ready=domesticAnimal(a.id)?.kind==='cow'&&milkReady(this.state,a.id);if(ready&&!a.badge)a.badge=this.add.image(a.brain.x,a.brain.y-44,'interior-milk-ready').setOrigin(.5,1);if(!ready&&a.badge){a.badge.destroy();a.badge=undefined;}if(a.badge)a.badge.setDisplaySize(10,13);}}
 /** Os animais aparecem aqui dentro à noite ou quando foram recolhidos; de dia, ficam no cercado. */
 private syncAnimals():void{
  const site=this.site;if(!site)return;const inside=animalsInside(site,this.state);if(inside===this.animalsShown)return;
  this.animalsShown=inside;this.clearAnimals();if(!inside)return;
  const stalls=this.layout.fixtures.filter(f=>f.kind==='stall'&&!f.solid);
  site.animals.forEach((id,i)=>{const def=domesticAnimal(id);if(!def)return;
   const stall=stalls[i],start=stall?{x:stall.x+stall.w/2,y:stall.y+stall.h/2+6}:{x:(2+(i%5))*32+16,y:(3+Math.floor(i/5))*32+16};
   const p=interiorSafe(this.layout,start)?start:interiorSpawn(this.layout);
   const brain=new AnimalBrain(id,def.kind,p.x,p.y,false,this.blockedTile,84,()=>0,this.blocked);
   const sprite=animalSprite(this,def.kind,brain.x,brain.y),shadow=this.add.ellipse(brain.x,brain.y,def.kind==='cow'?42:17,def.kind==='cow'?12:5,0x29271d,.16);
   this.animals.push({id,brain,sprite,shadow});
  });
  this.refreshBadges();
 }
 private fixtureNear(){const p=this.player;return this.layout.fixtures.filter(f=>!f.id.startsWith('stall-divider')).map(f=>({f,d:Math.hypot(Math.max(f.x-p.x,0,p.x-(f.x+f.w)),Math.max(f.y-p.y,0,p.y-(f.y+f.h)))})).filter(x=>x.d<26).sort((a,b)=>a.d-b.d)[0]?.f;}
 private fixturePrompt(kind:string,label:string,id=''):string{
  const site=this.site;
  if(kind==='trough'&&site){const cap=TROUGH_CAPACITY[site.kind]??0,n=site.trough??0;return`${label} · ${n}/${cap} palhas${n<cap?' · E coloca a palha da mochila':''}`;}
  if(kind==='water')return`${label} · água fresca para os animais`;
  if(kind==='nest')return site?.eggs?.includes(Number(id.slice(5))-1)?`${label} · E recolhe o ovo`:`${label} · vazio; as galinhas alimentadas botam pela manhã`;
  return`${label} · leve a vaca até aqui e use o balde para ordenhar`;
 }
 /** Vaca mais perto do jogador, para a ordenha. */
 private cowNear():InteriorAnimal|undefined{const p=this.player;return this.animals.filter(a=>domesticAnimal(a.id)?.kind==='cow').map(a=>({a,d:Math.hypot(a.brain.x-p.x,a.brain.y-p.y)})).filter(x=>x.d<44).sort((a,b)=>a.d-b.d)[0]?.a;}
 private cowPrompt(a:InteriorAnimal):string{const name=farmAnimalLabel(a.id),c=canMilk(this.state,a.id);return c.ok?`${name} · E ordenha com o balde`:`${name} · ${c.message}`;}
 private updateHUD():void{if(!this.player)return;const f=this.fixtureNear(),site=this.site,count=site?.animals.length??0;
  const sum=site?productionSummary(this.state,site):undefined,cow=this.milking?undefined:this.cowNear();
  const status=sum&&count?` · cocho ${sum.trough}/${sum.capacity} · ${sum.fed}/${count} ${sum.fed===1?'alimentado':'alimentados'} hoje${site!.kind==='coop'?` · ${sum.eggs} ${sum.eggs===1?'ovo':'ovos'} nos ninhos`:` · ${sum.milk} para ordenhar`}`:'';
  const hint=!count?`${this.name} vazio · conduza seus animais até a entrada pelo cercado`:this.animalsShown?`${count} ${count===1?'animal':'animais'} aqui dentro${status}`:`De dia os animais ficam no cercado · use "Recolher os animais" no painel${status}`;
  this.ui.updateHUD({area:'property',worldWeapon:this.state.worldWeapon,toolConditions:this.state.economy6?.tools,learnedRecipes:this.state.villageProgress?.recipes??[],name:this.state.profile.name,day:this.state.day,time:this.state.time,inventory:this.state.inventory,tool:'hand',inHome:true,swimming:false,coins:this.state.villageEconomy?.coins??0,vigor:this.state.villageProgress?.vigor??100,wateringCan:!!this.state.homeSupplies?.wateringCan,wateringCanWater:this.state.wateringCanWater??0,playerTile:{x:this.player.x/32,y:this.player.y/32},interactionKey:this.milking?null:cow||f?'E':null,prompt:this.milking?'Ordenhando…':cow?this.cowPrompt(cow):f?this.fixturePrompt(f.kind,f.label,f.id):hint,location:this.name,harvests:this.state.inventory.turnip,metLia:this.state.metLia,nearWorkbench:false,sheltered:true,shelterReason:this.name,resourceProgress:'',farmingProgress:this.farming.progress,progress:this.state.progress});this.ui.updateCameraZoom(this.shownZoom,!this.paused);}
 private interact():void{if(this.paused||this.leaving||this.milking||this.ui.isModalOpen())return;
  const cow=this.cowNear();if(cow){this.startMilking(cow);return;}
  const f=this.fixtureNear();if(!f)return;
  if(f.kind==='trough'){const r=fillTrough(this.state,this.siteId,saveGame);this.ui.toast(r.message);if(r.ok){gameAudio.play('plant');this.refreshFixtures();}return;}
  if(f.kind==='nest'){const r=collectEgg(this.state,this.siteId,Number(f.id.slice(5))-1,saveGame);this.ui.toast(r.message);if(r.ok){gameAudio.play('pickup');this.refreshFixtures();}return;}
  this.ui.toast(this.fixturePrompt(f.kind,f.label,f.id));
 }
 private startMilking(cow:InteriorAnimal):void{
  const c=canMilk(this.state,cow.id);if(!c.ok){this.ui.toast(c.message);return;}
  const side=this.player.x<cow.brain.x?-1:1,pail=this.add.image(cow.brain.x+side*14,cow.brain.y+6,'interior-milk-pail').setOrigin(.5,1).setDepth(cow.brain.y+1);pail.setScale(14/pail.height);
  this.milking={animal:cow,left:MILKING_SECONDS,pail};gameAudio.play('water');
 }
 private stopMilking():void{this.milking?.pail.destroy();this.milking=undefined;}
 private updateMilking(dt:number):void{const m=this.milking;if(!m)return;m.left-=dt;m.pail.y=m.animal.brain.y+6+Math.round(Math.sin(m.left*18));if(m.left>0)return;
  this.stopMilking();const r=milkCow(this.state,this.siteId,m.animal.id,saveGame);this.ui.toast(r.message);if(r.ok)gameAudio.play('pickup');this.refreshBadges();}
 private key(e:KeyboardEvent):void{if(e.repeat||this.leaving)return;if(e.target instanceof HTMLElement&&e.target.matches('input,textarea,select,[contenteditable="true"]'))return;const k=e.key.toLowerCase();if(k==='escape'){e.preventDefault();this.ui.togglePause();return;}if(k==='i'){this.ui.toggleInventory(this.state.inventory);return;}if(k==='c'){this.ui.toggleCrafting(this.state.inventory,false);return;}if(this.paused||this.ui.isModalOpen())return;if(k==='e')this.interact();if(e.key>='1'&&e.key<='9')this.ui.activateSlot(Number(e.key)-1);if(['+','=','-','_','Home'].includes(e.key))this.changeCameraZoom(e.key==='Home'?0:e.key==='-'||e.key==='_'?-1:1);}
 private wheel=(_p:Phaser.Input.Pointer,_objects:unknown,_dx:number,dy:number)=>{if(!this.paused&&!this.ui.isModalOpen()&&Math.abs(dy)>5)this.changeCameraZoom(dy>0?-1:1);};
 private get shownZoom(){const s=interiorSize(this.layout);return mapCameraZoom(this.zoom,this.scale.width,this.scale.height,s.width,s.height);}
 private applyCamera=()=>{if(!this.layout||!this.player)return;this.cameras.main.setZoom(2*this.shownZoom).startFollow(this.player,true,.12,.12).setRoundPixels(true);this.ui?.updateCameraZoom(this.shownZoom,!this.paused);};
 changeCameraZoom(d:-1|0|1):void{if(this.paused)return;this.zoom=stepCameraZoom(this.shownZoom,d);saveCameraZoom(this.zoom);this.applyCamera();}
 setPaused(v:boolean):void{this.paused=v;this.input.keyboard?.resetKeys();if(v)this.persist();}
 selectTool(_tool:Tool):void{this.ui.toast('Ferramentas ficam para fora. Aqui dentro, cuide dos animais.');}
 craftRecipe(id:string):void{const r=craftInField(this.state,id,saveGame);this.ui.toast(r.message);this.updateHUD();this.ui.refreshCrafting(this.state.inventory,false);}
 async useVillageItem(item:ItemId):Promise<void>{const r=consumeInField(this.state,item,saveGame);this.ui.toast(r.message);this.updateHUD();}
 openMapEditor():void{this.ui.toast('O editor de mapa fica disponível na propriedade.');}
 async captureMap():Promise<string>{const s=interiorSize(this.layout),rt=this.make.renderTexture({width:s.width,height:s.height},false);this.children.depthSort();rt.draw(this.children.list.filter(o=>'visible'in o&&o.visible));return new Promise(resolve=>rt.snapshot(img=>{const url=img instanceof HTMLImageElement?img.src:'';rt.destroy();resolve(url);}));}
 persist():boolean{return this.save();}
 /** Fora da cena, o jogador conta como estando na porta, do lado de fora. */
 private snapshotState():SaveData{const site=this.site;this.state.activeArea='property';delete this.state.homePosition;if(site){const out=farmDoorExit(site);this.state.player={x:out.x,y:out.y,direction:out.direction};}this.state.quickbar=this.ui.getQuickbar();this.state.crops=this.farming.crops.map(c=>({...c}));return this.state;}
 private save=():boolean=>!!this.player&&!this.leaving&&saveGame(this.snapshotState());
 private blur=()=>{this.input.keyboard?.resetKeys();};
 private visibility=()=>{if(document.hidden){this.blur();this.persist();}};
 mainMenu():void{this.ui.closeModal();this.leave(true);}
 private leave(title=false):void{if(this.leaving)return;const next=structuredClone(this.snapshotState());if(!saveGame(next)){this.ui.toast('Não foi possível salvar. A saída foi cancelada.');return;}this.leaving=true;this.cameras.main.fadeOut(SCENE_FADE_MS);this.time.delayedCall(SCENE_FADE_MS,()=>{this.scene.stop();this.onReturn(next,title);});}
 update(_time:number,ms:number):void{
  if(!this.player||this.leaving||!this.layout)return;if(this.paused||this.ui.isModalOpen()||document.hidden)return;
  const dt=Math.min(.1,ms/1000),before={x:this.player.x,y:this.player.y};this.player.speedMultiplier=this.state.inventory.boots>0?1.08:1;
  if(this.milking)this.updateMilking(dt);else this.player.update(dt,this.blockedTile,this.blocked,true);this.player.sprite.setDepth(this.player.y);
  if(this.passage.update(before,this.player,interiorExit(this.layout))){this.leave();return;}
  this.farming.update(dt,this.state.day);Object.assign(this.state,advanceClock(this.state,dt*GAME_MINUTES_PER_SECOND));this.state.crops=this.farming.crops;advanceBackgroundVillage(this.state,dt,this.player,this.bentoRuntime);
  if(processAnimalProduction(this.state)){this.refreshFixtures();this.refreshBadges();}
  this.syncAnimals();const brains=this.animals.map(a=>a.brain);
  for(const a of this.animals){if(this.milking?.animal!==a)a.brain.update(dt,this.player,brains);a.badge?.setPosition(a.brain.x,a.brain.y-40+Math.round(Math.sin(this.elapsed*4)*2)).setDepth(a.brain.y+60);a.shadow.setPosition(a.brain.x,a.brain.y).setDepth(a.brain.y-.2);if(!updateAnimalSprite(a.sprite,a.brain,dt))a.sprite.setPosition(a.brain.x,a.brain.y).setDepth(a.brain.y).setFlipX(a.brain.direction.includes('left'));}
  this.updateHUD();this.elapsed+=dt;if(this.elapsed>=5){this.elapsed=0;this.persist();}
 }
}
export const farmAnimalLabel=(id:string)=>{const d=domesticAnimal(id);return d?ANIMAL_NAMES[d.kind]:'Animal';};
