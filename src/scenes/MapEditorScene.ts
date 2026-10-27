import { drawConnectedFence, drawGate } from '../fence-art';
import {nearRiverBank} from '../data/fiber-plants';
import {EditorResourceVisibility,editorResourceTexture} from '../editor-resource-visibility';
import {Farming} from '../systems/farming';
import {drawPreparedSoil} from '../farming-art';
import Phaser from 'phaser';
import {MapEditor} from '../map-editor';
import {MapEditHistory,isProtectedMapTile,type MapEditData} from '../systems/map-editor';
import {defaultMap,type MapArea} from '../data/default-maps';
import {createWorld,TILE,NPC_POSITION,type WorldView,type WorldEditorObject} from '../world';
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
 private resourceTextures=new Set<string>();
 private readonly resourceVisibility=new EditorResourceVisibility<Phaser.GameObjects.Image>();
 constructor(){super('Editor');}
 create(data:MapEditorStart):void {
  this.editorStart=data;this.histories={property:new MapEditHistory(data.save.mapEdits??defaultMap('property')),forest:new MapEditHistory(data.save.forestMapEdits??defaultMap('forest')),village:new MapEditHistory(data.save.villageMapEdits??defaultMap('village'))};
  this.initial={property:JSON.stringify(this.histories.property.current),forest:JSON.stringify(this.histories.forest.current),village:JSON.stringify(this.histories.village.current)};
  this.openArea(data.area);
  this.events.once('shutdown',()=>{this.editor?.destroy();this.editor=undefined;this.villageView?.destroy();this.villageView=undefined;this.resourceVisibility.clear();});
 }
 private openArea(area:MapArea):void {
  this.editor?.destroy();this.villageView?.destroy();this.villageView=undefined;this.children.removeAll(true);this.area=area;
  const save=this.editorStart.save,edits=this.histories[area].current;
  const farming=new Farming(save.crops,save.preparedSoil,save.farmingProgress,save.restoredFarmSoil);
  let property:WorldView|undefined,forest:ForestWorld|undefined,village:VillageWorld|undefined;
  if(area==='property')property=createWorld(this,[],save.buildings,undefined,'editor-property',(x,y)=>farming.isPrepared(x,y));
  else if(area==='village')village=this.villageView=new VillageWorld(this,undefined,'editor-village');else forest=new ForestWorld(this,undefined,'editor-forest');
  const original=(property?.editorObjects??village?.editorObjects??forest!.editorObjects).map(o=>({...o,depleted:save.depletedResources.includes(area==='forest'?`f-${o.id}`:o.id)}));
  const buildings=new Set([...save.buildings.flatMap(buildingFootprint),...farming.soilTiles].map(p=>`${p.x},${p.y}`));
  const render=(map:MapEditData):void=>{
   this.resourceVisibility.clear();
   village?.destroy();village=undefined;this.villageView=undefined;
   this.children.removeAll(true);
   if(area==='forest'){forest=new ForestWorld(this,map,'editor-forest');forest.depleted=new Set(save.depletedResources);forest.rebuildEnvironment(map);property=undefined;for(const animal of FOREST_ANIMALS)if(!save.recruitedAnimals?.includes(animal.id))animalSprite(this,animal.kind,animal.x*32+16,animal.y*32+16);}
   else if(area==='village'){village=this.villageView=new VillageWorld(this,map,'editor-village');property=undefined;forest=undefined;}
   else {
    property=createWorld(this,save.depletedResources,save.buildings,map,'editor-property',(x,y)=>farming.isPrepared(x,y));forest=undefined;
    this.add.sprite(NPC_POSITION.x,NPC_POSITION.y,'lia').setOrigin(.5,1).setDepth(NPC_POSITION.y);
    for(const b of save.buildings){
     if(b.kind==='fence')drawConnectedFence(this,b,save.buildings,save.day);
     else if(b.kind==='gate')drawGate(this,b);
     else if(b.kind==='roof')this.add.image(b.x*TILE,b.y*TILE,b.rotation?'roof-vertical':'roof').setOrigin(0).setDepth(3000);
     else if(b.kind==='floor')this.add.sprite(b.x*TILE,b.y*TILE,'floor').setOrigin(0).setDepth(-20);
     else this.add.sprite(b.x*TILE+16,b.y*TILE+29,b.kind==='door'&&b.open?'door-open':b.kind).setOrigin(.5,1).setDepth(b.y*TILE+30);
    }
    drawPreparedSoil(this,farming.soilTiles,save.crops);
    for(const c of save.crops)this.add.sprite(c.x*TILE+16,c.y*TILE+29,`crop-${c.growth>=1?2:c.growth>=.45?1:0}`).setOrigin(.5,1).setDepth(c.y*TILE+25);
   }
   this.resourceTextures=new Set((property?.editorObjects??village?.editorObjects??forest!.editorObjects).map(o=>o.texture));
   this.updateResourceVisibility();
  };
  render(edits);
  const objects=():WorldEditorObject[]=>property?.editorObjects??village?.editorObjects??forest!.editorObjects;
  const blocked=(x:number,y:number)=>property?.isBlocked(x,y)??village?.isBlocked(x,y)??forest!.isBlocked(x,y);
  const water=(x:number,y:number)=>property?.isWater(x,y)??village?.waterAt(x,y)??forest!.waterAt(x,y);
  this.editor=new MapEditor(this,edits,{
   rebuild:render,objects,originalObjects:original,
   resourcesHidden:this.resourcesHidden,
   setResourcesHidden:hidden=>{this.resourcesHidden=hidden;this.updateResourceVisibility();},
   protectedTile:(x,y)=>isProtectedMapTile(x,y,area==='property'?undefined:area)||area==='property'&&buildings.has(`${x},${y}`),
   protectedTerrainTile:(x,y)=>area==='village'?isProtectedMapTile(x,y,'village'):area==='property'&&buildings.has(`${x},${y}`),
   baseWater:area==='village'?villageWater:area==='forest'?forestWater:isWaterTile,
   baseWaterPoint:area==='village'?(x,y)=>villageLakeDistance(x/32,y/32)<0:area==='forest'?(x,y)=>forestWaterDistanceAt(x,y)<0:isWaterPoint,
   defaultPoints:defaultMap(area).points as {entry:{x:number;y:number};exit:{x:number;y:number}},
   canPlace:(x,y,id,kind)=>(kind!=='reeds'||area==='property'&&nearRiverBank(x,y)||area==='village'&&Math.abs(villageLakeDistance(x+.5,y+.5))<1.7)&&(!isTreeKind(kind)||(property?property.canPlantTree(x,y):treeGroundClear(x,y,village?.waterPointAt??forest!.waterPointAt)))&&(!blocked(x,y)||objects().some(o=>o.id===id&&o.x===x&&o.y===y)||!!natureArt(kind)?.water&&water(x,y)),
   switchArea:next=>this.openArea(next),
   apply:()=>{
    const next=structuredClone(save);next.mapEdits=this.histories.property.current;next.forestMapEdits=this.histories.forest.current;next.villageMapEdits=this.histories.village.current;
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
