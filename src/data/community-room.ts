import {CHARACTER_DIRECTIONS,type CharacterDirection} from '../character-directions';
export const COMMUNITY_ENTRANCE={x:1840,y:560};
export const COMMUNITY_ROOM_ENTRY={x:288,y:334};
export const COMMUNITY_ROOM_EXIT={x:288,y:357,halfWidth:24,depth:10,direction:'down' as const};
export const COMMUNITY_BEDS=Array.from({length:8},(_,i)=>({x:[60,150,372,462][i%4],y:i<4?198:306}));
export const communityResidentPosition=(index:number)=>({x:COMMUNITY_BEDS[index%8].x+27,y:COMMUNITY_BEDS[index%8].y+16});
export function communityRoomBlocked(x:number,y:number):boolean{
 if(!(x>=36&&x<=540&&y>=118&&y<=350||x>=263&&x<=313&&y>=350&&y<=368))return true;
 return COMMUNITY_BEDS.some(p=>x>=p.x&&x<=p.x+54&&y>=p.y-54&&y<=p.y)||x>=252&&x<=324&&y>=180&&y<=224;
}
export const communityRoomFits=(x:number,y:number)=>Number.isFinite(x)&&Number.isFinite(y)&&[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!communityRoomBlocked(x+dx,y+dy));
export function validCommunityInterior(value:unknown):value is {x:number;y:number;direction?:CharacterDirection}{
 if(!value||typeof value!=='object')return false;const p=value as {x:number;y:number;direction?:CharacterDirection};
 return communityRoomFits(p.x,p.y)&&(p.direction===undefined||CHARACTER_DIRECTIONS.includes(p.direction));
}
