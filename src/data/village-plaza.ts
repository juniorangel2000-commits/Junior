export type PlazaFrame='south'|'north'|'east'|'west'|'shrubs-white'|'shrubs-lilac';
export interface PlazaFurniture {
 id:string;frame:PlazaFrame;x:number;y:number;width:number;height:number;
 footprint:readonly [number,number,number,number];
}
/** Benches face the fountain. The south edge remains clear for the lunch stops. */
export const PLAZA_SEATS:readonly PlazaFurniture[]=[
 {id:'banco-noroeste',frame:'south',x:43,y:34,width:64,height:44,footprint:[-29,-13,58,13]},
 {id:'banco-nordeste',frame:'south',x:49,y:34,width:64,height:44,footprint:[-29,-13,58,13]},
 {id:'banco-sudoeste',frame:'north',x:43,y:42,width:64,height:40,footprint:[-29,-13,58,13]},
 {id:'banco-sudeste',frame:'north',x:49,y:42,width:64,height:40,footprint:[-29,-13,58,13]},
 {id:'banco-oeste',frame:'east',x:39,y:37.5,width:40,height:56,footprint:[-16,-24,32,24]},
 {id:'banco-leste',frame:'west',x:53,y:37.5,width:40,height:56,footprint:[-16,-24,32,24]},
];
export const PLAZA_BEDS:readonly PlazaFurniture[]=[
 {id:'arbustos-noroeste',frame:'shrubs-white',x:40,y:35,width:82,height:64,footprint:[-37,-28,74,28]},
 {id:'arbustos-nordeste',frame:'shrubs-lilac',x:52,y:35,width:82,height:64,footprint:[-37,-28,74,28]},
 {id:'arbustos-sudoeste',frame:'shrubs-lilac',x:40,y:40,width:82,height:64,footprint:[-37,-28,74,28]},
 {id:'arbustos-sudeste',frame:'shrubs-white',x:52,y:40,width:82,height:64,footprint:[-37,-28,74,28]},
];
export const PLAZA_LAMPS=[{x:40,y:32},{x:52,y:32},{x:37,y:38},{x:55,y:38},{x:40,y:44},{x:52,y:44}] as const;
const furniture=[...PLAZA_SEATS,...PLAZA_BEDS];

export function plazaFurnitureBlockedPoint(x:number,y:number):boolean {
 return furniture.some(p=>{
  const ax=(p.x+.5)*32,ay=p.y*32+25,[l,t,w,h]=p.footprint;
  return p.frame.startsWith('shrubs-')?Math.hypot((x-ax)/(w/2),(y-ay-t-h/2)/(h/2))<=1
   :x>=ax+l&&x<=ax+l+w&&y>=ay+t&&y<=ay+t+h;
 });
}
export const plazaFurnitureBlockedTile=(x:number,y:number)=>plazaFurnitureBlockedPoint((x+.5)*32,(y+.5)*32);
