import type {ItemId} from '../types';
import {type Season} from '../systems/calendar';
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
import {CROP_CATALOG,type CatalogCropId} from './crop-catalog';
export const CROPS=Object.fromEntries(CROP_CATALOG.map(c=>[c.id,{...c,yield:c.yieldCount}])) as unknown as Record<CatalogCropId,CropDefinition>;
export type CropId=CatalogCropId;
export const CROP_IDS=Object.keys(CROPS) as CropId[];
export const isCropId=(v:unknown):v is CropId=>typeof v==='string'&&Object.hasOwn(CROPS,v);
export const cropDefinition=(id:CropId|undefined):CropDefinition=>CROPS[id??'turnip'];
export const cropFromSeed=(item:unknown):CropId|undefined=>CROP_CATALOG.find(c=>c.seed===item)?.id;
export const cropStage=(growth:number)=>growth<=0?0:growth>=1?4:growth>=2/3?3:growth>=1/3?2:1;
export const cropTexture=(crop:{crop?:CropId;growth:number})=>crop.growth<=0?'crop-planted-seed':`crop-${crop.crop??'turnip'}-${cropStage(crop.growth)}`;
