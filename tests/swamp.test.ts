import {describe,it,expect} from 'vitest';
import {createSwampLayout,isSwampReed,swampEntry,swampExit,tileCenter,SWAMP_SIZE,swampBaseWater,FOREST_SWAMP_EXIT,FOREST_SWAMP_RETURN} from '../src/data/swamp';
import {defaultMap} from '../src/data/default-maps';
import {natureArt} from '../src/data/nature-catalog';
import {MapExitPassage} from '../src/systems/map-transition';
import {cloneMapEdits,validateMapEdits} from '../src/systems/map-editor';
import {readSceneMap,writeSceneMap} from '../src/systems/scene-map-edits';
import {createNewSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';

describe('Pântano',()=>{
 it('tem chegada, retorno e passarela com cabeceiras secas e guarda-corpo',()=>{
  const layout=createSwampLayout();
  for(const tile of [swampEntry(),swampExit()]){
   const p=tileCenter(tile);
   expect(layout.blocked(p.x,p.y)).toBe(false);
   expect(layout.water(p.x,p.y)).toBe(false);
  }
  const bridge=tileCenter(layout.objects.find(o=>o.kind==='swamp-boardwalk')!);
  expect(layout.water(bridge.x,bridge.y)).toBe(true);
  expect(layout.inWater(bridge.x,bridge.y)).toBe(false);
  expect(layout.allowsStep({x:bridge.x,y:bridge.y-23},{x:bridge.x,y:bridge.y-20})).toBe(false);
  expect(layout.allowsStep({x:bridge.x,y:bridge.y+20},{x:bridge.x,y:bridge.y+23})).toBe(false);
  for(const sign of [-1,1]){
   const x=bridge.x+sign*265;
   expect(layout.water(x,bridge.y)).toBe(false);
   expect(layout.allowsStep({x,y:bridge.y},{x:x-sign*4,y:bridge.y})).toBe(true);
  }
 });
 it('mantém as árvores em terra firme, as raízes sólidas e os jacarés na água',()=>{
  const layout=createSwampLayout();
  for(const object of layout.objects){
   const p=tileCenter(object);
   if(!natureArt(object.kind)?.water)expect(swampBaseWater(p.x,p.y),object.id).toBe(false);
   if(natureArt(object.kind)?.solid)expect(layout.blocked(p.x,p.y),object.id).toBe(true);
   if(object.kind==='swamp-caiman')expect(layout.inWater(p.x,p.y),object.id).toBe(true);
  }
 });
 it('mantém juncos nas margens secas, inclusive quando o terreno é editado',()=>{
  const layout=createSwampLayout();
  const reeds=layout.objects.filter(o=>isSwampReed(o.kind));
  expect(reeds.length).toBeGreaterThan(0);
  for(const reed of reeds){
   const {x,y}=tileCenter(reed);
   for(const dx of [-10,0,10])expect(layout.water(x+dx,y+4),reed.id).toBe(false);
  }
  const map=defaultMap('swamp'),[flooded,shore]=reeds;
  map.terrain[`${flooded.x},${flooded.y}`]='water';
  const edited=createSwampLayout(map);
  expect(edited.objects.some(o=>o.id===flooded.id)).toBe(false);
  expect(edited.objects.some(o=>o.id===shore.id)).toBe(true);
  expect(edited.objects.filter(o=>o.kind==='swamp-lilies')).toEqual(layout.objects.filter(o=>o.kind==='swamp-lilies'));
 });
 it('persiste pintura e colisão no save e respeita a posição nova de cada objeto',()=>{
  const data=createNewSave(createCharacterProfile('Brejo'));
  data.activeArea='swamp';data.swampPosition={...tileCenter(swampEntry()),direction:'up'};
  expect(validateSave(data)).toBe(true);
  const map=defaultMap('swamp');
  const tree=createSwampLayout().objects.find(o=>o.kind==='swamp-cypress')!;
  const previous=tileCenter(tree),next={x:18,y:62};
  const relocated=tileCenter(next);
  map.objects[tree.id]={...next};
  map.collisions={'18,61':'blocked','18,62':'clear'};
  map.terrain['18,63']='wetPath';
  expect(validateMapEdits(map)).toBe(true);
  writeSceneMap(data,'swamp',cloneMapEdits(map));
  expect(validateSave(data)).toBe(true);
  const edited=createSwampLayout(readSceneMap(data,'swamp'));
  expect(edited.blocked(previous.x,previous.y)).toBe(false);
  expect(edited.blocked(relocated.x,relocated.y)).toBe(false);
  expect(edited.objects.find(o=>o.id===tree.id)).toMatchObject(next);
  const override=tileCenter({x:18,y:61});
  expect(edited.blocked(override.x,override.y)).toBe(true);
  expect(validateMapEdits({...map,area:'forest'})).toBe(false);
  expect(validateSave({...data,swampPosition:{x:SWAMP_SIZE.width,y:200}})).toBe(false);
 });
 it('entra na saída da Floresta apenas ao andar para fora na trilha',()=>{
  const gate=tileCenter(FOREST_SWAMP_EXIT);
  const passage=new MapExitPassage();
  expect(passage.update(gate,gate,FOREST_SWAMP_EXIT,FOREST_SWAMP_RETURN)).toBe(false);
  expect(passage.update({...gate,y:gate.y-25},gate,FOREST_SWAMP_EXIT,FOREST_SWAMP_RETURN)).toBe(true);
  const north=tileCenter(swampExit());
  const back=new MapExitPassage();
  expect(back.update({...north,y:north.y+25},north,swampExit(),swampEntry())).toBe(true);
  expect(gate.x).toBe(north.x);
 });
 it('dá acesso em terra firme da nova chegada até a outra margem',()=>{
  const layout=createSwampLayout(),start=swampEntry();
  const bridge=layout.objects.find(o=>o.kind==='swamp-boardwalk')!;
  const east={x:bridge.x+10,y:bridge.y},queue=[start];
  const seen=new Set<string>([`${start.x},${start.y}`]);
  for(let i=0;i<queue.length;i++){
   const from=queue[i];
   if(from.x===east.x&&from.y===east.y)break;
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const to={x:from.x+dx,y:from.y+dy},p=tileCenter(to),key=`${to.x},${to.y}`;
    if(seen.has(key)||layout.inWater(p.x,p.y)||!layout.allowsStep(tileCenter(from),p))continue;
    seen.add(key);queue.push(to);
   }
  }
  expect(seen.has(`${east.x},${east.y}`)).toBe(true);
 });
 it('atualiza os marcadores padrão antigos e mantém o que foi pintado ou personalizado',()=>{
  const save=createNewSave(createCharacterProfile('Brejo'));
  const legacy=defaultMap('swamp');
  delete legacy.swampRevision;
  legacy.points={entry:{x:18,y:67},exit:{x:15,y:65}};
  legacy.terrain['18,63']='wetPath';
  save.swampMapEdits=legacy;
  expect(validateSave(save)).toBe(true);
  const map=readSceneMap(save,'swamp');
  expect(map.points).toEqual({entry:swampEntry(),exit:{x:15,y:65}});
  expect(map.terrain).toEqual(legacy.terrain);
  map.points!.entry={x:18,y:67};
  expect(swampEntry(map)).toEqual({x:18,y:67});
 });
});
