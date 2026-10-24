import {TILE} from './world-size';
import {riverBanksAt} from './property-water';
export const FIBER_PLANTS=['fern','whiteFlowers','bush','reeds'] as const;
export type FiberPlant=typeof FIBER_PLANTS[number];
export const isFiberPlant=(kind:unknown):kind is FiberPlant=>FIBER_PLANTS.includes(kind as FiberPlant);
export function nearRiverBank(x:number,y:number):boolean {
 const px=(x+.5)*TILE,{left,right}=riverBanksAt((y+.5)*TILE);
 const distance=px<left?left-px:px>right?px-right:Infinity;
 return distance<=48;
}
export function fiberPlantArt(plant:FiberPlant){
 const shape={fern:['fern',36],whiteFlowers:['flowers',30],bush:['bush',45],reeds:['reeds',46]} as const;
 return {texture:`forest-detail-${shape[plant][0]}`,size:shape[plant][1],pivot:124/128};
}
export function fiberPlantFor(node:{id:string;plant?:FiberPlant}):FiberPlant {
 if(node.plant)return node.plant;
 let seed=2166136261;for(const c of node.id)seed=Math.imul(seed^c.charCodeAt(0),16777619);
 // Old saves gain a stable land plant, never an inland reed.
 return FIBER_PLANTS[(seed>>>0)%3];
}
