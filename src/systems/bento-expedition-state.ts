import type {TilePoint} from '../types';
import {CHARACTER_DIRECTIONS,type CharacterDirection} from '../character-directions';
import {BENTO_TRAVEL_AREAS,type BentoTravelArea} from './bento-travel-state';
export type BentoPartyMode='guide'|'follow'|'wait'|'return';
export type BentoDanger='zombie'|'bat'|'collapse'|'gas'|'darkness';
export type BentoPartyEnd='separated'|'danger'|'returned'|'dismissed'|'time';
export interface BentoParty{tripDay:number;mode:BentoPartyMode;status:'active'|'ended';separation:number;waiting:number;regrouping:boolean;reason?:BentoPartyEnd;goal?:TilePoint;goalArea?:BentoTravelArea}
export interface BentoDefense{target:number;kind:'zombie'|'bat';elapsed:number;impacted:boolean;direction:CharacterDirection}
export interface BentoExpeditionState{
 version:1;caveHit?:number;health:number;grace:number;cooldown:number;
 invitation?:{day:number};party?:BentoParty;
 safety?:{reason:BentoDanger;elapsed:number;blocked:number;calm:number;returning:boolean;goal?:TilePoint};
 defense?:BentoDefense;
}
const finite=(v:unknown,max=1e9)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max;
const day=(v:unknown,max:number)=>finite(v,max)&&Number.isSafeInteger(v)&&Number(v)>=1;
const point=(v:unknown):v is TilePoint=>!!v&&typeof v==='object'&&finite((v as TilePoint).x,5120)&&finite((v as TilePoint).y,6144);
export function validBentoExpedition(value:unknown,maxDay=999999):value is BentoExpeditionState{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;const s=value as BentoExpeditionState;
 if(s.version!==1||!finite(s.health,100)||s.health<1||!finite(s.grace,2)||!finite(s.cooldown,3))return false;
 if(s.caveHit!==undefined&&(!finite(s.caveHit)||!Number.isSafeInteger(s.caveHit)))return false;
 if(s.invitation&&(!day(s.invitation.day,maxDay)))return false;
 const p=s.party;if(p&&(!day(p.tripDay,maxDay)||!['guide','follow','wait','return'].includes(p.mode)||!['active','ended'].includes(p.status)||!finite(p.separation,61)||!finite(p.waiting,1440)||typeof p.regrouping!=='boolean'||p.reason!==undefined&&!['separated','danger','returned','dismissed','time'].includes(p.reason)||p.goal!==undefined&&!point(p.goal)||p.goalArea!==undefined&&!BENTO_TRAVEL_AREAS.includes(p.goalArea)))return false;
 const a=s.safety;if(a&&(!['zombie','bat','collapse','gas','darkness'].includes(a.reason)||!finite(a.elapsed,1440)||!finite(a.blocked,1440)||!finite(a.calm,5)||typeof a.returning!=='boolean'||a.goal!==undefined&&!point(a.goal)))return false;
 const d=s.defense;if(d&&(!day(d.target,1e9)||!['zombie','bat'].includes(d.kind)||!finite(d.elapsed,.60001)||typeof d.impacted!=='boolean'||!CHARACTER_DIRECTIONS.includes(d.direction)||d.impacted&&d.elapsed<.3||!d.impacted&&d.elapsed>=.3))return false;
 return true;
}
