import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {describe,expect,it} from 'vitest';
import {BUTTERFLY_VARIANTS,CRITTER_ART,CRITTER_CELL,CRITTER_POSES,CRITTER_ROW_WIDTH,CRITTER_VIEWS,CRITTERS,critterActive,critterDirection,critterFrame,critterRandom,critterSpot,crittersOf,type CritterTerrain} from '../src/data/critters';
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

describe('bichos dos cenários',()=>{
  it('carrega os quadros de todas as vistas e as quatro cores de borboleta',()=>{
    const {PNG}=createRequire(import.meta.url)('pngjs');
    const sheet=PNG.sync.read(readFileSync('public/'+CRITTER_ART));
    const rows=CRITTERS.length+BUTTERFLY_VARIANTS-1;
    const frames=CRITTERS.flatMap(s=>Array.from({length:s.id==='butterfly'?BUTTERFLY_VARIANTS:1},(_,variant)=>
      CRITTER_VIEWS.map(direction=>critterFrame(s.id,direction,0,variant))).flat());
    const cell=CRITTER_CELL;
    expect(CRITTERS).toHaveLength(14);
    expect(new Set(frames).size).toBe(rows*CRITTER_VIEWS.length);
    expect([sheet.width,sheet.height]).toEqual([CRITTER_ROW_WIDTH*cell,rows*cell]);
    for(const base of frames)for(let pose=0;pose<CRITTER_POSES;pose++){
      const frame=base+pose,ox=(frame%CRITTER_ROW_WIDTH)*cell,oy=Math.floor(frame/CRITTER_ROW_WIDTH)*cell;
      let visible=0,border=0;
      for(let y=0;y<cell;y++)for(let x=0;x<cell;x++){
        const alpha=sheet.data[((y+oy)*sheet.width+x+ox)*4+3];
        if(alpha>=100)visible++;
        if(!x||!y||x===cell-1||y===cell-1)border+=alpha;
      }
      expect(visible,`quadro ${frame}`).toBeGreaterThan(25);
      expect(border,`borda do quadro ${frame}`).toBe(0);
    }
  });
  it('segue a direção do deslocamento e espelha só as vistas da esquerda',()=>{
    expect(critterDirection(100,20)).toBe('right');
    expect(critterDirection(-40,20)).toBe('left');
    expect(critterDirection(-20,40)).toBe('down');
    expect(critterDirection(10,-40)).toBe('up');
    expect(critterFrame('fox','left',3)).toBe(critterFrame('fox','right',3));
    expect(critterFrame('fox','up',3)).not.toBe(critterFrame('fox','down',3));
  });
  it('cada espécie encontra lugar no seu cenário, em terra, na beira da água ou sobre ela',()=>{
    for(const [area,t] of Object.entries(terrains)){
      expect(crittersOf(area).length,area).toBeGreaterThan(0);
      for(const sp of crittersOf(area)){
        const r=critterRandom(5),spot=critterSpot(sp,t,r);
        expect(spot,`${area} ${sp.id}`).toBeDefined();
        expect(t.land(spot!.x,spot!.y),`${sp.id}`).toBe(true);
        // Longe do jogador quando reaparece.
        const away=critterSpot(sp,t,r,{x:spot!.x,y:spot!.y,r:sp.near?Math.min(300,sp.near.r):420});
        if(away)expect(Math.hypot(away.x-spot!.x,away.y-spot!.y)).toBeGreaterThanOrEqual(sp.near?Math.min(300,sp.near.r):420);
      }
    }
  });
  it('respeita a hora: tartaruga à noite, morcego ao anoitecer, borboleta de dia',()=>{
    expect(critterActive('night',22*60)).toBe(true);expect(critterActive('night',12*60)).toBe(false);
    expect(critterActive('dusk',19*60)).toBe(true);expect(critterActive('dusk',10*60)).toBe(false);
    expect(critterActive('day',10*60)).toBe(true);expect(critterActive('day',21*60)).toBe(false);
  });
});
