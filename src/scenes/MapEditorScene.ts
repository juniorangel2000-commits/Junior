import {cropSpriteLayout} from '../crop-layout';
import {HighlandWorld,preloadHighland} from '../highland-world';
import {highlandBlockedPoint,highlandWaterPoint} from '../data/highland';
import {campApproachDistance} from '../data/forest-camp-access';
import {SurvivorCampWorld,preloadSurvivorCamp} from '../survivor-camp-world';
import {campBlockedPoint} from '../data/survivor-camp';
import {propertyLakeApproach} from '../data/property-lake-gate';
import {FishingLakeWorld,preloadFishingLake} from '../fishing-lake-world';
import {lakeWater,lakeBlockedPoint} from '../data/fishing-lake';
import {drawCraftedBench} from '../woodwork-art';
import {EDITOR_AREAS,isDungeonArea} from '../data/editor-areas';
import {readSceneMap,writeSceneMap} from '../systems/scene-map-edits';
import {CityForestWorld,preloadCityForest,setupCityForestArt} from '../city-forest-world';
import {cityForestBlockedPoint,cityForestWater} from '../data/city-forest';
import {DungeonWorld} from '../dungeons/world';
import {dungeonBlocked} from '../dungeons/maps';
import {setupDungeonScenery} from '../dungeons/art';
import {paintedWaterPoint} from '../data/terrain-paint';
import { drawConnectedFence, drawGate } from '../fence-art';
import {nearRiverBank} from '../data/fiber-plants';
import {EditorResourceVisibility,editorResourceTexture} from '../editor-resource-visibility';
import {Farming} from '../systems/farming';
import {drawPreparedSoil} from '../farming-art';
import Phaser from 'phaser';
import {MapEditor} from '../map-editor';
import {MapEditHistory,isProtectedMapTile,type MapEditData} from '../systems/map-editor';
import {defaultMap,type MapArea} from '../data/default-maps';
import {createWorld,TILE,type WorldView,type WorldEditorObject} from '../world';
import {ForestWorld} from '../forest-world';
import {isTreeKind,treeGroundClear} from '../systems/tree-ground';
import {forestWater,forestWaterDistanceAt,FOREST_ANIMALS} from '../data/ancient-forest';
import {animalSprite} from '../forest-art';
import {isWaterTile} from '../data/regions';
import {isWaterPoint} from '../data/property-water';
import {buildingFootprint} from '../systems/building';
import {natureArt} from '../data/nature-catalog';
import {saveGame} from '../systems/save';
import type {SaveData} from '../types';
import {VillageWorld} from '../village-world';
import {villageWater,villageLakeDistance} from '../data/village';
export interface MapEditorStart {save:SaveData;area:MapArea;onClose:(save:SaveData|undefined,area:MapArea)=>void}
/** One editing session, with separate undo stacks and no simulation/save writes until Apply. */
export class MapEditorScene extends Phaser.Scene {
 editor?:MapEditor;
 private editorStart!:MapEditorStart;
 private histories!:Record<MapArea,MapEditHistory>;
 private area!:MapArea;
 private initial!:Record<MapArea,string>;
 private resourcesHidden=false;
 private villageView?:VillageWorld;
 private extraView?:CityForestWorld|DungeonWorld|FishingLakeWorld|SurvivorCampWorld|HighlandWorld;
 private resourceTextures=new Set<string>();
 private readonly resourceVisibility=new EditorResourceVisibility<Phaser.GameObjects.Image>();
 constructor(){super('Editor');}
 preload():void{preloadCityForest(this);preloadFishingLake(this);preloadSurvivorCamp(this);preloadHighland(this);}
 create(data:MapEditorStart):void {
  setupCityForestArt(this);setupDungeonScenery(this);
  this.editorStart=data;
  this.histories=Object.fromEntries(EDITOR_AREAS.map(area=>[area,new MapEditHistory(readSceneMap(data.save,area))])) as Record<MapArea,MapEditHistory>;
  this.initial=Object.fromEntries(EDITOR_AREAS.map(area=>[area,JSON.stringify(this.histories[area].current)])) as Record<MapArea,string>;
  this.openArea(data.area);
  this.events.once('shutdown',()=>{this.editor?.destroy();this.editor=undefined;this.villageView?.destroy();this.villageView=undefined;this.resourceVisibility.clear();this.extraView?.destroy();this.extraView=undefined;});
 }
 private openArea(area:MapArea):void {
  this.editor?.destroy();this.villageView?.destroy();this.villageView=undefined;this.extraView?.destroy();this.extraView=undefined;this.children.removeAll(true);this.area=area;
  const save=this.editorStart.save,edits=this.histories[area].current;
  const farming=new Farming(save.crops,save.preparedSoil,save.farmingProgress,save.restoredFarmSoil);
  let property:WorldView|undefined,forest:ForestWorld|undefined,village:VillageWorld|undefined;
  if(area==='property')property=createWorld(this,[],save.buildings,undefined,'editor-property',(x,y)=>farming.isPrepared(x,y));
  else if(area==='village')village=this.villageView=new VillageWorld(this,undefined,'editor-village');else if(area==='forest')forest=new ForestWorld(this,undefined,'editor-forest');else if(area==='fishingLake')this.extraView=new FishingLakeWorld(this,undefined,'editor-lake');else if(area==='cityForest')this.extraView=new CityForestWorld(this,undefined,'editor-city');else if(area==='survivorCamp')this.extraView=new SurvivorCampWorld(this);else if(area==='highland')this.extraView=new HighlandWorld(this);else this.extraView=new DungeonWorld(this,area,undefined,'editor-dungeon-baseline');
  const original=(property?.editorObjects??village?.editorObjects??forest?.editorObjects??this.extraView!.editorObjects).map(o=>({...o,depleted:save.depletedResources.includes(area==='forest'?`f-${o.id}`:o.id)}));
  const buildings=new Set([...save.buildings.flatMap(buildingFootprint),...farming.soilTiles].map(p=>`${p.x},${p.y}`));
  let liveMap=edits;
  const render=(map:MapEditData):void=>{
   liveMap=map;
   this.resourceVisibility.clear();
   village?.destroy();village=undefined;this.villageView=undefined;
   this.extraView?.destroy();this.extraView=undefined;this.children.removeAll(true);
   if(area==='forest'){forest=new ForestWorld(this,map,'editor-forest');forest.depleted=new Set(save.depletedResources);forest.rebuildEnvironment(map);property=undefined;for(const animal of FOREST_ANIMALS)if(!save.recruitedAnimals?.includes(animal.id))animalSprite(this,animal.kind,animal.x*32+16,animal.y*32+16);}
   else if(area==='village'){village=this.villageView=new VillageWorld(this,map,'editor-village');property=undefined;forest=undefined;}
   else if(area==='fishingLake'){property=undefined;forest=undefined;this.extraView=new FishingLakeWorld(this,map,'editor-lake');}
   else if(area==='cityForest'){property=undefined;forest=undefined;this.extraView=new CityForestWorld(this,map,'editor-city');}
   else if(area==='highland'){property=undefined;forest=undefined;this.extraView=new HighlandWorld(this,map);}
   else if(area==='survivorCamp'){property=undefined;forest=undefined;this.extraView=new SurvivorCampWorld(this,map);}
   else if(isDungeonArea(area)){property=undefined;forest=undefined;this.extraView=new DungeonWorld(this,area,map,'editor-dungeon');}
   else {
    property=createWorld(this,save.depletedResources,save.buildings,map,'editor-property',(x,y)=>farming.isPrepared(x,y));forest=undefined;
    for(const b of save.buildings){
     if(b.kind==='fence')drawConnectedFence(this,b,save.buildings,save.day);
     else if(b.kind==='bench')drawCraftedBench(this,b);
     else if(b.kind==='gate')drawGate(this,b);
     else if(b.kind==='roof')this.add.image(b.x*TILE,b.y*TILE,b.rotation?'roof-vertical':'roof').setOrigin(0).setDepth(3000);
     else if(b.kind==='floor')this.add.sprite(b.x*TILE,b.y*TILE,'floor').setOrigin(0).setDepth(-20);
     else this.add.sprite(b.x*TILE+16,b.y*TILE+29,b.kind==='door'&&b.open?'door-open':b.kind).setOrigin(.5,1).setDepth(b.y*TILE+30);
    }
    drawPreparedSoil(this,farming.soilTiles,save.crops);
    for(const c of save.crops){const art=cropSpriteLayout(c);this.add.sprite(c.x*TILE+art.x,c.y*TILE+art.y,art.texture).setOrigin(art.originX,art.originY).setDisplaySize(art.width,art.height).setDepth(c.y*TILE+art.depth);}
   }
   this.resourceTextures=new Set((property?.editorObjects??village?.editorObjects??forest?.editorObjects??this.extraView!.editorObjects).map(o=>o.texture));
   this.updateResourceVisibility();
  };
  render(edits);
  const objects=():WorldEditorObject[]=>property?.editorObjects??village?.editorObjects??forest?.editorObjects??this.extraView!.editorObjects;
  const blocked=(x:number,y:number)=>property?.isBlocked(x,y)??village?.isBlocked(x,y)??(area==='highland'?highlandBlockedPoint((x+.5)*32,(y+.5)*32,liveMap):area==='survivorCamp'?campBlockedPoint((x+.5)*32,(y+.5)*32,liveMap):area==='fishingLake'?lakeBlockedPoint((x+.5)*32,(y+.5)*32,liveMap):area==='cityForest'?cityForestBlockedPoint((x+.5)*32,(y+.5)*32,liveMap):isDungeonArea(area)?dungeonBlocked(area,(x+.5)*32,(y+.5)*32,liveMap):forest!.isBlocked(x,y));
  const water=(x:number,y:number)=>property?.isWater(x,y)??village?.waterAt(x,y)??(area==='highland'?highlandWaterPoint((x+.5)*32,(y+.5)*32,liveMap):area==='survivorCamp'?liveMap.terrain[`${x},${y}`]==='water':area==='fishingLake'?paintedWaterPoint(liveMap.terrain,(x+.5)*32,(y+.5)*32,(px,py)=>lakeWater(px/32,py/32)):area==='cityForest'?paintedWaterPoint(liveMap.terrain,(x+.5)*32,(y+.5)*32,(px,py)=>cityForestWater(px/32,py/32)):isDungeonArea(area)?liveMap.terrain[`${x},${y}`]==='water':forest!.waterAt(x,y));
  this.editor=new MapEditor(this,edits,{
   rebuild:render,objects,originalObjects:original,
   resourcesHidden:this.resourcesHidden,
   setResourcesHidden:hidden=>{this.resourcesHidden=hidden;this.updateResourceVisibility();},
   protectedTile:(x,y)=>area==='forest'&&campApproachDistance((x+.5)*32,(y+.5)*32)<32||isProtectedMapTile(x,y,area==='property'?undefined:area)||area==='property'&&(propertyLakeApproach(x,y)||buildings.has(`${x},${y}`)),
   protectedTerrainTile:(x,y)=>area==='property'?buildings.has(`${x},${y}`):isProtectedMapTile(x,y,area),
   baseWater:area==='highland'?(x,y)=>highlandWaterPoint((x+.5)*32,(y+.5)*32):area==='survivorCamp'?()=>false:area==='fishingLake'?lakeWater:area==='village'?villageWater:area==='forest'?forestWater:area==='cityForest'?cityForestWater:isDungeonArea(area)?()=>false:isWaterTile,
   baseWaterPoint:area==='highland'?highlandWaterPoint:area==='survivorCamp'?()=>false:area==='fishingLake'?(x,y)=>lakeWater(x/32,y/32):area==='village'?(x,y)=>villageLakeDistance(x/32,y/32)<0:area==='forest'?(x,y)=>forestWaterDistanceAt(x,y)<0:area==='cityForest'?(x,y)=>cityForestWater(x/32,y/32):isDungeonArea(area)?()=>false:isWaterPoint,
   defaultPoints:defaultMap(area).points as {entry:{x:number;y:number};exit:{x:number;y:number}},
   canPlace:(x,y,id,kind)=>(!kind?.startsWith('highland-')||area==='highland')&&(area!=='highland'||x<48&&y<32)&&(!kind?.startsWith('camp-')||area==='survivorCamp')&&(kind!=='reeds'||(area==='fishingLake'||area==='cityForest'||isDungeonArea(area))||area==='property'&&nearRiverBank(x,y)||area==='village'&&Math.abs(villageLakeDistance(x+.5,y+.5))<1.7)&&(!isTreeKind(kind)||(property?property.canPlantTree(x,y):treeGroundClear(x,y,village?.waterPointAt??forest?.waterPointAt??((px,py)=>water(Math.floor(px/32),Math.floor(py/32))))))&&(!blocked(x,y)||objects().some(o=>o.id===id&&o.x===x&&o.y===y)||!!natureArt(kind)?.water&&water(x,y)),
   validateLayout:map=>{
    if(area!=='fishingLake'&&area!=='cityForest'&&area!=='survivorCamp'&&area!=='highland'&&!isDungeonArea(area))return null;
    const points={...defaultMap(area).points,...map.points};
    for(const point of Object.values(points))if(point){
     const blocked=area==='highland'?highlandBlockedPoint:area==='fishingLake'?lakeBlockedPoint:area==='cityForest'?cityForestBlockedPoint:area==='survivorCamp'?campBlockedPoint:dungeonBlocked.bind(null,area);
     if([[-7,-5],[7,-5],[-7,3],[7,3]].some(([dx,dy])=>blocked((point.x+.5)*32+dx,(point.y+.5)*32+dy,map)))return 'Mantenha os pontos de chegada e saída em chão livre.';
    }
    return null;
   },
   switchArea:next=>this.openArea(next),
   apply:()=>{
    const next=structuredClone(save);
    for(const area of EDITOR_AREAS)writeSceneMap(next,area,this.histories[area].current);
    if(next.dungeonRun&&JSON.stringify(this.histories[next.dungeonRun.dungeon].current)!==this.initial[next.dungeonRun.dungeon])next.dungeonRun.mapEdits=this.histories[next.dungeonRun.dungeon].current;
    if(!saveGame(next))return false;
    const callback=this.editorStart.onClose;this.scene.stop();callback(next,this.area);return true;
   },
   cancel:()=>{const callback=this.editorStart.onClose;this.scene.stop();callback(undefined,this.editorStart.area);},
  },this.histories[area],this.initial[area]);
 }
 private updateResourceVisibility():void {
  const objects=this.children.list.filter(o=>{
   const image=o as Phaser.GameObjects.Image;
   return image.texture&&editorResourceTexture(image.texture.key,this.resourceTextures);
  }) as Phaser.GameObjects.Image[];
  this.resourceVisibility.update(objects,this.resourcesHidden);
 }
}
