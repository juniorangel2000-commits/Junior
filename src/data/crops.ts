import type {ItemId} from '../types';
import {SEASONS,type Season} from '../systems/calendar';
/** Ficha de cada planta cultivável. Ver docs/planejamento/CULTIVOS-E-CALENDARIO.md. */
export interface CropDefinition{
 name:string;
 /** Estações em que pode ser plantada e em que sobrevive à virada de estação. */
 seasons:readonly Season[];
 /** Dias regados até a primeira colheita. */
 days:number;
 /** Dias regados até produzir de novo; sem valor, a planta sai do canteiro ao colher. */
 regrow?:number;
 seed:ItemId;
 harvest:ItemId;
 yield:number;
 /** Sementes devolvidas na colheita. */
 seedReturn?:number;
}
export const CROPS={
 // Provisório: o nabo cresce em todas as estações até a etapa 3 trazer plantas para
 // cada estação; depois ele fica restrito à Primavera.
 turnip:{name:'Nabo',seasons:SEASONS,days:4,seed:'seeds',harvest:'turnip',yield:1,seedReturn:1},
} as const satisfies Record<string,CropDefinition>;
export type CropId=keyof typeof CROPS;
export const CROP_IDS=Object.keys(CROPS) as CropId[];
export const isCropId=(v:unknown):v is CropId=>typeof v==='string'&&Object.hasOwn(CROPS,v);
export const cropDefinition=(id:CropId|undefined):CropDefinition=>CROPS[id??'turnip'];
