import {COAST_ART,isCoastKind,type CoastKind} from './coast-art';
import {natureArt} from './nature-catalog';
import {COAST_ROAD_Y,coastRoadProtected} from './ruins-road';
import type {RuinLandmark} from './ruins-story';
import {paintedWaterPoint} from './terrain-paint';
import {TILE,WORLD_HEIGHT,WORLD_WIDTH} from './world-size';
import {editorObjectKind,type EditorObjectKind,type MapEditData} from '../systems/map-editor';

type Point={x:number;y:number};
type Bounds={left:number;right:number;top:number;bottom:number};
type CoastObject=Point & {id:string;kind:EditorObjectKind;scale?:number;flip?:true;variant?:number;generated?:true};
export const COAST_SIZE={width:WORLD_WIDTH*TILE,height:WORLD_HEIGHT*TILE};
export const COAST_ROAD_HALF_WIDTH=3.16;
export const COAST_TRACKS=[{y:40,end:29*TILE},{y:48,end:13*TILE}] as const;
export function coastTrackDistance(x:number,y:number):number {
  let distance=Infinity;
  for(const line of COAST_TRACKS)distance=Math.min(distance,Math.hypot(Math.max(0,x-line.end),y-line.y*TILE));
  return distance;
}

export const coastRoadDistance=(y:number):number=>Math.abs(y-COAST_ROAD_Y);
export function coastShoreX(y:number):number {
  const t=y/TILE;
  const headland=55*Math.exp(-(((t-3)/9)**4));
  return (56.8+6.5*Math.sin((t-14)*.135)+3.4*Math.cos(t*.33)+headland)*TILE;
}
const shoreRows=Float32Array.from({length:COAST_SIZE.height+1},(_,y)=>coastShoreX(y+.5));
export const coastShoreDistance=(x:number,y:number):number=>
  x-(shoreRows[Math.max(0,Math.min(COAST_SIZE.height,Math.floor(y)))]??coastShoreX(y));
export const coastBaseWater=(x:number,y:number):boolean=>coastShoreDistance(x,y)>0;

const trails=[
  [[31,6.4],[31.7,12],[32,18],[36.2,22],[39,27],[43,31],[49,36],[53,38.25]],
  [[49,36],[49.4,42],[46.4,47],[47.6,54],[49,57],[54,60],[57,59]],
  [[31.7,12],[39,13],[44,15],[49.6,19],[53,21],[59,21]],
] as const;
const trailSegments=trails.flatMap(route=>route.slice(1).map(([x,y],i)=>{
  const [ax,ay]=route[i],dx=x-ax,dy=y-ay;
  return {ax,ay,dx,dy,inverseLength:1/(dx*dx+dy*dy)};
}));
export function coastTrailDistance(x:number,y:number):number {
  let nearest=Infinity;
  for(const {ax,ay,dx,dy,inverseLength} of trailSegments){
    const along=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)*inverseLength));
    const px=x-ax-along*dx,py=y-ay-along*dy;
    nearest=Math.min(nearest,px*px+py*py);
  }
  return Math.sqrt(nearest);
}
export function coastSeed(x:number,y:number):number {
  let h=Math.imul(x+401,73856093)^Math.imul(y+823,19349663);
  h=Math.imul(h^(h>>>16),0x45d9f3b);
  return ((h^(h>>>16))>>>0)/4294967296;
}

const placements:ReadonlyArray<readonly [CoastKind,number,number]>=[
  ['coast-hut',49,31],['coast-pier',59,39],['coast-boat',52,41],
  ['coast-net-rack',50,34],['coast-lantern',51,36],['coast-lantern',54,40],
  ['coast-broken-fence',46,32],['coast-driftwood',45,44],
  ['coast-rocks',63,17],['coast-rocks',65,19],['coast-rocks',62,21],['coast-rocks',64,22],
  ['coast-rocks',48,49],['coast-rocks',49,50],['coast-rocks',49,51],
  ['coast-rocks',57,63],['coast-rocks',58,64],['coast-rocks',57,66],
  ['coast-driftwood',54,58],['coast-shells',52,42],
];
const original:CoastObject[]=placements.map(([kind,x,y])=>({id:`${kind}-${x}-${y}`,kind,x,y}));
const key=(x:number,y:number)=>`${x},${y}`;
const occupied=new Set(original.map(o=>key(o.x,o.y)));
const pivot=(o:Point):Point=>({x:(o.x+.5)*TILE,y:(o.y+.5)*TILE});
const relative=(p:Point,left:number,right:number,top:number,bottom:number):Bounds=>
  ({left:p.x+left,right:p.x+right,top:p.y+top,bottom:p.y+bottom});
const contains=(b:Bounds,x:number,y:number)=>x>=b.left&&x<b.right&&y>=b.top&&y<b.bottom;
const pierBounds=(o:Point):Bounds=>relative(pivot(o),-224,225,-77,-24);
const originalPier=pierBounds({x:59,y:39});
const reserved=placements.map(([kind,x,y])=>{
  const reach=COAST_ART[kind].width*.5+10;
  return relative(pivot({x,y}),-reach,reach,-52,18);
});
for(let gy=2;gy<WORLD_HEIGHT-2;gy+=3)for(let gx=2;gx<WORLD_WIDTH-2;gx+=3){
  const x=gx+Math.floor(coastSeed(gy,gx)*3),y=gy+Math.floor(coastSeed(gx,gy)*3),p=pivot({x,y});
  if(occupied.has(key(x,y))||coastRoadDistance(y+.5)<5.5||coastTrailDistance(x+.5,y+.5)<2.65||
    coastShoreDistance(p.x,p.y)>-365||coastTrackDistance(p.x,p.y)<99||reserved.some(b=>contains(b,p.x,p.y)))continue;
  const seed=coastSeed(x,y);
  if(seed<.37&&x>4&&y<67)continue;
  const kind=seed>.59?'standingTree':'pine';
  original.push({id:`${kind}-${x}-${y}`,kind,x,y,variant:Math.floor(seed*37)%3,scale:.77+seed*.32,generated:true});
  occupied.add(key(x,y));
}
for(let y=2;y<WORLD_HEIGHT-2;y++)for(let x=2;x<WORLD_WIDTH-2;x++){
  const p=pivot({x,y}),shore=coastShoreDistance(p.x,p.y),pick=coastSeed(x+105,y+419);
  if(occupied.has(key(x,y))||shore> -18||coastRoadDistance(y+.5)<4.5||
    coastTrailDistance(x+.5,y+.5)<1.5||coastTrailDistance(x+.5,y-.25)<1.17||
    reserved.some(b=>contains(b,p.x,p.y))||contains(originalPier,p.x,p.y))continue;
  const density=(shore< -78?.29:.12)+.12*Math.sin(x*.3+y*.18)+.07*Math.cos(y*.42-x*.15);
  if(pick>density)continue;
  const t=coastSeed(x+431,y-226);
  const kind:CoastKind=shore> -62?'coast-shells':t<.35?'coast-tall-grass':t<.62?'coast-dune-grass':'coast-groundcover';
  occupied.add(key(x,y));
  original.push({id:`${kind}-${x}-${y}`,kind,x,y,scale:.74+t*.43,generated:true,...(pick<.15?{flip:true as const}:{})});
}
export const COAST_ORIGINAL_OBJECTS:readonly CoastObject[]=original;
const originals=new Map(original.map(o=>[o.id,o]));
const grassTerrain=new Set(['grass','meadow','moss','forest','sand']);

const landmarks:Partial<Record<EditorObjectKind,RuinLandmark>>={
  'coast-hut':{name:'Abrigo dos pescadores',text:'A madeira do abrigo guarda marcas de sal. Sob o beiral ainda há pregos para pendurar as redes depois da pesca.'},
  'coast-boat':{name:'Barco encalhado',text:'A maré deixou o barco acima da areia molhada. O casco carrega a mesma marca de tinta azul das velhas caixas da Estação.'},
  'coast-net-rack':{name:'Varal de redes',text:'Nós desfeitos, boias de cortiça e um pedaço de rede ainda resistem ao vento.'},
};

export function createCoastLayout(edits?:MapEditData) {
  const terrain=edits?.terrain??{},edited=Object.keys(terrain).length>0;
  const water=(x:number,y:number):boolean=>{
    if(coastRoadProtected(Math.floor(x/TILE),Math.floor(y/TILE)))return false;
    return edited?paintedWaterPoint(terrain,x,y,coastBaseWater):coastBaseWater(x,y);
  };
  const objects:CoastObject[]=[];
  const used=new Set<string>();
  const add=(object:CoastObject)=>{objects.push(object);used.add(key(object.x,object.y));};
  for(const [id,edit] of Object.entries(edits?.objects??{})){
    const kind=editorObjectKind(id);
    if(!edit.removed&&kind)add({...originals.get(id),id,kind,x:edit.x,y:edit.y});
  }
  for(const object of original){
    const tile=key(object.x,object.y);
    if(edits?.objects[object.id]||used.has(tile))continue;
    if(object.generated&&terrain[tile]&&!grassTerrain.has(terrain[tile]))continue;
    add(object);
  }
  const decks=objects.filter(o=>o.kind==='coast-pier').map(pierBounds);
  const deck=(x:number,y:number)=>decks.find(b=>contains(b,x,y));
  const solid=objects.flatMap(o=>{
    const p=pivot(o);
    if(isCoastKind(o.kind))return COAST_ART[o.kind].bases.map(([left,right,top,bottom])=>relative(p,left,right,top,bottom));
    return o.kind==='standingTree'||o.kind==='pine'||natureArt(o.kind)?.solid?[relative(p,-13,13,-10,6)]:[];
  });
  const blocked=(x:number,y:number):boolean=>{
    if(x<TILE||y<TILE||x>=COAST_SIZE.width-TILE||y>=COAST_SIZE.height-TILE)return true;
    const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
    const collision=coastRoadProtected(tx,ty)?undefined:edits?.collisions?.[key(tx,ty)];
    return collision?collision==='blocked':solid.some(b=>contains(b,x,y));
  };
  const inspectable=objects.flatMap(o=>landmarks[o.kind]?[{...pivot(o),landmark:landmarks[o.kind]!}]:[]);
  return {
    objects,pivot,water,blocked,
    pierEntries:decks.map(b=>({x:b.left-11,y:(b.top+b.bottom)/2})),
    onDeck:(x:number,y:number)=>!!deck(x,y),
    inWater:(x:number,y:number)=>!deck(x,y)&&water(x,y),
    allowsStep(from:Point,to:Point):boolean {
      if(blocked(to.x,to.y))return false;
      const before=deck(from.x,from.y),after=deck(to.x,to.y);
      if(before===after)return true;
      const bank=before?to:from, edge=before??after!;
      return bank.x<edge.left&&!water(bank.x,bank.y)&&
        bank.y>=edge.top+4&&bank.y<=edge.bottom-4;
    },
    inspectNear(x:number,y:number):RuinLandmark|undefined {
      let nearest=56,found:RuinLandmark|undefined;
      for(const p of inspectable){
        const distance=Math.hypot(x-p.x,y-p.y);
        if(distance<nearest){nearest=distance;found=p.landmark;}
      }
      return found;
    },
  };
}
