import {COAST_ART,isCoastKind,type CoastKind} from './coast-art';
import {natureArt} from './nature-catalog';
import {COAST_ENTRY,coastEntryProtected} from './ruins-road';
import type {RuinLandmark} from './ruins-story';
import {paintedWaterPoint} from './terrain-paint';
import {TILE,WORLD_HEIGHT,WORLD_WIDTH} from './world-size';
import {editorObjectKind,type EditorObjectKind,type MapEditData} from '../systems/map-editor';

/** Costa das Marés: ao sul dos Campos Abertos. O rio que nasce na propriedade atravessa
 * os Campos, entra pelo norte e deságua no mar, que ocupa o sul e avança pelo leste
 * formando uma enseada com o píer. Sem estrada e sem trilho. */
type Point={x:number;y:number};
type Bounds={left:number;right:number;top:number;bottom:number};
type CoastObject=Point & {id:string;kind:EditorObjectKind;scale?:number;flip?:true;variant?:number;generated?:true};
type Line=readonly (readonly [number,number])[];
export const COAST_SIZE={width:WORLD_WIDTH*TILE,height:WORLD_HEIGHT*TILE};
/** Linha da praia, de oeste para leste (ladrilhos). O mar fica do lado sul/direito. */
export const COAST_SHORE:Line=[[-1,58],[10,59.5],[20,58.5],[30,60.5],[38,59],[46,56.5],[53,52],[57,47],[60,42.5],[64,39],[70,36.5],[78,35.5],[86,36.5],[97,35]];
/** Rio vindo dos Campos (mesma coluna em que ele sai de lá) até a foz. */
export const COAST_RIVER:Line=[[16.1,-1],[16.4,10],[18.5,20],[23,30],[28,40],[32,50],[34.5,60],[35.5,68]];
const riverHalf=(y:number)=>(1.7+1.9*Math.max(0,Math.min(1,(y/TILE-30)/36)))*TILE;

const segments=(line:Line)=>line.slice(1).map(([bx,by],i)=>{const [ax,ay]=line[i];return{ax:ax*TILE,ay:ay*TILE,dx:(bx-ax)*TILE,dy:(by-ay)*TILE};});
const shoreSegments=segments(COAST_SHORE),riverSegments=segments(COAST_RIVER);
function lineDistance(list:ReturnType<typeof segments>,x:number,y:number):{distance:number;side:number} {
  let best=Infinity,side=0;
  for(const s of list){
    const t=Math.max(0,Math.min(1,((x-s.ax)*s.dx+(y-s.ay)*s.dy)/(s.dx*s.dx+s.dy*s.dy)));
    const px=x-s.ax-t*s.dx,py=y-s.ay-t*s.dy,d=px*px+py*py;
    if(d<best){best=d;side=s.dx*(y-s.ay)-s.dy*(x-s.ax);}
  }
  return {distance:Math.sqrt(best),side};
}
/** Distância assinada até a praia em pixels: positiva no mar. Pré-calculada em grade de 8 px. */
const GRID=8,gw=COAST_SIZE.width/GRID+1,gh=COAST_SIZE.height/GRID+1,shoreGrid=new Float32Array(gw*gh);
for(let gy=0;gy<gh;gy++)for(let gx=0;gx<gw;gx++){const {distance,side}=lineDistance(shoreSegments,gx*GRID,gy*GRID);shoreGrid[gy*gw+gx]=side>0?distance:-distance;}
export function coastShoreDistance(x:number,y:number):number {
  const fx=Math.max(0,Math.min(gw-1.001,x/GRID)),fy=Math.max(0,Math.min(gh-1.001,y/GRID)),ix=Math.floor(fx),iy=Math.floor(fy),tx=fx-ix,ty=fy-iy,i=iy*gw+ix;
  return (shoreGrid[i]*(1-tx)+shoreGrid[i+1]*tx)*(1-ty)+(shoreGrid[i+gw]*(1-tx)+shoreGrid[i+gw+1]*tx)*ty;
}
/** Distância (px) até a margem do rio: negativa dentro d'água. */
export const coastRiverEdge=(x:number,y:number):number=>lineDistance(riverSegments,x,y).distance-riverHalf(y);
export const coastBaseWater=(x:number,y:number):boolean=>coastShoreDistance(x,y)>0||coastRiverEdge(x,y)<0;
/** Pontos ao longo da praia (para espuma e detalhes de areia), com a normal para o mar. */
export const COAST_SHORE_POINTS:readonly {x:number;y:number;nx:number;ny:number}[]=shoreSegments.flatMap(s=>{
  const length=Math.hypot(s.dx,s.dy),steps=Math.max(1,Math.floor(length/38)),nx=-s.dy/length,ny=s.dx/length;
  return Array.from({length:steps},(_,i)=>({x:s.ax+s.dx*i/steps,y:s.ay+s.dy*i/steps,nx,ny}));
}).filter(p=>p.x>=0&&p.x<=COAST_SIZE.width&&p.y>=0&&p.y<=COAST_SIZE.height);

const trails=[
  [[COAST_ENTRY.x+.5,2],[29,12],[33,22],[40,30],[48,37],[54,41.5],[57,44.5]],
  [[29,12],[25,15],[21.5,16]],
  [[48,37],[46,47],[45,53]],
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
/** Faixa da chegada pelo norte (ladrilhos), sem árvores. */
const entryLane=(x:number,y:number)=>Math.abs(x-COAST_ENTRY.x-.5)<3.2&&y<8;
export function coastSeed(x:number,y:number):number {
  let h=Math.imul(x+401,73856093)^Math.imul(y+823,19349663);
  h=Math.imul(h^(h>>>16),0x45d9f3b);
  return ((h^(h>>>16))>>>0)/4294967296;
}

const placements:ReadonlyArray<readonly [CoastKind,number,number]>=[
  ['coast-hut',54,41],['coast-pier',64,46],['coast-boat',52,52],
  ['coast-net-rack',49,43],['coast-lantern',51,40],['coast-lantern',56,44],
  ['coast-broken-fence',43,38],['coast-driftwood',40,55],['coast-driftwood',62,37],
  ['coast-rocks',75,36],['coast-rocks',77,37],['coast-rocks',76,38],
  ['coast-rocks',8,60],['coast-rocks',9,61],['coast-rocks',10,60],
  ['coast-rocks',24,61],['coast-rocks',25,62],
  ['coast-shells',48,55],['coast-shells',58,49],
];
const original:CoastObject[]=placements.map(([kind,x,y])=>({id:`${kind}-${x}-${y}`,kind,x,y}));
const key=(x:number,y:number)=>`${x},${y}`;
const occupied=new Set(original.map(o=>key(o.x,o.y)));
const pivot=(o:Point):Point=>({x:(o.x+.5)*TILE,y:(o.y+.5)*TILE});
const relative=(p:Point,left:number,right:number,top:number,bottom:number):Bounds=>
  ({left:p.x+left,right:p.x+right,top:p.y+top,bottom:p.y+bottom});
const contains=(b:Bounds,x:number,y:number)=>x>=b.left&&x<b.right&&y>=b.top&&y<b.bottom;
const pierBounds=(o:Point):Bounds=>relative(pivot(o),-224,225,-77,-24);
const originalPier=pierBounds({x:64,y:46});
const reserved=placements.map(([kind,x,y])=>{
  const reach=COAST_ART[kind].width*.5+10;
  return relative(pivot({x,y}),-reach,reach,-52,18);
});
for(let gy=2;gy<WORLD_HEIGHT-2;gy+=3)for(let gx=2;gx<WORLD_WIDTH-2;gx+=3){
  const x=gx+Math.floor(coastSeed(gy,gx)*3),y=gy+Math.floor(coastSeed(gx,gy)*3),p=pivot({x,y});
  if(occupied.has(key(x,y))||entryLane(x,y)||coastTrailDistance(x+.5,y+.5)<2.65||
    coastShoreDistance(p.x,p.y)>-365||coastRiverEdge(p.x,p.y)<96||reserved.some(b=>contains(b,p.x,p.y)))continue;
  const seed=coastSeed(x,y);
  if(seed<.37&&x>4&&y<67)continue;
  const kind=seed>.59?'standingTree':'pine';
  original.push({id:`${kind}-${x}-${y}`,kind,x,y,variant:Math.floor(seed*37)%3,scale:.77+seed*.32,generated:true});
  occupied.add(key(x,y));
}
for(let y=2;y<WORLD_HEIGHT-2;y++)for(let x=2;x<WORLD_WIDTH-2;x++){
  const p=pivot({x,y}),shore=coastShoreDistance(p.x,p.y),pick=coastSeed(x+105,y+419);
  if(occupied.has(key(x,y))||shore> -18||entryLane(x,y)||coastRiverEdge(p.x,p.y)<20||
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
  'coast-boat':{name:'Barco encalhado',text:'A maré deixou o barco acima da areia molhada. O casco ainda guarda uma faixa de tinta azul, quase apagada pelo sal.'},
  'coast-net-rack':{name:'Varal de redes',text:'Nós desfeitos, boias de cortiça e um pedaço de rede ainda resistem ao vento.'},
};

export function createCoastLayout(edits?:MapEditData) {
  const terrain=edits?.terrain??{},edited=Object.keys(terrain).length>0;
  const water=(x:number,y:number):boolean=>{
    if(coastEntryProtected(Math.floor(x/TILE),Math.floor(y/TILE)))return false;
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
    const collision=coastEntryProtected(tx,ty)?undefined:edits?.collisions?.[key(tx,ty)];
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
