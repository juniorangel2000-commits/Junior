import {COAST_ART,isCoastKind,type CoastKind} from './coast-art';
import {natureArt} from './nature-catalog';
import {coastRiverBanksAt,coastApproach} from './fields-river';
import type {RuinLandmark} from './ruins-story';
import {paintedWaterPoint} from './terrain-paint';
import {TILE,WORLD_HEIGHT,WORLD_WIDTH} from './world-size';
import {editorObjectKind,type EditorObjectKind,type MapEditData} from '../systems/map-editor';

type Point={x:number;y:number};
type Bounds={left:number;right:number;top:number;bottom:number};
type CoastObject=Point & {id:string;kind:EditorObjectKind;scale?:number;flip?:true;variant?:number;generated?:true};
export const COAST_SIZE={width:WORLD_WIDTH*TILE,height:WORLD_HEIGHT*TILE};
export function coastSeaY(x:number):number {
  const east=Math.max(0,Math.min(1,(x-1700)/700));
  return 1520+95*Math.sin(x*.004+1)+59*Math.sin(x*.0087)+84*Math.cos(x*.0025)-east*120;
}
const riverRows=Array.from({length:COAST_SIZE.height+1},(_,y)=>coastRiverBanksAt(y+.5));
const seaColumns=Float32Array.from({length:COAST_SIZE.width+1},(_,x)=>coastSeaY(x+.5));
export function coastShoreDistance(x:number,y:number):number{
  const river=riverRows[Math.max(0,Math.min(COAST_SIZE.height,Math.floor(y)))];
  const sea=seaColumns[Math.max(0,Math.min(COAST_SIZE.width,Math.floor(x)))];
  const riverDistance=Math.min(x-river.left,river.right-x),seaDistance=y-sea;
  const radius=105;
  const blend=Math.max(0,radius-Math.abs(riverDistance-seaDistance));
  return Math.max(riverDistance,seaDistance)+blend*blend/(radius*4);
}
export const coastBaseWater=(x:number,y:number):boolean=>coastShoreDistance(x,y)>0;

const trails=[
  [[28.5,0],[28.5,5],[30,10],[34,15],[37,21],[40,25],[44,29],[48,34],[51,38]],
  [[37,21],[31,23],[27,26],[23,31],[23,36],[28,39],[34,39]],
  [[44,29],[42,33],[39,35],[34,39],[29,40],[25,39]],
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
  ['coast-hut',49,31],['coast-pier',59,39],['coast-boat',50,41],
  ['coast-net-rack',50,34],['coast-lantern',51,36],['coast-lantern',54,40],
  ['coast-broken-fence',46,32],['coast-driftwood',44,39],
  ['coast-rocks',50,24],['coast-rocks',51,25],['coast-rocks',55,30],
  ['coast-rocks',35,48],['coast-rocks',37,47],['coast-rocks',38,46],
  ['coast-rocks',72,41],['coast-rocks',73,41],['coast-rocks',77,38],
  ['coast-driftwood',36,42],['coast-shells',31,43],
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
  if(occupied.has(key(x,y))||coastApproach(x,y)||coastTrailDistance(x+.5,y+.5)<2.65||
    coastShoreDistance(p.x,p.y)>-365||reserved.some(b=>contains(b,p.x,p.y)))continue;
  const seed=coastSeed(x,y);
  if(seed<.37&&x>4&&y<67)continue;
  const kind=seed>.59?'standingTree':'pine';
  original.push({id:`${kind}-${x}-${y}`,kind,x,y,variant:Math.floor(seed*37)%3,scale:.77+seed*.32,generated:true});
  occupied.add(key(x,y));
}
for(let y=2;y<WORLD_HEIGHT-2;y++)for(let x=2;x<WORLD_WIDTH-2;x++){
  const p=pivot({x,y}),shore=coastShoreDistance(p.x,p.y),pick=coastSeed(x+105,y+419);
  if(occupied.has(key(x,y))||shore> -18||coastApproach(x,y)||
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
    if(coastApproach(Math.floor(x/TILE),Math.floor(y/TILE)))return false;
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
    const collision=coastApproach(tx,ty)?undefined:edits?.collisions?.[key(tx,ty)];
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
