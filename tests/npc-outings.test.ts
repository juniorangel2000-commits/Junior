import {describe,expect,it} from 'vitest';
import {NPC_OUTINGS,onOuting,outingToday,outingsAt,outingDialogue,receiveOutingGift,outingGiftReceived,outingMessage} from '../src/systems/npc-outings';
import {REST_WEEKDAY,rainyDay} from '../src/data/village-schedule';
import {merchantPeriod,type RoutineId} from '../src/systems/merchant-routine';
import {FISHER_LAKE_HOURS} from '../src/data/fisher-schedule';
import {createOrchardLayout} from '../src/data/orchard';
import {createSwampLayout} from '../src/data/swamp';
import {createRuinsLayout} from '../src/data/ruins';
import {createRailwayLayout} from '../src/data/railway';
import {createCoastLayout} from '../src/data/coast';
import {fieldsBlocked} from '../src/data/open-fields';
import {calendarDate} from '../src/systems/calendar';
import {createCharacterProfile} from '../src/data/characters';
import {createNewSave,migrateSave,validateSave} from '../src/systems/save';
import {createSocialRuntime} from '../src/systems/npc-social';
import type {SaveData} from '../src/types';

const layouts={orchard:createOrchardLayout(),swamp:createSwampLayout(),ruins:createRuinsLayout(),railway:createRailwayLayout(),coast:createCoastLayout(),
  openFields:{blocked:fieldsBlocked,water:()=>false}};
/** Primeiro dia seco em que o morador sai. */
const outingDay=(id:string)=>{for(let d=1;d<400;d++)if(outingToday(id,d))return d;throw new Error(id);};

describe('saídas dos moradores para os cenários',()=>{
  it('cada morador trabalha em terra livre do seu cenário',()=>{
    for(const o of NPC_OUTINGS){
      const l=layouts[o.area];
      for(const [dx,dy] of [[-14,-10],[14,-10],[-14,8],[14,8],[0,0]]){
        expect(l.blocked(o.spot.x+dx,o.spot.y+dy),`${o.id} ${dx},${dy}`).toBe(false);
        expect(l.water(o.spot.x+dx,o.spot.y+dy),`${o.id} água`).toBe(false);
      }
    }
  });
  it('sai fora da folga, sem chuva e só no horário; a loja fica fechada nesse tempo',()=>{
    for(const o of NPC_OUTINGS){
      const rest=REST_WEEKDAY[o.id as RoutineId];
      if(rest!==undefined)expect(o.weekdays,o.id).not.toContain(rest);
      const day=outingDay(o.id);
      expect(o.weekdays).toContain(calendarDate(day).dayOfSeason%7);
      expect(onOuting(o.id,{day,time:o.start-1})).toBeUndefined();
      expect(onOuting(o.id,{day,time:o.start})).toBe(o);
      expect(onOuting(o.id,{day,time:o.end})).toBeUndefined();
      expect(outingsAt(o.area,{day,time:o.start})).toContain(o);
      expect(merchantPeriod(o.id as RoutineId,o.start+10,day)).toBe('closed');
      expect(outingMessage(o)).toContain('volta às');
    }
    for(let d=1;d<200;d++)if(rainyDay(d))for(const o of NPC_OUTINGS)expect(outingToday(o.id,d)).toBeUndefined();
    // O Damião só vai à costa depois da pesca da manhã no lago.
    const damiao=NPC_OUTINGS.find(o=>o.id==='damiao')!;
    expect(damiao.start).toBeGreaterThanOrEqual(FISHER_LAKE_HOURS.end);
  });
  it('dá um presente por dia, com amizade, e o save continua válido',()=>{
    const o=NPC_OUTINGS.find(n=>n.id==='rosa')!;
    let save=createNewSave(createCharacterProfile('Pomar'));
    save.day=outingDay('rosa');save.time=o.start+30;save.activeArea=o.area;
    const rt=createSocialRuntime(()=>save,s=>{if(!validateSave(s))return false;save=s;return true;},()=>save);
    expect(outingDialogue(save,o)[0]).toBe(o.gift.line);
    const first=receiveOutingGift(rt,'rosa');
    expect(first.ok,first.message).toBe(true);
    expect(save.inventory.apple).toBe(2);
    expect(outingGiftReceived(save,'rosa')).toBe(true);
    expect(save.npcSocial?.players.rosa?.affinity).toBe(1);
    expect(receiveOutingGift(rt,'rosa').ok).toBe(false);
    expect(outingDialogue(save,o)).toHaveLength(1);
    const loaded=migrateSave(JSON.parse(JSON.stringify(save)))!;
    expect(validateSave(loaded)).toBe(true);
    expect(loaded.npcOutingGifts).toEqual({rosa:save.day});
    // Fora do cenário ou depois do horário, não há presente.
    save.time=o.end;delete save.npcOutingGifts;
    expect(receiveOutingGift(rt,'rosa').ok).toBe(false);
  });
  it('recusa registros de presente inválidos e aceita saves sem o campo',()=>{
    const save=createNewSave(createCharacterProfile('Antigo'));
    expect(validateSave(save)).toBe(true);
    expect(validateSave({...save,npcOutingGifts:{augusto:3}} as SaveData)).toBe(false);
    expect(validateSave({...save,npcOutingGifts:{rosa:-1}} as SaveData)).toBe(false);
    expect(validateSave({...save,npcOutingGifts:{rosa:4}} as SaveData)).toBe(true);
  });
});
