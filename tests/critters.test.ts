import {describe,expect,it} from 'vitest';
import {CRITTERS,critterActive,critterPixels,critterRandom,critterSpot,critterStep,crittersOf,type CritterTerrain} from '../src/data/critters';
import {createOrchardLayout,ORCHARD_SIZE} from '../src/data/orchard';
import {createSwampLayout,SWAMP_SIZE} from '../src/data/swamp';
import {createRuinsLayout,RUINS_SIZE} from '../src/data/ruins';
import {createRailwayLayout,RAILWAY_SIZE} from '../src/data/railway';
import {createCoastLayout,COAST_SIZE} from '../src/data/coast';
import {FIELDS_SIZE,fieldsBlocked,fieldsWater} from '../src/data/open-fields';

const fromLayout=(l:{blocked:(x:number,y:number)=>boolean;water:(x:number,y:number)=>boolean},size:{width:number;height:number}):CritterTerrain=>({...size,land:(x,y)=>!l.blocked(x,y)&&!l.water(x,y),water:l.water});
const terrains:Record<string,CritterTerrain>={
  orchard:fromLayout(createOrchardLayout(),ORCHARD_SIZE),swamp:fromLayout(createSwampLayout(),SWAMP_SIZE),ruins:fromLayout(createRuinsLayout(),RUINS_SIZE),
  railway:fromLayout(createRailwayLayout(),RAILWAY_SIZE),coast:fromLayout(createCoastLayout(),COAST_SIZE),
  openFields:{...FIELDS_SIZE,land:(x,y)=>!fieldsBlocked(x,y),water:fieldsWater},
};

describe('bichos dos cenários (sprites provisórios)',()=>{
  it('todas as 16 espécies têm desenho com cores conhecidas e contorno',()=>{
    expect(CRITTERS).toHaveLength(16);
    expect(new Set(CRITTERS.map(c=>c.id)).size).toBe(16);
    for(const sp of CRITTERS)for(const rows of [...sp.art,...(sp.special??[])]){
      for(const ch of rows.join(''))if(ch!=='.')expect(sp.palette[ch],`${sp.id} '${ch}'`).toBeDefined();
      const f=critterPixels(rows,sp.palette);
      expect(f.pixels.length,sp.id).toBeGreaterThan(0);
      if(sp.id!=='firefly')expect(f.pixels.some(p=>p[2]==='#2a1a10'),sp.id).toBe(true);
    }
  });
  it('o segundo quadro do andar mexe as pernas sem mudar o resto',()=>{
    const rows=['.cc.','l..l'],step=critterStep(rows);
    expect(step[0]).toBe(rows[0]);
    expect(step[1]).not.toBe(rows[1]);
    expect([...step[1]].filter(c=>c==='l')).toHaveLength(2);
  });
  it('cada espécie encontra lugar no seu cenário, em terra, na beira da água ou sobre ela',()=>{
    for(const [area,t] of Object.entries(terrains)){
      expect(crittersOf(area).length,area).toBeGreaterThan(0);
      for(const sp of crittersOf(area)){
        const r=critterRandom(5),spot=critterSpot(sp,t,r);
        expect(spot,`${area} ${sp.id}`).toBeDefined();
        if(sp.spawn==='water')expect(t.water(spot!.x,spot!.y)).toBe(true);
        else expect(t.land(spot!.x,spot!.y),`${sp.id}`).toBe(true);
        // Longe do jogador quando reaparece.
        const away=critterSpot(sp,t,r,{x:spot!.x,y:spot!.y,r:sp.near?Math.min(300,sp.near.r):420});
        if(away)expect(Math.hypot(away.x-spot!.x,away.y-spot!.y)).toBeGreaterThanOrEqual(sp.near?Math.min(300,sp.near.r):420);
      }
    }
  });
  it('respeita a hora: vaga-lume à noite, morcego ao anoitecer, borboleta de dia',()=>{
    expect(critterActive('night',22*60)).toBe(true);expect(critterActive('night',12*60)).toBe(false);
    expect(critterActive('dusk',19*60)).toBe(true);expect(critterActive('dusk',10*60)).toBe(false);
    expect(critterActive('day',10*60)).toBe(true);expect(critterActive('day',21*60)).toBe(false);
  });
});
