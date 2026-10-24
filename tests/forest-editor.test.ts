import {describe,it,expect} from 'vitest';
import {emptyMapEdits,validateMapEdits,cloneMapEdits,saveMapDraft,loadMapDraft} from '../src/systems/map-editor';
import {NATURE_KINDS} from '../src/data/nature-catalog';
import {createNewSave,validateSave,migrateSave} from '../src/systems/save';
import {forestWater,forestBlocked} from '../src/data/ancient-forest';

describe('separate forest editor data',()=>{
 it('round-trips every new sprite and both transition markers',()=>{
   const data=emptyMapEdits('forest');
   NATURE_KINDS.forEach((kind,i)=>data.objects[`editor-${kind}-test`]={kind,x:4+i,y:30});
   data.points={entry:{x:48,y:60},exit:{x:48,y:61}};
   expect(validateMapEdits(data)).toBe(true);expect(cloneMapEdits(data)).toEqual(data);
 });
 it('allows lake rocks on water but rejects trees and submerged arrival points',()=>{
   const data=emptyMapEdits('forest');data.terrain['54,16']='water';
   data.objects['editor-lakeRockD-test']={kind:'lakeRockD',x:54,y:16};expect(validateMapEdits(data)).toBe(true);
   data.points={entry:{x:54,y:16}};expect(validateMapEdits(data)).toBe(false);delete data.points;
   delete data.objects['editor-lakeRockD-test'];data.objects['editor-oakA-test']={kind:'oakA',x:54,y:16};expect(validateMapEdits(data)).toBe(false);
 });
 it('keeps property and forest drafts independent',()=>{
   const map=new Map<string,string>(),storage={getItem:(key:string)=>map.get(key)??null,setItem:(key:string,value:string)=>{map.set(key,value);}};
   const property=emptyMapEdits(),forest=emptyMapEdits('forest');forest.points={exit:{x:48,y:60}};
   expect(saveMapDraft(property,storage)).toBe(true);expect(saveMapDraft(forest,storage)).toBe(true);
   expect(loadMapDraft(storage)).toEqual(property);expect(loadMapDraft(storage,'forest')).toEqual(forest);
 });
 it('preserves both edited maps in a save and rejects a forest map in the property field',()=>{
   const save=createNewSave({name:'Editor',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso'});
   save.mapEdits=emptyMapEdits();save.forestMapEdits=emptyMapEdits('forest');save.forestMapEdits.points={exit:{x:48,y:60}};
   expect(validateSave(save)).toBe(true);expect(migrateSave(JSON.parse(JSON.stringify(save)))?.forestMapEdits).toEqual(save.forestMapEdits);
   save.mapEdits=save.forestMapEdits;expect(validateSave(save)).toBe(false);
 });
 it('blocks water where the wooden deck used to be',()=>{
   let checked=0;for(let y=14;y<=16;y++)for(let x=66;x<=73;x++)if(forestWater(x,y)){checked++;expect(forestBlocked(x,y)).toBe(true);}
   expect(checked).toBeGreaterThan(0);
 });
});
