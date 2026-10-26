import type {ItemId} from '../types';
export const METALS=['iron','gold','blackMetal'] as const;
export type Metal=typeof METALS[number];
export const METAL_NAMES={iron:'Ferro',gold:'Ouro',blackMetal:'Metal Negro'};
export const TOOL_IDS=['hatchet','pickaxe','hoe','sickle','shovel'] as const;
export type EconomicTool=typeof TOOL_IDS[number];
export const ECONOMY_BALANCE={blackToolRecipe:{blackMetalIngot:9,goldIngot:4},rareDepositRespawnDays:30,initialCrowns:100,fragmentsPerIngot:9,mineralTradeDay:31,maxOrders:20,
 efficiency:[1,1.5,2.2,3.2],durability:[100,250,450,800],workDays:[0,1,2,4],
 smeltMinutes:{iron:30,gold:90,blackMetal:240},smeltFee:{iron:25,gold:90,blackMetal:500},
 wholeChance:{iron:.002,gold:.0005,blackMetal:.0001},
 deposits:{property:{iron:.15,gold:0,blackMetal:0},forest:{iron:.24,gold:.04,blackMetal:.003}},
 labor:{hatchet:[0,80,220,900],pickaxe:[0,100,280,1100],hoe:[0,60,180,750],sickle:[0,70,200,800],shovel:[0,75,210,850]},
 ingots:{hatchet:[0,4,5,9],pickaxe:[0,4,5,9],hoe:[0,3,4,9],sickle:[0,3,4,9],shovel:[0,3,4,9]},
 prices:{wood:[8,2],plank:[18,6],board:[18,6],ironShard:[15,4],ironIngot:[120,65],goldShard:[90,18],goldIngot:[750,380],blackMetalShard:[0,120],blackMetalIngot:[5000,2500]} as Partial<Record<ItemId,readonly [number,number]>>,
 stock:{ironShard:{quantity:4,interval:2},ironIngot:{quantity:3,interval:3},goldShard:{quantity:2,interval:5},goldIngot:{quantity:1,interval:7},blackMetalIngot:{quantity:1,interval:15}},
 contracts:[{npc:'tobias',item:'wood',quantity:20,reward:90,interval:3},{npc:'helena',item:'turnip',quantity:10,reward:100,interval:3},{npc:'amelia',item:'herb',quantity:12,reward:80,interval:4},{npc:'bento',item:'scrap',quantity:15,reward:120,interval:4}] as const,
};
export const ECONOMY_ITEM_IDS=['ironShard','ironOre','ironIngot','goldShard','goldOre','goldIngot','blackMetalShard','blackMetalOre','blackMetalIngot','sickle','shovel','furniture','doorKit','windowKit','fenceKit','forge','mushroom'] as const;
export const shard=(metal:Metal)=>`${metal}Shard` as ItemId;
export const ore=(metal:Metal)=>`${metal}Ore` as ItemId;
export const ingot=(metal:Metal)=>`${metal}Ingot` as ItemId;
export const NON_COMMERCIAL:readonly string[]=['branch','stone','fiber','flakedStone','hatchet','pickaxe','hoe','sickle','shovel','hammer','handsaw','ironOre','goldOre','blackMetalOre'];
