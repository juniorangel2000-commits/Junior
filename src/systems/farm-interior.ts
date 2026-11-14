import type {SaveData,TilePoint} from '../types';
import type {FarmSite} from './farm-construction';
import {FARM_BUILDINGS} from '../data/farm-buildings';
import {hasInterior} from '../data/farm-interiors';
/** De dia (06:00–18:00) os animais ficam no cercado; à noite, dentro da construção.
 * "Recolher" e "Soltar" valem até a próxima virada (06:00 ou 18:00). */
export const DAY_START=6*60;
export const NIGHT_START=18*60;
export interface AnimalsOverride{inside:boolean;until:number}
/** Relógio absoluto em minutos, a partir do primeiro dia. */
export const farmClock=(s:Pick<SaveData,'day'|'time'>)=>(Math.max(1,Math.floor(s.day))-1)*1440+Math.max(0,s.time);
export const scheduledInside=(clock:number)=>{const m=((clock%1440)+1440)%1440;return m>=NIGHT_START||m<DAY_START;};
export function nextTransition(clock:number):number{
 const m=((clock%1440)+1440)%1440,base=clock-m;
 return m<DAY_START?base+DAY_START:m<NIGHT_START?base+NIGHT_START:base+1440+DAY_START;
}
export function animalsInside(site:FarmSite,s:Pick<SaveData,'day'|'time'>):boolean{
 if(!site.finished||!hasInterior(site.kind))return false;
 const clock=farmClock(s),o=site.animalsOverride;
 return o&&clock<o.until?o.inside:scheduledInside(clock);
}
/** Porta da construção, no chão do cercado logo à frente do corpo da construção. */
export function farmDoorPoint(site:FarmSite):TilePoint{const d=FARM_BUILDINGS[site.kind];return{x:(site.x+Math.floor(d.width/2)+.5)*32,y:(site.y+d.bodyRows+.5)*32};}
/** Onde o jogador aparece ao sair: logo abaixo da porta, virado para baixo. */
export function farmDoorExit(site:FarmSite):TilePoint&{direction:'down'}{const p=farmDoorPoint(site);return{x:p.x,y:p.y+14,direction:'down'};}
export function nearFarmDoor(save:SaveData,p:TilePoint):FarmSite|undefined{
 return (save.farmConstruction?.sites??[]).find(s=>s.finished&&hasInterior(s.kind)&&Math.hypot(farmDoorPoint(s).x-p.x,farmDoorPoint(s).y-p.y)<=30);
}
export function validAnimalsOverride(v:unknown):v is AnimalsOverride{
 if(!v||typeof v!=='object'||Array.isArray(v))return false;const o=v as AnimalsOverride;
 return typeof o.inside==='boolean'&&Number.isFinite(o.until)&&o.until>=0&&o.until<=1e9;
}
