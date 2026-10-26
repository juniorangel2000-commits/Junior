import type {EconomicTool,Metal} from './economy-balance';

export const ECONOMY_ART_ROOT='assets/visual/economy';
export const ECONOMY_ICON_IDS=['ironShard','ironOre','ironIngot','goldShard','goldOre','goldIngot','blackMetalShard','blackMetalOre','blackMetalIngot','forge','crown','furniture','doorKit','windowKit','fenceKit','mushroom'] as const;
export const TOOL_MATERIALS=['stone','iron','gold','blackMetal'] as const;
export const ART_TOOL_IDS=['hatchet','pickaxe','hoe','sickle','shovel'] as const;
export const MERCHANT_ART_IDS=['augusto','bento','amelia','tobias','rosa','nilo','celina','damiao','helena','icaro'] as const;
export const NPC_ART_DIRECTIONS=['down','left','up','right'] as const;
export function economyIcon(id:string):string|undefined{
 return (ECONOMY_ICON_IDS as readonly string[]).includes(id)?`${ECONOMY_ART_ROOT}/icons/${id}.png`:undefined;
}
export function tierToolIcon(tool:EconomicTool,tier:number):string{
 const material=TOOL_MATERIALS[Number.isInteger(tier)&&tier>=0&&tier<=3?tier:0];
 return `${ECONOMY_ART_ROOT}/tools/${material}-${tool}.png`;
}
export const mineralTexture=(metal:Metal)=>`economy-deposit-${metal}`;
