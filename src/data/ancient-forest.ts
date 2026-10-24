/** Separate 96×72 area. Property coordinates and resource IDs never change. */
export const FOREST_WIDTH = 96, FOREST_HEIGHT = 72;
export const FOREST_ENTRY = { x: 48, y: 66 };
export const PROPERTY_FOREST_GATE = { x: 75, y: 18 };
export const ANIMAL_KINDS = ['chicken', 'sheep', 'goat', 'cow', 'rabbit', 'deer'] as const;
export type AnimalKind = typeof ANIMAL_KINDS[number];
export const ANIMAL_NAMES: Record<AnimalKind, string> = { chicken: 'Galinha', sheep: 'Ovelha', goat: 'Cabra', cow: 'Vaca', rabbit: 'Coelho', deer: 'Cervo' };
export const FOREST_ANIMALS = [
  { id: 'forest-chicken-1', kind: 'chicken', x: 22, y: 55 }, { id: 'forest-chicken-2', kind: 'chicken', x: 25, y: 57 },
  { id: 'forest-sheep-1', kind: 'sheep', x: 21, y: 35 }, { id: 'forest-sheep-2', kind: 'sheep', x: 24, y: 37 },
  { id: 'forest-goat-1', kind: 'goat', x: 21, y: 15 }, { id: 'forest-goat-2', kind: 'goat', x: 25, y: 17 },
  { id: 'forest-cow-1', kind: 'cow', x: 75, y: 35 }, { id: 'forest-cow-2', kind: 'cow', x: 78, y: 38 },
  { id: 'forest-rabbit-1', kind: 'rabbit', x: 76, y: 56 }, { id: 'forest-deer-1', kind: 'deer', x: 79, y: 54 },
] as const;
const segments = [ [48,70,48,56], [48,56,25,55], [25,55,21,35], [21,35,21,15], [21,15,37,13],
  [21,35,40,32], [40,32,49,28], [49,28,68,28], [68,28,76,35], [76,35,77,55], [77,55,48,56],
  [68,28,80,19], [80,19,84,9] ];
export function forestPathDistance(x: number, y: number): number {
  return Math.min(...segments.map(([ax,ay,bx,by]) => {
    const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));
    return Math.hypot(x-ax-t*dx,y-ay-t*dy);
  }));
}
export function forestWater(x: number, y: number): boolean {
  return ((x-54)/13)**2+((y-16)/8)**2 < 1 || (y < 17 && x > 65 && Math.abs(x-(84-y)) < 1.4);
}

export function forestClearing(x: number,y: number): boolean {
  return FOREST_ANIMALS.some(a=>Math.hypot(x-a.x,y-a.y)<8) || Math.hypot(x-48,y-42)<8;
}
function hash(x:number,y:number):number { return ((Math.imul(x+19,73856093)^Math.imul(y+7,19349663))>>>0)/4294967296; }
export const FOREST_TREES: Array<{x:number;y:number;pine:boolean;ancient:boolean}> = [];
for(let y=3;y<70;y+=3) for(let x=3;x<94;x+=3) {
  if(forestWater(x,y)||forestPathDistance(x,y)<3.5||forestClearing(x,y))continue;
  if(hash(x,y)>.18)FOREST_TREES.push({x,y,pine:hash(y,x)>.76,ancient:false});
}
FOREST_TREES.push({x:48,y:42,pine:false,ancient:true});
const trunks=new Set(FOREST_TREES.map(t=>`${t.x},${t.y}`));
export function forestBlocked(x:number,y:number):boolean {
  return x<1||y<1||x>=95||y>=71||forestWater(x,y)||trunks.has(`${x},${y}`);
}
export function recruitAnimal(ids: readonly string[], id: string): string[] {
  return !FOREST_ANIMALS.some(a=>a.id===id)||ids.includes(id)?[...ids]:[...ids,id];
}

/** Stable art variation independent of the three-tile placement grid. */
export function forestTreeAppearance(tree:{x:number;y:number;pine:boolean;ancient:boolean}):{variant:number;scale:number;flip:boolean} {
  if(tree.ancient)return {variant:2,scale:3.6,flip:false};
  const seed=(Math.imul(tree.x+17,2654435761)^Math.imul(tree.y+31,1597334677))>>>0;
  return {variant:seed%3,scale:1.68+((seed>>>8)%45)/100,flip:((seed>>>16)&1)===1};
}

export const FOREST_ROCKS=[
 {x:44,y:12,variant:0},{x:47,y:10,variant:1},{x:51,y:9,variant:2},
 {x:58,y:10,variant:0},{x:64,y:13,variant:3},{x:65,y:18,variant:4},
 {x:61,y:22,variant:5},{x:52,y:23,variant:2},{x:43,y:19,variant:0},
 {x:49,y:16,variant:3},{x:58,y:18,variant:4},{x:37,y:17,variant:1},
 {x:30,y:39,variant:0},{x:70,y:48,variant:5},{x:63,y:32,variant:2}
] as const;
