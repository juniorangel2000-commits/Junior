import {existsSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {createCoastLayout,coastBaseWater,coastSeaY,COAST_ORIGINAL_OBJECTS} from '../src/data/coast';
import {COAST_KINDS} from '../src/data/coast-art';
import {tileMidpoint} from '../src/data/ruins-road';
import {COAST_ENTRY,COAST_EXIT,FIELDS_COAST_EXIT,FIELDS_COAST_RETURN,coastRiverBanksAt,fieldsRiverBanksAt} from '../src/data/fields-river';
import {FIELDS_SIZE,fieldsSafe} from '../src/data/open-fields';
import {riverBanksAt} from '../src/data/property-water';
import {defaultMap} from '../src/data/default-maps';
import {createCharacterProfile} from '../src/data/characters';
import {readSceneMap,writeSceneMap} from '../src/systems/scene-map-edits';
import {createNewSave,migrateSave,validateSave} from '../src/systems/save';
import {validateMapEdits} from '../src/systems/map-editor';
import {MapExitPassage} from '../src/systems/map-transition';

describe('Costa das Marés',()=>{
  it('liga Campos Abertos e Costa pelos acessos secos ao sul e ao norte',()=>{
    const south=tileMidpoint(FIELDS_COAST_EXIT),north={...tileMidpoint(COAST_EXIT),y:62};
    expect(new MapExitPassage().update({x:south.x,y:south.y-24},south,FIELDS_COAST_EXIT,FIELDS_COAST_RETURN)).toBe(true);
    expect(new MapExitPassage().update({x:north.x,y:north.y+24},north,COAST_EXIT,COAST_ENTRY)).toBe(true);
    expect(fieldsSafe(tileMidpoint(FIELDS_COAST_RETURN))).toBe(true);
    const cell=`${COAST_ENTRY.x},${COAST_ENTRY.y}`,pos=tileMidpoint(COAST_ENTRY),map=defaultMap('coast');
    map.terrain[cell]='water';map.collisions={[cell]:'blocked'};
    const layout=createCoastLayout(map);
    expect(layout.water(pos.x,pos.y)).toBe(false);
    expect(layout.blocked(pos.x,pos.y)).toBe(false);
  });
  it('preserva as duas margens nas divisas e faz o rio desaguar no mar',()=>{
    expect(fieldsRiverBanksAt(0)).toEqual(riverBanksAt(FIELDS_SIZE.height));
    expect(fieldsRiverBanksAt(FIELDS_SIZE.height)).toEqual(coastRiverBanksAt(0));
    for(let y=0;y<FIELDS_SIZE.height;y+=8){
      const {left,right}=coastRiverBanksAt(y);
      expect(coastBaseWater((left+right)/2,y)).toBe(true);
    }
    const x=2780,y=coastSeaY(x);
    expect(coastBaseWater(x,y-8)).toBe(false);
    expect(coastBaseWater(x,y+8)).toBe(true);
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
    const x=1120,y=coastSeaY(x);
    expect(layout.allowsStep({x,y:y-4},{x,y:y+4})).toBe(true);
    expect(layout.inWater(x,y+5)).toBe(true);
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
