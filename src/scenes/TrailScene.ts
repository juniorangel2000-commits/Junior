import Phaser from 'phaser';
import type { SaveData, Tool, ItemId } from '../types';
import type { ForestStart as TrailStart } from './ForestScene';
import type { MapEditorStart } from './MapEditorScene';
import { Player, PLAYER_SPEED } from '../player';
import {AnimalPopulation} from '../animals';
import {startAnimalEscort,releaseAnimalEscort,transferEscortTo} from '../systems/animals';
import {ropeBack,ROPE_PLACE} from '../data/wild-animals';
import {domesticAnimal} from '../data/domestic-animals';
import {ANIMAL_NAMES} from '../data/ancient-forest';
import { Daylight } from '../daylight';
import { gameAudio } from '../audio';
import { setupTreeWind } from '../tree-wind';
import { SwampWorld, preloadSwamp } from '../swamp-world';
import { SWAMP_SIZE, swampEntry, swampExit, tileCenter, FOREST_SWAMP_RETURN } from '../data/swamp';
import { RuinsWorld, preloadRuins } from '../ruins-world';
import { RuinsCellarWorld, preloadRuinsCellar } from '../ruins-cellar-world';
import { RUINS_SIZE } from '../data/ruins';
import { RUINS_CELLAR_ENTRY, RUINS_CELLAR_EXIT, RUINS_CELLAR_SIZE } from '../data/ruins-cellar';
import { RailwayHallWorld, preloadRailwayHall } from '../railway-hall-world';
import { RAILWAY_HALL_ENTRY, RAILWAY_HALL_EXIT, RAILWAY_HALL_SIZE } from '../data/railway-hall';
import { ruinsHasWetTraces } from '../data/ruins-story';
import { blockMountedEntry } from '../riding-guard';
import { installWorldCompanion } from '../dungeons/world-pet-controller';
import { preloadPetArt } from '../dungeons/pet-sprites';
import { CITY_RUINS_RETURN, RUINS_ENTRY, RUINS_EXIT, RUINS_RAILWAY_EXIT, RUINS_RAILWAY_RETURN, RAILWAY_ENTRY, RAILWAY_EXIT } from '../data/ruins-road';
import { RailwayWorld, preloadRailway } from '../railway-world';
import { RAILWAY_SIZE } from '../data/railway';
import { CoastWorld, preloadCoast } from '../coast-world';
import { OrchardWorld, preloadOrchard } from '../orchard-world';
import { ORCHARD_SIZE } from '../data/orchard';
import { ORCHARD_ENTRY, ORCHARD_EXIT, VILLAGE_ORCHARD_RETURN } from '../data/orchard-gate';
import { collectOrchardFruit } from '../systems/orchard-harvest';
import { ITEM_NAMES } from '../data/items';
import { COAST_SIZE } from '../data/coast';
import { COAST_ENTRY, COAST_EXIT } from '../data/ruins-road';
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
import {NpcOutingVisit} from '../npc-outing-visit';
import type {OutingArea} from '../systems/npc-outings';
import {CritterField,preloadCritters} from '../critters';
import {crittersOf} from '../data/critters';
import {FORAGE_SPOTS,collectForage,forageNear,forageReady,forageSpotsIn} from '../systems/forage';
import {Inventory} from '../systems/inventory';
const CRAB_REACH=150;
const OUTING_AREAS:readonly OutingArea[]=['orchard','swamp','ruins','railway','coast'];

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
  railway:{scene:'Estacao',map:'railwayMapEdits',position:'railwayPosition',size:RAILWAY_SIZE,
    World:RailwayWorld,preload:preloadRailway,entry:(edits?:MapEditData)=>edits?.points?.entry??RAILWAY_ENTRY,
    exit:(edits?:MapEditData)=>edits?.points?.exit??RAILWAY_EXIT,
    arrival:'right',returnArea:'ruins',returnPosition:'ruinsPosition',returnTile:RUINS_RAILWAY_RETURN,returnFacing:'left',
    returnName:AREA_NAMES.ruins,prompt:'A estação fica ao sul da estrada. A plataforma e os trilhos estão logo atrás do prédio.'},
  coast:{scene:'Costa',map:'coastMapEdits',position:'coastPosition',size:COAST_SIZE,
    World:CoastWorld,preload:preloadCoast,entry:(edits?:MapEditData)=>edits?.points?.entry??COAST_ENTRY,
    exit:(edits?:MapEditData)=>edits?.points?.exit??COAST_EXIT,
    // Chega-se pela saída sul dos Campos Abertos; o rio dos Campos deságua aqui no mar.
    arrival:'down',returnArea:'openFields',returnPosition:'openFieldsPosition',returnTile:{x:28,y:67},returnFacing:'up',
    returnName:AREA_NAMES.openFields,prompt:'Desça pela trilha até a praia. O rio dos Campos encontra o mar a oeste do píer.'},
  orchard:{scene:'Pomar',map:'orchardMapEdits',position:'orchardPosition',size:ORCHARD_SIZE,
    World:OrchardWorld,preload:preloadOrchard,entry:(edits?:MapEditData)=>edits?.points?.entry??ORCHARD_ENTRY,
    exit:(edits?:MapEditData)=>edits?.points?.exit??ORCHARD_EXIT,
    arrival:'right',returnArea:'village',returnPosition:'villagePosition',returnTile:VILLAGE_ORCHARD_RETURN,returnFacing:'left',
    returnName:AREA_NAMES.village,prompt:'Siga as trilhas até as frutíferas, a prensa e a lagoa.'},
} as const;
const ROAD_LINKS={
  ruins:{area:'railway',exit:RUINS_RAILWAY_EXIT,approach:RUINS_RAILWAY_RETURN},
} as const;
type RoadLink=typeof ROAD_LINKS[keyof typeof ROAD_LINKS];

export class TrailScene extends Phaser.Scene {
  private readonly trail:(typeof TRAILS)[keyof typeof TRAILS];
  private state!: SaveData;
  private ui!: TrailStart['ui'];
  private onReturn!: TrailStart['onReturn'];
  /** Animais de criação soltos (Pântano e Costa, preview.48). */
  private wildlife?:AnimalPopulation;
  private world!: SwampWorld|RuinsWorld|RuinsCellarWorld|RailwayWorld|RailwayHallWorld|CoastWorld|OrchardWorld;
  /** Interiores: o porão das Ruínas e a sala de espera da Estação. */
  get inHome():boolean{return this.area==='ruins'&&!!this.state?.ruinsCellarPosition||this.area==='railway'&&!!this.state?.railwayHallPosition;}
  private get mapSize(){return this.inHome?(this.area==='railway'?RAILWAY_HALL_SIZE:RUINS_CELLAR_SIZE):this.trail.size;}
  private get interiorEntry(){return this.area==='railway'?RAILWAY_HALL_ENTRY:RUINS_CELLAR_ENTRY;}
  private get interiorExit(){return this.area==='railway'?RAILWAY_HALL_EXIT:RUINS_CELLAR_EXIT;}
  private get interiorName(){return this.area==='railway'?'Sala de espera':'Porão do posto';}
  readonly movementBlockedPoint=(x:number,y:number)=>this.world.layout.blocked(x,y)||!!this.outings?.blocks(x,y);
  /** Moradores que vieram trabalhar neste cenário (src/systems/npc-outings.ts). */
  private outings?:NpcOutingVisit;
  /** Conchas soltas na areia da Costa (src/systems/forage.ts). */
  private shellSprites=new Map<string,Phaser.GameObjects.Image>();
  /** Bichos do cenário (src/critters.ts). */
  private critters?:CritterField;
  private readonly tileBlocked=(x:number,y:number)=>this.movementBlockedPoint((x+.5)*32,(y+.5)*32);
  readonly swimmingPoint=(x:number,y:number)=>this.world instanceof CoastWorld
    ?this.world.swimmingDepth(x,y):sampleWaterDepth(this.world.layout.inWater,x,y);
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
  private readonly roadPassage=new MapExitPassage();
  private readonly grounds=createGroundRuntime(
    ()=>this.snapshotState(),saveGame,()=>this.state,()=>this.state.inventory,()=>this.player,()=>this.inHome?(this.area==='railway'?'railway-hall':'ruins-cellar'):this.area,
    (x,y)=>this.movementBlockedPoint(x,y)||this.swimmingPoint(x,y)>0,()=>this.canPlay(),()=>this.updateHUD(),
  );
  private readonly missions=createMineMissionRuntime(()=>this.snapshotState(),saveGame,()=>this.state,()=>this.player);
  private readonly bentoRuntime={missions:this.missions,write:bentoSceneWriter(()=>this.snapshotState(),saveGame)};

  constructor(private readonly area:keyof typeof TRAILS){super(TRAILS[area].scene);this.trail=TRAILS[area];}
  private get outgoingRoad(){return this.area==='ruins'?ROAD_LINKS[this.area]:undefined;}
  private resumeViaRoad(save?:SaveData):RoadLink|undefined{
    const road=this.outgoingRoad;
    return save&&save.activeArea===road?.area?road:undefined;
  }
  preload():void{
    if(this.area==='coast'&&!this.textures.exists('forage-shell'))this.load.image('forage-shell','assets/visual/items/shell.png');
    const data=this.sys.settings.data as TrailStart|undefined;
    if(this.resumeViaRoad(data?.save))return;
    if(this.area==='ruins'&&data?.save?.ruinsCellarPosition)preloadRuinsCellar(this);
    else if(this.area==='railway'&&data?.save?.railwayHallPosition)preloadRailwayHall(this);
    else {this.trail.preload(this);preloadCritters(this);}
    if(this.area==='railway'||this.area==='coast'||this.area==='orchard')preloadPetArt(this);
  }
  getGroundItemRuntime(){return this.player?this.grounds:undefined;}
  getMineMissionRuntime=()=>this.missions;
  getFishingState=()=>this.state;
  syncInventory(inventory:SaveData['inventory']):void {
    this.state.inventory=inventory;
    this.updateHUD();
  }

  create(data:TrailStart):void {
    const resumeRoad=this.resumeViaRoad(data.save);
    if(resumeRoad){this.startRoadScene(resumeRoad,data);return;}
    this.state=structuredClone(data.save);
    this.state.activeArea=this.area;
    this.ui=data.ui;
    this.onReturn=data.onReturn;
    this.paused=this.leaving=this.fishing=false;
    this.elapsed=this.hudElapsed=0;
    this.passage.reset();this.roadPassage.reset();
    gameAudio.setScene('game');
    setupTreeWind(this);
    const {width,height}=this.mapSize,edits=this.state[this.trail.map];
    this.world=this.inHome?(this.area==='railway'?new RailwayHallWorld(this):new RuinsCellarWorld(this,!!this.state.ruinsSealFound)):new this.trail.World(this,edits);
    if(this.world instanceof RuinsWorld)this.world.weather(this.state.day);
    this.farming=new Farming(this.state.crops,this.state.preparedSoil,this.state.farmingProgress,this.state.restoredFarmSoil);
    const saved=this.inHome?(this.area==='railway'?this.state.railwayHallPosition:this.state.ruinsCellarPosition):this.state[this.trail.position];
    const valid=saved&&[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!this.movementBlockedPoint(saved.x+dx,saved.y+dy));
    const start=valid?saved:tileCenter(this.inHome?this.interiorEntry:this.trail.entry(edits));
    this.player=new Player(this,this.state.profile,start.x,start.y,this.area+'-player');
    const facing=this.inHome?(this.area==='railway'?'up':'down'):this.trail.arrival;
    this.player.facing=directionVector(valid?saved.direction??facing:facing);
    this.player.update(0,this.tileBlocked,this.movementBlockedPoint,false,this.swimmingPoint);
    this.daylight=new Daylight(this,width,height);
    this.daylight.update(this.state.time,this.inHome,this.state.day);
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
    if(this.area==='railway'||this.area==='coast'||this.area==='orchard'){
      const area=this.area;
      this.input.on('pointerdown',this.pointer,this);
      installWorldCompanion(this,()=>({
        save:this.state,player:this.player,area,space:this.inHome?'railway-hall':'outdoors',
        bounds:this.mapSize,blockedPoint:(x,y)=>this.movementBlockedPoint(x,y)||this.world.layout.inWater(x,y),
        enabled:true,canMove:this.canPlay(),
      }),this.ui,this.persist);
    }
    this.shellSprites.clear();
    if(!this.inHome)for(const spot of forageSpotsIn(this.area).filter(f=>f.item==='shell'))
      if(this.textures.exists('forage-shell'))this.shellSprites.set(spot.id,this.add.image(spot.x,spot.y,'forage-shell').setOrigin(.5,.8).setDisplaySize(18,18).setDepth(spot.y));
    if(!this.inHome&&crittersOf(this.area).length){
      const layout=this.world.layout;
      this.critters=new CritterField(this,this.area,{width:this.mapSize.width,height:this.mapSize.height,
        land:(x,y)=>!layout.blocked(x,y)&&!layout.water(x,y),water:(x,y)=>layout.water(x,y)},
        {state:()=>this.state,player:()=>this.player,active:()=>this.canPlay(),
         // Com a rede na mochila, você chega devagar: o caranguejo só se assusta bem de perto.
         fleeScale:id=>id==='crab'&&(this.state.inventory.net??0)>0?.45:1});
    }
    if(!this.inHome&&(this.area==='swamp'||this.area==='coast'||this.area==='orchard'||this.area==='ruins'||this.area==='railway')){
      const layout=this.world.layout;
      this.wildlife=new AnimalPopulation(this,this.state,this.area,(x,y)=>this.tileBlocked(x,y)||layout.water((x+.5)*32,(y+.5)*32),PLAYER_SPEED);
    }
    if(!this.inHome&&OUTING_AREAS.includes(this.area as OutingArea))this.outings=new NpcOutingVisit(this,this.area as OutingArea,{
      state:()=>this.state,snapshot:()=>this.snapshotState(),player:()=>this.player,
      pause:value=>{this.setPaused(value);this.updateHUD();},syncInventory:inventory=>this.syncInventory(inventory),
    });
    this.scale.on('resize',this.applyCamera);
    window.addEventListener('pagehide',this.persist);
    window.addEventListener('beforeunload',this.persist);
    window.addEventListener('blur',this.blur);
    document.addEventListener('visibilitychange',this.visibility);
    this.events.once('shutdown',()=>{
      this.outings?.destroy();this.outings=undefined;this.critters?.destroy();this.critters=undefined;this.wildlife?.destroy();this.wildlife=undefined;
      if(!(this.world instanceof RuinsCellarWorld))this.world.destroy();
      this.daylight.destroy();
      this.input.keyboard?.off('keydown',this.key,this);
      this.input.off('wheel',this.wheel,this);
      this.input.off('pointerdown',this.pointer,this);
      this.scale.off('resize',this.applyCamera);
      window.removeEventListener('pagehide',this.persist);
      window.removeEventListener('beforeunload',this.persist);
      window.removeEventListener('blur',this.blur);
      document.removeEventListener('visibilitychange',this.visibility);
    });
    this.persist();
  }

  private startRoadScene(road:RoadLink,{save,ui,onReturn}:TrailStart):void{
    this.scene.start(TRAILS[road.area].scene,{save,ui,onReturn:(updated:SaveData,title=false)=>{
      if(title)onReturn(updated,true);else this.scene.start(this.trail.scene,{save:updated,ui,onReturn} satisfies TrailStart);
    }} satisfies TrailStart);
  }

  private enterRoad(road:RoadLink):void {
    if(this.leaving)return;
    if(this.state.animalEscort){this.ui.toast(`Leve o animal pela saída até ${this.trail.returnName}. G solta a corda.`);return;}
    const save=structuredClone(this.snapshotState());
    save.activeArea=road.area;
    delete save[TRAILS[road.area].position];
    if(!saveGame(save)){this.ui.toast('Não foi possível salvar. A passagem foi cancelada.');return;}
    this.leaving=true;this.blur();this.cameras.main.fadeOut(SCENE_FADE_MS);
    this.time.delayedCall(SCENE_FADE_MS,()=>this.startRoadScene(road,{save,ui:this.ui,onReturn:this.onReturn}));
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
    if(this.player.isSwimming)return undefined;
    if(this.world instanceof RuinsCellarWorld||this.world instanceof RailwayHallWorld)return this.world.layout.inspectNear(this.player.x,this.player.y);
    if(this.world instanceof RuinsWorld)return this.world.layout.inspectNear(this.player.x,this.player.y,ruinsHasWetTraces(this.state.day));
    if(this.world instanceof RailwayWorld||this.world instanceof CoastWorld||this.world instanceof OrchardWorld)return this.world.layout.inspectNear(this.player.x,this.player.y);
  }

  private updateHUD():void {
    if(!this.player)return;
    const {state,player,trail}=this,edits=state[trail.map],exit=trail.exit(edits),gate=tileCenter(exit);
    const forage=this.player.isSwimming?undefined:forageNear(state,this.area,player),crab=this.crabInReach();
    this.shellSprites.forEach((sprite,id)=>{const spot=FORAGE_SPOTS.find(f=>f.id===id);sprite.setVisible(!!spot&&forageReady(state,spot));});
    const fruit=this.nearbyFruit(),landmark=this.nearbyLandmark(),resident=this.player.isSwimming?undefined:this.outings?.nearName();
    if(this.world instanceof OrchardWorld)this.world.showFruits(state.day,state.orchardHarvest);
    const road=this.outgoingRoad,nextGate=road&&tileCenter(road.exit);
    const fishing=this.nearFishing()&&!!this.equippedFishingItem();
    const cardinal={up:'norte',down:'sul',left:'oeste',right:'leste'}[exitSignLayout(exit,trail.entry(edits)).direction];
    const led=!!state.animalEscort&&!!this.wildlife,catchable=!led&&!player.isSwimming?this.wildlife?.nearest(player):undefined,catchKind=catchable&&domesticAnimal(catchable.id)?.kind;
    const prompt=player.isSwimming?'Siga até a margem para sair da água.':
      led?'Conduzindo animal · siga até a saída · soltar corda':
      catchKind?`Prender ${ANIMAL_NAMES[catchKind].toLowerCase()} com corda`:
      resident?`E · Conversar com ${resident}`:
      forage?`E · ${forage.item==='shell'?'Recolher concha':'Colher íris azul'}`:
      crab?'E · Pegar caranguejo com a rede':
      fruit?`E · Recolher ${ITEM_NAMES[fruit.item].toLowerCase()}`:
      landmark?(landmark.cellar&&state.ruinsMapFound?'E · Descer ao porão':landmark.hall?'E · Entrar na sala de espera':`E · Examinar ${landmark.name.toLowerCase()}`):
      this.inHome?(this.area==='railway'?'A porta ao sul leva de volta à plataforma.':'Suba os degraus ao norte para voltar ao armazém.'):
      Math.hypot(player.x-gate.x,player.y-gate.y)<144?`${trail.returnName} ao ${cardinal}`:
      road&&nextGate&&Math.hypot(player.x-nextGate.x,player.y-nextGate.y)<144?`${AREA_NAMES[road.area]} a leste`:
      fishing?'Pescar na margem · E':trail.prompt;
    this.ui.updateHUD({
      area:this.area,name:state.profile.name,day:state.day,time:state.time,
      inventory:state.inventory,itemQuality:state.itemQuality,toolConditions:state.economy6?.tools,
      tool:state.equippedTool??'hand',worldWeapon:state.worldWeapon,learnedRecipes:state.villageProgress?.recipes??[],
      inHome:this.inHome,swimming:player.isSwimming,coins:state.villageEconomy?.coins??0,vigor:state.villageProgress?.vigor??100,
      wateringCan:!!state.homeSupplies?.wateringCan,wateringCanWater:state.wateringCanWater??0,
      playerTile:{x:player.x/32,y:player.y/32},interactionKey:led?'G':catchKind||resident||forage||crab||fruit||landmark||fishing?'E':null,prompt,location:AREA_NAMES[this.area],
      ...(this.inHome?{mapTitle:this.interiorName,location:this.interiorName,interiorMapSize:{width:this.mapSize.width/32,height:this.mapSize.height/32}}:{}),
      ...(this.area==='coast'||this.area==='orchard'?{mapTitle:AREA_NAMES[this.area]}:{}),
      harvests:state.inventory.turnip,metLia:state.metLia,nearWorkbench:false,sheltered:false,shelterReason:'',
      resourceProgress:'',farmingProgress:this.farming.progress,progress:state.progress,
    });
  }

  private key=(event:KeyboardEvent):void=>{
    if(event.repeat||this.leaving)return;
    const key=event.key.toLowerCase();
    if(key==='escape'){event.preventDefault();this.ui.togglePause();return;}
    if(event.target instanceof HTMLElement&&event.target.matches('input,textarea,select,[contenteditable="true"]'))return;
    if(key==='i'){this.ui.toggleInventory(this.state.inventory);return;}
    if(key==='m'){void this.ui.toggleMap();return;}
    if(key==='c'){this.ui.toggleCrafting(this.state.inventory,false);return;}
    if(!this.canPlay())return;
    if(event.key==='F2'&&DEVELOPMENT_TOOLS)this.openMapEditor();
    else if(key==='e')this.interact();
    else if(key==='g')this.releaseAnimal();
    else if(/^[1-9]$/.test(event.key))this.ui.activateSlot(Number(event.key)-1);
    else if(['+','=','-','_','Home'].includes(event.key))this.changeCameraZoom(event.key==='Home'?0:['-','_'].includes(event.key)?-1:1);
  };
  private pointer=(pointer:Phaser.Input.Pointer):void=>{
    if(pointer.button===0&&this.canPlay())this.interact();
  };
  /** Caranguejo perto o bastante para pegar com a rede (precisa ter a rede na mochila). */
  private crabInReach():boolean{return this.area==='coast'&&!this.player.isSwimming&&(this.state.inventory.net??0)>0&&!!this.critters?.nearest('crab',this.player,CRAB_REACH);}
  private nearbyFruit(){
    if(this.player.isSwimming||this.player.mounted||!(this.world instanceof OrchardWorld))return;
    return this.world.fruitNear(this.player,this.state.day,this.state.orchardHarvest);
  }
  private interact():void {
    if(!this.player.isSwimming&&this.outings?.interact())return;
    if(this.tieAnimal())return;
    const forage=this.player.isSwimming?undefined:forageNear(this.state,this.area,this.player);
    if(forage){this.ui.toast(collectForage(this.snapshotState(),forage,this.player,saveGame));this.updateHUD();return;}
    if(this.crabInReach()){
      const draft=this.snapshotState(),inv=new Inventory(draft.inventory);
      if(!inv.transact({},{crab:1})){this.ui.toast('A mochila está cheia.');return;}
      draft.inventory=inv.data;
      if(!saveGame(draft)){this.ui.toast('Não foi possível salvar.');return;}
      this.critters!.take('crab',this.player,CRAB_REACH);this.state.inventory=draft.inventory;
      this.ui.toast('Caranguejo na mochila.');this.updateHUD();return;
    }
    const fruit=this.nearbyFruit();
    if(fruit){
      this.ui.toast(collectOrchardFruit(this.snapshotState(),fruit,this.player,saveGame));
      this.updateHUD();
      return;
    }
    const landmark=this.nearbyLandmark();
    if(landmark){
      if((landmark.cellar&&this.state.ruinsMapFound)||landmark.hall){this.changeCellar(true);return;}
      const lines=inspectRuins(this.snapshotState(),landmark,saveGame);
      if(this.world instanceof RuinsCellarWorld&&this.state.ruinsSealFound)this.world.takeSeal();
      this.updateHUD();
      this.ui.showDialogue(landmark.name,lines,undefined,'inspection');
      return;
    }
    const item=this.equippedFishingItem();
    if(item&&this.nearFishing())void this.useVillageItem(item);
  }
  private wheel=(_p:Phaser.Input.Pointer,_objects:unknown[],_x:number,deltaY:number):void=>{
    if(this.canPlay()&&Math.abs(deltaY)>5)this.changeCameraZoom(deltaY>0?-1:1);
  };
  private get shownZoom():number{return mapCameraZoom(this.zoom,this.scale.width,this.scale.height,this.mapSize.width,this.mapSize.height);}
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
    const factor=this.inHome?1:1/3;
    const rt=this.make.renderTexture({width:this.mapSize.width*factor,height:this.mapSize.height*factor},false);
    rt.camera.setZoom(factor).setScroll(0,0).setOrigin(0,0);
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

  /** Mesmo padrão do Bosque e dos Campos: E prende o animal na corda, G solta. */
  private tieAnimal():boolean{
    if(!this.wildlife||this.player.isSwimming)return false;
    if(this.state.animalEscort){this.ui.toast(`Conduza o animal pela saída até ${this.trail.returnName} e depois à propriedade. G solta a corda.`);return true;}
    const a=this.wildlife.nearest(this.player);if(!a)return false;
    if(!startAnimalEscort(this.state,a.brain.snapshot())){this.ui.toast('Fabrique uma corda vegetal com 3 fibras (C) para conduzir o animal.');return true;}
    gameAudio.play('pickup');this.ui.toast('Corda presa! Leve o animal até a propriedade. G para soltar.');this.persist();this.updateHUD();return true;
  }
  private releaseAnimal():void{
    if(!this.state.animalEscort)return;
    // Nas Ruínas, um animal da Estação corre de volta pela estrada a leste (preview.48).
    const back=ropeBack(this.state.animalEscort.id,this.area as never),road=back&&this.outgoingRoad;
    const home=!!road&&back===road.area&&!!this.wildlife?.runHome(tileCenter(road.exit));
    if(releaseAnimalEscort(this.state)){this.ui.toast(home?`Animal solto. Ele corre de volta para ${ROPE_PLACE[back!]}, e a corda voltou para você.`:'Animal solto. A corda voltou para você.');this.persist();this.updateHUD();}
  }
  private snapshotState():SaveData {
    const position={x:this.player.x,y:this.player.y,direction:directionFromVector(this.player.facing.x,this.player.facing.y)};
    if(this.inHome){if(this.area==='railway')this.state.railwayHallPosition=position;else this.state.ruinsCellarPosition=position;}
    else this.state[this.trail.position]=position;
    this.wildlife?.store();
    this.state.quickbar=this.ui.getQuickbar();
    this.state.crops=this.farming.crops;
    this.state.farmingProgress=this.farming.progress;
    return this.state;
  }
  persist=():boolean=>!!this.player&&!this.leaving&&saveGame(this.snapshotState());
  mainMenu():void{this.ui.closeModal();this.leave(true);}
  private changeCellar(enter:boolean):void {
    if(this.leaving||enter&&blockMountedEntry(this.player,this.ui))return;
    if(enter&&this.state.animalEscort){this.ui.toast('Solte a corda antes de entrar.');return;}
    const save=structuredClone(this.snapshotState());
    if(this.area==='railway'){
      if(enter)save.railwayHallPosition={...tileCenter(RAILWAY_HALL_ENTRY),direction:'up'};
      // Ao sair, volta à posição guardada quando apertou E: o patamar livre diante da porta.
      else delete save.railwayHallPosition;
    }else if(enter)save.ruinsCellarPosition={...tileCenter(RUINS_CELLAR_ENTRY),direction:'down'};
    else delete save.ruinsCellarPosition;
    if(!saveGame(save)){this.ui.toast('Não foi possível salvar antes de atravessar a escada.');return;}
    this.leaving=true;this.blur();this.cameras.main.fadeOut(SCENE_FADE_MS);
    this.time.delayedCall(SCENE_FADE_MS,()=>this.scene.restart({save,ui:this.ui,onReturn:this.onReturn} satisfies TrailStart));
  }
  private leave(title=false):void {
    if(this.leaving)return;
    if(!title&&this.state.animalEscort&&this.wildlife&&!this.wildlife.canLeave(this.player)){this.ui.toast('Espere o animal chegar perto antes de atravessar.');return;}
    const next=structuredClone(this.snapshotState());
    if(!title){
      if(next.animalEscort){const arrival=tileCenter(this.trail.returnTile);transferEscortTo(next,this.trail.returnArea,{x:arrival.x+(arrival.x<1536?24:-24),y:arrival.y});}
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
    this.daylight.update(this.state.time,this.inHome,this.state.day);
    if(!this.canPlay())return;
    const dt=Math.min(.1,ms/1000),previous={x:this.player.x,y:this.player.y};
    this.player.speedMultiplier=playerSpeedFactor(this.state);this.player.keepDry=!!this.state.animalEscort;
    this.player.update(dt,this.tileBlocked,this.movementBlockedPoint,true,this.swimmingPoint,this.allowStep);
    if(!(this.world instanceof RuinsCellarWorld))this.world.update(dt,this.player);
    this.wildlife?.update(dt,this.player);
    const edits=this.state[this.trail.map];
    const exit=this.inHome?this.interiorExit:this.trail.exit(edits),entry=this.inHome?this.interiorEntry:this.trail.entry(edits);
    if(!this.player.isSwimming&&this.passage.update(previous,this.player,exit,entry)){
      if(this.inHome)this.changeCellar(false);else this.leave();
      return;
    }
    const road=this.outgoingRoad;
    if(road&&!this.inHome&&!this.player.isSwimming&&this.roadPassage.update(previous,this.player,road.exit,road.approach)){
      this.enterRoad(road);
      return;
    }
    this.farming.update(dt,this.state.day);
    this.state.crops=this.farming.crops;
    Object.assign(this.state,advanceClock(this.state,dt*GAME_MINUTES_PER_SECOND));
    if(this.world instanceof RuinsWorld)this.world.weather(this.state.day);
    advanceBackgroundVillage(this.state,dt,this.player,this.bentoRuntime);
    this.hudElapsed+=dt;
    this.elapsed+=dt;
    if(this.hudElapsed>=.1){this.hudElapsed=0;this.updateHUD();}
    if(this.elapsed>=5){this.elapsed=0;this.persist();}
  }
}
