import {afterEach,describe,expect,it,vi} from 'vitest';
import {MAX_COINS} from '../src/data/village-commerce';
import {FOREST_ANIMALS} from '../src/data/ancient-forest';
import {HOME_SPAWN} from '../src/systems/home';
import {createNewSave,loadSave,migrateSave,SAVE_KEY,saveGame,validateSave} from '../src/systems/save';
import type {CharacterProfile} from '../src/types';

const profile:CharacterProfile={name:'Vila',skin:'#d9a276',hairStyle:'preso',hairColor:'#754323',outfit:'#638a9d'};
afterEach(()=>vi.unstubAllGlobals());
function storage(raw?:string){
  const disk=new Map<string,string>(raw?[[SAVE_KEY,raw]]:[]);
  const write=vi.fn((key:string,value:string)=>disk.set(key,value));
  vi.stubGlobal('localStorage',{getItem:(key:string)=>disk.get(key)??null,setItem:write});
  return{disk,write};
}

describe('village persistence and compatibility',()=>{
  it('starts a new wallet with 100 Crowns and keeps each save independent',()=>{
    const first=createNewSave(profile),second=createNewSave(profile);
    expect(first.villageEconomy).toEqual({coins:100,met:[]});
    first.villageEconomy!.coins=9;first.villageEconomy!.met.push('rosa');
    expect(second.villageEconomy).toEqual({coins:100,met:[]});
  });

  it('continues in the village without changing the saved property position or stock',()=>{
    storage();
    const saved=createNewSave(profile);
    saved.activeArea='village';saved.villagePosition={x:1120.5,y:1088,direction:'down-left'};
    saved.villageEconomy={coins:173,met:['rosa','bento']};
    saved.inventory.turnip=4;saved.inventory.seeds=3;
    const outside={...saved.player};
    expect(saveGame(saved)).toBe(true);
    const restored=loadSave()!;
    expect(restored).toEqual(saved);expect(restored.player).toEqual(outside);
    expect(restored.villageEconomy).not.toBe(saved.villageEconomy);
    expect(migrateSave(restored)).toEqual(saved);
    expect(migrateSave(migrateSave(restored))).toEqual(saved);
  });

  it('keeps earlier saves unchanged on read without adding money, rewards or map edits',()=>{
    const legacy=createNewSave(profile);delete legacy.villageEconomy;
    legacy.inventory.wood=23;legacy.homeSupplies={wateringCan:true,seedPacket:true};
    legacy.player.direction='right';legacy.mapEdits!.terrain['12,60']='wood';
    legacy.crops=[{x:22,y:21,growth:.4,watered:true}];
    const raw=JSON.stringify(legacy,null,2),{disk,write}=storage(raw);
    expect(validateSave(legacy)).toBe(true);expect(loadSave()).toEqual(legacy);
    expect(migrateSave(legacy)).toEqual(legacy);expect(loadSave()?.villageEconomy).toBeUndefined();
    expect(disk.get(SAVE_KEY)).toBe(raw);expect(write).not.toHaveBeenCalled();
  });

  it.each([-1,1.5,NaN,Infinity,MAX_COINS+1,'10',null])('rejects invalid wallet balance %s without overwriting the save',coins=>{
    const saved=createNewSave(profile);const raw=JSON.stringify(saved),{disk,write}=storage(raw);
    const bad={...saved,villageEconomy:{coins,met:[]}};
    expect(validateSave(bad)).toBe(false);expect(migrateSave(bad)).toBeNull();
    expect(saveGame(bad as typeof saved)).toBe(false);
    expect(disk.get(SAVE_KEY)).toBe(raw);expect(write).not.toHaveBeenCalled();
  });

  it('accepts the bounded wallet and each known villager once, rejecting unknown or duplicate introductions',()=>{
    const saved=createNewSave(profile);
    const villagers=['augusto','bento','amelia','tobias','rosa','nilo','celina','damiao','helena','icaro'];
    saved.villageEconomy={coins:MAX_COINS,met:villagers};
    expect(validateSave(saved)).toBe(true);
    for(const met of [['rosa','rosa'],['unknown'],[1],null,{},[...villagers,'rosa']])
      expect(validateSave({...saved,villageEconomy:{coins:0,met}})).toBe(false);
  });

  it('keeps the local village preview wallet while mapping its old introductions to the final villagers',()=>{
    const preview=createNewSave(profile);preview.villageEconomy={coins:173,met:['clara','bento','olivia','tomas']};
    preview.activeArea='village';preview.villagePosition={x:1000,y:1100,direction:'right'};
    const original=structuredClone(preview),raw=JSON.stringify(preview,null,2),{disk,write}=storage(raw);
    expect(validateSave(preview)).toBe(false);
    const loaded=loadSave()!;
    expect(loaded.villageEconomy).toEqual({coins:173,met:['rosa','bento','tobias','augusto']});
    expect(loaded.villagePosition).toEqual(preview.villagePosition);expect(loaded.inventory).toEqual(preview.inventory);
    expect(loaded.mapEdits).toEqual(preview.mapEdits);expect(validateSave(loaded)).toBe(true);
    expect(migrateSave(loaded)).toEqual(loaded);expect(preview).toEqual(original);
    expect(disk.get(SAVE_KEY)).toBe(raw);expect(write).not.toHaveBeenCalled();
  });

  it('validates the separate village position and allows entering an older save without one',()=>{
    const saved=createNewSave(profile);saved.activeArea='village';
    expect(validateSave(saved)).toBe(true);
    for(const position of [{x:31,y:800},{x:3041,y:800},{x:800,y:31},{x:800,y:2273},{x:NaN,y:800},{x:800,y:800,direction:'sideways'},null])
      expect(validateSave({...saved,villagePosition:position})).toBe(false);
    expect(validateSave({...saved,villagePosition:{x:32,y:2272,direction:'up-right'}})).toBe(true);
  });

  it('cannot restore an interior or an escorted animal as if it were in the village',()=>{
    const saved=createNewSave(profile);saved.activeArea='village';
    expect(validateSave({...saved,homePosition:{...HOME_SPAWN}})).toBe(false);
    expect(validateSave({...saved,animalEscort:{id:FOREST_ANIMALS[0].id,area:'property'},animalPositions:{forest:[],property:[{id:FOREST_ANIMALS[0].id,x:800,y:800,direction:'right'}]}})).toBe(false);
    expect(validateSave(saved)).toBe(true);
  });
});
