import Phaser from 'phaser';
import {MapEditor} from '../map-editor';
import {MapEditHistory,isProtectedMapTile,type MapEditData} from '../systems/map-editor';
import {defaultMap,type MapArea} from '../data/default-maps';
import {createWorld,TILE,NPC_POSITION,type WorldView,type WorldEditorObject} from '../world';
import {ForestWorld} from '../forest-world';
import {forestWater,FOREST_ANIMALS} from '../data/ancient-forest';
import {animalSprite} from '../forest-art';
import {isWaterTile} from '../data/regions';
import {buildingFootprint} from '../systems/building';
import {natureArt} from '../data/nature-catalog';
import {saveGame} from '../systems/save';
import type {SaveData} from '../types';
export interface MapEditorStart {save:SaveData;area:MapArea;onClose:(save:SaveData|undefined,area:MapArea)=>void}
/** One editing session, with separate undo stacks and no simulation/save writes until Apply. */
export class MapEditorScene extends Phaser.Scene {
 editor?:MapEditor;
 private editorStart!:MapEditorStart;
 private histories!:Record<MapArea,MapEditHistory>;
 private area!:MapArea;
 private initial!:Record<MapArea,string>;
 constructor(){super('Editor');}
 create(data:MapEditorStart):void {
  this.editorStart=data;this.histories={property:new MapEditHistory(data.save.mapEdits??defaultMap('property')),forest:new MapEditHistory(data.save.forestMapEdits??defaultMap('forest'))};
  this.initial={property:JSON.stringify(this.histories.property.current),forest:JSON.stringify(this.histories.forest.current)};
  this.openArea(data.area);
  this.events.once('shutdown',()=>{this.editor?.destroy();this.editor=undefined;});
 }
 private openArea(area:MapArea):void {
  this.editor?.destroy();this.children.removeAll(true);this.area=area;
  const save=this.editorStart.save,edits=this.histories[area].current;
  let property:WorldView|undefined,forest:ForestWorld|undefined;
  if(area==='property')property=createWorld(this,[],save.buildings,undefined,'editor-property');
  else forest=new ForestWorld(this,undefined,'editor-forest');
  const original=(property?.editorObjects??forest!.editorObjects).map(o=>({...o,depleted:save.depletedResources.includes(area==='forest'?`f-${o.id}`:o.id)}));
  const buildings=new Set(save.buildings.flatMap(buildingFootprint).map(p=>`${p.x},${p.y}`));
  const render=(map:MapEditData):void=>{
   this.children.removeAll(true);
   if(area==='forest'){forest=new ForestWorld(this,map,'editor-forest');forest.depleted=new Set(save.depletedResources);forest.rebuildEnvironment(map);property=undefined;for(const animal of FOREST_ANIMALS)if(!save.recruitedAnimals?.includes(animal.id))animalSprite(this,animal.kind,animal.x*32+16,animal.y*32+16);}
   else {
    property=createWorld(this,save.depletedResources,save.buildings,map,'editor-property');forest=undefined;
    this.add.sprite(NPC_POSITION.x,NPC_POSITION.y,'lia').setOrigin(.5,1).setDepth(NPC_POSITION.y);
    for(const b of save.buildings){
     if(b.kind==='roof')this.add.image(b.x*TILE,b.y*TILE,b.rotation?'roof-vertical':'roof').setOrigin(0).setDepth(3000);
     else if(b.kind==='floor')this.add.sprite(b.x*TILE,b.y*TILE,'floor').setOrigin(0).setDepth(-20);
     else this.add.sprite(b.x*TILE+16,b.y*TILE+29,b.kind==='door'&&b.open?'door-open':b.kind).setOrigin(.5,1).setDepth(b.y*TILE+30);
    }
    for(const c of save.crops)this.add.sprite(c.x*TILE+16,c.y*TILE+29,`crop-${c.growth>=1?2:c.growth>=.45?1:0}`).setOrigin(.5,1).setDepth(c.y*TILE+25);
   }
  };
  render(edits);
  const objects=():WorldEditorObject[]=>property?.editorObjects??forest!.editorObjects;
  const blocked=(x:number,y:number)=>property?.isBlocked(x,y)??forest!.isBlocked(x,y);
  const water=(x:number,y:number)=>property?.isWater(x,y)??forest!.waterAt(x,y);
  this.editor=new MapEditor(this,edits,{
   rebuild:render,objects,originalObjects:original,
   protectedTile:(x,y)=>isProtectedMapTile(x,y,area==='forest'?'forest':undefined)||area==='property'&&buildings.has(`${x},${y}`),
   baseWater:area==='forest'?forestWater:isWaterTile,
   defaultPoints:defaultMap(area).points as {entry:{x:number;y:number};exit:{x:number;y:number}},
   canPlace:(x,y,id,kind)=>!blocked(x,y)||objects().some(o=>o.id===id&&o.x===x&&o.y===y)||!!natureArt(kind)?.water&&water(x,y),
   switchArea:next=>this.openArea(next),
   apply:()=>{
    const next=structuredClone(save);next.mapEdits=this.histories.property.current;next.forestMapEdits=this.histories.forest.current;
    if(!saveGame(next))return false;
    const callback=this.editorStart.onClose;this.scene.stop();callback(next,this.area);return true;
   },
   cancel:()=>{const callback=this.editorStart.onClose;this.scene.stop();callback(undefined,this.editorStart.area);},
  },this.histories[area],this.initial[area]);
 }
}
