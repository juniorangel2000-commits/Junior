import type {CharacterDirection} from '../character-directions';
/** Match the existing nine-frame ToolUse clock; frame four is the one impact. */
export const PLAYER_MINING_FRAMES=[0,1,1,2,3,3,4,4,5]as const;
export const playerMiningRow=(direction:CharacterDirection)=>direction.includes('up')?1:direction.includes('down')?0:direction==='left'?3:2;
export function playerMiningFrame(direction:CharacterDirection,frame:number):number{return playerMiningRow(direction)*6+PLAYER_MINING_FRAMES[Math.max(0,Math.min(8,Math.floor(Number.isFinite(frame)?frame:0)))];}
/** Metal-only regions of the authored tool. Clothing, skin and shaft are excluded. */
export const PLAYER_PICKAXE_HEADS=[
 [[48,153,56,88],[41,96,60,85],[18,20,100,82],[68,174,82,78],[55,176,85,77],[48,153,56,88]],
 [[169,151,48,86],[175,82,63,76],[18,15,96,89],[157,163,28,44],[171,161,34,78],[169,151,48,86]],
 [[162,147,54,96],[167,85,63,79],[19,16,100,92],[160,152,63,96],[169,171,64,80],[162,147,54,96]],
 [[39,147,54,96],[28,88,73,89],[126,14,92,82],[25,155,73,97],[24,174,74,80],[39,147,54,96]],
]as const;
export function playerMiningMetal(r:number,g:number,b:number,tier:number):readonly[number,number,number]{
 if(tier<1||Math.max(r,g,b)-Math.min(r,g,b)>24||Math.max(r,g,b)<60)return[r,g,b];
 const l=(r+g+b)/765;
 return tier===2?[60+195*l,30+158*l,10+65*l]:tier>=3?[12+95*l,15+108*l,22+125*l]:[30+200*l,35+202*l,42+205*l];
}
