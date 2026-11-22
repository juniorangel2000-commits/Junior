import {natureArt} from './nature-catalog';
import {isRuinKind, RUINS_ART, type RuinKind} from './ruins-art';
import {RUINS_ROAD_Y, ruinsRailwayRoadProtected, tileMidpoint} from './ruins-road';
import {paintedWaterPoint} from './terrain-paint';
import {TILE, WORLD_HEIGHT, WORLD_WIDTH} from './world-size';
import {editorObjectKind, type EditorObjectKind, type MapEditData} from '../systems/map-editor';
import {RUINS_HATCH_ID, RUINS_LANDMARKS, RUINS_WET_TRACK, type RuinLandmark} from './ruins-story';

type Point = {x:number;y:number};
type Route = readonly (readonly [number,number])[];
export const RUINS_SIZE = {width:WORLD_WIDTH*TILE,height:WORLD_HEIGHT*TILE};
export const RUINS_ROAD_HALF_WIDTH = 3.16;

const footpaths: Route[] = [
  [[12.6,6.4],[13.5,13],[14,17],[13.5,21.5],[12,24],[14,30],[23.5,31],[28,35],[32,44],[40,53],[52.5,55]],
  [[23.5,6.4],[23.5,19],[23.5,31],[29,30],[38,30],[43,26],[48,22],[53,17],[54.5,6.4]],
  [[37,30],[42,38],[49,39],[58,37],[64,32],[70,33],[73,38],[72,46],[63,52],[52.5,55],[51,60],[46,64]],
  [[42,38],[44,46],[50,47],[52.5,55],[59,61]],
  [[54.5,8],[58,13],[61,18],[64.5,25.5],[64,32]],
  [[76.5,7],[74,15],[72,20],[69,23],[64.5,25.5]],
];

function routeDistance(x:number,y:number,route:Route):number {
  let nearest = Infinity;
  for (let i=1;i<route.length;i++) {
    const [ax,ay]=route[i-1], [bx,by]=route[i], dx=bx-ax, dy=by-ay;
    const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));
    nearest=Math.min(nearest,Math.hypot(x-ax-t*dx,y-ay-t*dy));
  }
  return nearest;
}

export const ruinsRoadDistance = (y:number):number => Math.abs(y-RUINS_ROAD_Y);
export function ruinsTrailDistance(x:number,y:number):number {
  let nearest=Infinity;
  for(const path of footpaths)nearest=Math.min(nearest,routeDistance(x,y,path));
  return nearest;
}

const courts = [
  {x:30,y:25,rx:10.7,ry:8.2},
  {x:12,y:25,rx:5.5,ry:5.7},
  {x:12.5,y:16,rx:6.3,ry:4.9},
  {x:47,y:43,rx:5.6,ry:5.4},
  {x:65,y:29,rx:7.6,ry:9.4},
  {x:52.5,y:54,rx:7.4,ry:6.1},
];
export function ruinsCourtDistance(x:number,y:number):number {
  let nearest=Infinity;
  for(const court of courts)nearest=Math.min(nearest,Math.hypot((x-court.x)/court.rx,(y-court.y)/court.ry));
  return nearest;
}

type RuinObject = Point & {id:string;kind:EditorObjectKind;variant?:number;scale?:number;overgrown?:true};
const masonry: ReadonlyArray<readonly [RuinKind,number,number]> = [
  // Pátio de parada, guichê e curral das carroças.
  ['ruin-waystone',18,8],['ruin-toll',9,14],['ruin-rubble',10,17],['ruin-cart',16,15],['ruin-cargo',18,16],
  ['ruin-wall-break',9,19],['ruin-gateposts',13,21],['ruin-corner',8,25],['ruin-pillar',16,22],
  ['ruin-window',7,22],['ruin-trough',16,26],['ruin-wall',10,29],['ruin-rubble',18,28],['ruin-corner',17,19],
  ['ruin-flagstones',13,16],['ruin-flagstones',13,20],['ruin-flagstones',12,27],
  // Sede do posto, pátio de pedra e fundação circular.
  ['ruin-wall',19,19],['ruin-arch',23,19],['ruin-wall',27,19],['ruin-relief',32,19],['ruin-corner',36,20],
  ['ruin-corner',19,24],['ruin-wall',19,27],['ruin-pillar',26,24],['ruin-pillar',31,24],
  ['ruin-rubble',29,22],['ruin-wall-break',36,25],['ruin-rubble',38,22],['ruin-bell',41,24],
  ['ruin-bench',21,29],['ruin-column-bases',29,28],['ruin-urns',36,27],['ruin-well',33,28],
  ['ruin-wall',27,33],['ruin-corner',31,33],['ruin-rubble',35,33],['ruin-wall',38,29],['ruin-ring',34,37],
  ['ruin-flagstones',23,22],['ruin-flagstones',28,25],['ruin-flagstones',32,25],['ruin-flagstones',35,30],
  // Oficina, armazém e depósitos com duas trilhas saindo do asfalto.
  ['ruin-rubble',49,12],['ruin-wall',57,14],['ruin-rubble',59,17],['ruin-corner',51,21],
  ['ruin-facade',46,40],['ruin-hearth',42,42],['ruin-corner',49,42],['ruin-pillar',43,44],
  ['ruin-rubble',46,45],['ruin-wall',51,44],['ruin-amphora',50,40],['ruin-cargo',47,44],
  ['ruin-storehouse',64,25],['ruin-wall-break',60,25],['ruin-wall',68,25],['ruin-window',69,28],
  ['ruin-wall',62,28],['ruin-corner',66,27],['ruin-wall',70,31],['ruin-cistern',68,34],
  ['ruin-rubble',61,35],['ruin-wall',65,36],['ruin-lintel',70,37],['ruin-urns',61,29],['ruin-hatch',65,31],
  ['ruin-flagstones',64,24],['ruin-flagstones',64,27],['ruin-flagstones',64,30],
  ['ruin-marker',76,17],['ruin-amphora',72,22],['ruin-column-bases',78,21],['ruin-wall-break',78,23],
  // Praça baixa onde termina a história do posto.
  ['ruin-marker',42,48],['ruin-pillar',47,53],['ruin-pillar',58,53],['ruin-wall',49,50],
  ['ruin-plinth',52,51],['ruin-corner',56,50],['ruin-steps',52,54],['ruin-sundial',56,56],
  ['ruin-rubble',46,57],['ruin-rubble',59,55],['ruin-wall',48,59],['ruin-planter',58,59],
  ['ruin-flagstones',52,52],['ruin-flagstones',50,56],['ruin-bench',48,55],['ruin-lintel',60,51],
];

export function ruinsSeed(x:number,y:number):number {
  let h=Math.imul(x+311,73856093)^Math.imul(y+821,19349663);
  h=Math.imul(h^(h>>>16),0x45d9f3b);
  return ((h^(h>>>16))>>>0)/4294967296;
}

const original: RuinObject[] = masonry.map(([kind,x,y])=>({id:`${kind}-${x}-${y}`,kind,x,y}));
const reserved = new Set(original.map(p=>`${p.x},${p.y}`));
for(let gy=2;gy<WORLD_HEIGHT-2;gy+=3)for(let gx=2;gx<WORLD_WIDTH-2;gx+=3){
  const x=gx+Math.floor(ruinsSeed(gy,gx)*3), y=gy+Math.floor(ruinsSeed(gx,gy)*3);
  if(x>=WORLD_WIDTH-1||y>=WORLD_HEIGHT-1||reserved.has(`${x},${y}`))continue;
  const seed=ruinsSeed(x,y), border=x<3||x>89||y>65||y<4;
  const road=ruinsRoadDistance(y+.5), trail=ruinsTrailDistance(x+.5,y+.5), court=ruinsCourtDistance(x+.5,y+.5);
  if(road<3.35||trail<1.18)continue;
  const nearWall=masonry.some(([,rx,ry])=>Math.hypot(x-rx,y-ry)<2.4);
  let kind:EditorObjectKind;
  if(!nearWall&&court>1.10&&trail>2.5&&road>6&&(border||seed>.40))kind=seed>.67?'standingTree':'pine';
  else if(!nearWall&&seed>.85&&road>5&&trail>1.95)kind='mossBoulder';
  else if(seed>.71&&trail>1.62)kind='fern';
  else if(seed>.62&&trail>1.80)kind='bush';
  else if(seed>.51)kind='whiteFlowers';
  else if(seed>.08)kind=seed>.34?'tallGrassA':seed>.22?'tallGrassB':'tallGrassC';
  else continue;
  original.push({id:`${kind}-${x}-${y}`,kind,x,y,scale:.79+seed*.23,variant:Math.floor(seed*41)%3});
}

const occupiedGround=new Set(original.map(o=>`${o.x},${o.y}`));
const grassVariants=['tallGrassA','tallGrassB','tallGrassC'] as const;
const landmarkGround=masonry.filter(([kind,x,y])=>Object.hasOwn(RUINS_LANDMARKS,`${kind}-${x}-${y}`));
const masonryGround=masonry.flatMap(([kind,x,y])=>RUINS_ART[kind].bases.map(([left,right,top,bottom])=>({
  left:x*TILE+left-5,right:x*TILE+right+5,top:y*TILE+top-4,bottom:y*TILE+bottom+4,
})));
for(let y=1;y<WORLD_HEIGHT-1;y++)for(let x=1;x<WORLD_WIDTH-1;x++){
  if(ruinsRoadDistance(y+.5)<4.8||occupiedGround.has(`${x},${y}`))continue;
  const density=.38+.15*Math.sin(x*.24+y*.19)+.13*Math.cos(y*.42-x*.29);
  const seed=ruinsSeed(x+937,y+513);
  if(seed>density)continue;
  if(ruinsTrailDistance(x+.5,y+.5)<1.55||ruinsTrailDistance(x+.5,y-.25)<1.28)continue;
  if(landmarkGround.some(([,mx,my])=>Math.hypot(x-mx,y-my)<1.8))continue;
  const px=x*TILE,py=y*TILE;
  if(masonryGround.some(b=>px>b.left&&px<b.right&&py>b.top&&py<b.bottom))continue;
  const variant=ruinsSeed(x-667,y+724);
  const kind=grassVariants[Math.floor(variant*grassVariants.length)];
  original.push({id:`${kind}-${x}-${y}`,kind,x,y,scale:.83+variant*.40,overgrown:true});
}
const originalById=new Map(original.map(object=>[object.id,object]));
const grassyTerrain=new Set(['grass','meadow','forest','moss']);

export function createRuinsLayout(edits?:MapEditData) {
  const objects:RuinObject[]=[];
  const occupied=new Set<string>();
  const add=(o:RuinObject)=>{objects.push(o);occupied.add(`${o.x},${o.y}`);};
  for(const [id,edit] of Object.entries(edits?.objects??{})){
    const kind=editorObjectKind(id);
    if(!edit.removed&&kind)add({...originalById.get(id),id,kind,x:edit.x,y:edit.y});
  }
  for(const o of original){
    const key=`${o.x},${o.y}`;
    if(edits?.objects[o.id]||occupied.has(key))continue;
    if(o.overgrown&&edits){
      const terrain=edits.terrain[key];
      if(terrain&&!grassyTerrain.has(terrain))continue;
      if(Object.values(edits.points??{}).some(p=>p&&Math.hypot(o.x-p.x,o.y-p.y)<1.8))continue;
    }
    add(o);
  }
  const solid=objects.flatMap(o=>{
    const p=tileMidpoint(o);
    if(isRuinKind(o.kind))return RUINS_ART[o.kind].bases.map(([left,right,top,bottom])=>({
      left:p.x+left,right:p.x+right,top:p.y+top,bottom:p.y+bottom,
    }));
    if(o.kind==='standingTree'||o.kind==='pine'||o.kind==='vein'||natureArt(o.kind)?.solid)
      return [{left:p.x-14,right:p.x+14,top:p.y-11,bottom:p.y+6}];
    return [];
  });
  const water=(x:number,y:number)=>paintedWaterPoint(edits?.terrain,x,y,()=>false);
  const blocked=(x:number,y:number):boolean=>{
    if(x<32||y<32||x>=RUINS_SIZE.width-32||y>=RUINS_SIZE.height-32)return true;
    const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
    const collision=ruinsRailwayRoadProtected(tx,ty)?undefined:edits?.collisions?.[`${tx},${ty}`];
    if(collision)return collision==='blocked';
    return solid.some(b=>x>b.left&&x<b.right&&y>b.top&&y<b.bottom);
  };
  const inspectable=objects.flatMap(o=>Object.hasOwn(RUINS_LANDMARKS,o.id)?[{...tileMidpoint(o),landmark:RUINS_LANDMARKS[o.id]}]:[]);
  const hatch=objects.find(o=>o.id===RUINS_HATCH_ID);
  const wetTrack=hatch?{x:tileMidpoint(hatch).x-83,y:tileMidpoint(hatch).y-86}:undefined;
  const inspectNear=(x:number,y:number,wet=false):RuinLandmark|undefined=>{
    let nearest=59,found:RuinLandmark|undefined;
    for(const point of inspectable){
      const distance=Math.hypot(x-point.x,y-point.y);
      if(distance<nearest){nearest=distance;found=point.landmark;}
    }
    if(wet&&wetTrack&&Math.hypot(x-wetTrack.x,y-wetTrack.y)<Math.min(nearest,44))return RUINS_WET_TRACK;
    return found;
  };
  return {objects,water,inWater:water,blocked,inspectNear,wetTrack,allowsStep:(_from:Point,to:Point)=>!blocked(to.x,to.y)};
}
