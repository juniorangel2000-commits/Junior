import {IPE_ART} from './ipe-art';
import {FIELDS_BRIDGES,mapBridgeAt,mapBridgeRail} from './bridges';
import type {TilePoint} from '../types';
export const FIELDS_SIZE={width:3072,height:2304};
export const FIELDS_ENTRY={x:1536,y:140,direction:'down' as const};
export const FIELDS_EXIT={x:1536,y:68,halfWidth:62,depth:40,direction:'up' as const};
export const PROPERTY_FIELDS_EXIT={x:816,y:2224,halfWidth:58,depth:38,direction:'down' as const};
export const PROPERTY_FIELDS_RETURN={x:816,y:2160,direction:'up' as const};
/** A short grassy approach at the south edge, safely west of the river. */
export const propertyFieldsApproach=(x:number,y:number)=>y>=65&&Math.abs(x-25)<2.5;
export const FIELDS_SHED={x:2370,y:800,width:218,height:174};
/** Saída sul para a Costa das Marés, ao lado da foz do rio. */
export const FIELDS_COAST_EXIT={x:912,y:2236,halfWidth:62,depth:40,direction:'down' as const};
export const FIELDS_COAST_RETURN={x:912,y:2160,direction:'up' as const};
export const FIELDS_COAST_SIGN={exit:{x:28,y:70},entry:{x:28,y:67}};
/** Rio que vem da propriedade, atravessa os Campos de norte a sul e desce para a Costa,
 * onde deságua no mar. Pontos em pixels; a largura cresce um pouco rio abaixo. */
export const FIELDS_RIVER:readonly (readonly [number,number])[]=[[1180,-60],[1160,280],[1040,600],[840,890],[650,1200],[548,1560],[505,1920],[516,2380]];
export const fieldsRiverHalf=(y:number)=>50+14*Math.max(0,Math.min(1,y/2304));
const riverSegments=FIELDS_RIVER.slice(1).map(([bx,by],i)=>{const [ax,ay]=FIELDS_RIVER[i],dx=bx-ax,dy=by-ay;return{ax,ay,dx,dy,inv:1/(dx*dx+dy*dy)};});
export function fieldsRiverDistance(x:number,y:number):number{
 let best=Infinity;
 for(const s of riverSegments){const t=Math.max(0,Math.min(1,((x-s.ax)*s.dx+(y-s.ay)*s.dy)*s.inv)),px=x-s.ax-t*s.dx,py=y-s.ay-t*s.dy;best=Math.min(best,px*px+py*py);}
 return Math.sqrt(best);
}
/** Distância (px, negativa dentro d'água) até a margem do rio. */
export const fieldsRiverEdge=(x:number,y:number)=>fieldsRiverDistance(x,y)-fieldsRiverHalf(y);
export const fieldsWater=(x:number,y:number)=>fieldsRiverEdge(x,y)<0&&!mapBridgeAt(FIELDS_BRIDGES,x,y);
/** Trilhas gastas até as pontes (só no desenho do chão; não mudam a geração dos tufos). */
const bridgePaths=[[[1490,262],[1290,256]],[[1078,256],[930,300],[760,360]],[[930,1780],[760,1765],[650,1760]],[[406,1760],[300,1790],[200,1850]]] as const;
export function fieldsBridgePathDistance(x:number,y:number):number{
 let distance=Infinity;
 for(const path of bridgePaths)for(let i=1;i<path.length;i++){const[a,b]=[path[i-1],path[i]],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));distance=Math.min(distance,Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t));}
 return distance;
}
/** Faixa livre da trilha até a saída sul. */
const coastLane=(x:number,y:number)=>y>1980&&Math.abs(x-FIELDS_COAST_EXIT.x)<120||fieldsBridgePathDistance(x,y)<70||!!mapBridgeAt(FIELDS_BRIDGES,x,y);
type Trail=readonly (readonly [number,number])[];
const trailDistance=(paths:readonly Trail[],x:number,y:number)=>{
 let distance=Infinity;
 for(const path of paths)for(let i=1;i<path.length;i++){const[a,b]=[path[i-1],path[i]],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));distance=Math.min(distance,Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t));}
 return distance;
};
/** Trilhas que já existiam antes do rio. A geração de pedras e moitas usa só elas, para que
 * ids e posições continuem iguais aos dos saves antigos. */
const ORIGINAL_TRAILS:readonly Trail[]=[[[1536,0],[1490,300],[1540,590],[1440,940],[1030,1330],[930,1780]],[[1440,940],[1850,1020],[2180,850],[2420,890]]];
const originalPathDistance=(x:number,y:number)=>trailDistance(ORIGINAL_TRAILS,x,y);
/** Trilha principal com o trecho novo até a saída sul, para a Costa. */
const COAST_TRAIL:readonly Trail[]=[[[930,1780],[912,2304]]];
export function fieldsPathDistance(x:number,y:number):number{return Math.min(originalPathDistance(x,y),trailDistance(COAST_TRAIL,x,y));}
let seed=93715;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
export interface FieldProp extends TilePoint{id:string;texture:string;width:number;height:number;rx:number;ry:number;tree?:boolean}
export const FIELDS_PROPS:FieldProp[]=[];
const tree=(x:number,y:number,i:number)=>FIELDS_PROPS.push({id:`tree-${i}`,x,y,texture:`asset-tree-${i%3}`,width:150+i%4*8,height:190+i%4*10,rx:13,ry:9,tree:true});
// Dense, irregular edges frame the meadow; only trunks obstruct movement.
for(let i=0;i<96;i++){let x=0,y=0;const edge=i%4;if(edge===0){x=60+random()*2950;y=55+random()*130;}if(edge===1){x=60+random()*2950;y=2170+random()*100;}if(edge===2){x=40+random()*140;y=120+random()*2030;}if(edge===3){x=2890+random()*130;y=120+random()*2030;}if(y<260&&Math.abs(x-FIELDS_ENTRY.x)<160)continue;tree(x,y,i);}
for(const [i,[x,y]]of [[430,420],[540,510],[610,400],[2460,390],[2570,490],[2490,560],[320,1410],[460,1480],[2440,1680],[2610,1770],[2510,1880],[1770,1880],[1840,2000],[1660,2040],[680,970],[740,1080]].entries())tree(x,y,i+100);
for(let i=0;i<35;i++){const x=210+random()*2640,y=260+random()*1810;if(originalPathDistance(x,y)<100||Math.hypot(x-FIELDS_SHED.x,y-FIELDS_SHED.y)<210)continue;FIELDS_PROPS.push({id:`rock-${i}`,x,y,texture:'lake-rock-'+(i%3),width:42+i%3*13,height:42+i%3*13,rx:18+i%3*5,ry:10+i%3*3});}
/** Grade de 128 px com os obstáculos de cada célula. Índice numérico: a consulta roda
 * centenas de milhares de vezes por segundo quando os animais fogem (rota de fuga). */
const PROP_COLUMNS=Math.ceil(3072/128)+2;
const propCells:(FieldProp[]|undefined)[]=[];
const propCell=(x:number,y:number)=>(y+1)*PROP_COLUMNS+x+1;
const indexProp=(p:FieldProp)=>{for(let y=Math.floor((p.y-p.ry)/128);y<=Math.floor((p.y+p.ry)/128);y++)for(let x=Math.floor((p.x-p.rx)/128);x<=Math.floor((p.x+p.rx)/128);x++){if(x<-1||y<-1||x>=PROP_COLUMNS-1)continue;(propCells[propCell(x,y)]??=[]).push(p);}};
for(const p of FIELDS_PROPS)indexProp(p);
/** Obstáculos sólidos (o jogador atravessa o rio nadando). */
export function fieldsSolid(x:number,y:number):boolean{
 if(x<32||y<32||x>3040||y>2272)return true;
 if(mapBridgeRail(FIELDS_BRIDGES,x,y))return true;
 const s=FIELDS_SHED;
 // Back and side timber walls; open front and floor remain accessible.
 if(x>s.x-78&&x<s.x+78&&y>s.y-88&&y<s.y-64)return true;
 if(Math.abs(x-s.x)>64&&Math.abs(x-s.x)<82&&y>s.y-88&&y<s.y-4)return true;
 const cell=propCells[propCell(Math.floor(x/128),Math.floor(y/128))];if(!cell)return false;
 for(const p of cell){const dx=(x-p.x)/p.rx,dy=(y-p.y)/p.ry;if(dx*dx+dy*dy<1)return true;}
 return false;
}
/** Animais, pets, armadilhas e construções: obstáculos e água. */
export function fieldsBlocked(x:number,y:number):boolean{return fieldsSolid(x,y)||fieldsWater(x,y);}
/** Corrimãos das pontes: sólidos para todos. */
export const fieldsBridgeRail=(x:number,y:number)=>mapBridgeRail(FIELDS_BRIDGES,x,y);
export interface MeadowPatch extends TilePoint{id:string;variant:number;size:number;kind:'grass'|'herb'|'mushroom';regrow:number}
export const MEADOW_PATCHES:MeadowPatch[]=[];
for(let y=230;y<2160;y+=41)for(let x=220;x<2860;x+=44){const px=x+(random()-.5)*30,py=y+(random()-.5)*30;
 const density=Math.sin(px*.007+Math.cos(py*.006))*Math.cos(py*.009)+Math.sin(py*.004-px*.003)*.4;
 if(density<-.28||random()>.78||originalPathDistance(px,py)<65||Math.hypot(px-FIELDS_SHED.x,py-FIELDS_SHED.y)<155||FIELDS_PROPS.some(p=>Math.hypot(px-p.x,py-p.y)<p.rx+32))continue;
 MEADOW_PATCHES.push({id:`grass-${MEADOW_PATCHES.length}`,x:px,y:py,variant:Math.floor(random()*3),size:42+random()*14,kind:'grass',regrow:3});
}
for(const [i,p]of FIELDS_PROPS.filter(p=>p.tree&&p.y>280&&p.y<2100).entries())if(i%2===0&&p.x>180&&p.x<2840&&[[-16,-16],[16,-16],[-16,16],[16,16],[0,0]].every(([dx,dy])=>!fieldsSolid(p.x+42+dx,p.y+26+dy)))MEADOW_PATCHES.push({id:`herb-${i}`,x:p.x+42,y:p.y+26,variant:0,size:28,kind:i%4===0?'herb':'mushroom',regrow:4});
// Rio e trilha da Costa (preview.45): a geração acima continua igual à das versões
// anteriores (mesmos ids e posições de tufos, ervas e árvores salvos). Só depois tiramos o
// que ficou dentro d'água, na margem ou na trilha da saída sul.
for(let i=FIELDS_PROPS.length-1;i>=0;i--){const p=FIELDS_PROPS[i];if(fieldsRiverEdge(p.x,p.y)<p.rx+34||coastLane(p.x,p.y))FIELDS_PROPS.splice(i,1);}
propCells.length=0;for(const p of FIELDS_PROPS)indexProp(p);
/** Moitas que o rio e o caminho da Costa cobriram na preview.45. Os ids continuam reservados:
 * a migração apaga cortes antigos delas, e nenhum id novo reaproveita esses números. */
export const FIELDS_RETIRED_PATCHES=new Set<string>();
for(let i=MEADOW_PATCHES.length-1;i>=0;i--){const p=MEADOW_PATCHES[i];if(fieldsRiverEdge(p.x,p.y)<26||coastLane(p.x,p.y)){FIELDS_RETIRED_PATCHES.add(p.id);MEADOW_PATCHES.splice(i,1);}}
export const FIELDS_ANIMALS=[{id:'field-horse-1',kind:'horse',x:1904,y:1392},{id:'field-cow-1',kind:'cow',x:1020,y:1690},{id:'field-cow-2',kind:'cow',x:1150,y:1790},{id:'field-hen-1',kind:'chicken',x:2240,y:990},{id:'field-hen-2',kind:'chicken',x:2310,y:1080},{id:'field-hen-3',kind:'chicken',x:2160,y:1150},{id:'field-rabbit-1',kind:'rabbit',x:600,y:700},{id:'field-rabbit-2',kind:'rabbit',x:2600,y:1550}] as const;
export const fieldPatch=(id:string)=>MEADOW_PATCHES.find(p=>p.id===id);
export const fieldsSafe=(p:TilePoint)=>[[-8,-5],[8,-5],[-8,4],[8,4]].every(([dx,dy])=>!fieldsBlocked(p.x+dx,p.y+dy));
/** O jogador pode ter salvado nadando no rio: só obstáculos sólidos invalidam a posição. */
export const fieldsPlayerSafe=(p:TilePoint)=>[[-8,-5],[8,-5],[-8,4],[8,4]].every(([dx,dy])=>!fieldsSolid(p.x+dx,p.y+dy));
/** Rare golden ipês, unique to the fields. Spots sit in existing clearings, and
 * their trunks are indexed only after every meadow patch exists, so patch ids
 * and saved cuts from earlier versions stay unchanged. */
export const IPE_HITS=6;
export const IPE_REGROW_DAYS=7;
export const IPE_REACH=78;
export const FIELDS_IPES:FieldProp[]=[[1240,440],[1720,720],[1940,1140],[760,1370],[2490,1400],[2120,1720]].map(([x,y],i)=>({id:`ipe-${i}`,x,y,texture:'fields-ipe',width:IPE_ART.width,height:IPE_ART.height,rx:14,ry:9,tree:true}));
for(const p of FIELDS_IPES)indexProp(p);
export const fieldIpe=(id:string)=>FIELDS_IPES.find(p=>p.id===id);
