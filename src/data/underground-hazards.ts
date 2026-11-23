import {DUNGEON_BALANCE} from '../dungeons/config';
/** Provisional encounter balance. Gas damage is the approved, fixed 2%/second. */
export const MINE_HAZARDS={
 maxHealth:DUNGEON_BALANCE.playerHealth,
 zombies:{surface:3,middle:5,deep:7,extreme:9,detect:138,noise:420,memory:14,activeRadius:680},
 caveIn:{damageFraction:.45,warningSeconds:2.8,radius:58,cooldown:35,chance:{surface:.025,middle:.05,deep:.08,extreme:.11}},
 gas:{damageFractionPerSecond:.02},
 bats:{damage:3,speed:100,detect:110,disturb:56,warningSeconds:.65,diveSeconds:.5,cooldown:9},
 /** Escuridão por faixa. `radius` é o que se enxerga sem lampião; `lanternRadius`, com ele.
  * Nas galerias profundas, sem luz, quase nada aparece (preview.48). O Bento compara só `alpha`. */
 darkness:{surface:{alpha:.45,radius:150,lanternRadius:200},middle:{alpha:.62,radius:105,lanternRadius:180},deep:{alpha:.95,radius:46,lanternRadius:158},extreme:{alpha:.985,radius:32,lanternRadius:138}},
} as const;
