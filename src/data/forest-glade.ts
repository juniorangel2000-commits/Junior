import type {NatureKind} from './nature-catalog';
/** Northeast meadow: loose groups around an open center, using the current atlas. */
export const FOREST_GLADE_DETAILS:readonly {kind:NatureKind;x:number;y:number}[]=[
 {kind:'whiteFlowers',x:82,y:5},{kind:'whiteFlowers',x:88,y:6},{kind:'whiteFlowers',x:86,y:12},
 {kind:'fern',x:80,y:7},{kind:'fern',x:89,y:10},{kind:'fern',x:81,y:12},
 {kind:'berryBush',x:79,y:10},{kind:'berryBush',x:90,y:6},
 {kind:'mushrooms',x:80,y:4},{kind:'mushrooms',x:89,y:4},{kind:'mushrooms',x:90,y:12},{kind:'mushrooms',x:79,y:13},
 {kind:'fallenLog',x:88,y:14},{kind:'stump',x:79,y:5},{kind:'mossBoulder',x:91,y:11},
];
export const gladeObjectId=(detail:{kind:string;x:number;y:number}):string=>`${detail.kind}-${detail.x}-${detail.y}`;
export const FOREST_GLADE_RESOURCE_IDS=new Set(FOREST_GLADE_DETAILS.map(d=>`f-${gladeObjectId(d)}`));
