import {equipWorldSword,ownsWorldSword} from '../systems/world-sword';
import {swordIcon} from '../data/sword-icon';
import {showSurvivorHelp} from '../survivor-dialog';
import {CampCombatArt,preloadCampCombat} from '../camp-combat-art';
import {campStrike,campSegmentClear} from '../systems/survivor-combat';
import Phaser from 'phaser';
import type {SaveData,Tool,ItemId} from '../types';
import type {GameUI} from '../ui';
import {Player} from '../player';
import {survivorTexture} from '../survivor-sprites';
import {survivorLook,survivorWalkFrame} from '../data/survivor-looks';
import {Daylight} from '../daylight';
import {gameAudio} from '../audio';
import {setupTreeWind} from '../tree-wind';
import {saveGame} from '../systems/save';
import {advanceClock,GAME_MINUTES_PER_SECOND} from '../systems/clock';
import {advanceBackgroundVillage} from '../systems/village-background';
import {Farming} from '../systems/farming';
import {craftInField,consumeInField} from '../systems/field-inventory';
import {emptyQuickbar} from '../systems/quickbar';
import {MapExitPassage,SCENE_FADE_MS} from '../systems/map-transition';
import {directionFromVector,directionVector} from '../character-directions';
import {loadCameraZoom,saveCameraZoom,stepCameraZoom} from '../camera-zoom';
import {installWorldCompanion} from '../dungeons/world-pet-controller';
import {preloadPetArt} from '../dungeons/pet-sprites';
import {SurvivorCampWorld,preloadSurvivorCamp} from '../survivor-camp-world';
import {CAMP_ENTRY,CAMP_EXIT} from '../data/survivor-camp';
import {FOREST_CAMP_RETURN} from '../data/forest-camp-access';
import {ensureSurvivorCamp,advanceSurvivorCamp,advanceHostileWarning,recruitCampVisitor,type CampPerson} from '../systems/survivor-camp';
import {DEVELOPMENT_TOOLS} from '../development-tools';
interface CampStart {save:SaveData;ui:GameUI;onReturn:(save:SaveData,title?:boolean)=>void}
export class SurvivorCampScene extends Phaser.Scene {
 private state!:SaveData;
 private ui!:GameUI;
 private player!:Player;
 private world!:SurvivorCampWorld;
 private daylight!:Daylight;
 private farming!:Farming;
 private onReturn!:CampStart['onReturn'];
 private paused=false;
 private leaving=false;
 private zoom=1;
 private elapsed=0;
 private combatArt!:CampCombatArt;
 private attackCooldown=0;
 private enemyCooldown=0;
 private passage=new MapExitPassage();
 private actors=new Map<string,{sprite:Phaser.GameObjects.Sprite;label:Phaser.GameObjects.Text;distance:number;cycle:number}>();
 constructor(){super('Acampamento');}
 preload():void{preloadSurvivorCamp(this);preloadPetArt(this);preloadCampCombat(this);}
 getFishingState():SaveData{return this.state;}
 create(data:CampStart):void {
  this.state=structuredClone(data.save);this.state.activeArea='survivorCamp';delete this.state.homePosition;delete this.state.merchantInterior;delete this.state.blacksmithInterior;
  this.ui=data.ui;this.onReturn=data.onReturn;this.paused=false;this.leaving=false;this.elapsed=this.attackCooldown=this.enemyCooldown=0;this.passage.reset();this.actors.clear();gameAudio.setScene('game');setupTreeWind(this);
  this.combatArt=new CampCombatArt(this);ensureSurvivorCamp(this.state);this.world=new SurvivorCampWorld(this,this.state.survivorCampMapEdits);this.farming=new Farming(this.state.crops,this.state.preparedSoil,this.state.farmingProgress,this.state.restoredFarmSoil);
  const p=this.state.survivorCampPosition,entry=this.state.survivorCampMapEdits?.points?.entry??CAMP_ENTRY,valid=p&&!this.world.blockedPoint(p.x,p.y);
  this.player=new Player(this,this.state.profile,valid?p.x:(entry.x+.5)*32,valid?p.y:(entry.y+.5)*32,'survivor-camp-player');this.player.facing=directionVector(valid?p.direction??'up':'up');this.player.update(0,this.blockedTile,this.blockedPoint,false);
  this.daylight=new Daylight(this,3072,2304);this.zoom=loadCameraZoom();this.cameras.main.setBounds(0,0,3072,2304);this.applyCamera();this.cameras.main.fadeIn(SCENE_FADE_MS);
  this.ui.showHUD('survivorCamp');document.querySelector<HTMLElement>('#ui')!.style.display='';this.ui.setQuickbar(this.state.quickbar??emptyQuickbar());this.updateHUD();this.renderPeople();
  this.input.keyboard!.on('keydown',this.key,this);this.input.on('wheel',this.wheel,this);this.input.on('pointerdown',this.pointer,this);this.scale.on('resize',this.applyCamera,this);
  window.addEventListener('pagehide',this.save);window.addEventListener('beforeunload',this.save);window.addEventListener('blur',this.blur);document.addEventListener('visibilitychange',this.visibility);
  this.events.once('shutdown',()=>{this.combatArt.destroy();this.world.destroy();this.daylight.destroy();this.actors.forEach(a=>{a.sprite.destroy();a.label.destroy();});this.actors.clear();this.input.keyboard?.off('keydown',this.key,this);this.input.off('wheel',this.wheel,this);this.input.off('pointerdown',this.pointer,this);this.scale.off('resize',this.applyCamera,this);window.removeEventListener('pagehide',this.save);window.removeEventListener('beforeunload',this.save);window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);});
  installWorldCompanion(this,()=>({save:this.state,player:this.player,area:'survivorCamp',space:'outdoors',blockedPoint:this.blockedPoint,enabled:true,canMove:!this.paused&&!this.leaving&&!this.ui.isModalOpen()&&!document.hidden}),this.ui,()=>this.persist());this.persist();
 }
 private people():CampPerson[]{const c=this.state.survivorCamp!;return[...c.members,...c.residents].filter(p=>p.status!=='gone'&&(p.area??'survivorCamp')==='survivorCamp'&&!p.homeInside);}
 private nearest():CampPerson|undefined{return this.people().filter(p=>Math.hypot(p.x-this.player.x,p.y-this.player.y)<85).sort((a,b)=>Math.hypot(a.x-this.player.x,a.y-this.player.y)-Math.hypot(b.x-this.player.x,b.y-this.player.y))[0];}
 private renderPeople():void {
  const ids=new Set<string>();for(const p of this.people()){
   ids.add(p.id);let actor=this.actors.get(p.id);
   if(!actor){const texture=survivorTexture(this,survivorLook(p.character,p.name));actor={sprite:this.add.sprite(p.x,p.y,texture,0).setOrigin(.5,1).setDisplaySize(48,64),label:this.add.text(p.x,p.y-67,p.name,{fontSize:'12px',fontFamily:'Georgia',color:'#f6efd8',backgroundColor:'#243b2bd9',padding:{x:5,y:3}}).setOrigin(.5,1),distance:p.distance,cycle:0};this.actors.set(p.id,actor);}
   const moving=p.distance>actor.distance+.001;actor.cycle=moving?(actor.cycle+p.distance-actor.distance)%48:0;actor.distance=p.distance;actor.sprite.setPosition(p.x,p.y).setDepth(p.y).setFrame(survivorWalkFrame(survivorLook(p.character,p.name),p.direction,actor.cycle,moving));
   const hostile=this.state.survivorCamp!.kind==='hostile'&&!this.state.survivorCamp!.residents.includes(p);actor.label.setPosition(p.x,p.y-65).setText(p.name+(p.status==='resident'?' · aliado':hostile?' · hostil':'')).setDepth(p.y+2).setVisible(Math.hypot(p.x-this.player.x,p.y-this.player.y)<220);
  }
  for(const[id,a]of this.actors)if(!ids.has(id)){a.sprite.destroy();a.label.destroy();this.actors.delete(id);}
 }
 private blockedPoint=(x:number,y:number)=>this.world.blockedPoint(x,y)||this.people().some(p=>Math.abs(p.x-x)<10&&Math.abs(p.y-y)<6);
 private blockedTile=(x:number,y:number)=>this.world.blockedPoint((x+.5)*32,(y+.5)*32);
 private updateHUD():void {
  const c=this.state.survivorCamp!,near=this.nearest(),hostile=c.kind==='hostile'&&!!near&&c.members.some(p=>p.id===near.id);
  this.ui.updateHUD({worldWeapon:this.state.worldWeapon,area:'survivorCamp',name:this.state.profile.name,day:this.state.day,time:this.state.time,inventory:this.state.inventory,tool:'hand',inHome:false,coins:this.state.villageEconomy?.coins??0,vigor:this.state.villageProgress?.vigor??100,wateringCan:!!this.state.homeSupplies?.wateringCan,wateringCanWater:this.state.wateringCanWater??0,learnedRecipes:this.state.villageProgress?.recipes??[],toolConditions:this.state.economy6?.tools,playerTile:{x:this.player.x/32,y:this.player.y/32},interactionKey:near?'E':null,prompt:near?hostile?c.aggressive?'E · Defender-se · afaste-se para recuar':'Grupo hostil · mantenha distância':`E · Conversar com ${near.name}`:`${this.state.worldWeapon==='sword'?'Espada equipada':'Desarmado'} · Q equipamento · ${c.residents.length}/8 moradores da vila · ${c.members.every(p=>p.status==='gone')?'aguardando novos visitantes':c.kind==='hostile'?'grupo hostil nas proximidades':'visitantes no acampamento'}`,location:'Acampamento de Sobreviventes',harvests:this.state.inventory.turnip,metLia:this.state.metLia,nearWorkbench:false,sheltered:false,shelterReason:'',resourceProgress:'',farmingProgress:this.farming.progress,progress:this.state.progress});this.ui.updateCameraZoom(this.zoom,!this.paused);
 }
 private showPerson(p:CampPerson):void {
  const c=this.state.survivorCamp!;if(c.kind==='hostile'&&c.members.includes(p)){if(c.aggressive){this.defend(p);return;}this.warning();return;}
  if(p.status==='resident'){showSurvivorHelp(this.ui,this.state,p.id,saveGame,()=>this.updateHUD());return;}
  this.ui.showSceneEditor(host=>{
   const panel=document.createElement('section');panel.className='panel camp-dialog';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',p.name);
   panel.innerHTML=`<div class="modal-heading"><div><span class="eyebrow">ACAMPAMENTO DE SOBREVIVENTES</span><h2 data-camp-name></h2></div><button class="icon-button" data-close aria-label="Fechar conversa">×</button></div><p>${p.status==='resident'?'Agora faço parte do seu grupo. Vou morar na casa comunitária da vila.':'Chegamos procurando um lugar seguro. Você aceita mais alguém no seu grupo?'}</p><p class="camp-dialog-details">${c.residents.length}/8 moradores da casa comunitária · novos grupos a cada três dias.</p><div class="pause-actions">${p.status!=='resident'&&p.status!=='leaving'?'<button class="button button-primary" data-recruit>Convidar para o grupo</button>':''}<button class="button button-light" data-close>Até mais</button></div><p data-feedback role="status"></p>`;
   host.append(panel);panel.querySelector('[data-camp-name]')!.textContent=p.name;panel.querySelectorAll<HTMLButtonElement>('[data-close]').forEach(b=>b.onclick=()=>this.ui.closeModal());panel.querySelector<HTMLButtonElement>('[data-recruit]')?.addEventListener('click',()=>{const result=recruitCampVisitor(this.state,p.id,saveGame);if(result.ok){this.ui.closeModal();this.ui.toast(result.message);this.renderPeople();this.updateHUD();showSurvivorHelp(this.ui,this.state,p.id,saveGame,()=>this.updateHUD());}else panel.querySelector('[data-feedback]')!.textContent=result.message;});panel.querySelector<HTMLButtonElement>('button')!.focus();return()=>panel.remove();
  });
 }
 private warning():void {
  const camp=this.state.survivorCamp!;camp.warned=true;camp.warningGrace=5;this.persist();
  this.ui.showSceneEditor(host=>{const panel=document.createElement('section');panel.className='panel camp-dialog';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Aviso do grupo hostil');panel.innerHTML='<span class="eyebrow">VOZES ENTRE AS BARRACAS</span><h2>Não dê mais um passo.</h2><p>Este grupo não quer companhia. Você pode recuar pelo acesso da floresta. Se avançar ou continuar aqui após o aviso, eles atacarão. Você tem alguns segundos para se afastar.</p><div class="pause-actions"><button class="button button-primary" data-retreat>Vou recuar</button><button class="button button-light" data-fight>Não vou sair</button></div>';
   host.append(panel);panel.querySelector<HTMLButtonElement>('[data-retreat]')!.onclick=()=>this.ui.closeModal();panel.querySelector<HTMLButtonElement>('[data-fight]')!.onclick=()=>{camp.aggressive=true;this.persist();this.ui.closeModal();};panel.querySelector<HTMLButtonElement>('[data-retreat]')!.focus();return()=>panel.remove();});
 }
 private defend(p:CampPerson):void {
  if(this.attackCooldown>0||p.hp<=0)return;
  if((this.state.villageProgress?.vigor??0)<=0){this.ui.toast('Você está exausto. Recue para a floresta e recupere o vigor.');return;}
  const angle=Math.atan2(p.y-this.player.y,p.x-this.player.x),strike=campStrike(this.state,this.player,angle,this.world.blockedPoint);if(!strike.cooldown)return;this.attackCooldown=strike.cooldown;
  if(strike.effect){this.combatArt.swing(strike.effect);gameAudio.play('sword-swing');}else gameAudio.play('combat-hit');
  for(const id of strike.hit){const sprite=this.actors.get(id)?.sprite;if(sprite){sprite.setTint(0xff8b70);this.time.delayedCall(140,()=>{if(sprite.active)sprite.clearTint();});}}
  if(strike.hit.length)gameAudio.play('combat-hit');this.persist();this.updateHUD();
 }
 private equipment():void {
  const owned=ownsWorldSword(this.state),equipped=owned&&this.state.worldWeapon==='sword';
  this.ui.showSceneEditor(host=>{const panel=document.createElement('section');panel.className='panel camp-dialog';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Equipamento de defesa');
   panel.innerHTML=`<span class="eyebrow">DEFESA NO ACAMPAMENTO</span><h2>Equipamento</h2><div class="camp-sword-summary">${swordIcon('camp-sword-icon')}<div><h3>Espada improvisada</h3><p>${equipped?'Equipada':owned?'Disponível na mochila':'Fabrique na bancada da propriedade'}</p></div></div><p>${owned?'Usa o mesmo corte frontal e o mesmo visual da espada das expedições. E ou clique ataca os hostis próximos.':'Você precisa de 2 lâminas de sucata, 1 cabo e 1 corda. Leve o martelo até a bancada e abra a fabricação com C.'}</p><div class="pause-actions"><button class="button button-primary" data-sword ${owned?'':'disabled'}>Equipar espada</button><button class="button button-light" data-unarmed>Guardar espada</button><button class="button button-light" data-close>Voltar</button></div><p data-equipment-feedback role="status"></p>`;
   host.append(panel);for(const[selector,equip]of [['[data-sword]',true],['[data-unarmed]',false]] as const)panel.querySelector<HTMLButtonElement>(selector)!.onclick=()=>{const result=equipWorldSword(this.state,equip,saveGame);if(!result.ok){panel.querySelector('[data-equipment-feedback]')!.textContent=result.message;return;}this.ui.closeModal();this.ui.toast(result.message);this.updateHUD();};panel.querySelector<HTMLButtonElement>('[data-close]')!.onclick=()=>this.ui.closeModal();panel.querySelector<HTMLButtonElement>(owned?'[data-sword]':'[data-close]')!.focus();return()=>panel.remove();});
 }
 private key(e:KeyboardEvent):void {if(e.repeat||this.leaving)return;const target=e.target;if(e.key!=='Escape'&&target instanceof HTMLElement&&target.matches('input,textarea,select,[contenteditable="true"]'))return;const key=e.key.toLowerCase();if(key==='escape'){e.preventDefault();this.ui.togglePause();return;}if(key==='i'){this.ui.toggleInventory(this.state.inventory);return;}if(key==='m'){void this.ui.toggleMap();return;}if(key==='c'){this.ui.toggleCrafting(this.state.inventory,false);return;}if(DEVELOPMENT_TOOLS&&e.key==='F2'){this.openMapEditor();return;}if(this.paused||this.ui.isModalOpen())return;if(key==='q'){this.equipment();return;}if(key==='e'){const p=this.nearest();if(p)this.showPerson(p);}if(e.key>='1'&&e.key<='9')this.ui.activateSlot(Number(e.key)-1);if(['+','=','-','_','Home'].includes(e.key))this.changeCameraZoom(e.key==='Home'?0:e.key==='-'||e.key==='_'?-1:1);}
 private pointer=(pointer:Phaser.Input.Pointer)=>{if(pointer.button===0&&!this.paused&&!this.ui.isModalOpen()){const p=this.nearest();if(p)this.showPerson(p);}};
 private wheel=(_pointer:Phaser.Input.Pointer,_objects:unknown,_dx:number,dy:number)=>{if(!this.paused&&!this.ui.isModalOpen()&&Math.abs(dy)>5)this.changeCameraZoom(dy>0?-1:1);};
 private applyCamera=()=>{this.cameras.main.setZoom(2*this.zoom).startFollow(this.player,true,.12,.12).setRoundPixels(true);};
 changeCameraZoom(direction:-1|0|1):void{if(this.paused)return;this.zoom=stepCameraZoom(this.zoom,direction);saveCameraZoom(this.zoom);this.applyCamera();this.ui.updateCameraZoom(this.zoom,true,true);}
 setPaused(value:boolean):void{this.paused=value;this.input.keyboard?.resetKeys();if(value)this.persist();}
 selectTool(tool:Tool):void{if(tool==='hand')return;this.ui.toast('Mãos livres para conversar · E para se defender de agressores.');}
 craftRecipe(id:string):void{const result=craftInField(this.state,id,saveGame);this.ui.toast(result.message);this.updateHUD();this.ui.refreshCrafting(this.state.inventory,false);}
 async useVillageItem(item:ItemId):Promise<void>{const result=consumeInField(this.state,item,saveGame);this.ui.toast(result.message);this.updateHUD();}
 async captureMap():Promise<string>{const rt=this.make.renderTexture({width:960,height:720},false);rt.camera.setZoom(960/3072).setScroll(0,0).setOrigin(0,0);this.children.depthSort();rt.draw(this.children.list.filter(o=>o!==this.player.sprite&&!this.daylight.contains(o)&&'visible'in o&&o.visible));return new Promise(resolve=>rt.snapshot(image=>{const url=image instanceof HTMLImageElement?image.src:'';rt.destroy();resolve(url);}));}
 openMapEditor():void{if(!DEVELOPMENT_TOOLS||this.leaving||this.ui.isModalOpen())return;this.persist();this.setPaused(true);const original=structuredClone(this.state);this.ui.showMapEditorMode();this.scene.setVisible(false);this.scene.pause();this.scene.launch('Editor',{save:original,area:'survivorCamp',onClose:(updated:SaveData|undefined)=>{this.scene.resume();this.scene.setVisible(true);this.scene.restart({save:updated??original,ui:this.ui,onReturn:this.onReturn});}});}
 mainMenu():void{this.ui.closeModal();this.leave(true);}
 persist():boolean {return this.save();}
 private save=():boolean=>{if(!this.player||this.leaving)return true;this.state.survivorCampPosition={x:this.player.x,y:this.player.y,direction:directionFromVector(this.player.facing.x,this.player.facing.y)};this.state.quickbar=this.ui.getQuickbar();this.state.crops=this.farming.crops.map(c=>({...c}));return saveGame(this.state);};
 private blur=()=>this.input.keyboard?.resetKeys();
 private visibility=()=>{if(document.hidden){this.blur();this.persist();}};
 private leave(title=false):void {if(this.leaving)return;this.persist();this.leaving=true;if(!title){this.state.activeArea='forest';this.state.forestPosition={x:(FOREST_CAMP_RETURN.x+.5)*32,y:(FOREST_CAMP_RETURN.y+.5)*32,direction:'down'};}saveGame(this.state);this.cameras.main.fadeOut(SCENE_FADE_MS);this.time.delayedCall(SCENE_FADE_MS,()=>{const state=structuredClone(this.state);this.scene.stop();this.onReturn(state,title);});}
 update(time:number,ms:number):void {
  if(!this.player)return;this.daylight.update(this.state.time,false,this.state.day);this.world.update(time);
  if(this.paused||this.leaving||this.ui.isModalOpen()||document.hidden){this.combatArt.update(0);this.renderPeople();return;}
  const dt=Math.min(.1,ms/1000);this.combatArt.update(dt);const before={x:this.player.x,y:this.player.y};this.player.speedMultiplier=this.state.inventory.boots>0?1.08:1;this.player.update(dt,this.blockedTile,this.blockedPoint,true);this.player.sprite.setDepth(this.player.y);
  if(this.passage.update(before,this.player,this.state.survivorCampMapEdits?.points?.exit??CAMP_EXIT,this.state.survivorCampMapEdits?.points?.entry??CAMP_ENTRY)){this.leave();return;}
  Object.assign(this.state,advanceClock(this.state,dt*GAME_MINUTES_PER_SECOND));this.farming.update(dt);this.state.crops=this.farming.crops;advanceBackgroundVillage(this.state,dt);advanceSurvivorCamp(this.state,dt,this.player);this.renderPeople();
  const c=this.state.survivorCamp!,enemies=c.members.filter(p=>p.status!=='gone'&&p.status!=='leaving'&&p.hp>0),near=enemies.find(p=>Math.hypot(p.x-this.player.x,p.y-this.player.y)<210);
  if(c.kind==='hostile'&&near&&!c.warned){this.warning();return;}
  const nearestEnemy=enemies.reduce((best,p)=>Math.min(best,Math.hypot(p.x-this.player.x,p.y-this.player.y)),Infinity);advanceHostileWarning(c,dt,nearestEnemy,near?Math.hypot(near.x-this.player.x,near.y-this.player.y)<Math.hypot(near.x-before.x,near.y-before.y)-.05:false);
  this.enemyCooldown=Math.max(0,this.enemyCooldown-dt);this.attackCooldown=Math.max(0,this.attackCooldown-dt);
  if(c.aggressive&&this.enemyCooldown===0&&enemies.some(p=>Math.hypot(p.x-this.player.x,p.y-this.player.y)<36&&campSegmentClear(p,this.player,this.world.blockedPoint))&&this.state.villageProgress!.vigor>0){this.enemyCooldown=1.2;this.state.villageProgress!.vigor=Math.max(0,this.state.villageProgress!.vigor-8);gameAudio.play('combat-hit');this.player.sprite.setTint(0xff8877);this.time.delayedCall(130,()=>{if(this.player.sprite.active)this.player.sprite.clearTint();});this.cameras.main.shake(90,.002);this.ui.toast('Você foi atingido · recue ou use E para se defender.');}
  for(const tree of this.world.trees)tree.setAlpha(this.player.y<tree.y&&Math.abs(this.player.x-tree.x)<65&&this.player.y>tree.y-170?.42:1);
  this.elapsed+=dt;this.updateHUD();if(this.elapsed>=5){this.elapsed=0;this.persist();}
 }
}
