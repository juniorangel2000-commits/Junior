import type {SaveData} from '../types';
import {WEAPONS} from '../dungeons/config';
import {insideSwordArc} from '../dungeons/weapon-identity';
import type {AttackEffect} from '../dungeons/run';
export function campSegmentClear(from:{x:number;y:number},to:{x:number;y:number},blocked:(x:number,y:number)=>boolean):boolean {
 const count=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)/6));for(let i=1;i<=count;i++)if(blocked(from.x+(to.x-from.x)*i/count,from.y+(to.y-from.y)*i/count))return false;return true;
}
export function campStrike(save:SaveData,origin:{x:number;y:number},angle:number,blocked:(x:number,y:number)=>boolean):{hit:string[];cooldown:number;effect?:AttackEffect} {
 const c=save.survivorCamp,sword=save.worldWeapon==='sword',weapon=WEAPONS.sword,range=sword?weapon.range:42;
 const result:{hit:string[];cooldown:number;effect?:AttackEffect}={hit:[],cooldown:0};if(!c||c.kind!=='hostile'||!c.aggressive||!save.villageProgress||save.villageProgress.vigor<=0)return result;
 save.villageProgress.vigor=Math.max(0,save.villageProgress.vigor-1);result.cooldown=sword?weapon.cooldown:.65;
 if(sword)result.effect={id:0,weapon:'sword',...origin,angle,ttl:.22,variant:0,radius:range};
 for(const p of c.members){const dx=p.x-origin.x,dy=p.y-origin.y;if(p.hp<=0||!['arriving','staying'].includes(p.status)||Math.hypot(dx,dy)>range||!insideSwordArc(dx,dy,angle,0)||!campSegmentClear(origin,p,blocked))continue;p.hp=Math.max(0,p.hp-(sword?weapon.damage:6));if(p.hp===0)p.status='leaving';result.hit.push(p.id);}
 return result;
}
