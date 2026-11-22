import {existsSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {createCoastLayout,coastBaseWater,coastShoreX,COAST_ORIGINAL_OBJECTS} from '../src/data/coast';
import {COAST_KINDS} from '../src/data/coast-art';
import {createRailwayLayout} from '../src/data/railway';
import {COAST_ENTRY,COAST_EXIT,RAILWAY_COAST_EXIT,RAILWAY_COAST_RETURN,tileMidpoint} from '../src/data/ruins-road';
import {defaultMap} from '../src/data/default-maps';
import {createCharacterProfile} from '../src/data/characters';
import {readSceneMap,writeSceneMap} from '../src/systems/scene-map-edits';
import {createNewSave,migrateSave,validateSave} from '../src/systems/save';
import {validateMapEdits} from '../src/systems/map-editor';
import {MapExitPassage} from '../src/systems/map-transition';

describe('Costa das Marés',()=>{
  it('continua o asfalto acessível nos dois sentidos, mesmo com pinturas antigas nas chegadas',()=>{
    const east=tileMidpoint(RAILWAY_COAST_EXIT),west=tileMidpoint(COAST_EXIT);
    expect(new MapExitPassage().update({x:east.x-24,y:east.y},east,RAILWAY_COAST_EXIT,RAILWAY_COAST_RETURN)).toBe(true);
    expect(new MapExitPassage().update({x:west.x+24,y:west.y},west,COAST_EXIT,COAST_ENTRY)).toBe(true);
    for(let x=0;x<96;x++)for(const y of [2.5,4.5,6.5])expect(coastBaseWater((x+.5)*32,y*32)).toBe(false);
    for(const [factory,area,p] of [
      [createCoastLayout,'coast',COAST_ENTRY],[createRailwayLayout,'railway',RAILWAY_COAST_RETURN],
    ] as const){
      const cell=`${p.x},${p.y}`,pos=tileMidpoint(p),map=defaultMap(area);
      map.terrain[cell]='water';map.collisions={[cell]:'blocked'};
      const layout=factory(map);
      expect(layout.water(pos.x,pos.y)).toBe(false);
      expect(layout.blocked(pos.x,pos.y)).toBe(false);
    }
  });
  it('conecta a praia com o mar e restringe o píer à entrada de terra',()=>{
    const layout=createCoastLayout(),[start]=layout.pierEntries;
    expect(layout.blocked(start.x,start.y)).toBe(false);
    expect(layout.inWater(start.x,start.y)).toBe(false);
    expect(layout.allowsStep(start,{x:start.x+22,y:start.y})).toBe(true);
    const deck={x:start.x+366,y:start.y},above={x:deck.x,y:deck.y-35},below={x:deck.x,y:deck.y+35};
    expect(layout.water(deck.x,deck.y)).toBe(true);
    expect(layout.inWater(deck.x,deck.y)).toBe(false);
    for(const swimmer of [above,below]){
      expect(layout.inWater(swimmer.x,swimmer.y)).toBe(true);
      expect(layout.allowsStep(swimmer,deck)).toBe(false);
      expect(layout.allowsStep(deck,swimmer)).toBe(false);
    }
    const y=27*32,x=coastShoreX(y);
    expect(layout.allowsStep({x:x-4,y},{x:x+4,y})).toBe(true);
    expect(layout.inWater(x+5,y)).toBe(true);
  });
  it('mantém as peças separadas e aceita edição e salvamento compatíveis',()=>{
    const ids=COAST_ORIGINAL_OBJECTS.map(o=>o.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(500);
    for(const kind of COAST_KINDS)expect(existsSync(`public/assets/visual/coast/${kind.slice(6)}.png`),kind).toBe(true);
    const save=createNewSave(createCharacterProfile('Costa'));
    save.activeArea='coast';
    save.coastPosition={x:700,y:320,direction:'right'};
    const map=readSceneMap(save,'coast');
    const boat=COAST_ORIGINAL_OBJECTS.find(o=>o.kind==='coast-boat')!;
    map.objects[boat.id]={x:boat.x,y:boat.y+1};
    const tile='20,32';
    map.terrain[tile]='sand';map.collisions={[tile]:'blocked'};
    writeSceneMap(save,'coast',map);
    expect(validateMapEdits(map)).toBe(true);
    expect(validateMapEdits({...map,area:'railway'})).toBe(false);
    expect(createCoastLayout(map).objects.find(o=>o.id===boat.id)?.y).toBe(boat.y+1);
    expect(createCoastLayout(map).blocked(20.5*32,32.5*32)).toBe(true);
    const loaded=migrateSave(JSON.parse(JSON.stringify(save)));
    expect(loaded?.coastMapEdits).toEqual(map);
    expect(loaded?.coastPosition).toEqual(save.coastPosition);
    expect(validateSave({...save,coastPosition:{x:-1,y:450}})).toBe(false);
  });
});
