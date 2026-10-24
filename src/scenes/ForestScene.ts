import {AnimalPopulation} from '../animals';
import {startAnimalEscort,releaseAnimalEscort,transferAnimalEscort} from '../systems/animals';
import {sampleWaterDepth} from '../swimming/config';
import {ResourceLifecycle} from '../resource-lifecycle';
import {Resources,RESOURCE_DEFINITIONS} from '../systems/resources';
import {Inventory} from '../systems/inventory';
import {craft} from '../systems/crafting';
import {ToolUse} from '../systems/tool-use';
import {ToolVisual} from '../tool-visual';
import type {ResourceNode} from '../types';
import type {MapEditorScene} from './MapEditorScene';
import {ForestWorld} from '../forest-world';
import {atMapExit} from '../data/default-maps';
import { emptyQuickbar } from '../systems/quickbar';
import { MapEditor } from '../map-editor';
import Phaser from 'phaser';
import { Player,PLAYER_SPEED } from '../player';
import type { SaveData, Tool } from '../types';
import type { GameUI } from '../ui';
import { saveGame } from '../systems/save';
import { advanceClock, GAME_MINUTES_PER_SECOND } from '../systems/clock';
import { Farming } from '../systems/farming';
import { directionFromVector, directionVector } from '../character-directions';
import { setupAnimalArt } from '../forest-art';
import { FOREST_ANIMALS, FOREST_ENTRY,  forestWater, ANIMAL_NAMES } from '../data/ancient-forest';
import { gameAudio } from '../audio';
import { loadCameraZoom, saveCameraZoom, stepCameraZoom } from '../camera-zoom';

export interface ForestStart { save: SaveData; ui: GameUI; onReturn: (save: SaveData, title?: boolean) => void }
export class ForestScene extends Phaser.Scene {
  private state!: SaveData;
  private resources!:Resources;
  private resourceLifecycle?:ResourceLifecycle;
  private toolUse=new ToolUse();
  private toolVisual?:ToolVisual;
  private player!: Player;
  private farming!: Farming;
  private onReturn!: ForestStart['onReturn'];
  private ui!:GameUI;
  private world!:ForestWorld;
  private get trees(){return this.world.trees;}
  private wildlife?:AnimalPopulation;
  private get animals(){return this.wildlife?.animals??[];}
  private paused=false;
  private leaving=false;
  private zoom=1;
  private elapsed=0;
  private hudElapsed=0;
  get mapEditor():MapEditor|undefined{return this.scene.isActive('Editor')?(this.scene.get('Editor') as MapEditorScene).editor:undefined;}
  private get solid(){return this.world.solid;}
  private get edits(){return this.world.edits;}
  private movementBlockedAt=(x:number,y:number):boolean=>x<1||y<1||x>=95||y>=71||this.solid.has(`${x},${y}`);
  private waterContains=(x:number,y:number):boolean=>{const terrain=this.edits?.terrain[`${Math.floor(x/32)},${Math.floor(y/32)}`];return terrain?terrain==='water':forestWater(x/32-.5,y/32-.5);};
  private swimmingPoint=(x:number,y:number):number=>sampleWaterDepth(this.waterContains,x,y);
  private entry(){return this.edits?.points?.entry??FOREST_ENTRY;}
  private exit(){return this.edits?.points?.exit??{x:48,y:69};}
  constructor(){super('Floresta');}

  create(data:ForestStart):void {
    this.ui=data.ui;this.state=structuredClone(data.save);this.state.activeArea='forest';this.onReturn=data.onReturn;
    this.paused=false;this.leaving=false;this.elapsed=0;this.hudElapsed=0;this.wildlife?.destroy();this.wildlife=undefined;
    this.zoom=loadCameraZoom();this.farming=new Farming(this.state.crops);setupAnimalArt(this);
    this.world=new ForestWorld(this);
    this.world.depleted=new Set(this.state.depletedResources);this.world.rebuildEnvironment(this.state.forestMapEdits);
    this.resources=new Resources(this.state.resourceProgress);this.toolUse=new ToolUse();this.toolVisual=new ToolVisual(this,this.state.profile);
    const p=this.state.forestPosition;
    const valid=p&&!this.movementBlockedAt(Math.floor(p.x/32),Math.floor(p.y/32));
    this.player=new Player(this,this.state.profile,valid?p.x:(this.entry().x+.5)*32,valid?p.y:(this.entry().y+.5)*32,'forest-player');
    this.player.facing=directionVector(valid?p.direction??'up':'up');this.player.update(0,this.movementBlockedAt,undefined,true,this.swimmingPoint);

    this.resetNaturalResources();this.rebuildAnimals();
    this.cameras.main.setBounds(0,0,3072,2304);this.applyCamera();this.cameras.main.fadeIn(300);
    document.querySelector<HTMLElement>('#ui')!.style.display='';this.ui.setQuickbar(this.state.quickbar??emptyQuickbar());this.ui.showHUD('forest');this.updateHUD();
    this.input.keyboard!.on('keydown',this.key,this);this.input.on('wheel',this.wheel,this);
    this.scale.on('resize',this.applyCamera,this);
    window.addEventListener('pagehide',this.save);window.addEventListener('beforeunload',this.save);window.addEventListener('blur',this.blur);
    document.addEventListener('visibilitychange',this.visibility);
    this.events.once('shutdown',()=>{this.wildlife?.destroy();this.wildlife=undefined;this.input.keyboard?.off('keydown',this.key,this);this.input.off('wheel',this.wheel,this);this.scale.off('resize',this.applyCamera,this);window.removeEventListener('pagehide',this.save);window.removeEventListener('beforeunload',this.save);window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);});
    this.save();
  }
  openMapEditor():void {
    if(this.state.animalEscort){this.ui.toast('Leve o animal à propriedade ou solte a corda com G antes de editar.');return;}
    if(this.mapEditor||this.leaving)return;
    this.toolUse.cancel();this.toolVisual?.hide();this.save();const original=structuredClone(this.state);this.paused=true;this.ui.showMapEditorMode();this.player.setVisible(false);this.input.keyboard?.resetKeys();
    this.scene.setVisible(false);this.scene.pause();this.scene.launch('Editor',{save:original,area:'forest',onClose:(updated:SaveData|undefined,area:'property'|'forest')=>{
      this.scene.resume();this.scene.setVisible(true);this.state=updated??original;this.world.depleted=new Set(this.state.depletedResources);this.world.rebuildEnvironment(this.state.forestMapEdits);this.resetNaturalResources();this.rebuildAnimals();this.farming=new Farming(this.state.crops);this.paused=false;
      if(this.movementBlockedAt(Math.floor(this.player.x/32),Math.floor(this.player.y/32))){this.player.x=(this.entry().x+.5)*32;this.player.y=(this.entry().y+.5)*32;}
      this.player.setVisible(true);this.ui.showHUD('forest');this.applyCamera();this.updateHUD();this.input.keyboard?.resetKeys();
      if(updated){this.save();if(area==='property')this.leave();}
    }});
  }
  private animalBlocked=(x:number,y:number):boolean=>this.movementBlockedAt(x,y)||this.waterContains(x*32+16,y*32+16);
  private allowLeashMovement=(x:number,y:number):boolean=>this.wildlife?.allowsPlayerCenter(x,y,this.player)??true;
  private rebuildAnimals():void {this.wildlife?.destroy();this.wildlife=new AnimalPopulation(this,this.state,'forest',this.animalBlocked,PLAYER_SPEED);}
  private releaseRope():void {
    if(!this.state.animalEscort)return;
    if(releaseAnimalEscort(this.state)){this.ui.toast('Animal solto. A corda voltou para você.');this.updateHUD();this.save();}
    else this.ui.toast('Não foi possível guardar a corda.');
  }
  private resetNaturalResources():void {
    this.resourceLifecycle=new ResourceLifecycle(this.state,'forest',this.world,(x,y)=>!this.world.isBlocked(x,y)&&!this.world.resourceAt(x,y)&&Math.hypot(x-this.player.x/32,y-this.player.y/32)>3&&[this.entry(),this.exit(),...FOREST_ANIMALS].every(p=>Math.hypot(x-p.x,y-p.y)>3)&&this.animals.every(a=>Math.hypot(x-a.x/32,y-a.y/32)>2));
    this.resources=new Resources(this.state.resourceProgress);
  }
  private nearestResource():ResourceNode|undefined {return this.world.resources.filter(n=>Math.hypot(n.x*32+16-this.player.x,n.y*32+16-this.player.y)<68).sort((a,b)=>Math.hypot(a.x*32+16-this.player.x,a.y*32+16-this.player.y)-Math.hypot(b.x*32+16-this.player.x,b.y*32+16-this.player.y))[0];}
  private applyCamera():void {
    if(!this.player||this.mapEditor)return;
    this.cameras.main.setBounds(0,0,3072,2304).setZoom(2*this.zoom).startFollow(this.player,false,1,1);
    this.cameras.main.centerOn(this.player.x,this.player.y);
  }
  setPaused(paused:boolean):void {
    if(paused){this.toolUse.cancel();this.toolVisual?.hide();}
    this.paused=paused;this.input.keyboard?.resetKeys();this.ui.updateCameraZoom(this.zoom,!paused&&!this.mapEditor);
    if(paused)this.save();
  }
  selectTool(tool:Tool):void {if(this.player.isSwimming)return;if((tool==='pickaxe'||tool==='hatchet')&&this.state.inventory[tool]<1){this.ui.toast('Fabrique essa ferramenta na propriedade.');return;}this.toolUse.cancel();this.toolVisual?.hide();this.state.equippedTool=tool;this.updateHUD();}
  persist():boolean {return this.save();}
  craftRecipe(id:string):void {
    if(!this.ui.isCraftingOpen())return;
    if(id!=='cord'){this.ui.toast('Volte à propriedade para fabricar esse item.');return;}
    const inventory=new Inventory(this.state.inventory),result=craft(id,inventory,false);
    if(result.ok){Object.assign(this.state.inventory,inventory.data);gameAudio.play('craft');this.updateHUD();this.save();}
    this.ui.toast(result.message);this.ui.refreshCrafting(this.state.inventory,false);
  }
  mainMenu():void {this.ui.closeModal();this.leave(true);}
  changeCameraZoom(direction:-1|0|1):void {
    if(this.paused||this.mapEditor||this.leaving)return;
    this.zoom=stepCameraZoom(this.zoom,direction);saveCameraZoom(this.zoom);this.applyCamera();this.ui.updateCameraZoom(this.zoom,true);
  }
  captureMap():Promise<string> {
    this.updateHUD();
    const texture=this.make.renderTexture({width:960,height:720},false);texture.camera.setZoom(960/3072).setScroll(0,0).setOrigin(0,0);
    this.children.depthSort();texture.draw(this.children.list.filter(o=>o!==this.player.sprite&&'visible' in o&&o.visible));
    return new Promise(resolve=>texture.snapshot(image=>{const url=image instanceof HTMLImageElement?image.src:'';texture.destroy();resolve(url);}));
  }
  private updateHUD():void {
    const nearest=this.nearest(),info=nearest&&FOREST_ANIMALS.find(a=>a.id===nearest.id),node=this.nearestResource();
    this.ui.updateHUD({area:'forest',inHome:false,swimming:this.player.isSwimming,name:this.state.profile.name,day:this.state.day,time:this.state.time,
      inventory:this.state.inventory,tool:this.state.equippedTool??'hand',wateringCan:!!this.state.homeSupplies?.wateringCan,wateringCanWater:this.state.wateringCanWater??0,
      playerTile:{x:this.player.x/32,y:this.player.y/32},interactionKey:this.state.animalEscort&&!this.nearExit()?'G':'E',prompt:this.player.isSwimming?'Nadar · siga até a margem para sair':this.nearExit()?this.state.animalEscort?'Levar animal à propriedade':'Voltar à Propriedade Abandonada':this.state.animalEscort?'Conduzindo animal · siga até a saída · soltar corda':info?'Prender '+ANIMAL_NAMES[info.kind].toLowerCase()+' com corda':node?`${RESOURCE_DEFINITIONS[node.kind].label} · ${RESOURCE_DEFINITIONS[node.kind].tool==='pickaxe'?'use a picareta':RESOURCE_DEFINITIONS[node.kind].tool==='hatchet'?'use a machadinha':'recolher'}`:'Explorar a floresta',
      location:'Floresta Antiga',harvests:this.state.inventory.turnip,metLia:this.state.metLia,nearWorkbench:false,sheltered:false,shelterReason:'',resourceProgress:'',progress:this.state.progress});
    this.ui.updateCameraZoom(this.zoom,!this.paused&&!this.mapEditor);
  }
  private key(e:KeyboardEvent):void {
    if(e.repeat||this.mapEditor)return;
    const target=e.target;if(e.key!=='Escape'&&target instanceof HTMLElement&&target.matches('input,textarea,select,[contenteditable="true"]'))return;
    const key=e.key.toLowerCase();
    if(e.key==='F2'){e.preventDefault();this.openMapEditor();return;}
    if(e.key==='Escape'){e.preventDefault();if(!this.ui.dismissTopToolbar())this.ui.togglePause();return;}
    if(key==='m'){e.preventDefault();this.updateHUD();this.ui.toggleMap();return;}
    if(key==='g'&&!this.paused){e.preventDefault();this.releaseRope();return;}
    if(key==='i'){this.ui.toggleInventory(this.state.inventory);return;}
    if(key==='c'){this.ui.toggleCrafting(this.state.inventory,false);return;}
    if(key==='b'){this.ui.toggleBuilding(this.state.inventory,false);return;}
    if(this.paused)return;
    if(e.key>='1'&&e.key<='9')this.ui.activateSlot(Number(e.key)-1);
    if(e.key==='+'||e.key==='=')this.changeCameraZoom(1);
    else if(e.key==='-'||e.key==='_')this.changeCameraZoom(-1);
    else if(e.key==='Home')this.changeCameraZoom(0);
    else if(key==='e'){e.preventDefault();this.interact();}
  }
  private wheel=(_p:unknown,_objects:unknown,_dx:number,dy:number):void=>{if(!this.paused)this.changeCameraZoom(dy<0?1:-1);};
  private blur=():void=>{if(!this.paused){this.setPaused(true);this.ui.togglePause();}this.save();};
  private visibility=():void=>{if(document.hidden)this.blur();};
  private nearExit():boolean {return atMapExit(this.player.x,this.player.y,this.exit());}
  private nearest(){return this.wildlife?.nearest(this.player);}
  private interact():void {
    if(this.player.isSwimming||this.toolUse.active)return;
    if(this.nearExit()){if(!this.wildlife?.canLeave(this.player)){this.ui.toast('Traga o animal para perto da saída.');return;}this.leave();return;}
    if(this.state.animalEscort){this.ui.toast('Conduza o animal até a propriedade. G solta a corda.');return;}
    const a=this.nearest();if(!a){
      const node=this.nearestResource();if(!node)return;const tool=this.state.equippedTool;
      if(RESOURCE_DEFINITIONS[node.kind].tool!=='hand'&&tool!==RESOURCE_DEFINITIONS[node.kind].tool){this.ui.toast('Equipe a ferramenta indicada.');return;}
      if(tool==='pickaxe'||tool==='hatchet'){
        if(this.state.inventory[tool]<1)return;
        this.player.facing={x:(node.x*32+16-this.player.x)/Math.max(1,Math.hypot(node.x*32+16-this.player.x,node.y*32+16-this.player.y)),y:(node.y*32+16-this.player.y)/Math.max(1,Math.hypot(node.x*32+16-this.player.x,node.y*32+16-this.player.y))};
        this.toolUse.start({tool,direction:directionFromVector(this.player.facing.x,this.player.facing.y),target:{...node}});
      }else this.hitResource(node,tool);
      return;
    }
    if(!startAnimalEscort(this.state,a.brain.snapshot())){this.ui.toast('Fabrique uma corda vegetal com 3 fibras (C) para conduzir o animal.');return;}
    this.toolUse.cancel();this.toolVisual?.hide();gameAudio.play('pickup');
    this.ui.toast('Corda presa! Leve o animal até a propriedade. G para soltar.');this.updateHUD();this.save();
  }
  private hitResource(node:ResourceNode,tool:Tool):void {
    const inventory=new Inventory(this.state.inventory),result=this.resources.hit(node,tool,inventory);
    if(result.ok){Object.assign(this.state.inventory,inventory.data);this.state.resourceProgress=this.resources.progress;if(result.depleted){this.world.removeResource(node.id);if(!this.resourceLifecycle?.collected(node)){this.state.depletedResources.push(node.id);this.world.depleted.add(node.id);}this.state.progress.collected ||=this.state.inventory.wood>0&&this.state.inventory.stone>0&&this.state.inventory.fiber>0;}
      gameAudio.play(tool==='pickaxe'?'stone':tool==='hatchet'?'wood':'pickup');}
    this.ui.toast(result.message);this.updateHUD();this.save();
  }
  private save=():boolean=>{
    if(!this.player||this.leaving||this.mapEditor)return false;
    this.wildlife?.store();
    this.state.quickbar=this.ui.getQuickbar();
    this.state.forestPosition={x:this.player.x,y:this.player.y,direction:directionFromVector(this.player.facing.x,this.player.facing.y)};
    this.state.crops=this.farming.crops.map(c=>({...c}));return saveGame(this.state);
  };
  private leave(title=false):void {
    if(this.leaving)return;this.save();this.leaving=true;
    if(!title){this.state.activeArea='property';this.state.forestPosition=undefined;const entry=this.state.mapEdits?.points?.entry??{x:2,y:52};transferAnimalEscort(this.state,{x:(entry.x+.5)*32,y:(entry.y+.5)*32});}
    saveGame(this.state);this.cameras.main.fadeOut(250);
    this.time.delayedCall(250,()=>{const save=structuredClone(this.state);this.scene.stop();this.onReturn(save,title);});
  }
  update(_time:number,ms:number):void {
    if(!this.player||this.paused||this.leaving||this.mapEditor||document.hidden)return;
    const delta=Math.min(ms/1000,.1);this.player.update(delta,this.movementBlockedAt,undefined,!this.toolUse.active,this.swimmingPoint,this.allowLeashMovement);this.wildlife?.update(delta,this.player);this.farming.update(delta);if(this.player.isSwimming){this.state.equippedTool='hand';this.toolUse.cancel();this.toolVisual?.hide();}
    const strike=this.toolUse.advance(delta);if(strike){const node=this.world.resourceAt(strike.target.x,strike.target.y);if(node?.id===strike.target.id&&!this.player.isSwimming)this.hitResource(node,strike.tool);}
    const active=this.toolUse.current;if(active&&(active.tool==='pickaxe'||active.tool==='hatchet'))this.toolVisual?.show(active.tool,active.direction,this.player.x,this.player.y,this.toolUse);else this.toolVisual?.hide();
    Object.assign(this.state,advanceClock(this.state,delta*GAME_MINUTES_PER_SECOND));
    this.trees.forEach(t=>t.setAlpha(this.player.y<t.y&&Math.abs(this.player.x-t.x)<t.displayWidth*.4&&this.player.y>t.y-t.displayHeight*.85?.42:1));
    this.resourceLifecycle?.tick();
    this.hudElapsed+=delta;if(this.hudElapsed>=.1){this.updateHUD();this.hudElapsed=0;}
    this.elapsed+=delta;
    if(this.elapsed>=5){this.save();this.elapsed=0;}
  }
}
