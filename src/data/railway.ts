import {natureArt} from './nature-catalog';
import {isRailwayKind, RAILWAY_ART, type RailwayKind} from './railway-art';
import {RAILWAY_ROAD_Y, railwayRoadProtected, tileMidpoint} from './ruins-road';
import {paintedWaterPoint} from './terrain-paint';
import {TILE, WORLD_HEIGHT, WORLD_WIDTH} from './world-size';
import {editorObjectKind, type EditorObjectKind, type MapEditData} from '../systems/map-editor';
import type {RuinLandmark} from './ruins-story';

/** Estação Ferroviária Desativada (docs/cenarios/ESTACAO-FERROVIARIA.md). Grade de 96 × 72
 * ladrilhos, a mesma das Ruínas. Coordenadas em ladrilhos; o ponto de apoio dos objetos em
 * pixels é (fx·32, fy·32). */
type Point = {x:number;y:number};
type Route = readonly (readonly [number,number])[];
export const RAILWAY_SIZE = {width:WORLD_WIDTH*TILE,height:WORLD_HEIGHT*TILE};
export const RAILWAY_ROAD_HALF_WIDTH = 3.16;
/** Linhas: principal junto da plataforma e secundária de manobra e carga. */
export const RAILWAY_LINES = {main:40,yard:48} as const;
export const YARD_LINE_START = 30;
/** Plataforma (piso de lajes) e a face sul, com escada e rampa. */
export const PLATFORM = {left:24,right:76,top:32,bottom:38} as const;
export const PLATFORM_STAIRS = {left:768,right:864};
export const PLATFORM_RAMP = {left:2352,right:2432};
/** Travessias de madeira, em pixels: na linha principal sob a escada e na linha de carga. */
export const RAILWAY_CROSSINGS = [{line:'main',left:768},{line:'yard',left:2112}] as const;
export const YARD_BROKEN = {left:1792,right:1872};
/** Porta do prédio principal (frente sul, voltada para a plataforma). */
export const STATION_DOOR = {x:52.5*TILE,y:31.6*TILE};

const gravelRoutes: Route[] = [
  [[38.8,6.8],[39.4,9.5],[40.5,12.7],[40.9,16.4],[40.2,20.1],[40.9,23.7],[42.8,26.8],[44.2,29.2],[47,32.5]],
  [[66,6.8],[65.6,10.1],[64.2,13],[63.1,16.2],[63.3,19.9],[62.5,23.3],[61,26.7],[59.3,29.8],[57,32.5]],
  [[18,44],[23.8,44.6],[31.3,44.9],[38.2,43.6],[46.9,43.8],[56,44.9],[62.6,44.45],[67.5,44],[75,43.5],[82.2,44.2],[89,45.4]],
  [[18,44],[15.6,41.5],[13.7,37.3],[11.4,32.4],[10.2,27.3],[10.7,22.1],[11.7,17.3],[10.9,11.9],[10,6.8]],
  [[67.5,44],[67.5,50],[68.4,52.2],[70,54]],
];
function routeDistanceSquared(x:number,y:number,route:Route):number {
  let nearest=Infinity;
  for(let i=1;i<route.length;i++){
    const [ax,ay]=route[i-1],[bx,by]=route[i],dx=bx-ax,dy=by-ay;
    const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));
    const px=x-ax-t*dx,py=y-ay-t*dy;
    nearest=Math.min(nearest,px*px+py*py);
  }
  return nearest;
}
export const railwayRoadDistance=(y:number):number=>Math.abs(y-RAILWAY_ROAD_Y);
export function railwayGravelDistance(x:number,y:number):number {
  let nearest=Infinity;
  for(const route of gravelRoutes)nearest=Math.min(nearest,routeDistanceSquared(x,y,route));
  return Math.sqrt(nearest);
}
/** Distância (em ladrilhos) até o eixo de uma linha; a secundária começa em x=30. */
export function railwayBallastDistance(x:number,y:number):number {
  const main=Math.abs(y-RAILWAY_LINES.main);
  const yard=x>=YARD_LINE_START-.5?Math.abs(y-RAILWAY_LINES.yard):Infinity;
  return Math.min(main,yard);
}
export const onPlatform=(x:number,y:number)=>x>=PLATFORM.left&&x<PLATFORM.right&&y>=PLATFORM.top&&y<PLATFORM.bottom;
/** Mancha de terra batida ao redor do pátio (o resto é a floresta da paleta do jogo). */
export function railwayYardDistance(x:number,y:number):number {
  return Math.min(Math.hypot((x-51)/40,(y-41)/16),Math.hypot((x-52)/14,(y-24)/9));
}
export function railwaySeed(x:number,y:number):number {
  let h=Math.imul(x+571,73856093)^Math.imul(y+239,19349663);
  h=Math.imul(h^(h>>>16),0x45d9f3b);
  return ((h^(h>>>16))>>>0)/4294967296;
}

type RailwayObject = Point & {id:string;kind:EditorObjectKind;ox?:number;oy?:number;variant?:number;scale?:number;overgrown?:true;flip?:true};
const placements:ReadonlyArray<readonly [RailwayKind,number,number]> = [
  // Prédio principal, fachada para o sul e a plataforma à frente.
  ['rail-station',52.5,31.6],['rail-vine',49.1,31.62],['rail-fallen-tiles',58.4,31.9],['rail-young-tree',45.2,27.4],['rail-young-tree',60.1,26.8],
  ['rail-sign',44.2,33.3],['rail-notice-board',60.2,33.4],['rail-luggage',48.4,34.1],['rail-baggage-cart',56.6,34.7],['rail-milk-cans',31.6,33.7],
  ['rail-canopy',38,37.25],['rail-bench',37.2,34.5],['rail-canopy',67,37.25],['rail-bench',67.8,34.5],
  ['rail-lamp',30.6,36.9],['rail-lamp',45.6,36.9],['rail-lamp',60.4,36.9],['rail-lamp',74,36.9],
  ['rail-stairs',25.5,38.7],['rail-ramp',74.5,38.9],
  // Cabine de sinais, semáforo e manutenção junto da travessia.
  ['rail-signal-cabin',19.4,37.7],['rail-lever',22.1,44.7],['rail-railing',22.6,43.1],['rail-railing',28.4,43.1],
  ['rail-semaphore',30.2,44.4],['rail-switch-box',33.1,45.8],['rail-fallen-fence',8.4,44.6],['rail-old-track',14,50.3],
  // Trem parado na linha principal, do mesmo lado da travessia.
  ['rail-locomotive',45,40.55],['rail-tender',50.3,40.55],['rail-passenger-car',55.6,40.55],['rail-draisine',88,40.55],
  ['rail-water-column',80.6,38.4],
  // Linha de carga, batente, trecho quebrado e o pátio de manutenção.
  ['rail-buffer',29.4,48.45],['rail-freight-car',40.5,48.55],['rail-flatcar',80.6,48.55],['rail-broken-track',57.25,48.95],
  ['rail-sleeper-stack',36,53.2],['rail-axles',41.6,53.5],['rail-ballast-pile',46.2,52.6],['rail-sleeper',48.6,53.1],['rail-sleeper',50.1,52.8],
  // Galpão de carga ao sul da linha secundária.
  ['rail-cargo-shed',74.5,56.8],['rail-crates',80.4,58.1],['rail-milk-cans',68.6,57.8],['rail-barrel',83.2,55.4],['rail-luggage',66.9,55.8],
  ['rail-mossy-rocks',12,57],['rail-mossy-rocks',89,61],['rail-young-tree',26,58],['rail-young-tree',87,30],
];
/** Mureta da face sul da plataforma, em peças de 96 px, com vãos para a escada e a rampa. */
const walls:[RailwayKind,number,number][]=[];
for(let x=PLATFORM_STAIRS.right+48;x<=PLATFORM_RAMP.left-48+1;x+=96)walls.push(['rail-platform-wall',x/TILE,PLATFORM.bottom+.05]);
if((PLATFORM_RAMP.left-PLATFORM_STAIRS.right)%96)walls.push(['rail-platform-wall',(PLATFORM_RAMP.left-48)/TILE,PLATFORM.bottom+.05]);

function place([kind,fx,fy]:readonly [RailwayKind,number,number]):RailwayObject {
  const x=Math.floor(fx),y=Math.floor(fy);
  return {id:`${kind}-${x}-${y}`,kind,x,y,ox:Math.round((fx-x-.5)*TILE),oy:Math.round((fy-y-.5)*TILE)};
}
const original:RailwayObject[]=[];
const ids=new Set<string>();
for(const p of [...placements,...walls]){
  let o=place(p);
  for(let n=2;ids.has(o.id);n++)o={...o,id:`${place(p).id}-${n}`};
  ids.add(o.id);original.push(o);
}
const reservedRects=original.flatMap(o=>{
  const art=isRailwayKind(o.kind)?RAILWAY_ART[o.kind]:undefined;if(!art)return[];
  const px=(o.x+.5)*TILE+(o.ox??0),py=(o.y+.5)*TILE+(o.oy??0);
  return [{left:px-art.width/2-10,right:px+art.width/2+10,top:py-art.height*.55,bottom:py+12}];
});
const reserved=(x:number,y:number)=>{const px=(x+.5)*TILE,py=(y+.5)*TILE;return reservedRects.some(r=>px>r.left&&px<r.right&&py>r.top&&py<r.bottom);};
const doorway=(x:number,y:number)=>Math.abs(x+.5-STATION_DOOR.x/TILE)<2.5&&y+.5>=STATION_DOOR.y/TILE-1&&y+.5<PLATFORM.top+2;
const crossingLane=(x:number)=>RAILWAY_CROSSINGS.some(c=>(x+.5)*TILE>c.left-24&&(x+.5)*TILE<c.left+120);

// Floresta e vegetação rasteira da paleta do jogo nas bordas e longe do pátio.
for(let gy=2;gy<WORLD_HEIGHT-2;gy+=3)for(let gx=2;gx<WORLD_WIDTH-2;gx+=3){
  const x=gx+Math.floor(railwaySeed(gy,gx)*3),y=gy+Math.floor(railwaySeed(gx,gy)*3);
  if(x>=WORLD_WIDTH-1||y>=WORLD_HEIGHT-1||reserved(x,y))continue;
  const seed=railwaySeed(x,y),yard=railwayYardDistance(x+.5,y+.5),gravel=railwayGravelDistance(x+.5,y+.5);
  if(railwayRoadDistance(y+.5)<3.5||gravel<1.3||onPlatform(x,y)||doorway(x,y)||railwayBallastDistance(x+.5,y+.5)<1.7)continue;
  let kind:EditorObjectKind;
  const road=railwayRoadDistance(y+.5);
  // Árvores longe da estrada: a copa (211 px) não pode cobrir o asfalto.
  if(yard>1.05&&gravel>2.6&&road>6.2&&(seed>.36||x<3||x>91||y>66))kind=seed>.66?'standingTree':'pine';
  else if(yard>.92&&seed>.86&&gravel>2&&road>4.6)kind='mossBoulder';
  else if(seed>.70)kind='fern';
  else if(seed>.60&&gravel>1.9)kind='bush';
  else if(seed>.50)kind='whiteFlowers';
  else if(seed>.10)kind=seed>.36?'tallGrassA':seed>.23?'tallGrassB':'tallGrassC';
  else continue;
  original.push({id:`${kind}-${x}-${y}`,kind,x,y,scale:.80+seed*.22,variant:Math.floor(seed*41)%3});
}
// Capim ferroviário e silvas: denso na linha de carga, atrás dos prédios e ao pé da plataforma.
const occupied=new Set(original.map(o=>`${o.x},${o.y}`));
const thicket=(x:number,y:number)=>{
  const yardLine=x>=YARD_LINE_START&&y>=RAILWAY_LINES.yard+1.6&&y<RAILWAY_LINES.yard+4.6;
  const behind=y>=19&&y<29.5&&x>=36&&x<69;
  const foot=y>=PLATFORM.bottom+.2&&y<PLATFORM.bottom+1&&x>=PLATFORM.left+1&&x<PLATFORM.right;
  const shed=x>=62&&x<88&&y>=58&&y<62;
  if(yardLine||behind||foot||shed)return yardLine?.62:behind?.42:foot?.30:.45;
  const distance=railwayGravelDistance(x+.5,y+.5);
  const patch=Math.sin(x*.45+y*.28)+.62*Math.sin(x*.98-y*.67);
  return railwayRoadDistance(y+.5)>4.5&&distance>1.6&&distance<3.8&&
    !onPlatform(x+.5,y+.5)&&railwayBallastDistance(x+.5,y+.5)>1.7&&patch>.5?.28:0;
};
const railGrass=['rail-grass-green','rail-grass-plume','rail-grass-dry','rail-brambles','rail-fern'] as const;
for(let y=2;y<WORLD_HEIGHT-2;y++)for(let x=2;x<WORLD_WIDTH-2;x++){
  const density=thicket(x,y);if(!density||occupied.has(`${x},${y}`)||reserved(x,y)||doorway(x,y)||crossingLane(x))continue;
  if(railwayGravelDistance(x+.5,y+.5)<1.25||railwaySeed(x+311,y+97)>density)continue;
  if(x*TILE>=YARD_BROKEN.left-32&&x*TILE<YARD_BROKEN.right+32&&Math.abs(y-RAILWAY_LINES.yard)<3)continue;
  const pick=railwaySeed(x-71,y+404),kind=railGrass[Math.floor(pick*railGrass.length)];
  occupied.add(`${x},${y}`);
  original.push({id:`${kind}-${x}-${y}`,kind,x,y,scale:.78+pick*.32,overgrown:true,...(pick>.5?{flip:true as const}:{})});
}

// Manchas de capim alto além do pátio mantêm a mesma lógica dos tufos das Ruínas.
for(let y=1;y<WORLD_HEIGHT-1;y++)for(let x=1;x<WORLD_WIDTH-1;x++){
  if(occupied.has(`${x},${y}`)||railwayRoadDistance(y+.5)<5.4||onPlatform(x+.5,y+.5))continue;
  const density=.38+.16*Math.sin(x*.24+y*.19)+.15*Math.cos(y*.42-x*.29);
  const seed=railwaySeed(x+937,y+519);
  if(seed>density||doorway(x,y)||reserved(x,y))continue;
  if(railwayGravelDistance(x+.5,y+.5)<1.7||railwayGravelDistance(x+.5,y-.25)<1.35)continue;
  const ballast=railwayBallastDistance(x+.5,y+.5);
  if(ballast<1.85||railwayBallastDistance(x+.5,y-.75)<1.28||ballast<3.7&&crossingLane(x))continue;
  const pick=railwaySeed(x-667,y+725),kind=railGrass[Math.floor(pick*3)];
  original.push({
    id:`${kind}-${x}-${y}`,kind,x,y,scale:.84+pick*.36,overgrown:true,
    ox:Math.round((railwaySeed(x+13,y+43)-.5)*9),oy:Math.round((seed-.2)*11),
    ...(pick>.5?{flip:true as const}:{}),
  });
}
const originalById=new Map(original.map(o=>[o.id,o]));
export const RAILWAY_ORIGINAL_OBJECTS:readonly RailwayObject[]=original;
const grassyTerrain=new Set(['grass','meadow','forest','moss']);

/** Pontos de examinar e a porta da sala de espera. */
export const RAILWAY_LANDMARKS:Readonly<Record<string,RuinLandmark>>={
  'rail-sign-44-33':{name:'Placa da estação',text:'As letras quase sumiram, mas ainda dá para ler “Estação do Desvio”. Embaixo, alguém riscou a data da última partida.'},
  'rail-notice-board-60-33':{name:'Quadro de avisos',text:'Restos de um aviso: “Circulação suspensa até a baixa das águas. Os passageiros devem procurar o posto da estrada.”'},
  'rail-signal-cabin-19-37':{name:'Cabine de sinais',text:'As alavancas estão emperradas na posição de parada. O livro de turnos termina no meio de uma frase.'},
  'rail-locomotive-45-40':{name:'Locomotiva',text:'A caldeira está fria há muito tempo. Na cabine, um apito de bronze ainda pende de uma corrente.'},
};
export const STATION_HALL_DOOR:RuinLandmark={name:'Sala de espera',text:'A porta da sala de espera está entreaberta.',hall:true};

export function createRailwayLayout(edits?:MapEditData) {
  const objects:RailwayObject[]=[];
  const used=new Set<string>();
  const protectedPoints=Object.values(edits?.points??{});
  const add=(o:RailwayObject)=>{objects.push(o);used.add(`${o.x},${o.y}`);};
  for(const [id,edit] of Object.entries(edits?.objects??{})){
    const kind=editorObjectKind(id);
    if(!edit.removed&&kind)add({...originalById.get(id),id,kind,x:edit.x,y:edit.y});
  }
  for(const o of original){
    if(edits?.objects[o.id])continue;
    if(o.overgrown){
      const tile=`${o.x},${o.y}`,terrain=edits?.terrain[tile];
      if(used.has(tile)||terrain&&!grassyTerrain.has(terrain)||
        protectedPoints.some(p=>p&&Math.hypot(o.x-p.x,o.y-p.y)<1.8))continue;
    }
    add(o);
  }
  const pivot=(o:RailwayObject)=>({x:(o.x+.5)*TILE+(o.ox??0),y:(o.y+.5)*TILE+(o.oy??0)});
  const solid=objects.flatMap(o=>{
    const p=pivot(o);
    if(isRailwayKind(o.kind))return RAILWAY_ART[o.kind].bases.map(([left,right,top,bottom])=>({left:p.x+left,right:p.x+right,top:p.y+top,bottom:p.y+bottom}));
    if(o.kind==='standingTree'||o.kind==='pine'||natureArt(o.kind)?.solid)return [{left:p.x-14,right:p.x+14,top:p.y-11,bottom:p.y+6}];
    return [];
  });
  const water=(x:number,y:number)=>paintedWaterPoint(edits?.terrain,x,y,()=>false);
  const blocked=(x:number,y:number):boolean=>{
    if(x<32||y<32||x>=RAILWAY_SIZE.width-32||y>=RAILWAY_SIZE.height-32)return true;
    const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
    const collision=railwayRoadProtected(tx,ty)?undefined:edits?.collisions?.[`${tx},${ty}`];
    if(collision)return collision==='blocked';
    return solid.some(b=>x>b.left&&x<b.right&&y>b.top&&y<b.bottom);
  };
  const inspectable=objects.flatMap(o=>Object.hasOwn(RAILWAY_LANDMARKS,o.id)?[{...pivot(o),landmark:RAILWAY_LANDMARKS[o.id]}]:[]);
  const station=objects.find(o=>o.kind==='rail-station');
  const door=station?{x:pivot(station).x,y:pivot(station).y}:undefined;
  const inspectNear=(x:number,y:number):RuinLandmark|undefined=>{
    if(door&&Math.abs(x-door.x)<30&&y>door.y&&y<door.y+44)return STATION_HALL_DOOR;
    let nearest=62,found:RuinLandmark|undefined;
    for(const point of inspectable){const d=Math.hypot(x-point.x,y-point.y);if(d<nearest){nearest=d;found=point.landmark;}}
    return found;
  };
  return {objects,pivot,water,inWater:water,blocked,inspectNear,door,allowsStep:(_from:Point,to:Point)=>!blocked(to.x,to.y)};
}
export {tileMidpoint};
