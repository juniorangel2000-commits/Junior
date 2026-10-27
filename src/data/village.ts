import {augustoShopBlockedPoint} from './augusto-shop';
import {cottageSolidPoint,cottageSolidTile,wellFootprint} from './architecture-collision';
import {blacksmithBlockedPoint} from './blacksmith-house';
import {TILE,WORLD_WIDTH,WORLD_HEIGHT} from './world-size';
import type {NatureKind} from './nature-catalog';
import {natureArt} from './nature-catalog';
import type {MapEditData} from '../systems/map-editor';

export const VILLAGE_LAKE={x:87,y:44,rx:5.8,ry:7.5};
export function villageLakeDistance(x:number,y:number):number {
 const u=(x-VILLAGE_LAKE.x)/VILLAGE_LAKE.rx,v=(y-VILLAGE_LAKE.y)/VILLAGE_LAKE.ry;
 const angle=Math.atan2(v,u),shore=.065*Math.sin(angle*3+.4)+.045*Math.cos(angle*5-.8)+.018*Math.sin(angle*9);
 return (Math.hypot(u,v)-1-shore)*VILLAGE_LAKE.rx;
}
export const villageWater=(x:number,y:number,edits?:MapEditData)=>{const kind=edits?.terrain[`${x},${y}`];return kind?kind==='water':villageLakeDistance(x+.5,y+.5)<0;};
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
 {id:'amelia',name:'Amélia',role:'Herbalista',merchantId:'herbalist',x:22,y:24,direction:'down',dialogue:[
  'Eu sou a Amélia. Depois da chuva, gosto de observar o que volta a crescer entre as pedras e as raízes.',
  'Compro ervas, cogumelos e plantas medicinais. Guarde as fibras para seus próprios projetos.',
 ]},
 {id:'tobias',name:'Tobias',role:'Carpintaria',merchantId:'carpenter',x:25,y:51,direction:'down',dialogue:[
  'Sou o Tobias, carpinteiro da vila. Se está reconstruindo sua casa, estamos no mesmo caminho.',
  'Guarde fibras para fazer cordas e madeira para suas cercas. Um quintal bem cuidado recebe muitos companheiros.',
 ]},
 {id:'rosa',name:'Rosa',role:'Agricultora',merchantId:'seeds',x:37,y:62,direction:'down',dialogue:[
  'Sou a Rosa. Traga suas colheitas: sempre há alguém precisando de comida fresca.',
  'As sementes de nabo vão bem na propriedade. Prepare a terra, plante e lembre de regar todos os dias.',
 ]},
 {id:'nilo',name:'Nilo',role:'Negociante de antiguidades',merchantId:'traveler',x:17,y:63,direction:'down',dialogue:[
  'Nilo, ao seu dispor! Estudo antiguidades e objetos especiais encontrados nesta região.',
  'Meu antiquário está aberto todos os dias. Traga os artefatos encontrados na exploração.',
 ]},
 {id:'celina',name:'Celina',role:'Costureira',merchantId:'tailor',x:70,y:24,direction:'down',dialogue:[
  'Eu sou a Celina. Um bom tecido começa com fibras bem escolhidas e um pouco de paciência.',
  'Compro tecidos e componentes de vestuário. Também vendo roupas, mochilas e acessórios.',
 ]},
 {id:'damiao',name:'Damião',role:'Pescador',merchantId:'fisher',x:78,y:44,direction:'down',dialogue:[
  'Meu nome é Damião. A água ensina a esperar e a prestar atenção nos detalhes.',
  'Se precisar de cordas ou materiais, dê uma olhada no meu balcão antes de ir aos lagos.',
 ]},
 {id:'helena',name:'Helena',role:'Pousada',merchantId:'inn',x:46,y:21,direction:'down',dialogue:[
  'Bem-vindo! Sou a Helena. Na minha pousada sempre há uma conversa boa e um cantinho acolhedor.',
  'A vila fica mais bonita quando alguém volta para contar como foi o dia na propriedade.',
 ]},
 {id:'icaro',name:'Ícaro',role:'Mecânico',merchantId:'mechanic',x:68,y:60,direction:'down',dialogue:[
  'Ícaro. Gosto de descobrir como as coisas se encaixam, principalmente quando parecem ter perdido o jeito.',
  'Compro sucata e trabalho com ferramentas e materiais. Talvez alguma peça esquecida ainda tenha futuro.',
 ]},
];
export interface VillageBuilding {id:string;x:number;y:number;shop?:VillageMerchantId;flip?:boolean}
export const VILLAGE_BUILDINGS:readonly VillageBuilding[]=[
 {id:'armazem',x:33,y:31,shop:'general'},
 {id:'ferraria',x:57,y:31,shop:'blacksmith'},
 {id:'ervas',x:22,y:22,shop:'herbalist',flip:true},
 {id:'carpintaria',x:25,y:49,shop:'carpenter'},
 {id:'sementes',x:37,y:60,shop:'seeds'},
 {id:'antiquario',x:17,y:61,shop:'traveler'},
 {id:'costura',x:70,y:22,shop:'tailor'},
 {id:'pescador',x:78,y:42,shop:'fisher',flip:true},
 {id:'pousada',x:46,y:19,shop:'inn'},
 {id:'oficina',x:68,y:58,shop:'mechanic'},
];
export interface VillageWalkway {width:number;points:readonly (readonly [number,number])[]}
/** Half-widths in tiles. Main lanes allow two people to pass; side lanes have
 * softer bends, and each future front door keeps its own clear approach. */
export const VILLAGE_WALKWAYS:readonly VillageWalkway[]=[
 {width:1.45,points:[[1,52],[19,52],[26,52.4],[33,53],[39,50],[46,46],[46,38]]},
 {width:1.05,points:[[33,32],[33,34],[37,36],[40,37.3],[46,38]]},
 {width:1.05,points:[[57,32],[57,34],[53,36],[49,37.5],[46,38]]},
 {width:1.2,points:[[46,38],[46,29],[46,20]]},
 {width:.95,points:[[22,23],[22,25],[29,25],[36,25.6],[46,26]]},
 {width:.95,points:[[46,26],[50,23],[53,21.5],[60,21.5],[65,25],[70,25],[70,23]]},
 {width:1.1,points:[[46,44],[55,44.5],[64,45.4],[72,45.1],[78,45],[78,43]]},
 {width:1.1,points:[[46,46],[46.4,53],[46,63]]},
 {width:1.05,points:[[37,61],[37,63],[41,63.4],[46,63],[55,63],[63,63.3],[68,63],[68,59]]},
 {width:.95,points:[[19,52],[13,54],[11,57],[11,61],[12,64],[17,64],[17,62]]},
 {width:.9,points:[[25,50],[25,52.3]]},
 {width:.7,points:[[19,24],[22,24]]},
 {width:.8,points:[[57,33],[62,33]]},
 {width:.7,points:[[30,64],[30,65.5],[37,65.5],[37,63]]},
];
function walkwayDistance(x:number,y:number,edge:boolean):number {
 let nearest=Infinity;
 for(const road of VILLAGE_WALKWAYS)for(let i=1;i<road.points.length;i++){
  const [ax,ay]=road.points[i-1],[bx,by]=road.points[i];
  const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));
  nearest=Math.min(nearest,Math.hypot(x-ax-dx*t,y-ay-dy*t)-(edge?road.width:0));
 }
 return nearest;
}
export function villageRoadDistance(x:number,y:number):number {
 return walkwayDistance(x,y,false);
}
export const villagePathEdge=(x:number,y:number)=>walkwayDistance(x,y,true);
export const VILLAGE_LAWNS=[{x:39.8,y:36.6,rx:2.2,ry:2.9},{x:52.2,y:36.6,rx:2.2,ry:2.9}] as const;
export const villageLawnDistance=(x:number,y:number)=>Math.min(...VILLAGE_LAWNS.map(p=>Math.hypot((x-p.x)/p.rx,(y-p.y)/p.ry)));
/** Entrance coordinates are useful to future indoor scenes and NPC schedules.
 * No interior or routine is enabled until its own artwork/gameplay is ready. */
export const VILLAGE_DOOR_APPROACHES=VILLAGE_BUILDINGS.map(b=>({id:b.id,x:b.x,y:b.y+1}));
export const villageDoorApproach=(x:number,y:number)=>VILLAGE_BUILDINGS.some(b=>Math.abs(x-b.x)<=1.5&&y>b.y&&y<=b.y+4);
export const VILLAGE_GARDENS=[
 {id:'ervas',x:16.8,y:24,rx:2.7,ry:2.2,kind:'herbs'},
 {id:'rosa',x:30,y:61,rx:2.6,ry:2.4,kind:'crops'},
 {id:'pousada',x:54,y:17.8,rx:2.6,ry:1.9,kind:'flowers'},
 {id:'costura',x:77,y:23.6,rx:2.3,ry:1.9,kind:'flowers'},
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
 return VILLAGE_BUILDINGS.find(b=>b.shop==='blacksmith'
  ? blacksmithBlockedPoint((x+.5)*32,(y+.5)*32,b)
  :b.shop==='general'?augustoShopBlockedPoint((x+.5)*32,(y+.5)*32,b):cottageSolidTile(x,y,{x:(b.x+.5)*32,y:b.y*32+25}));
}
const hash=(x:number,y:number):number=>(Math.imul(x+83,73856093)^Math.imul(y+37,19349663))>>>0;
export interface VillageTree {x:number;y:number;kind:NatureKind}
export const VILLAGE_PROPS:readonly {kind:'well'|'bench'|'lantern'|'barrel'|'flowerpot'|'woodpile'|'anvil'|'crates'|'sacks'|'basket'|'planter';x:number;y:number}[]=[
 {kind:'well',x:46,y:37},
 {kind:'bench',x:40,y:40},{kind:'bench',x:52,y:40},
 {kind:'bench',x:42,y:28},{kind:'bench',x:60,y:51},
 {kind:'lantern',x:21,y:50},{kind:'lantern',x:36,y:41},
 {kind:'lantern',x:55,y:39},{kind:'lantern',x:44,y:28},
 {kind:'lantern',x:12,y:50},{kind:'lantern',x:33,y:50},
 {kind:'lantern',x:27,y:27},{kind:'lantern',x:65,y:27},
 {kind:'lantern',x:49,y:55},{kind:'lantern',x:58,y:61},
 {kind:'bench',x:76,y:48},{kind:'bench',x:50,y:60},
 {kind:'crates',x:29,y:33},{kind:'sacks',x:37,y:32},
 {kind:'barrel',x:66,y:32},
 {kind:'woodpile',x:21,y:49},{kind:'barrel',x:29,y:50},
 {kind:'flowerpot',x:42,y:21},{kind:'flowerpot',x:50,y:21},
 {kind:'flowerpot',x:66,y:24},{kind:'flowerpot',x:74,y:24},
 {kind:'flowerpot',x:34,y:63},{kind:'barrel',x:72,y:60},
 {kind:'crates',x:21,y:63},{kind:'flowerpot',x:18,y:24},
 {kind:'basket',x:42,y:61},{kind:'barrel',x:75,y:44},
 {kind:'planter',x:54,y:16},{kind:'planter',x:77,y:23},
];
export const VILLAGE_TREES:readonly VillageTree[]=(()=>{
 const trees:VillageTree[]=[],kinds=['oakA','oakB','oakC','pineA','pineB','pineC'] as const;
 for(let y=3;y<70;y+=4)for(let x=3;x<94;x+=4){
  const seed=hash(x,y),tx=x+(seed>>>4)%2,ty=y+(seed>>>7)%2;
  if(villageLakeDistance(tx,ty)<2||seed%7===0||villageRoadDistance(tx,ty)<4.2||villagePlazaDistance(tx,ty)<1.3)continue;
  // Roofs and storefronts stay readable; keep the complete canopy away from doors.
  if(VILLAGE_BUILDINGS.some(b=>Math.abs(b.x-tx)<7&&ty>b.y-8&&ty<b.y+8))continue;
  if(VILLAGE_PROPS.some(p=>Math.hypot(tx-p.x,ty-p.y)<2.6))continue;
  if(VILLAGE_GARDENS.some(p=>Math.hypot((tx-p.x)/p.rx,(ty-p.y)/p.ry)<1.7))continue;
  const grove=VILLAGE_GROVES.some(p=>Math.hypot((tx-p.x)/p.rx,(ty-p.y)/p.ry)<1);
  if(tx>11&&tx<86&&ty>10&&ty<67&&!grove&&seed%17!==0)continue;
  if(tx<9&&ty>=49&&ty<=59)continue;
  trees.push({x:tx,y:ty,kind:kinds[(seed>>>12)%kinds.length]});
 }
 return trees;
})();
/** Garden borders use the approved connected fence, leaving physical gates
 * open so future residents can enter without scene-specific interaction hacks. */
export const VILLAGE_FENCES:readonly {kind:'fence';x:number;y:number}[]=(()=>{
 const result:Array<{kind:'fence';x:number;y:number}>=[];
 for(const box of [{left:14,right:19,top:21,bottom:27},{left:27,right:33,top:58,bottom:64}]){
  for(let y=box.top;y<=box.bottom;y++)for(let x=box.left;x<=box.right;x++){
   if(x!==box.left&&x!==box.right&&y!==box.top&&y!==box.bottom)continue;
   if(box.left===14&&x===box.right&&(y===24||y===25))continue;
   if(box.left===27&&y===box.bottom&&(x===30||x===31))continue;
   result.push({kind:'fence',x,y});
  }
 }
 return result;
})();
export const villageWellTile=(x:number,y:number)=>VILLAGE_PROPS.filter(p=>p.kind==='well').some(p=>[0,16,31].some(dx=>[0,16,31].some(dy=>wellFootprint(x*32+dx,y*32+dy,{x:(p.x+.5)*32,y:p.y*32+25},.49))));
export function villagePropAt(x:number,y:number):boolean {
 return villageWellTile(x,y)||VILLAGE_PROPS.some(p=>p.kind!=='well'&&p.y===y&&Math.abs(p.x-x)<=(p.kind==='bench'||p.kind==='woodpile'||p.kind==='planter'?1:0));
}
export const VILLAGE_SHORE_DETAILS:readonly {kind:'reeds'|'shoreStones';x:number;y:number}[]=(()=>{
 const result:Array<{kind:'reeds'|'shoreStones';x:number;y:number}>=[],seen=new Set<string>();
 for(let i=0;i<22;i++){
  const a=i/22*Math.PI*2,r=1+.065*Math.sin(a*3+.4)+.045*Math.cos(a*5-.8)+.018*Math.sin(a*9);
  const x=Math.round(VILLAGE_LAKE.x+Math.cos(a)*VILLAGE_LAKE.rx*(r+.04)),y=Math.round(VILLAGE_LAKE.y+Math.sin(a)*VILLAGE_LAKE.ry*(r+.04)),key=`${x},${y}`;
  if(seen.has(key)||villageRoadDistance(x,y)<1.9||VILLAGE_BUILDINGS.some(b=>Math.abs(b.x-x)<5&&Math.abs(b.y-y)<4))continue;
  seen.add(key);result.push({x,y,kind:i%5===0?'shoreStones':'reeds'});
 }
 return result;
})();
export const villageTreeId=(t:VillageTree)=>`editor-${t.kind}-village-${t.x}-${t.y}`;
const villageTreeIds=new Set(VILLAGE_TREES.map(villageTreeId));
export function villageSceneryBlockedAt(x:number,y:number,includeWell=true,edits?:MapEditData):boolean {
 return villageWater(x,y,edits)||x<1||y<1||x>=WORLD_WIDTH-1||y>=WORLD_HEIGHT-1
  ||VILLAGE_TREES.some(t=>{const e=edits?.objects[villageTreeId(t)];return !e?.removed&&(e?.x??t.x)===x&&(e?.y??t.y)===y;})
  ||Object.entries(edits?.objects??{}).some(([id,e])=>!e.removed&&e.x===x&&e.y===y&&natureArt(e.kind)?.solid&&!villageTreeIds.has(id))
  ||(includeWell?villagePropAt(x,y):VILLAGE_PROPS.some(p=>p.kind!=='well'&&p.y===y&&Math.abs(p.x-x)<=(p.kind==='bench'||p.kind==='woodpile'||p.kind==='planter'?1:0)))||VILLAGE_SHORE_DETAILS.some(p=>p.kind==='shoreStones'&&p.x===x&&p.y===y)||VILLAGE_FENCES.some(p=>p.x===x&&p.y===y);
}
export const villageBlockedAt=(x:number,y:number,edits?:MapEditData)=>villageSceneryBlockedAt(x,y,true,edits)||!!villageBuildingAt(x,y);
export function villagePointBlocked(x:number,y:number,edits?:MapEditData):boolean{
 const tx=Math.floor(x/32),ty=Math.floor(y/32);
 const scenery=villageSceneryBlockedAt(tx,ty,false,edits);
 const well=VILLAGE_PROPS.find(p=>p.kind==='well'&&Math.abs(p.x-tx)<=2&&Math.abs(p.y-ty)<=3);
 return scenery||(!!well&&wellFootprint(x,y,{x:(well.x+.5)*32,y:well.y*32+25},.49))||VILLAGE_BUILDINGS.some(b=>b.shop==='blacksmith'?blacksmithBlockedPoint(x,y,b):b.shop==='general'?augustoShopBlockedPoint(x,y,b):cottageSolidPoint(x,y,{x:(b.x+.5)*32,y:b.y*32+25}));
}
export const villagePixelPoint=(point:{x:number;y:number})=>({x:(point.x+.5)*TILE,y:(point.y+.5)*TILE});
