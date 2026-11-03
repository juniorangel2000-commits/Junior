import {CHARACTER_DIRECTIONS,type CharacterDirection} from '../character-directions';
import type {TilePoint} from '../types';
export const BENTO_TRAVEL_AREAS=['home','property','shop','village','cityForest','fishingLake','highland','mine','mining'] as const;
export type BentoTravelArea=typeof BENTO_TRAVEL_AREAS[number];
export const BENTO_TRAVEL_LEGS=['rescue-dialogue','rescue-home-exit','rescue-property-out','prepare','shop-exit','village-out','city-out','lake-out','highland-out','hall-out','survey','explore','inspect','mining-back','hall-back','highland-back','lake-back','city-back','village-back','shop-back','unload','withdraw','forge','settle'] as const;
export type BentoTravelLeg=typeof BENTO_TRAVEL_LEGS[number];
export interface BentoTrip extends TilePoint{
 day:number;area:BentoTravelArea;leg:BentoTravelLeg;direction:CharacterDirection;
 route:TilePoint[];index:number;distance:number;moving:boolean;wait:number;blocked:boolean;
 transition?:'out'|'in';
 purpose?:'workshop'|'rescue';
}
export interface BentoTravelState{version:1;seed:number;updatedAt:number;lastAttemptDay?:number;lastCompletedDay?:number;trip?:BentoTrip}
const number=(n:unknown,max=1440*1_000_001)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=max;
const day=(n:unknown)=>Number.isSafeInteger(n)&&Number(n)>=1&&Number(n)<=999999;
const limits=(area:BentoTravelArea)=>area==='home'?[384,320]:area==='shop'?[576,384]:area==='highland'?[1536,1024]:area==='mine'||area==='mining'?[5120,6144]:[3072,2304];
export function validBentoTravel(value:unknown,maxDay=999999):value is BentoTravelState{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;const s=value as BentoTravelState;
 if(s.version!==1||!Number.isSafeInteger(s.seed)||s.seed<0||s.seed>4294967295||!number(s.updatedAt)||s.lastAttemptDay!==undefined&&!day(s.lastAttemptDay)||s.lastCompletedDay!==undefined&&!day(s.lastCompletedDay))return false;
 if(s.lastAttemptDay!==undefined&&s.lastAttemptDay>maxDay||s.lastCompletedDay!==undefined&&s.lastCompletedDay>maxDay)return false;
 const t=s.trip;if(t===undefined)return true;if(!t||typeof t!=='object'||Array.isArray(t))return false;if(!BENTO_TRAVEL_AREAS.includes(t.area)||!BENTO_TRAVEL_LEGS.includes(t.leg)||!day(t.day)||!CHARACTER_DIRECTIONS.includes(t.direction)||!number(t.distance,1e9)||!number(t.wait,1440)||typeof t.moving!=='boolean'||typeof t.blocked!=='boolean')return false;
 if(t.day>maxDay)return false;
 const areas:Record<BentoTravelLeg,BentoTravelArea>={'rescue-dialogue':'home','rescue-home-exit':'home','rescue-property-out':'property',prepare:'shop','shop-exit':'shop','village-out':'village','city-out':'cityForest','lake-out':'fishingLake','highland-out':'highland','hall-out':'mine',survey:'mining',explore:'mining',inspect:'mining','mining-back':'mining','hall-back':'mine','highland-back':'highland','lake-back':'fishingLake','city-back':'cityForest','village-back':'village','shop-back':'shop',unload:'shop',withdraw:'shop',forge:'shop',settle:'shop'};if(areas[t.leg]!==t.area)return false;
 if(t.purpose!==undefined&&(t.purpose!=='rescue'&&(t.purpose!=='workshop'||t.area!=='shop')))return false;
 if(t.transition!==undefined&&!['out','in'].includes(t.transition))return false;
 const [width,height]=limits(t.area),point=(p:TilePoint)=>!!p&&number(p.x,width)&&number(p.y,height);
 return point(t)&&Array.isArray(t.route)&&t.route.length<=4000&&t.route.every(point)&&Number.isInteger(t.index)&&t.index>=0&&t.index<=t.route.length;
}

/** All route ownership changes preserve the actual world position. */
export function changeBentoLeg(trip:BentoTrip,leg:BentoTravelLeg,wait=0):void{trip.leg=leg;trip.route=[];trip.index=0;trip.wait=wait;trip.moving=false;trip.blocked=false;delete trip.transition;}
export const bentoReturnLeg=(area:BentoTravelArea):BentoTravelLeg=>({home:'rescue-home-exit',property:'rescue-property-out',shop:'shop-back',village:'village-back',cityForest:'city-back',fishingLake:'lake-back',highland:'highland-back',mine:'hall-back',mining:'mining-back'}as const)[area];
