import type {CharacterId} from './characters';
import type {CharacterDirection} from '../character-directions';
import {characterFrame} from '../character-directions';
export const SURVIVOR_LOOKS={
 wine:{character:'farmer-female',clothes:[52,52,56],shirt:[113,51,60],hair:[43,36,36]},
 olive:{character:'farmer-male',clothes:[54,54,57],shirt:[205,185,145],hair:[158,126,77]},
 slate:{character:'farmer-female',clothes:[57,60,65],shirt:[61,79,91],hair:[103,94,90]},
 sand:{character:'farmer-male',clothes:[66,57,51],shirt:[183,178,160],hair:[70,48,33]},
} as const;
export type SurvivorLook=keyof typeof SURVIVOR_LOOKS;
const NAMES:Record<string,SurvivorLook>={Nara:'wine',Bruna:'slate',Sofia:'slate','Olívia':'wine',Caio:'olive',Artur:'sand',Henrique:'sand',Samuel:'olive'};
export function survivorLook(character:CharacterId,name:string):SurvivorLook {const known=NAMES[name];if(known&&SURVIVOR_LOOKS[known].character===character)return known;let n=0;for(const ch of name)n+=ch.charCodeAt(0);return character==='farmer-female'?n%2?'wine':'slate':n%2?'olive':'sand';}
/** Same 48-world-pixel step cycle as Player; idle is always column zero. */
export function survivorWalkFrame(look:SurvivorLook,direction:CharacterDirection,distance:number,moving:boolean):number {
 const count=SURVIVOR_LOOKS[look].character==='farmer-male'?8:6;
 const phase=moving&&Number.isFinite(distance)?Math.floor(((distance%48)+1e-7)/48*count)%count+1:0;return characterFrame(direction,phase,count);
}
