import { lakeDistance } from './water-contours';
import { paintedWaterPoint } from './terrain-paint';
import { TILE, WORLD_WIDTH, WORLD_HEIGHT } from './world-size';
import { SWAMP_ART, isSwampKind, type SwampKind } from './swamp-art';
import { natureArt } from './nature-catalog';
import { editorObjectKind, type EditorObjectKind, type MapEditData } from '../systems/map-editor';

type Point = {x:number;y:number};
export const SWAMP_SIZE = { width: WORLD_WIDTH * TILE, height: WORLD_HEIGHT * TILE };
export const SWAMP_ENTRY = { x: 18, y: 67 };
export const SWAMP_EXIT = { x: 18, y: 70 };
export const FOREST_SWAMP_EXIT = { x: 84, y: 2 };
export const FOREST_SWAMP_RETURN = { x: 84, y: 6 };
export function forestSwampApproach(x:number,y:number): boolean {
  return x >= 82 && x <= 86 && y >= 1 && y <= 10;
}
export const tileCenter = (p: Point):Point => ({ x: (p.x + .5)*TILE, y: (p.y + .5)*TILE });
export const swampEntry = (edits?: MapEditData):Point => edits?.points?.entry ?? SWAMP_ENTRY;
export const swampExit = (edits?: MapEditData):Point => edits?.points?.exit ?? SWAMP_EXIT;

function distanceToSegment(x:number,y:number,ax:number,ay:number,bx:number,by:number):number {
  const dx=bx-ax,dy=by-ay;
  const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));
  return Math.hypot(x-ax-t*dx,y-ay-t*dy);
}
const trail = [
 [18,72,18,63],[18,63,21,56],[21,56,28,51],[28,51,32,43],[32,43,39,38],
 [39,38,58,38],[58,38,65,37],[65,37,72,32],[72,32,78,22],[78,22,85,13],
 [32,43,25,39],[25,39,19,38],[19,38,13,40],[72,32,82,32],[82,32,89,36],
] as const;
export function swampTrailDistance(x:number,y:number):number {
  const tx=x/TILE-.5, ty=y/TILE-.5;
  let best=Infinity;
  for(const [ax,ay,bx,by] of trail)best=Math.min(best,distanceToSegment(tx,ty,ax,ay,bx,by));
  return best*TILE;
}
export function swampWaterDistance(x:number,y:number):number {
  const riverCenter=1570+150*Math.sin(y/345)+62*Math.cos(y/200);
  const riverWidth=144+37*Math.sin(y/174+1.2)+23*Math.cos(y/93);
  const river=Math.abs(x-riverCenter)-riverWidth+5*Math.sin(y/17);
  // Duas lagoas laterais, uma remansa ao norte e enseadas ligadas ao canal.
  const west=lakeDistance(x,y,748,760,470,285,2.8);
  const southeast=lakeDistance(x,y,2330,1625,462,316,4);
  const north=lakeDistance(x,y,2150,372,485,224,1.5);
  const eddy=lakeDistance(x,y,1720,620,364,276,4.3);
  return Math.min(river,west,southeast,north,eddy);
}
export const swampBaseWater=(x:number,y:number):boolean=>swampWaterDistance(x,y)<0;
export const insideSwamp=(x:number,y:number):boolean=>
  x>=TILE&&y>=TILE&&x<SWAMP_SIZE.width-TILE&&y<SWAMP_SIZE.height-TILE;

type SwampObject = Point & {id:string;kind:EditorObjectKind};
function seed(x:number,y:number):number {
  let h=(Math.imul(x+183,73856093)^Math.imul(y+97,19349663))>>>0;
  h=Math.imul(h^(h>>>16),0x45d9f3b);
  return ((h^(h>>>16))>>>0)/4294967296;
}
const fixed:ReadonlyArray<readonly [SwampKind, number, number]> = [
 ['swamp-boardwalk',49,38],
 ['swamp-cypress',23,59],['swamp-willow',29,48],['swamp-alder',16,58],
 ['swamp-willow',34,34],['swamp-cypress',38,36],['swamp-alder',41,35],
 ['swamp-willow',59,35],['swamp-cypress',66,39],['swamp-alder',64,33],
 ['swamp-log',81,31],['swamp-stump',36,43],['swamp-stones',61,41],
 ['swamp-iris',11,39],['swamp-iris',85,12],['swamp-iris',87,38],
 ['swamp-frog',20,35],['swamp-frog',70,41],['swamp-frog',89,41],
 ['swamp-caiman',22,23],['swamp-caiman',74,51],['swamp-caiman',49,29],
];
function swampDefaults():SwampObject[] {
  const objects:SwampObject[]=[];
  const occupied=new Set<string>();
  const add=(kind:SwampKind,x:number,y:number)=>{
    const key=`${x},${y}`;
    if(occupied.has(key))return;
    occupied.add(key);
    objects.push({id:`${kind}-${x}-${y}`,kind,x,y});
  };
  fixed.forEach(([kind,x,y])=>add(kind,x,y));
  for(let y=2;y<WORLD_HEIGHT-2;y+=4)for(let x=2;x<WORLD_WIDTH-2;x+=4){
    const tx=x+Math.floor(seed(y,x)*3),ty=y+Math.floor(seed(x,y)*3);
    const p=tileCenter({x:tx,y:ty}),shore=swampWaterDistance(p.x,p.y);
    const route=swampTrailDistance(p.x,p.y),r=seed(tx,ty);
    if(route<86||!insideSwamp(p.x,p.y))continue;
    if(shore>27 && (r>.48||tx<5||ty<6||tx>90||ty>65)){
      add(r>.8?'swamp-willow':r>.61?'swamp-cypress':'swamp-alder',tx,ty);
    }else if(shore>32&&r<.18)add(r<.08?'swamp-stones':'swamp-log',tx,ty);
    else if(shore< -12&&shore> -95&&r>.57)add('swamp-lilies',tx,ty);
  }
  for(let y=3;y<WORLD_HEIGHT-2;y+=2)for(let x=3;x<WORLD_WIDTH-2;x+=2){
    const p=tileCenter({x,y}),shore=swampWaterDistance(p.x,p.y),r=seed(y+12,x+27);
    const route=swampTrailDistance(p.x,p.y);
    if(route<64||Math.abs(x-49)<11&&Math.abs(y-38)<3)continue;
    if(shore> -25&&shore<45&&r>.36)add(r>.67?'swamp-cattails':'swamp-sedges',x,y);
    else if(shore>20&&shore<125&&r<.12)add('swamp-sedges',x,y);
  }
  return objects;
}
const ORIGINAL_OBJECTS=swampDefaults();

const extraFootprint: Partial<Record<SwampKind, readonly [number, number]>> = {
  'swamp-cypress':[21,13], 'swamp-willow':[21,12], 'swamp-alder':[14,9],
  'swamp-stump':[22,14], 'swamp-log':[42,12], 'swamp-stones':[24,13],
};
export function createSwampLayout(edits?:MapEditData) {
  const objects:SwampObject[]=[];
  const occupied=new Set<string>();
  const add=(object:SwampObject)=>{
    occupied.add(`${object.x},${object.y}`);
    objects.push(object);
  };
  for(const [id,edit] of Object.entries(edits?.objects??{})){
    const kind=editorObjectKind(id);
    if(!edit.removed&&kind)add({id,kind,x:edit.x,y:edit.y});
  }
  for(const object of ORIGINAL_OBJECTS){
    if(edits?.objects[object.id]||occupied.has(`${object.x},${object.y}`))continue;
    add(object);
  }
  const water=(x:number,y:number)=>{
    const terrain=edits?.terrain;
    const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
    if(terrain?.[`${tx},${ty}`]!=='water')return paintedWaterPoint(terrain,x,y,swampBaseWater);
    const edgeWater=(cx:number,cy:number)=>{
      const brush=terrain[`${cx},${cy}`];
      return brush?brush==='water':swampBaseWater((cx+.5)*TILE,(cy+.5)*TILE);
    };
    const px=x-tx*TILE,py=y-ty*TILE,radius=13;
    const dx=px<TILE/2?-1:1,dy=py<TILE/2?-1:1;
    const u=dx<0?px:TILE-px,v=dy<0?py:TILE-py;
    return u>=radius||v>=radius||edgeWater(tx+dx,ty)||edgeWater(tx,ty+dy)||
      Math.hypot(radius-u,radius-v)<radius;
  };
  const decks=objects.filter(o=>o.kind==='swamp-boardwalk').map(tileCenter);
  const deck=(x:number,y:number)=>decks.find(p=>Math.abs(x-p.x)<SWAMP_ART['swamp-boardwalk'].width/2-11&&Math.abs(y-p.y)<22);
  const inWater=(x:number,y:number)=>!deck(x,y)&&water(x,y);
  const solids=objects.filter(o=>natureArt(o.kind)?.solid||o.kind==='standingTree'||o.kind==='pine'||o.kind==='vein').map(o=>({
    ...tileCenter(o),size:isSwampKind(o.kind)?extraFootprint[o.kind]??[14,11]:[14,11],
  }));
  const override=(x:number,y:number)=>edits?.collisions?.[`${Math.floor(x/TILE)},${Math.floor(y/TILE)}`];
  const blocked=(x:number,y:number):boolean=>{
    if(!insideSwamp(x,y))return true;
    const custom=override(x,y);
    if(custom)return custom==='blocked';
    return solids.some(p=>Math.abs(x-p.x)<p.size[0]&&Math.abs(y-p.y)<p.size[1]);
  };
  const allowsStep=(from:Point,to:Point):boolean=>{
    if(blocked(to.x,to.y))return false;
    const before=deck(from.x,from.y),after=deck(to.x,to.y);
    if(before===after)return true;
    // Entrar ou sair pelas cabeceiras em chão seco.
    const outside=before?to:from,platform=(before??after)!;
    return Math.abs(outside.x-platform.x)>=SWAMP_ART['swamp-boardwalk'].width/2-11&&
      Math.abs(outside.y-platform.y)<22&&!water(outside.x,outside.y);
  };
  return {objects,water,inWater,blocked,allowsStep,deck};
}
