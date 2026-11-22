import {describe,expect,it} from 'vitest';
import {existsSync} from 'node:fs';
import {FORAGE_SPOTS,collectForage,forageNear,forageReady,forageSpotsIn} from '../src/systems/forage';
import {createCoastLayout} from '../src/data/coast';
import {createSwampLayout} from '../src/data/swamp';
import {DISH_RECIPES,dishRecipe} from '../src/data/kitchen';
import {NPC_STORIES} from '../src/data/npc-stories';
import {ITEM_NAMES,VILLAGE_ITEM_IDS} from '../src/data/items';
import {unitPrice} from '../src/data/village-commerce';
import {createCharacterProfile} from '../src/data/characters';
import {createNewSave,migrateSave,validateSave} from '../src/systems/save';
import type {SaveData} from '../src/types';

describe('atividades nos cenários novos',()=>{
  it('conchas ficam na areia da Costa e íris nas lagoas do Pântano, em terra',()=>{
    const coast=createCoastLayout(),swamp=createSwampLayout();
    expect(forageSpotsIn('coast').length).toBeGreaterThanOrEqual(8);
    expect(forageSpotsIn('swamp')).toHaveLength(3);
    for(const s of FORAGE_SPOTS){
      const l=s.area==='coast'?coast:swamp;
      expect(l.water(s.x,s.y),s.id).toBe(false);
      expect(l.blocked(s.x,s.y),s.id).toBe(false);
    }
    expect(new Set(FORAGE_SPOTS.map(s=>s.id)).size).toBe(FORAGE_SPOTS.length);
  });
  it('recolhe uma vez, volta depois dos dias certos e o save continua válido',()=>{
    const s:SaveData=createNewSave(createCharacterProfile('Praia'));s.activeArea='coast';s.day=5;
    const spot=forageSpotsIn('coast')[0];
    expect(forageNear(s,'coast',spot)?.id).toBe(spot.id);
    expect(collectForage(s,spot,spot,()=>false)).toContain('Não foi possível');
    expect(s.inventory.shell).toBe(0);
    expect(collectForage(s,spot,spot,validateSave)).toContain('Concha');
    expect(s.inventory.shell).toBe(1);
    expect(forageReady(s,spot)).toBe(false);
    expect(collectForage(s,spot,spot,validateSave)).toContain('Já foi');
    s.day+=spot.regrow;expect(forageReady(s,spot)).toBe(true);
    const loaded=migrateSave(JSON.parse(JSON.stringify(s)))!;
    expect(validateSave(loaded)).toBe(true);
    expect(validateSave({...loaded,forageHarvest:{'shell-99':1}})).toBe(false);
  });
  it('itens novos têm nome, ícone, comprador e entram em saves antigos',()=>{
    for(const id of ['shell','blueIris','crab'] as const){
      expect(ITEM_NAMES[id]).toBeTruthy();
      expect(existsSync(`public/assets/visual/items/${id}.png`),id).toBe(true);
      expect(VILLAGE_ITEM_IDS).toContain(id);
    }
    expect(unitPrice('tailor','sell','shell')).toBeGreaterThan(0);
    expect(unitPrice('fisher','sell','crab')).toBeGreaterThan(0);
    const old=createNewSave(createCharacterProfile('Antigo'));
    for(const id of ['shell','blueIris','crab'])delete (old.inventory as Record<string,number>)[id];
    const m=migrateSave(old)!;
    expect(m.inventory.shell).toBe(0);expect(validateSave(m)).toBe(true);
  });
  it('receitas das frutas e do caranguejo têm arte e ingredientes que existem',()=>{
    for(const id of ['orangeJuice','pearJam','applePie','crabStew']){
      const r=dishRecipe(id)!;
      expect(r,id).toBeDefined();
      expect(existsSync(`public/assets/visual/kitchen/dishes/${id}.png`),id).toBe(true);
      for(const item of Object.keys(r.ingredients))expect(ITEM_NAMES[item as keyof typeof ITEM_NAMES],`${id} ${item}`).toBeTruthy();
    }
    expect(DISH_RECIPES.some(r=>r.ingredients.apple)).toBe(true);
  });
  it('Amélia e Nilo têm histórias de 3 partes ligadas aos cenários novos',()=>{
    expect(NPC_STORIES.amelia!.parts.some(p=>p.need.blueIris)).toBe(true);
    expect(NPC_STORIES.nilo!.title).toContain('três pontas');
    for(const id of ['amelia','nilo'] as const)for(const p of NPC_STORIES[id]!.parts)
      for(const item of Object.keys(p.need))expect(ITEM_NAMES[item as keyof typeof ITEM_NAMES],`${id} ${item}`).toBeTruthy();
  });
});
