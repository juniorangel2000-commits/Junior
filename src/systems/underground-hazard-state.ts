import {UNDERGROUND} from '../data/underground-layout';
import {MINE_HAZARDS as B} from '../data/underground-hazards';
import type {TilePoint} from '../types';
export interface MineZombie extends TilePoint{id:number;hp:number;mode:'dormant'|'alert';goal?:TilePoint;alert:number}
export interface MineBat extends TilePoint{id:number;hp:number;home:TilePoint;mood:'peaceful'|'reactive'|'aggressive';state:'roost'|'flight'|'flee'|'warning'|'dive';remaining:number;goal?:TilePoint;struck?:boolean}
export interface MineCaveIn extends TilePoint{stage:'warning'|'impact';remaining:number}
export interface MineHazardState{
 version:1;hp:number;invulnerable:number;elapsed:number;swordCooldown:number;zombies:MineZombie[];bats:MineBat[];
 cave:{sequence:number;cooldown:number;active?:MineCaveIn};
}
const finite=(n:unknown,max=1e9)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=max;
const point=(p:unknown):p is TilePoint=>!!p&&typeof p==='object'&&finite((p as TilePoint).x,UNDERGROUND.width*32-1)&&finite((p as TilePoint).y,UNDERGROUND.height*32-1);
export function validMineHazards(v:unknown):v is MineHazardState{
 if(!v||typeof v!=='object'||Array.isArray(v))return false;const h=v as MineHazardState;
 if(h.version!==1||!finite(h.hp,B.maxHealth)||!finite(h.invulnerable,2)||!finite(h.elapsed)||!finite(h.swordCooldown,2)||!Array.isArray(h.zombies)||h.zombies.length>32||!Array.isArray(h.bats)||h.bats.length>24)return false;
 if(!h.cave||!Number.isSafeInteger(h.cave.sequence)||h.cave.sequence<0||h.cave.sequence>1e9||!finite(h.cave.cooldown,120))return false;
 if(h.cave.active&&(!point(h.cave.active)||!['warning','impact'].includes(h.cave.active.stage)||!finite(h.cave.active.remaining,3)))return false;
 const ids=new Set<number>();
 return h.zombies.every(z=>{if(!point(z)||!Number.isSafeInteger(z.id)||z.id<1||ids.has(z.id)||!finite(z.hp,100)||!['dormant','alert'].includes(z.mode)||!finite(z.alert,60)||z.goal!==undefined&&!point(z.goal))return false;ids.add(z.id);return true;})&&h.bats.every(b=>{if(!point(b)||!Number.isSafeInteger(b.id)||b.id<1||ids.has(b.id)||!finite(b.hp,100)||!point(b.home)||!['peaceful','reactive','aggressive'].includes(b.mood)||!['roost','flight','flee','warning','dive'].includes(b.state)||!finite(b.remaining,60)||b.goal!==undefined&&!point(b.goal)||b.struck!==undefined&&typeof b.struck!=='boolean')return false;ids.add(b.id);return true;});
}
