import Phaser from 'phaser';
import type { SaveData, Tool, ItemId } from '../types';
import type { ForestStart as TrailStart } from './ForestScene';
import type { MapEditorStart } from './MapEditorScene';
import { Player } from '../player';
import { Daylight } from '../daylight';
import { gameAudio } from '../audio';
import { setupTreeWind } from '../tree-wind';
import { SwampWorld, preloadSwamp } from '../swamp-world';
import { SWAMP_SIZE, swampEntry, swampExit, tileCenter, FOREST_SWAMP_RETURN } from '../data/swamp';
import { RuinsWorld, preloadRuins } from '../ruins-world';
import { RUINS_SIZE } from '../data/ruins';
import { CITY_RUINS_RETURN, RUINS_ENTRY, RUINS_EXIT } from '../data/ruins-road';
import { AREA_NAMES } from '../data/area-names';
import { directionFromVector, directionVector } from '../character-directions';
import { sampleWaterDepth } from '../swimming/config';
import { loadCameraZoom, mapCameraZoom, stepCameraZoom, saveCameraZoom } from '../camera-zoom';
import { MapExitPassage, SCENE_FADE_MS } from '../systems/map-transition';
import { exitSignLayout } from '../data/exit-signs';
import { saveGame } from '../systems/save';
import { emptyQuickbar } from '../systems/quickbar';
import { createGroundRuntime } from '../systems/ground-items';
import { createMineMissionRuntime } from '../systems/mine-missions';
import { bentoSceneWriter } from '../systems/bento-commit';
import { Farming } from '../systems/farming';
import { advanceClock, GAME_MINUTES_PER_SECOND } from '../systems/clock';
import { advanceBackgroundVillage } from '../systems/village-background';
import { craftInField, consumeInField } from '../systems/field-inventory';
import { inspectRuins } from '../systems/ruins-discoveries';
import { playerSpeedFactor } from '../systems/food-effects';
import { fishAtBank } from '../fishing-ui';
import { createFishingCast } from '../fishing-cast';
import { DEVELOPMENT_TOOLS } from '../development-tools';
import type { MapEditData } from '../systems/map-editor';

const TRAILS={
  swamp:{scene:'Pantano',map:'swampMapEdits',position:'swampPosition',size:SWAMP_SIZE,
    World:SwampWorld,preload:preloadSwamp,entry:swampEntry,exit:swampExit,
    arrival:'down',returnArea:'forest',returnPosition:'forestPosition',returnTile:FOREST_SWAMP_RETURN,returnFacing:'up',
    returnName:AREA_NAMES.forest,prompt:'A passarela cruza o canal. Siga as trilhas entre as lagoas.'},
  ruins:{scene:'Ruinas',map:'ruinsMapEdits',position:'ruinsPosition',size:RUINS_SIZE,
    World:RuinsWorld,preload:preloadRuins,entry:(edits?:MapEditData)=>edits?.points?.entry??RUINS_ENTRY,
    exit:(edits?:MapEditData)=>edits?.points?.exit??RUINS_EXIT,
    arrival:'right',returnArea:'cityForest',returnPosition:'cityForestPosition',returnTile:CITY_RUINS_RETURN,returnFacing:'left',
    returnName:AREA_NAMES.cityForest,prompt:'A estrada segue a leste. As trilhas do antigo posto ficam ao sul.'},
} as const;

export class TrailScene extends Phaser.Scene {
  private readonly trail:(typeof TRAILS)[keyof typeof TRAILS];
  private state!: SaveData;
  private ui!: TrailStart['ui'];
  private onReturn!: TrailStart['onReturn'];
  private world!: SwampWorld|RuinsWorld;
  readonly movementBlockedPoint=(x:number,y:number)=>this.world.layout.blocked(x,y);
  private readonly tileBlocked=(x:number,y:number)=>this.movementBlockedPoint((x+.5)*32,(y+.5)*32);
  readonly swimmingPoint=(x:number,y:number)=>sampleWaterDepth(this.world.layout.inWater,x,y);
  private readonly allowStep=(x:number,y:number)=>this.world.layout.allowsStep(this.player,{x,y});
  private player!: Player;
  private daylight!: Daylight;
  private farming!: Farming;
  private zoom=1;
  private paused=false;
  private leaving=false;
  private fishing=false;
  private elapsed=0;
  private hudElapsed=0;
  private readonly passage=new MapExitPassage();
  private readonly grounds=createGroundRuntime(
    ()=>this.snapshotState(),saveGame,()=>this.state,()=>this.state.inventory,()=>this.player,()=>this.area,
    (x,y)=>this.movementBlockedPoint(x,y)||this.swimmingPoint(x,y)>0,()=>this.canPlay(),()=>this.updateHUD(),
  );
  private readonly missions=createMineMissionRuntime(()=>this.snapshotState(),saveGame,()=>this.state,()=>this.player);
  private readonly bentoRuntime={missions:this.missions,write:bentoSceneWriter(()=>this.snapshotState(),saveGame)};

  constructor(private readonly area:keyof typeof TRAILS){super(TRAILS[area].scene);this.trail=TRAILS[area];}
  preload():void{this.trail.preload(this);}
  getGroundItemRuntime(){return this.player?this.grounds:undefined;}
  getMineMissionRuntime=()=>this.missions;
  getFishingState=()=>this.state;

  create(data:TrailStart):void {
    this.state=structuredClone(data.save);
    this.state.activeArea=this.area;
    this.ui=data.ui;
    this.onReturn=data.onReturn;
    this.paused=this.leaving=this.fishing=false;
    this.elapsed=this.hudElapsed=0;
    this.passage.reset();
    gameAudio.setScene('game');
    setupTreeWind(this);
    const {width,height}=this.trail.size,edits=this.state[this.trail.map];
    this.world=new this.trail.World(this,edits);
    this.farming=new Farming(this.state.crops,this.state.preparedSoil,this.state.farmingProgress,this.state.restoredFarmSoil);
    const saved=this.state[this.trail.position];
    const valid=saved&&[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!this.movementBlockedPoint(saved.x+dx,saved.y+dy));
    const start=valid?saved:tileCenter(this.trail.entry(edits));
    this.player=new Player(this,this.state.profile,start.x,start.y,this.area+'-player');
    this.player.facing=directionVector(valid?saved.direction??this.trail.arrival:this.trail.arrival);
    this.player.update(0,this.tileBlocked,this.movementBlockedPoint,false,this.swimmingPoint);
    this.daylight=new Daylight(this,width,height);
    this.daylight.update(this.state.time,false,this.state.day);
    this.zoom=loadCameraZoom();
    this.cameras.main.setBounds(0,0,width,height).setBackgroundColor('#3a4129');
    this.applyCamera();
    this.cameras.main.fadeIn(SCENE_FADE_MS);
    this.ui.showHUD(this.area);
    document.querySelector<HTMLElement>('#ui')!.style.display='';
    this.ui.setQuickbar(this.state.quickbar??emptyQuickbar());
    this.updateHUD();
    this.input.keyboard!.on('keydown',this.key,this);
    this.input.on('wheel',this.wheel,this);
    this.scale.on('resize',this.applyCamera);
    window.addEventListener('pagehide',this.persist);
    window.addEventListener('beforeunload',this.persist);
    window.addEventListener('blur',this.blur);
    document.addEventListener('visibilitychange',this.visibility);
    this.events.once('shutdown',()=>{
      this.world.destroy();
      this.daylight.destroy();
      this.input.keyboard?.off('keydown',this.key,this);
      this.input.off('wheel',this.wheel,this);
      this.scale.off('resize',this.applyCamera);
      window.removeEventListener('pagehide',this.persist);
      window.removeEventListener('beforeunload',this.persist);
      window.removeEventListener('blur',this.blur);
      document.removeEventListener('visibilitychange',this.visibility);
    });
    this.persist();
  }

  private canPlay():boolean{
    return !!this.player&&!this.paused&&!this.leaving&&!this.ui.isModalOpen()&&!document.hidden;
  }

  private nearFishing():boolean {
    if(this.player.isSwimming||this.player.mounted)return false;
    return [0,1,2,3,4,5,6,7].some(i=>{
      const angle=i*Math.PI/4;
      return this.world.layout.inWater(this.player.x+Math.cos(angle)*58,this.player.y+Math.sin(angle)*58);
    });
  }

  private equippedFishingItem(): 'net'|'fishingRod'|undefined {
    return this.state.inventory.fishingRod?'fishingRod':this.state.inventory.net?'net':undefined;
  }

  private nearbyLandmark(){
    return this.world instanceof RuinsWorld&&!this.player.isSwimming
      ? this.world.layout.inspectNear(this.player.x,this.player.y) : undefined;
  }

  private updateHUD():void {
    if(!this.player)return;
    const {state,player,trail}=this,edits=state[trail.map],exit=trail.exit(edits),gate=tileCenter(exit);
    const landmark=this.nearbyLandmark();
    const fishing=this.nearFishing()&&!!this.equippedFishingItem();
    const cardinal={up:'norte',down:'sul',left:'oeste',right:'leste'}[exitSignLayout(exit,trail.entry(edits)).direction];
    const prompt=player.isSwimming?'Siga até a margem para sair da água.':
      landmark?`E · Examinar ${landmark.name.toLowerCase()}`:
      Math.hypot(player.x-gate.x,player.y-gate.y)<144?`${trail.returnName} ao ${cardinal}`:
      fishing?'Pescar na margem · E':trail.prompt;
    this.ui.updateHUD({
      area:this.area,name:state.profile.name,day:state.day,time:state.time,
      inventory:state.inventory,itemQuality:state.itemQuality,toolConditions:state.economy6?.tools,
      tool:state.equippedTool??'hand',worldWeapon:state.worldWeapon,learnedRecipes:state.villageProgress?.recipes??[],
      inHome:false,swimming:player.isSwimming,coins:state.villageEconomy?.coins??0,vigor:state.villageProgress?.vigor??100,
      wateringCan:!!state.homeSupplies?.wateringCan,wateringCanWater:state.wateringCanWater??0,
      playerTile:{x:player.x/32,y:player.y/32},interactionKey:landmark||fishing?'E':null,prompt,location:AREA_NAMES[this.area],
      harvests:state.inventory.turnip,metLia:state.metLia,nearWorkbench:false,sheltered:false,shelterReason:'',
      resourceProgress:'',farmingProgress:this.farming.progress,progress:state.progress,
    });
  }

  private key=(event:KeyboardEvent):void=>{
    if(event.repeat||this.leaving||event.target instanceof HTMLElement&&event.target.matches('input,textarea,select,[contenteditable="true"]'))return;
    const key=event.key.toLowerCase();
    if(key==='escape'){event.preventDefault();this.ui.togglePause();return;}
    if(key==='i'){this.ui.toggleInventory(this.state.inventory);return;}
    if(key==='m'){void this.ui.toggleMap();return;}
    if(key==='c'){this.ui.toggleCrafting(this.state.inventory,false);return;}
    if(!this.canPlay())return;
    if(event.key==='F2'&&DEVELOPMENT_TOOLS)this.openMapEditor();
    else if(key==='e'){
      const landmark=this.nearbyLandmark();
      if(landmark){
        const lines=inspectRuins(this.snapshotState(),landmark,saveGame);
        this.updateHUD();
        this.ui.showDialogue(landmark.name,lines,undefined,'inspection');
        return;
      }
      const item=this.equippedFishingItem();
      if(item&&this.nearFishing())void this.useVillageItem(item);
    }else if(/^[1-9]$/.test(event.key))this.ui.activateSlot(Number(event.key)-1);
    else if(['+','=','-','_','Home'].includes(event.key))this.changeCameraZoom(event.key==='Home'?0:['-','_'].includes(event.key)?-1:1);
  };
  private wheel=(_p:Phaser.Input.Pointer,_objects:unknown[],_x:number,deltaY:number):void=>{
    if(this.canPlay()&&Math.abs(deltaY)>5)this.changeCameraZoom(deltaY>0?-1:1);
  };
  private get shownZoom():number{return mapCameraZoom(this.zoom,this.scale.width,this.scale.height,this.trail.size.width,this.trail.size.height);}
  private applyCamera=():void=>{
    this.cameras.main.setZoom(2*this.shownZoom).startFollow(this.player,true,.12,.12).setRoundPixels(true);
    this.ui?.updateCameraZoom(this.shownZoom,!this.paused);
  };
  changeCameraZoom(change:-1|0|1):void {
    if(this.paused)return;
    this.zoom=stepCameraZoom(this.shownZoom,change);
    saveCameraZoom(this.zoom);
    this.applyCamera();
  }
  setPaused(value:boolean):void{this.paused=value;this.blur();if(value)this.persist();}
  private blur=():void=>{this.input.keyboard?.resetKeys();};
  private visibility=():void=>{if(document.hidden){this.blur();this.persist();}};
  selectTool(tool:Tool):void{this.state.equippedTool=tool;this.updateHUD();}
  craftRecipe(id:string):void {
    const result=craftInField(this.state,id,saveGame);
    this.ui.toast(result.message);
    this.updateHUD();
    this.ui.refreshCrafting(this.state.inventory,false);
  }
  async useVillageItem(item:ItemId):Promise<void> {
    if(this.leaving||this.fishing)return;
    if(item!=='fishingRod'&&item!=='net'){
      this.ui.toast(consumeInField(this.state,item,saveGame).message);
      this.updateHUD();return;
    }
    if(!this.nearFishing()){this.ui.toast('Aproxime-se de uma margem livre para pescar.');return;}
    this.fishing=true;
    this.setPaused(true);
    try{
      this.ui.toast(await fishAtBank(this.state,item==='net',()=>this.updateHUD(),
        createFishingCast(this,this.player,this.world.layout.inWater,(x,y)=>!this.movementBlockedPoint(x,y),item==='net')));
    }finally{this.fishing=false;this.setPaused(false);this.updateHUD();}
  }

  captureMap():Promise<string> {
    const rt=this.make.renderTexture({width:this.trail.size.width/3,height:this.trail.size.height/3},false);
    rt.camera.setZoom(1/3).setScroll(0,0).setOrigin(0,0);
    this.children.depthSort();
    rt.draw(this.children.list.filter(o=>o!==this.player.sprite&&!this.daylight.contains(o)&&'visible'in o&&o.visible));
    return new Promise(resolve=>rt.snapshot(image=>{
      const url=image instanceof HTMLImageElement?image.src:'';
      rt.destroy();resolve(url);
    }));
  }
  openMapEditor():void {
    if(!DEVELOPMENT_TOOLS||!this.canPlay())return;
    const original=structuredClone(this.snapshotState());
    if(!saveGame(original)){this.ui.toast('Não foi possível salvar antes de abrir o editor.');return;}
    this.setPaused(true);
    this.ui.showMapEditorMode();
    this.scene.setVisible(false);
    this.scene.pause();
    const data:MapEditorStart={save:original,area:this.area,onClose:updated=>{
      this.scene.setVisible(true);
      this.scene.resume();
      this.scene.restart({save:updated??original,ui:this.ui,onReturn:this.onReturn} satisfies TrailStart);
    }};
    this.scene.launch('Editor',data);
  }

  private snapshotState():SaveData {
    this.state[this.trail.position]={x:this.player.x,y:this.player.y,direction:directionFromVector(this.player.facing.x,this.player.facing.y)};
    this.state.quickbar=this.ui.getQuickbar();
    this.state.crops=this.farming.crops;
    this.state.farmingProgress=this.farming.progress;
    return this.state;
  }
  persist=():boolean=>!!this.player&&!this.leaving&&saveGame(this.snapshotState());
  mainMenu():void{this.ui.closeModal();this.leave(true);}
  private leave(title=false):void {
    if(this.leaving)return;
    const next=structuredClone(this.snapshotState());
    if(!title){
      next.activeArea=this.trail.returnArea;
      next[this.trail.returnPosition]={...tileCenter(this.trail.returnTile),direction:this.trail.returnFacing};
      delete next[this.trail.position];
    }
    if(!saveGame(next)){this.ui.toast('Não foi possível salvar. A passagem foi cancelada.');return;}
    this.leaving=true;
    this.blur();
    this.cameras.main.fadeOut(SCENE_FADE_MS);
    this.time.delayedCall(SCENE_FADE_MS,()=>{this.scene.stop();this.onReturn(next,title);});
  }

  update(_time:number,ms:number):void {
    if(!this.player||this.leaving)return;
    this.daylight.update(this.state.time,false,this.state.day);
    if(!this.canPlay())return;
    const dt=Math.min(.1,ms/1000),previous={x:this.player.x,y:this.player.y};
    this.player.speedMultiplier=playerSpeedFactor(this.state);
    this.player.update(dt,this.tileBlocked,this.movementBlockedPoint,true,this.swimmingPoint,this.allowStep);
    this.world.update(dt,this.player);
    const edits=this.state[this.trail.map];
    if(!this.player.isSwimming&&this.passage.update(previous,this.player,this.trail.exit(edits),this.trail.entry(edits))){this.leave();return;}
    this.farming.update(dt,this.state.day);
    this.state.crops=this.farming.crops;
    Object.assign(this.state,advanceClock(this.state,dt*GAME_MINUTES_PER_SECOND));
    advanceBackgroundVillage(this.state,dt,this.player,this.bentoRuntime);
    this.hudElapsed+=dt;
    this.elapsed+=dt;
    if(this.hudElapsed>=.1){this.hudElapsed=0;this.updateHUD();}
    if(this.elapsed>=5){this.elapsed=0;this.persist();}
  }
}
