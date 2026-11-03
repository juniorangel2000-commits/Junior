import type {SaveData,TilePoint} from '../types';
import {undergroundFits} from './underground';
import {mineContaminated,mineGasRegions,mineSegmentClear} from './underground-hazards';
import {mineDarkness,mineFixedLights} from './underground-light';
import {BENTO_EXPEDITION as B} from '../data/bento-expedition';
import type {BentoDanger} from './bento-expedition-state';
const distance=(a:TilePoint,b:TilePoint)=>Math.hypot(a.x-b.x,a.y-b.y);
export function bentoMineLit(save:SaveData,p:TilePoint,player?:TilePoint):boolean{
 const mine=save.underground;if(!mine)return false;if(mineDarkness(p.y).alpha<=B.darknessLimit)return true;
 if(player&&save.inventory.lantern>0&&distance(player,p)<mineDarkness(player.y,true).radius&&mineSegmentClear(mine,p,player))return true;
 return mineFixedLights(mine).some(l=>distance(l,p)<l.radius&&mineSegmentClear(mine,p,l));
}
export function bentoMineDanger(save:SaveData,p:TilePoint,light=false,player?:TilePoint):{reason:BentoDanger;point:TilePoint}|undefined{
 const mine=save.underground;if(!mine)return;
 const cave=mine.hazards?.cave.active;if(cave&&distance(cave,p)<76)return{reason:'collapse',point:cave};
 if(mineContaminated(mine,p))return{reason:'gas',point:mineGasRegions(mine).find(g=>distance(g,p)<g.radius)??p};
 const z=mine.hazards?.zombies.find(z=>z.hp>0&&distance(z,p)<100&&mineSegmentClear(mine,p,z));if(z)return{reason:'zombie',point:z};
 const bat=mine.hazards?.bats.find(b=>b.hp>0&&b.mood!=='peaceful'&&(b.state==='warning'||b.state==='dive'||b.mood==='aggressive'&&b.state==='roost')&&distance(b,p)<100&&mineSegmentClear(mine,p,b));if(bat)return{reason:'bat',point:bat};
 if(light&&!bentoMineLit(save,p,player))return{reason:'darkness',point:p};
}
export function bentoMineEscapeFits(save:SaveData,p:TilePoint,from:TilePoint):boolean{
 const mine=save.underground;if(!mine||p.y>=5600||!undergroundFits(mine,p.x,p.y))return false;
 if(mineContaminated(mine,p)&&!mineContaminated(mine,from))return false;
 const cave=mine.hazards?.cave.active;if(cave&&distance(cave,p)<70&&distance(cave,from)>=70)return false;
 return true;
}
export function bentoMineRisk(save:SaveData,p:TilePoint):number{
 const m=save.underground;if(!m)return 0;let cost=0;
 if(mineContaminated(m,p))cost+=60;
 const cave=m.hazards?.cave.active;if(cave)cost+=Math.max(0,100-distance(cave,p))*.8;
 for(const e of [...m.hazards?.zombies??[],...m.hazards?.bats.filter(b=>b.mood!=='peaceful')??[]])if(e.hp>0&&distance(e,p)<140&&mineSegmentClear(m,p,e))cost+=(140-distance(e,p))*.25;
 return cost;
}
