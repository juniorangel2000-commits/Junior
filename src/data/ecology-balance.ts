/** Calendar, yields and medicinal recipes are kept together for balancing. */
export const ECOLOGY_BALANCE={
 growthDays:[0,1,3,7] as const,
 treeLimit:512,
 seedSpacing:2,
 herbYield:2,
 mushroomYield:2,
 rareHerbForestDenominator:7,
 infusion:{cost:{herb:3,mushroom:2},output:{fungalInfusion:1},vigor:50,serviceFee:8,learnCost:{herb:3,mushroom:2},buy:68,sell:18},
} as const;
