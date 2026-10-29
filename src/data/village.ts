import {villageNorthConnectionDistance} from './city-forest';
import {VILLAGE_DRESSING,villageDressingBounds,villageDressingBlockedPoint} from './village-dressing';
import {PLAZA_BEDS,PLAZA_LAMPS,plazaFurnitureBlockedPoint,plazaFurnitureBlockedTile} from './village-plaza';
import {VILLAGE_LANDMARKS,villageLandmarkBlockedPoint,villageLandmarkBlockedTile,villageLandmarkClearing} from './village-landmarks';
import {facadeForMerchant,facadeBlockedPoint} from './shop-facades';
import {tobiasShopBlockedPoint} from './tobias-shop';
import {cottageSolidPoint,cottageSolidTile,wellFootprint} from './architecture-collision';
import {blacksmithBlockedPoint} from './blacksmith-house';
import {TILE,WORLD_WIDTH,WORLD_HEIGHT} from './world-size';
import type {NatureKind} from './nature-catalog';
import {natureArt} from './nature-catalog';
import type {MapEditData} from '../systems/map-editor';
import {paintedWaterPoint} from './terrain-paint';
import {VILLAGE_PIER_ACCESS,villagePierAccessDistance,villagePierDeckContains,villagePierNear,villagePierRailAtPoint,villageFishingPropAtPoint} from './village-pier';
import {villageBuildingArtBands,villageArtRectsOverlap} from './village-building-art';
import {VILLAGE_BARRICADES,villageBarricadeBlockedPoint} from './village-defences';

export const VILLAGE_LAKE={x:81,y:44,rx:5.8,ry:7.5};
export function villageLakeDistance(x:number,y:number):number {
 const u=(x-VILLAGE_LAKE.x)/VILLAGE_LAKE.rx,v=(y-VILLAGE_LAKE.y)/VILLAGE_LAKE.ry;
 const angle=Math.atan2(v,u),shore=.065*Math.sin(angle*3+.4)+.045*Math.cos(angle*5-.8)+.018*Math.sin(angle*9);
 return (Math.hypot(u,v)-1-shore)*VILLAGE_LAKE.rx;
}
export const villageWater=(x:number,y:number,edits?:MapEditData)=>{if(villagePierDeckContains((x+.5)*32,(y+.5)*32))return false;const kind=edits?.terrain[`${x},${y}`];return kind?kind==='water':villageLakeDistance(x+.5,y+.5)<0;};
export const villageWaterPoint=(x:number,y:number,edits?:MapEditData):boolean=>
 !villagePierDeckContains(x,y)&&paintedWaterPoint(edits?.terrain,x,y,(x,y)=>villageLakeDistance(x/32,y/32)<0);
export const VILLAGE_NAME='Vila do Recomeço';
export const VILLAGE_ENTRY={x:2,y:52} as const;
export const VILLAGE_EXIT={x:1,y:52} as const;
export const VILLAGE_PLAZA={x:46,y:38,rx:10.5,ry:8} as const;
export const VILLAGE_MERCHANT_IDS=['general','blacksmith','herbalist','carpenter','seeds','traveler','tailor','fisher','inn','mechanic'] as const;
export type VillageMerchantId=typeof VILLAGE_MERCHANT_IDS[number];
export interface VillageNPC {
 id:'augusto'|'bento'|'amelia'|'tobias'|'rosa'|'nilo'|'celina'|'damiao'|'helena'|'icaro';name:string;role:string;
 merchantId?:VillageMerchantId;x:number;y:number;direction:'down';dialogue:readonly string[];
}
/** Feet coordinates in tiles. Counters and facades never occupy these cells. */
export const VILLAGE_NPCS:readonly VillageNPC[]=[
 {id:'augusto',name:'Augusto',role:'Armazém',merchantId:'general',x:33,y:33,direction:'down',dialogue:[
  'Seja bem-vindo à vila! Sou o Augusto, do armazém. Por aqui, um pouco de cada coisa ajuda todo mundo a recomeçar.',
  'Pode trazer os recursos que encontrar na propriedade. Também tenho materiais para os seus primeiros projetos.',
 ]},
 {id:'bento',name:'Bento',role:'Ferraria',merchantId:'blacksmith',x:57,y:33,direction:'down',dialogue:[
  'Meu nome é Bento. Com uma boa ferramenta, até aquela propriedade abandonada pode voltar a florescer.',
  'Traga os materiais para fundir lingotes e encomendar ferramentas. Você entrega os materiais e paga pela minha mão de obra.',
 ]},
 {id:'amelia',name:'Amélia',role:'Herbalista',merchantId:'herbalist',x:29,y:26,direction:'down',dialogue:[
  'Eu sou a Amélia. Depois da chuva, gosto de observar o que volta a crescer entre as pedras e as raízes.',
  'Compro ervas, cogumelos e plantas medicinais. Guarde as fibras para seus próprios projetos.',
 ]},
 {id:'tobias',name:'Tobias',role:'Carpintaria',merchantId:'carpenter',x:28,y:46,direction:'down',dialogue:[
  'Sou o Tobias, carpinteiro da vila. Se está reconstruindo sua casa, estamos no mesmo caminho.',
  'Guarde fibras para fazer cordas e madeira para suas cercas. Um quintal bem cuidado recebe muitos companheiros.',
 ]},
 {id:'rosa',name:'Rosa',role:'Agricultora',merchantId:'seeds',x:38,y:57,direction:'down',dialogue:[
  'Sou a Rosa. Traga suas colheitas: sempre há alguém precisando de comida fresca.',
  'As sementes de nabo vão bem na propriedade. Prepare a terra, plante e lembre de regar todos os dias.',
 ]},
 {id:'nilo',name:'Nilo',role:'Negociante de antiguidades',merchantId:'traveler',x:24,y:59,direction:'down',dialogue:[
  'Nilo, ao seu dispor! Estudo antiguidades e objetos especiais encontrados nesta região.',
  'Meu antiquário está aberto todos os dias. Traga os artefatos encontrados na exploração.',
 ]},
 {id:'celina',name:'Celina',role:'Costureira',merchantId:'tailor',x:65,y:26,direction:'down',dialogue:[
  'Eu sou a Celina. Um bom tecido começa com fibras bem escolhidas e um pouco de paciência.',
  'Compro tecidos e componentes de vestuário. Também vendo roupas, mochilas e acessórios.',
 ]},
 {id:'damiao',name:'Damião',role:'Pescador',merchantId:'fisher',x:68,y:42,direction:'down',dialogue:[
  'Meu nome é Damião. A água ensina a esperar e a prestar atenção nos detalhes.',
  'Se precisar de cordas ou materiais, dê uma olhada no meu balcão antes de ir aos lagos.',
 ]},
 {id:'helena',name:'Helena',role:'Pousada',merchantId:'inn',x:44,y:24,direction:'down',dialogue:[
  'Bem-vindo! Sou a Helena. Na minha pousada sempre há uma conversa boa e um cantinho acolhedor.',
  'A vila fica mais bonita quando alguém volta para contar como foi o dia na propriedade.',
 ]},
 {id:'icaro',name:'Ícaro',role:'Mecânico',merchantId:'mechanic',x:61,y:56,direction:'down',dialogue:[
  'Ícaro. Gosto de descobrir como as coisas se encaixam, principalmente quando parecem ter perdido o jeito.',
  'Compro sucata e trabalho com ferramentas e materiais. Talvez alguma peça esquecida ainda tenha futuro.',
 ]},
];
export interface VillageBuilding {id:string;x:number;y:number;shop?:VillageMerchantId;flip?:boolean}
export const VILLAGE_BUILDINGS:readonly VillageBuilding[]=[
 {id:'armazem',x:33,y:31,shop:'general'},
 {id:'ferraria',x:57,y:31,shop:'blacksmith'},
 {id:'ervas',x:29,y:24,shop:'herbalist',flip:true},
 {id:'carpintaria',x:28,y:44,shop:'carpenter'},
 {id:'sementes',x:38,y:55,shop:'seeds'},
 {id:'antiquario',x:24,y:57,shop:'traveler'},
 {id:'costura',x:65,y:24,shop:'tailor'},
 {id:'pescador',x:68,y:40,shop:'fisher',flip:true},
 {id:'pousada',x:44,y:22,shop:'inn'},
 {id:'oficina',x:61,y:54,shop:'mechanic'},
];
export interface VillageWalkway {width:number;points:readonly (readonly [number,number])[];pier?:boolean}
/** Half-widths in tiles. Main lanes allow two people to pass; side lanes have
 * softer bends, and each future front door keeps its own clear approach. */
export const VILLAGE_WALKWAYS:readonly VillageWalkway[]=[
 {width:1.15,points:[[1,52],[15,52],[20,49],[30,49],[38,49],[42,47],[46,44]]},
 {width:1.0,points:[[33,32],[33,34],[40,36]]},
 {width:1.0,points:[[57,32],[57,34],[52,36]]},
 {width:1.05,points:[[46,30],[46,27],[44,25],[44,23]]},
 {width:.9,points:[[29,25],[29,27],[37,27],[44,27]]},
 {width:.9,points:[[44,27],[51,27],[58,27],[65,27],[65,25]]},
 {width:1.0,points:[[55,43],[64,45],[68,45],[68,41]]},
 {width:1.0,points:[[46,45],[46,53],[46,59]]},
 {width:1.0,points:[[24,58],[24,60],[38,60],[46,59],[61,57],[61,55]]},
 {width:.9,points:[[38,60],[38,56]]},
 {width:.9,points:[[28,45],[28,49]]},
 {width:.65,points:[[68,45],[VILLAGE_PIER_ACCESS.endX/32-.5,45]],pier:true},
 {width:.75,points:[[57,33],[62,33]]},
 {width:.8,points:[[31,60],[31,59]]},
 {width:.9,points:[[20,49],[19,43],[18,39],[18,35],[19,30],[20,25],[20,23],[20,22]]},
 {width:.9,points:[[18,39],[23,39],[23,37]]},
 {width:.8,points:[[26,26],[29,27],[29,25]]},
 {width:1.0,points:[[55,27],[57,23],[57,17]]},
 {width:.85,points:[[44,23],[39,24],[38,20],[38,15],[44,14],[44,13]]},
 {width:.85,points:[[65,27],[70,32],[76,32],[76,30]]},
 {width:.85,points:[[61,57],[68,60],[75,63],[77,63],[77,61]]},
];
function entranceApron(p:{id:string;x:number;y:number}){
 let nearest=Infinity,halfWidth=.9;
 for(const road of VILLAGE_WALKWAYS)for(let i=1;i<road.points.length;i++){
  const [ax,ay]=road.points[i-1],[bx,by]=road.points[i],dx=bx-ax,dy=by-ay;
  const t=Math.max(0,Math.min(1,((p.x-ax)*dx+(p.y+1-ay)*dy)/(dx*dx+dy*dy)));
  const distance=Math.hypot(p.x-ax-dx*t,p.y+1-ay-dy*t);
  if(distance<nearest){nearest=distance;halfWidth=road.width;}
 }
 return{id:p.id,x:p.x,y:p.y,halfWidth,top:-.1,bottom:2.5};
}
/** Flat ends at the original road width, without a wider pad at the door.
 * Their top edge sits behind the facade's feet so no grass gap remains. */
export const VILLAGE_ENTRANCE_APRONS=[
 ...VILLAGE_BUILDINGS.map(entranceApron),
 ...VILLAGE_LANDMARKS.filter(p=>['community','windmill','gazebo','granary','cottage'].includes(p.kind))
  .map(entranceApron),
];
function apronSurface(x:number,y:number,p:typeof VILLAGE_ENTRANCE_APRONS[number]):{distance:number;along:number}{
 const left=p.x-p.halfWidth,right=p.x+p.halfWidth,top=p.y+p.top,bottom=p.y+p.bottom;
 const cx=(left+right)/2,cy=(top+bottom)/2,rx=(right-left)/2,ry=(bottom-top)/2;
 const qx=Math.abs(x-cx)-rx,qy=Math.abs(y-cy)-ry;
 const distance=Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0);
 const px=Math.max(left,Math.min(right,x)),py=Math.max(top,Math.min(bottom,y)),width=right-left,height=bottom-top;
 const along=qx>qy?(x<cx?2*width+height+bottom-py:width+py-top)
  :(y<cy?px-left:width+height+right-px);
 return {distance,along:along*32};
}
function walkwayDistance(x:number,y:number,edge:boolean):number {
 let nearest=Infinity;
 for(const road of VILLAGE_WALKWAYS)for(let i=1;i<road.points.length;i++){
  if(edge&&road.pier){nearest=Math.min(nearest,villagePierAccessDistance((x+.5)*32,(y+.5)*32)/32);continue;}
  const [ax,ay]=road.points[i-1],[bx,by]=road.points[i];
  const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));
  nearest=Math.min(nearest,Math.hypot(x-ax-dx*t,y-ay-dy*t)-(edge?road.width:0));
 }
 return nearest;
}
export function villageRoadDistance(x:number,y:number):number {
 return walkwayDistance(x,y,false);
}
export const villagePathEdge=(x:number,y:number)=>{
 let nearest=walkwayDistance(x,y,true);
 for(const p of VILLAGE_ENTRANCE_APRONS)nearest=Math.min(nearest,apronSurface(x,y,p).distance);
 return nearest;
};
/** Distance along the closest road segment, for joints in its stone edging. */
export function villagePathAlignment(x:number,y:number):number {
 let nearest=Infinity,along=0;
 for(const road of VILLAGE_WALKWAYS){let offset=0;for(let i=1;i<road.points.length;i++){
  if(road.pier){const distance=villagePierAccessDistance((x+.5)*32,(y+.5)*32)/32;if(distance<nearest){nearest=distance;along=Math.max(0,(x+.5)*32-VILLAGE_PIER_ACCESS.startX);}continue;}
  const [ax,ay]=road.points[i-1],[bx,by]=road.points[i],dx=bx-ax,dy=by-ay,length=Math.hypot(dx,dy);
  const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(length*length)));
  const distance=Math.hypot(x-ax-dx*t,y-ay-dy*t)-road.width;
  if(distance<nearest){nearest=distance;along=(offset+t*length)*32;}offset+=length;
 }}
 for(const p of VILLAGE_ENTRANCE_APRONS){const apron=apronSurface(x,y,p);if(apron.distance<nearest){nearest=apron.distance;along=apron.along;}}
 return along;
}
export const VILLAGE_LAWNS=PLAZA_BEDS.map(p=>({x:p.x,y:p.y-.35,rx:1.1,ry:.75}));
export const villageLawnDistance=(x:number,y:number)=>Math.min(...VILLAGE_LAWNS.map(p=>Math.hypot((x-p.x)/p.rx,(y-p.y)/p.ry)));
/** Entrance coordinates are useful to future indoor scenes and NPC schedules.
 * No interior or routine is enabled until its own artwork/gameplay is ready. */
export const VILLAGE_DOOR_APPROACHES=VILLAGE_BUILDINGS.map(b=>({id:b.id,x:b.x,y:b.y+1}));
export const villageDoorApproach=(x:number,y:number)=>VILLAGE_BUILDINGS.some(b=>Math.abs(x-b.x)<=1.5&&y>b.y&&y<=b.y+4);
export const VILLAGE_GARDENS=[
 {id:'pousada',x:52,y:20.8,rx:2.6,ry:1.9,kind:'flowers'},
 {id:'costura',x:72,y:26.6,rx:2.3,ry:1.9,kind:'flowers'},
 {id:'comunitaria',x:57,y:18.8,rx:4,ry:1.4,kind:'flowers'},
 {id:'coreto',x:47,y:15.5,rx:2,ry:1.2,kind:'flowers'},
 {id:'casa-leste',x:77.5,y:32.3,rx:1.8,ry:1.3,kind:'flowers'},
 {id:'casa-sul',x:76.5,y:63.3,rx:1.8,ry:1.3,kind:'flowers'},
] as const;
export const VILLAGE_GROVES=[
 {x:30,y:15,rx:7,ry:4},{x:63,y:11,rx:10,ry:5},
 {x:20,y:38,rx:9,ry:5},{x:70,y:35,rx:6,ry:5},
 {x:58,y:54,rx:6,ry:4},{x:26,y:62,rx:4,ry:4},
] as const;
export function villagePlazaDistance(x:number,y:number):number {
 return Math.hypot((x-VILLAGE_PLAZA.x)/VILLAGE_PLAZA.rx,(y-VILLAGE_PLAZA.y)/VILLAGE_PLAZA.ry);
}
/** Describes the ground independently of graphics, for layout and editor tools. */
export function villageGround(x:number,y:number):'grass'|'forest'|'path'|'paving' {
 if(villagePlazaDistance(x,y)<1&&villageLawnDistance(x,y)>1)return 'paving';
 if(villagePathEdge(x,y)<.35||villageDoorApproach(x,y))return 'path';
 const edge=Math.min(x,WORLD_WIDTH-1-x,y,WORLD_HEIGHT-1-y);
 return edge<8+Math.sin(x*.27+y*.13)*1.4?'forest':'grass';
}
export function villageBuildingAt(x:number,y:number):VillageBuilding|undefined {
 return VILLAGE_BUILDINGS.find(b=>{
  const px=(x+.5)*32,py=(y+.5)*32,facade=facadeForMerchant(b.shop);
  return b.shop==='blacksmith'?blacksmithBlockedPoint(px,py,b):b.shop==='carpenter'?tobiasShopBlockedPoint(px,py,b):facade?facadeBlockedPoint(facade,px,py,b):cottageSolidTile(x,y,{x:(b.x+.5)*32,y:b.y*32+25});
 });
}
const hash=(x:number,y:number):number=>(Math.imul(x+83,73856093)^Math.imul(y+37,19349663))>>>0;
export interface VillageTree {x:number;y:number;kind:NatureKind}
export const VILLAGE_PROPS:readonly {kind:'well'|'bench'|'lantern'|'barrel'|'flowerpot'|'woodpile'|'anvil'|'crates'|'sacks'|'basket'|'planter'|'bin';x:number;y:number;facing?:'north'|'south'|'east'|'west'}[]=[
 {kind:'well',x:24,y:23},
 {kind:'bench',x:42,y:29,facing:'north'},{kind:'bench',x:57,y:46,facing:'north'},
 {kind:'lantern',x:20,y:51},
 {kind:'lantern',x:44,y:28},
 {kind:'lantern',x:12,y:50},{kind:'lantern',x:35,y:50},
 {kind:'lantern',x:34,y:29},{kind:'lantern',x:60,y:30},
 {kind:'lantern',x:49,y:55},{kind:'lantern',x:58,y:61},
 {kind:'bench',x:70,y:48,facing:'east'},{kind:'bench',x:51,y:61,facing:'north'},
 {kind:'barrel',x:66,y:32},
 {kind:'woodpile',x:25,y:47},{kind:'barrel',x:34,y:51},


 {kind:'barrel',x:65,y:56},
 {kind:'crates',x:28,y:59},
 {kind:'basket',x:43,y:56},{kind:'barrel',x:66,y:43},


 {kind:'lantern',x:59,y:21},{kind:'lantern',x:37,y:18},
 {kind:'lantern',x:21,y:26},{kind:'lantern',x:27,y:41},
 {kind:'lantern',x:71,y:34},{kind:'lantern',x:69,y:62},

 {kind:'sacks',x:16,y:23},{kind:'barrel',x:20,y:38},
 {kind:'bench',x:47,y:14,facing:'west'},
 {kind:'basket',x:72,y:31},

 {kind:'bin',x:38,y:40},{kind:'bin',x:54,y:40},
 {kind:'bin',x:40,y:29},{kind:'bin',x:68,y:48},
 {kind:'bin',x:55,y:46},{kind:'bin',x:49,y:61},
 ...PLAZA_LAMPS.map(p=>({kind:'lantern' as const,...p})),
];
export const VILLAGE_TREES:readonly VillageTree[]=(()=>{
 const trees:VillageTree[]=[],kinds=['oakA','oakB','oakC','pineA','pineB','pineC'] as const;
 const buildings=VILLAGE_BUILDINGS.flatMap(villageBuildingArtBands);
 const landmarks=VILLAGE_LANDMARKS.map(p=>({left:(p.x+.5)*32-p.width/2,right:(p.x+.5)*32+p.width/2,top:p.y*32+25-p.height,bottom:p.y*32+31}));
 const plant=(tx:number,ty:number,seed:number)=>{
  if(villageNorthConnectionDistance(tx+.5,ty+.5)<3.4)return;
  if(tx<2||ty<2||tx>94||ty>70||tx<14&&ty>=48&&ty<=59)return;
  if(villageLandmarkClearing(tx,ty,90)||villageLakeDistance(tx,ty)<2||villageRoadDistance(tx,ty)<4.2||villagePlazaDistance(tx,ty)<1.3)return;
  if(VILLAGE_BARRICADES.some(p=>Math.hypot(tx-p.x,ty-p.y)<2.6))return;
  if(VILLAGE_PROPS.some(p=>Math.hypot(tx-p.x,ty-p.y)<2.6))return;
  if(VILLAGE_GARDENS.some(p=>Math.hypot((tx-p.x)/p.rx,(ty-p.y)/p.ry)<1.7))return;
  const cx=(tx+.5)*32,cy=ty*32+25,canopy={left:cx-88,right:cx+88,top:cy-211,bottom:cy+6};
  if(buildings.some(b=>villageArtRectsOverlap(canopy,b))||landmarks.some(b=>villageArtRectsOverlap(canopy,b))||VILLAGE_DRESSING.some(p=>villageArtRectsOverlap(canopy,villageDressingBounds(p))))return;
  if(trees.some(t=>Math.hypot(tx-t.x,ty-t.y)<2.1+(seed%3)*.2))return;
  trees.push({x:tx,y:ty,kind:kinds[(seed>>>12)%kinds.length]});
 };
 // Groves overlap unevenly; candidates come from polar clusters rather than
 // parallel rows along the four map edges. Gaps open into smaller clearings.
 const forestGroups=[
  [5,7,9,8],[16,3,10,6],[34,4,12,6],[54,3,10,7],[76,5,13,8],[91,7,8,10],
  [4,23,7,12],[7,39,8,10],[4,63,10,10],
  [92,25,7,12],[91,43,9,11],[91,62,9,11],
  [20,67,12,7],[41,68,14,6],[65,67,12,8],[80,68,11,7],
  [29,12,5,4],[71,13,6,5],[82,24,4,6],[15,38,4,5],
  [53,53,4,4],[20,61,4,5],
 ];
 const glades=[[24,3,3.6,3],[48,5,4,3.4],[92,35,3.2,4],[8,29,3.2,4],[49,68,3.5,3]];
 for(const [group,[x,y,rx,ry]] of forestGroups.entries())for(let i=0;i<Math.ceil(rx*ry*2.2);i++){
  const seed=hash(group*53+i*7,i*19+group*11),angle=(seed%65536)/65536*Math.PI*2;
  const radius=Math.sqrt(((seed>>>16)%65536)/65536);
  const tx=Math.round(x+Math.cos(angle)*rx*radius),ty=Math.round(y+Math.sin(angle)*ry*radius);
  if(glades.some(([gx,gy,grx,gry])=>Math.hypot((tx-gx)/grx,(ty-gy)/gry)<1))continue;
  plant(tx,ty,seed);
 }
 return trees;
})();
/** Garden borders use the approved connected fence, leaving physical gates
 * open so future residents can enter without scene-specific interaction hacks. */
export const VILLAGE_FENCES:readonly {kind:'fence';x:number;y:number}[]=(()=>{
 const result:Array<{kind:'fence';x:number;y:number}>=[];
 for(const box of [{left:14,right:26,top:21,bottom:30}]){
  for(let y=box.top;y<=box.bottom;y++)for(let x=box.left;x<=box.right;x++){
   if(x!==box.left&&x!==box.right&&y!==box.top&&y!==box.bottom)continue;
   if(x===box.right&&(y===26||y===27))continue;
   if(y===box.top&&(x===20||x===21))continue;
   if(y===box.bottom&&x>=18&&x<=21)continue;
   result.push({kind:'fence',x,y});
  }
 }
 return result;
})();
export const villageWellTile=(x:number,y:number)=>VILLAGE_PROPS.filter(p=>p.kind==='well').some(p=>[0,16,31].some(dx=>[0,16,31].some(dy=>wellFootprint(x*32+dx,y*32+dy,{x:(p.x+.5)*32,y:p.y*32+25},.49))));
export function villagePropAt(x:number,y:number):boolean {
 return villageWellTile(x,y)||VILLAGE_PROPS.some(p=>p.kind!=='well'&&p.y===y&&Math.abs(p.x-x)<=(p.kind==='bench'||p.kind==='woodpile'||p.kind==='planter'?1:0));
}
export const VILLAGE_SHORE_DETAILS:readonly {kind:'shoreStones';x:number;y:number}[]=(()=>{
 const result:Array<{kind:'shoreStones';x:number;y:number}>=[],seen=new Set<string>();
 for(let i=0;i<22;i++){
  // Keep the existing rocks, removing all reeds from the lake surface.
  if(i%5!==0)continue;
  const a=i/22*Math.PI*2,r=1+.065*Math.sin(a*3+.4)+.045*Math.cos(a*5-.8)+.018*Math.sin(a*9);
  const x=Math.round(VILLAGE_LAKE.x+Math.cos(a)*VILLAGE_LAKE.rx*(r+.04)),y=Math.round(VILLAGE_LAKE.y+Math.sin(a)*VILLAGE_LAKE.ry*(r+.04)),key=`${x},${y}`;
  if(seen.has(key)||villagePierNear((x+.5)*32,(y+.5)*32)||villageRoadDistance(x,y)<1.9||VILLAGE_BUILDINGS.some(b=>Math.abs(b.x-x)<5&&Math.abs(b.y-y)<4))continue;
  seen.add(key);result.push({x,y,kind:'shoreStones'});
 }
 return result;
})();
export const villageTreeId=(t:VillageTree)=>`editor-${t.kind}-village-${t.x}-${t.y}`;
const villageTreeIds=new Set(VILLAGE_TREES.map(villageTreeId));
export function villageSceneryBlockedAt(x:number,y:number,includeWell=true,edits?:MapEditData,includeWater=true):boolean {
 return villageDressingBlockedPoint((x+.5)*32,(y+.5)*32)||includeWater&&villageWater(x,y,edits)||x<1||y<1||x>=WORLD_WIDTH-1||y>=WORLD_HEIGHT-1
  ||VILLAGE_TREES.some(t=>{const e=edits?.objects[villageTreeId(t)];return !e?.removed&&(e?.x??t.x)===x&&(e?.y??t.y)===y;})
  ||Object.entries(edits?.objects??{}).some(([id,e])=>!e.removed&&e.x===x&&e.y===y&&natureArt(e.kind)?.solid&&!villageTreeIds.has(id))
  ||(includeWell?villagePropAt(x,y):VILLAGE_PROPS.some(p=>p.kind!=='well'&&p.y===y&&Math.abs(p.x-x)<=(p.kind==='bench'||p.kind==='woodpile'||p.kind==='planter'?1:0)))||VILLAGE_SHORE_DETAILS.some(p=>p.kind==='shoreStones'&&p.x===x&&p.y===y)||VILLAGE_FENCES.some(p=>p.x===x&&p.y===y);
}
export const villageBlockedAt=(x:number,y:number,edits?:MapEditData)=>villageSceneryBlockedAt(x,y,true,edits)||villageLandmarkBlockedTile(x,y)||plazaFurnitureBlockedTile(x,y)||villagePierRailAtPoint((x+.5)*32,(y+.5)*32)||villageFishingPropAtPoint((x+.5)*32,(y+.5)*32)||villageBarricadeBlockedPoint((x+.5)*32,(y+.5)*32)||!!villageBuildingAt(x,y);
export function villagePointBlocked(x:number,y:number,edits?:MapEditData):boolean{
 const tx=Math.floor(x/32),ty=Math.floor(y/32);
 const nearPier=villagePierNear(x,y);
 const scenery=villageSceneryBlockedAt(tx,ty,false,edits,!nearPier);
 const well=VILLAGE_PROPS.find(p=>p.kind==='well'&&Math.abs(p.x-tx)<=2&&Math.abs(p.y-ty)<=3);
 return villageDressingBlockedPoint(x,y)||scenery||nearPier&&villageWaterPoint(x,y,edits)||villagePierRailAtPoint(x,y)||villageFishingPropAtPoint(x,y)||villageBarricadeBlockedPoint(x,y)||plazaFurnitureBlockedPoint(x,y)||villageLandmarkBlockedPoint(x,y)||(!!well&&wellFootprint(x,y,{x:(well.x+.5)*32,y:well.y*32+25},.49))||VILLAGE_BUILDINGS.some(b=>{
  const facade=facadeForMerchant(b.shop);
  return b.shop==='blacksmith'?blacksmithBlockedPoint(x,y,b):b.shop==='carpenter'?tobiasShopBlockedPoint(x,y,b):facade?facadeBlockedPoint(facade,x,y,b):cottageSolidPoint(x,y,{x:(b.x+.5)*32,y:b.y*32+25});
 });
}
export const villagePixelPoint=(point:{x:number;y:number})=>({x:(point.x+.5)*TILE,y:(point.y+.5)*TILE});
