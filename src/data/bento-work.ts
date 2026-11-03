/** Initial, configurable NPC limits. Public recipes, prices and tools are unchanged. */
export const BENTO_WORK={
 maxBlocks:6,maxIronBlocks:2,carryUnits:32,depotStoneUnits:96,depotIronUnits:64,
 miningSeconds:75,strikePause:.6,searchRadius:8,handlingSeconds:1.2,
 personalJobSeconds:4,jobsPerDay:2,jobCooldownMinutes:180,
 stoneJobCost:4,ironJobCost:1,
 storage:{stone:'caixa_minerios',iron:'armario_carvao_ferro'},
 anvil:'bigorna_e_toco',interactionReach:42,
} as const;
export const BENTO_MATERIALS=['stone','ironShard','ironOre'] as const;
export type BentoMaterial=typeof BENTO_MATERIALS[number];
