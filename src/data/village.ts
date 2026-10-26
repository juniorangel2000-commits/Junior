import {TILE,WORLD_WIDTH,WORLD_HEIGHT} from './world-size';
import type {NatureKind} from './nature-catalog';

export const VILLAGE_LAKE={x:87,y:44,rx:5.8,ry:7.5};
export function villageLakeDistance(x:number,y:number):number {return (Math.hypot((x-87)/5.8,(y-44)/7.5)-1)*5.8+.18*Math.sin(y*1.7)+.1*Math.cos(x*2);}
export const villageWater=(x:number,y:number)=>villageLakeDistance(x+.5,y+.5)<0;
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
const ROADS:readonly (readonly [number,number,number,number])[]=[
 [1,52,19,52],[19,52,33,53],[33,53,46,46],[46,46,46,38],
 [33,33,39,37],[39,37,46,38],[46,38,57,33],
 [46,38,46,22],[46,25,22,25],[46,25,70,25],
 [46,45,78,45],[46,46,46,63],[46,63,37,63],[46,63,68,63],[68,63,68,60],
 [19,52,11,54],[11,54,11,64],[11,64,17,64],
];
export function villageRoadDistance(x:number,y:number):number {
 let nearest=Infinity;
 for(const [ax,ay,bx,by] of ROADS){
  const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));
  nearest=Math.min(nearest,Math.hypot(x-ax-dx*t,y-ay-dy*t));
 }
 return nearest;
}
export function villagePlazaDistance(x:number,y:number):number {
 return Math.hypot((x-VILLAGE_PLAZA.x)/VILLAGE_PLAZA.rx,(y-VILLAGE_PLAZA.y)/VILLAGE_PLAZA.ry);
}
/** Describes the ground independently of graphics, for layout and editor tools. */
export function villageGround(x:number,y:number):'grass'|'forest'|'path'|'paving' {
 if(villagePlazaDistance(x,y)<1)return 'paving';
 if(villageRoadDistance(x,y)<1.5)return 'path';
 const edge=Math.min(x,WORLD_WIDTH-1-x,y,WORLD_HEIGHT-1-y);
 return edge<8+Math.sin(x*.27+y*.13)*1.4?'forest':'grass';
}
export function villageBuildingAt(x:number,y:number):VillageBuilding|undefined {
 return VILLAGE_BUILDINGS.find(b=>x>=b.x-3&&x<=b.x+3&&y>=b.y-3&&y<=b.y);
}
const hash=(x:number,y:number):number=>(Math.imul(x+83,73856093)^Math.imul(y+37,19349663))>>>0;
export interface VillageTree {x:number;y:number;kind:NatureKind}
export const VILLAGE_TREES:readonly VillageTree[]=(()=>{
 const trees:VillageTree[]=[],kinds=['oakA','oakB','oakC','pineA','pineB','pineC'] as const;
 for(let y=3;y<70;y+=4)for(let x=3;x<94;x+=4){
  const seed=hash(x,y),tx=x+(seed>>>4)%2,ty=y+(seed>>>7)%2;
  if(villageLakeDistance(tx,ty)<2||seed%7===0||villageRoadDistance(tx,ty)<4.8||villagePlazaDistance(tx,ty)<1.6)continue;
  // Roofs and storefronts stay readable; keep the complete canopy away from doors.
  if(VILLAGE_BUILDINGS.some(b=>Math.abs(b.x-tx)<7&&ty>b.y-8&&ty<b.y+8))continue;
  if(tx>11&&tx<86&&ty>10&&ty<67&&seed%13!==0)continue;
  if(tx<9&&ty>=49&&ty<=59)continue;
  trees.push({x:tx,y:ty,kind:kinds[(seed>>>12)%kinds.length]});
 }
 return trees;
})();
export const VILLAGE_PROPS:readonly {kind:'well'|'bench'|'lantern';x:number;y:number}[]=[
 {kind:'well',x:46,y:37},
 {kind:'bench',x:40,y:40},{kind:'bench',x:52,y:40},
 {kind:'bench',x:44,y:24},{kind:'bench',x:60,y:51},
 {kind:'lantern',x:21,y:50},{kind:'lantern',x:36,y:41},
 {kind:'lantern',x:55,y:39},{kind:'lantern',x:44,y:28},
];
export function villageBlockedAt(x:number,y:number):boolean {
 return villageWater(x,y)||x<1||y<1||x>=WORLD_WIDTH-1||y>=WORLD_HEIGHT-1
  ||!!villageBuildingAt(x,y)||VILLAGE_TREES.some(t=>t.x===x&&t.y===y)
  ||VILLAGE_PROPS.some(p=>p.x===x&&p.y===y);
}
export const villagePixelPoint=(point:{x:number;y:number})=>({x:(point.x+.5)*TILE,y:(point.y+.5)*TILE});
