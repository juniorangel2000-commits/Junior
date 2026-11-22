import {describe,expect,it} from 'vitest';
import {FESTIVALS,festivalOn,festivalNow,nextFestival,enterFestivalContest,festivalContestDone,contestItem} from '../src/systems/festivals';
import {onOuting,outingsAt,BEACH_FIRE} from '../src/systems/npc-outings';
import {merchantPeriod,type RoutineId} from '../src/systems/merchant-routine';
import {createCoastLayout} from '../src/data/coast';
import {DAYS_PER_SEASON} from '../src/systems/calendar';
import {SOCIAL_NPCS} from '../src/data/npc-social';
import {createCharacterProfile} from '../src/data/characters';
import {createNewSave,migrateSave,validateSave} from '../src/systems/save';
import {createSocialRuntime} from '../src/systems/npc-social';
import type {SaveData} from '../src/types';

const dayOf=(seasonIndex:number,dayOfSeason:number,year=1)=>(year-1)*4*DAYS_PER_SEASON+seasonIndex*DAYS_PER_SEASON+dayOfSeason;

describe('festivais da vila',()=>{
  it('um por estação, num dia fixo, e o próximo é encontrado',()=>{
    expect(FESTIVALS).toHaveLength(4);
    expect(new Set(FESTIVALS.map(f=>f.seasonIndex)).size).toBe(4);
    for(const f of FESTIVALS){
      expect(festivalOn(dayOf(f.seasonIndex,f.dayOfSeason))).toBe(f);
      expect(festivalOn(dayOf(f.seasonIndex,f.dayOfSeason,2))).toBe(f);
      expect(festivalOn(dayOf(f.seasonIndex,f.dayOfSeason)+1)).toBeUndefined();
    }
    expect(nextFestival(1)).toMatchObject({festival:FESTIVALS[0],inDays:13});
  });
  it('nas festas da vila as lojas param e todos vão à praça; na praia, todos vão à Costa',()=>{
    const fair=FESTIVALS.find(f=>f.id==='seed-fair')!,day=dayOf(0,14);
    for(const id of ['augusto','rosa','nilo'] as RoutineId[]){
      expect(merchantPeriod(id,fair.start+30,day)).toBe('break');
      expect(onOuting(id,{day,time:fair.start+30})).toBeUndefined();
    }
    const beach=FESTIVALS.find(f=>f.place==='coast')!,bday=dayOf(1,14),clock={day:bday,time:beach.start+30};
    expect(festivalNow(clock)).toBe(beach);
    expect(outingsAt('coast',clock)).toHaveLength(SOCIAL_NPCS.length);
    expect(merchantPeriod('rosa',clock.time,bday)).toBe('closed');
    const coast=createCoastLayout();
    expect(coast.water(BEACH_FIRE.x,BEACH_FIRE.y)).toBe(false);
    for(const o of outingsAt('coast',clock)){
      expect(coast.water(o.spot.x,o.spot.y),o.id).toBe(false);
      expect(coast.blocked(o.spot.x,o.spot.y),o.id).toBe(false);
    }
    // Fora do horário, a rotina volta ao normal.
    expect(outingsAt('coast',{day:bday,time:beach.end+5}).every(o=>!o.festival)).toBe(true);
  });
  it('o concurso recebe a entrega uma vez por ano e dá o prêmio',()=>{
    const f=FESTIVALS.find(f=>f.id==='beach-party')!;
    let save:SaveData=createNewSave(createCharacterProfile('Festa'));
    save.day=dayOf(1,14);save.time=f.start+60;
    const rt=createSocialRuntime(()=>save,s=>{if(!validateSave(s))return false;save=s;return true;},()=>save);
    expect(enterFestivalContest(rt,f).ok).toBe(false);
    save.inventory.crab=4;
    expect(contestItem(save,f)).toBe('crab');
    const coins=save.villageEconomy!.coins;
    const r=enterFestivalContest(rt,f);
    expect(r.ok,r.message).toBe(true);
    expect(save.inventory.crab).toBe(1);
    expect(save.villageEconomy!.coins).toBe(coins+f.reward.coins);
    expect(festivalContestDone(save,f)).toBe(true);
    expect(enterFestivalContest(rt,f).ok).toBe(false);
    // No ano seguinte, pode de novo.
    expect(festivalContestDone({...save,day:dayOf(1,14,2)},f)).toBe(false);
    const loaded=migrateSave(JSON.parse(JSON.stringify(save)))!;
    expect(validateSave(loaded)).toBe(true);
    expect(validateSave({...loaded,festivalDone:{'festa-falsa':1}})).toBe(false);
  });
});
