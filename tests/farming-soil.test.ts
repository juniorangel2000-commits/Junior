import { afterEach, describe, expect, it, vi } from 'vitest';
import { Farming, GROWTH_SECONDS, soilGroundReason, type SoilGround } from '../src/systems/farming';
import { Inventory, MAX_ITEM_COUNT } from '../src/systems/inventory';
import { craft } from '../src/systems/crafting';
import { createNewSave, migrateSave, saveGame, loadSave, SAVE_KEY, validateSave } from '../src/systems/save';
import { quickAction, validQuickbar } from '../src/systems/quickbar';
import type { CharacterProfile } from '../src/types';

const ground: SoilGround = { area: 'property', terrainAt: () => 'grass', occupied: () => false, reserved: () => false };
const profile: CharacterProfile = { name:'Ana', skin:'#d9a276', hairStyle:'preso', hairColor:'#754323', outfit:'#638a9d' };
afterEach(() => vi.unstubAllGlobals());

describe('enxada e novos canteiros', () => {
  it('fabrica uma única enxada com componentes e equipa pelo inventário', () => {
    const inventory = new Inventory({ handle:2, flakedStone:2, cord:2 });
    expect(craft('hoe',inventory,false).ok).toBe(true);
    expect(inventory.data).toMatchObject({hoe:1,handle:1,flakedStone:1,cord:1});
    const before = {...inventory.data};
    expect(craft('hoe',inventory,false).ok).toBe(false);
    expect(inventory.data).toEqual(before);
    expect(quickAction('item:hoe')).toBe('hoe');
    expect(validQuickbar(['item:hoe',null,null,null,null,null,null,null,null])).toBe(true);
  });

  it('não prepara sem enxada, nem planta fora do solo preparado', () => {
    const farming = new Farming(), inventory = new Inventory({seeds:2});
    expect(farming.prepare(40,40,inventory,ground).ok).toBe(false);
    expect(farming.plant(40,40,inventory).ok).toBe(false);
    expect(farming.preparedSoil).toEqual([]);
    expect(inventory.data.seeds).toBe(2);
  });

  it('recusa água, caminhos, pisos e areia, bloqueios, locais reservados e floresta', () => {
    const farming = new Farming(), inventory = new Inventory({hoe:1});
    const blocked: SoilGround[] = [
      ...['water','path','wetPath','forestPath','wood','paving','sand'].map(terrain => ({...ground,terrainAt:()=>terrain})),
      {...ground,occupied:()=>true}, {...ground,reserved:()=>true}, {...ground,area:'forest'},
    ];
    for (const context of blocked) expect(farming.prepare(40,40,inventory,context).ok).toBe(false);
    for (const [x,y] of [[0,40],[95,40],[40,71],[40.5,40],[NaN,40]]) expect(soilGroundReason(x,y,ground)).not.toBe('');
    expect(farming.preparedSoil).toEqual([]);
  });

  it('completa o ciclo fora da horta, preserva o canteiro e mantém a missão após gastar a colheita', () => {
    const farming = new Farming(), inventory = new Inventory({hoe:1,seeds:1});
    expect(farming.prepare(40,40,inventory,ground).ok).toBe(true);
    expect(farming.prepare(40,40,inventory,ground).ok).toBe(false);
    expect(farming.plant(40,40,inventory).ok).toBe(true);
    expect(farming.prepare(40,40,inventory,ground).ok).toBe(false);
    expect(farming.water(40,40).ok).toBe(true);
    farming.update(GROWTH_SECONDS);
    expect(farming.harvest(40,40,inventory).ok).toBe(true);
    expect(inventory.data).toMatchObject({hoe:1,turnip:1,seeds:1});
    inventory.spend({turnip:1});
    expect(farming.progress).toEqual({prepared:true,planted:true,watered:true,harvested:true});
    expect(farming.isPrepared(40,40)).toBe(true);
    expect(farming.harvest(40,40,inventory).ok).toBe(false);
    expect(farming.plant(40,40,inventory).ok).toBe(true);
  });

  it('não completa a missão nem remove a planta quando a colheita não cabe', () => {
    const inventory = new Inventory({hoe:1,seeds:MAX_ITEM_COUNT});
    const farming = new Farming([{x:40,y:40,watered:true,growth:1}],[{x:40,y:40}]);
    expect(farming.harvest(40,40,inventory).ok).toBe(false);
    expect(farming.progress.harvested).toBe(false);
    expect(farming.cropAt(40,40)).toBeDefined();
  });

  it('desfaz só o canteiro vazio escolhido, sem consumir recursos e permitindo preparar outra vez', () => {
    const farming=new Farming(),inventory=new Inventory({hoe:1,seeds:1});
    farming.prepare(40,40,inventory,ground);farming.prepare(41,40,inventory,ground);
    expect(farming.restore(40,40,new Inventory()).ok).toBe(false);
    expect(farming.restore(42,40,inventory).ok).toBe(false);
    expect(farming.restore(40,40,inventory).ok).toBe(true);
    expect(farming.preparedSoil).toEqual([{x:41,y:40}]);
    expect(farming.plant(40,40,inventory).ok).toBe(false);
    expect(inventory.data).toMatchObject({hoe:1,seeds:1});
    expect(farming.restore(40,40,inventory).ok).toBe(false);
    expect(farming.progress.prepared).toBe(true);
    expect(farming.prepare(40,40,inventory,ground).ok).toBe(true);
  });

  it('protege plantas de qualquer estágio contra a restauração do chão', () => {
    const inventory=new Inventory({hoe:1});
    for(const growth of [0,.5,1]) {
      const farming=new Farming([{x:40,y:40,growth,watered:true}],[{x:40,y:40}]);
      expect(farming.restore(40,40,inventory).ok).toBe(false);
      expect(farming.preparedSoil).toEqual([{x:40,y:40}]);
      expect(farming.crops[0].growth).toBe(growth);
    }
  });

  it('trata os 45 quadrados da horta inicial como canteiros removíveis e replantáveis', () => {
    const inventory=new Inventory({hoe:1,seeds:1}),farming=new Farming();
    expect(farming.soilTiles).toHaveLength(45);
    for (let y=20;y<=24;y++) for (let x=21;x<=29;x++) expect(farming.restore(x,y,inventory).ok).toBe(true);
    expect(farming.soilTiles).toEqual([]);
    expect(farming.restoredFarmSoil).toHaveLength(45);
    expect(farming.plant(21,20,inventory).ok).toBe(false);
    expect(farming.prepare(21,20,inventory,ground).ok).toBe(true);
    expect(farming.soilTiles).toEqual([{x:21,y:20}]);
    expect(farming.plant(21,20,inventory).ok).toBe(true);
    expect(farming.restore(21,20,inventory).ok).toBe(false);
  });
});

describe('continuidade do cultivo', () => {
  it('migra um save real v2 sem o novo item, preservando tudo e sem alterar o armazenamento', () => {
    const old = createNewSave(profile);
    old.crops=[{x:22,y:22,watered:true,growth:.7}]; old.inventory.turnip=3;
    const legacy = JSON.parse(JSON.stringify(old)); delete legacy.inventory.hoe;
    const raw = JSON.stringify(legacy);
    const setItem = vi.fn();
    vi.stubGlobal('localStorage',{getItem:()=>raw,setItem});
    const migrated = loadSave()!;
    expect(migrated).toEqual(old);
    expect(validateSave(migrated)).toBe(true);
    expect(JSON.stringify(legacy)).toBe(raw);
    expect(setItem).not.toHaveBeenCalled();
    const farming = new Farming(migrated.crops,migrated.preparedSoil,migrated.farmingProgress);
    expect(farming.cropAt(22,22)?.growth).toBe(.7);
    expect(farming.plant(21,20,new Inventory({seeds:1})).ok).toBe(true);
    delete legacy.inventory.stone;
    expect(migrateSave(legacy)).toBeNull();
  });

  it('salva e recarrega após preparar, plantar, regar e colher, sem repetir colheitas', () => {
    const slots=new Map<string,string>();
    vi.stubGlobal('localStorage',{getItem:(k:string)=>slots.get(k)??null,setItem:(k:string,v:string)=>slots.set(k,v)});
    let state=createNewSave(profile), inventory=new Inventory({hoe:1,seeds:1}), farming=new Farming();
    const reload=()=>{
      state={...state,inventory:{...inventory.data},preparedSoil:farming.preparedSoil,crops:farming.crops,farmingProgress:farming.progress,equippedTool:'hoe'};
      expect(saveGame(state)).toBe(true);
      state=loadSave()!; expect(validateSave(state)).toBe(true);
      inventory=new Inventory(state.inventory);farming=new Farming(state.crops,state.preparedSoil,state.farmingProgress);
    };
    farming.prepare(40,40,inventory,ground);reload();expect(farming.isPrepared(40,40)).toBe(true);
    farming.plant(40,40,inventory);reload();expect(inventory.data.seeds).toBe(0);
    farming.water(40,40);farming.update(GROWTH_SECONDS/2);reload();expect(farming.cropAt(40,40)?.growth).toBe(.5);
    farming.update(GROWTH_SECONDS/2);farming.harvest(40,40,inventory);reload();
    expect(farming.harvest(40,40,inventory).ok).toBe(false);expect(inventory.data.turnip).toBe(1);
    expect(farming.progress.harvested).toBe(true);expect(slots.has(SAVE_KEY)).toBe(true);
    farming.restore(40,40,inventory);reload();
    expect(farming.isPrepared(40,40)).toBe(false);
    expect(farming.preparedSoil).toEqual([]);
    expect(farming.progress.harvested).toBe(true);
  });

  it('recusa canteiros duplicados, fora do mapa, plantas sem canteiro e construções sobre o solo', () => {
    const state=createNewSave(profile);state.preparedSoil=[{x:40,y:40}];state.crops=[{x:40,y:40,watered:false,growth:0}];
    expect(validateSave(state)).toBe(true);
    expect(validateSave({...state,preparedSoil:[]})).toBe(false);
    expect(validateSave({...state,preparedSoil:[{x:40,y:40},{x:40,y:40}]})).toBe(false);
    expect(validateSave({...state,preparedSoil:[{x:96,y:40}]})).toBe(false);
    expect(validateSave({...state,buildings:[{kind:'roof',x:39,y:40}]})).toBe(false);
    expect(validateSave({...state,farmingProgress:{prepared:true}})).toBe(false);
    state.equippedTool='hoe';expect(validateSave(state)).toBe(false);
  });

  it('persiste a horta inicial desfeita, libera construção e não aceita plantas no solo devolvido à grama', () => {
    const state=createNewSave(profile);state.inventory.hoe=1;
    const farming=new Farming();farming.restore(21,20,new Inventory(state.inventory));
    state.restoredFarmSoil=farming.restoredFarmSoil;
    const migrated=migrateSave(JSON.parse(JSON.stringify(state)))!;
    expect(validateSave(migrated)).toBe(true);
    expect(new Farming(migrated.crops,migrated.preparedSoil,migrated.farmingProgress,migrated.restoredFarmSoil).isPrepared(21,20)).toBe(false);
    expect(validateSave({...state,buildings:[{kind:'floor',x:21,y:20}]})).toBe(true);
    expect(validateSave({...state,crops:[{x:21,y:20,growth:0,watered:false}]})).toBe(false);
    expect(validateSave({...state,restoredFarmSoil:[{x:21,y:20},{x:21,y:20}]})).toBe(false);
    expect(validateSave({...state,restoredFarmSoil:[{x:40,y:40}]})).toBe(false);
  });
});
