import {existsSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {VILLAGE_ORCHARD_EXIT,VILLAGE_ORCHARD_RETURN,ORCHARD_ENTRY,ORCHARD_EXIT} from '../src/data/orchard-gate';
import {ORCHARD_OBJECTS,ORCHARD_POND,ORCHARD_REGROW_DAYS,createOrchardLayout} from '../src/data/orchard';
import {ORCHARD_FRUITS,ORCHARD_KINDS,orchardArt,orchardFruitFile} from '../src/data/orchard-art';
import {villagePointBlocked} from '../src/data/village';
import {TILE} from '../src/data/world-size';
import {VALLEY_LAYOUT,VALLEY_SEAMS,valleySeamWeight} from '../src/data/valley-seams';
import {defaultMap} from '../src/data/default-maps';
import {createCharacterProfile} from '../src/data/characters';
import {createNewSave,migrateSave,validateSave} from '../src/systems/save';
import {collectOrchardFruit} from '../src/systems/orchard-harvest';
import {MapExitPassage} from '../src/systems/map-transition';
import {readSceneMap,writeSceneMap} from '../src/systems/scene-map-edits';

const midpoint=(p:{x:number;y:number})=>({x:(p.x+.5)*TILE,y:(p.y+.5)*TILE});
const matches=(path:string)=>existsSync('public/'+path);

describe('Pomar Abandonado',()=>{
  it('liga a trilha a leste da Vila e mantém as duas chegadas secas',()=>{
    const exit=midpoint(VILLAGE_ORCHARD_EXIT),back=midpoint(ORCHARD_EXIT);
    expect(new MapExitPassage().update({x:exit.x-24,y:exit.y},exit,VILLAGE_ORCHARD_EXIT,VILLAGE_ORCHARD_RETURN)).toBe(true);
    expect(new MapExitPassage().update({x:back.x+24,y:back.y},back,ORCHARD_EXIT,ORCHARD_ENTRY)).toBe(true);
    expect(VALLEY_LAYOUT.orchard.y+ORCHARD_ENTRY.y*TILE).toBe(VILLAGE_ORCHARD_EXIT.y*TILE);
    const seam=VALLEY_SEAMS.find(s=>s.first==='village'&&s.second==='orchard')!;
    expect(valleySeamWeight(seam,exit.y,0)).toBe(0);
    for(let x=90*TILE;x<94.5*TILE;x+=4)expect(villagePointBlocked(x,exit.y)).toBe(false);
    const layout=createOrchardLayout(),entry=midpoint(ORCHARD_ENTRY);
    expect(layout.blocked(entry.x,entry.y)).toBe(false);
    expect(layout.water(entry.x,entry.y)).toBe(false);
    expect(layout.water(ORCHARD_POND.x*TILE,ORCHARD_POND.y*TILE)).toBe(true);
  });
  it('carrega peças de arte separadas, bases sólidas e frutas em terra',()=>{
    expect(new Set(ORCHARD_OBJECTS.map(o=>o.id)).size).toBe(ORCHARD_OBJECTS.length);
    for(const kind of ORCHARD_KINDS)expect(matches(`assets/visual/orchard/${kind.slice(8)}${orchardArt(kind)?.fruit?'-tree':''}.png`),kind).toBe(true);
    for(const fruit of ORCHARD_FRUITS)expect(matches(orchardFruitFile(fruit)),fruit).toBe(true);
    const layout=createOrchardLayout();
    for(const fruit of ORCHARD_FRUITS)expect(layout.fruit.some(spot=>spot.item===fruit),fruit).toBe(true);
    for(const fruit of layout.fruit)expect(layout.blocked(fruit.x,fruit.y)||layout.water(fruit.x,fruit.y)).toBe(false);
    for(const landmark of layout.objects.filter(o=>o.kind==='orchard-press'||o.kind==='orchard-shed')){
      const p=layout.pivot(landmark);
      expect(layout.blocked(p.x,p.y-12)).toBe(true);
      expect(layout.inspectNear(p.x,p.y+32)).toBeDefined();
    }
  });
  it('recolhe uma fruta por vez, respeita a regeneração e não perde uma fruta se o save falhar',()=>{
    const save=createNewSave(createCharacterProfile('Pomar'));
    save.activeArea='orchard';
    const spot=createOrchardLayout().fruit[0];
    expect(collectOrchardFruit(save,spot,spot,()=>false)).toContain('Não foi possível salvar');
    expect(save.inventory[spot.item]).toBe(0);
    expect(save.orchardHarvest).toBeUndefined();
    expect(collectOrchardFruit(save,spot,spot,validateSave)).toContain('na mochila');
    expect(save.inventory[spot.item]).toBe(1);
    const resumed=migrateSave(structuredClone(save))!;
    expect(collectOrchardFruit(resumed,spot,spot,validateSave)).toContain('já foi recolhida');
    resumed.day+=ORCHARD_REGROW_DAYS;
    expect(collectOrchardFruit(resumed,spot,spot,validateSave)).toContain('na mochila');
    expect(resumed.inventory[spot.item]).toBe(2);
  });
  it('aceita edição de colisão e mapas próprios, e migra a mochila prévia',()=>{
    const old=createNewSave(createCharacterProfile('Pomar'));
    for(const fruit of ORCHARD_FRUITS)delete (old.inventory as Partial<typeof old.inventory>)[fruit];
    const save=migrateSave(old)!;
    expect(save.inventory.apple).toBe(0);
    const map=defaultMap('orchard');
    map.terrain['31,58']='path';
    map.collisions={'31,58':'blocked'};
    writeSceneMap(save,'orchard',map);
    const p=midpoint({x:31,y:58});
    expect(createOrchardLayout(map).blocked(p.x,p.y)).toBe(true);
    expect(validateSave(save)).toBe(true);
    expect(readSceneMap(save,'orchard')).toEqual(map);
  });
});
