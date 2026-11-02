import {pointInPolygon} from './architecture-collision';
import {CHARACTER_DIRECTIONS,type CharacterDirection} from '../character-directions';

/** The approved 1536×1024 artwork is shown at 2 texels per world pixel. */
export const MINE_ROOM={width:768,height:512,scale:.5,file:'assets/visual/mine/first-gallery.png'} as const;
export const MINE_NAME='Mina Antiga';
export type MinePolygon=readonly(readonly[number,number])[];
export interface MinePosition{x:number;y:number;direction?:CharacterDirection}
export const MINE_ARRIVAL:MinePosition={x:346,y:342,direction:'up'};
export const MINE_EXIT={x:347,y:482,halfWidth:47,depth:22,direction:'down'} as const;
/** Trace the ground at the foot of the walls, including the three door recesses. */
export const MINE_FLOOR:MinePolygon=[
 [218,440],[223,401],[265,378],[359,379],[398,391],[428,355],[495,342],[598,337],
 [636,321],[648,289],[683,276],[771,277],[800,312],[808,337],
 [932,348],[1064,350],[1137,380],[1198,414],[1240,407],[1244,356],[1311,355],[1320,425],
 [1355,449],[1344,512],[1327,566],[1315,610],[1295,640],[1284,684],[1240,716],
 [1180,741],[1114,770],[1030,794],[954,814],[886,844],[836,868],[795,894],
 [790,1024],[596,1024],[590,941],[553,880],[510,842],[437,804],[373,773],[313,737],
 [269,696],[247,655],[230,610],[222,569],[206,535],[219,490],
];
export interface MineSolid{id:string;label:string;footprint:MinePolygon;art?:MinePolygon;depth:number}
/** Ground footprints are independent of the taller visible silhouettes. Coordinates are in the source PNG. */
export const MINE_SOLIDS:readonly MineSolid[]=[
 {id:'stone',label:'Depósito de pedra',depth:438,
  footprint:[[248,390],[272,376],[353,378],[391,400],[382,431],[330,443],[270,428]],
  art:[[245,378],[252,345],[289,308],[328,305],[347,340],[374,345],[391,390],[395,415],[372,432],[327,442],[270,427],[242,407]]},
 {id:'coal',label:'Depósito de carvão',depth:747,
  footprint:[[239,697],[269,678],[348,685],[388,716],[374,748],[312,758],[253,740]],
  art:[[239,686],[263,648],[309,637],[337,651],[350,676],[378,687],[392,724],[374,747],[312,758],[250,739],[230,715]]},
 {id:'copper-north',label:'Veio de cobre',depth:406,
  footprint:[[1070,367],[1100,352],[1164,359],[1192,382],[1178,409],[1125,415],[1080,397]],
  art:[[1072,350],[1096,315],[1117,280],[1155,277],[1175,308],[1186,348],[1196,378],[1179,408],[1124,416],[1080,398],[1067,376]]},
 {id:'copper-south',label:'Veio de cobre',depth:739,
  footprint:[[1131,684],[1164,665],[1256,669],[1301,703],[1278,743],[1202,751],[1145,729]],
  art:[[1129,681],[1163,639],[1190,602],[1219,585],[1250,588],[1269,622],[1288,650],[1305,701],[1282,741],[1200,752],[1144,728]]},
 {id:'cart',label:'Carrinho da mina',depth:588,
  footprint:[[282,536],[318,524],[394,531],[427,550],[421,578],[378,594],[325,577],[282,557]],
  art:[[285,478],[354,449],[435,471],[424,529],[438,546],[425,572],[380,597],[324,577],[276,553],[273,534],[288,517]]},
 {id:'crate',label:'Caixote',depth:341,
  footprint:[[823,302],[869,283],[921,303],[921,327],[875,346],[824,330]],
  art:[[822,254],[868,231],[922,252],[924,324],[875,347],[821,327]]},
 {id:'sack',label:'Saco de minério',depth:337,footprint:[[918,310],[931,294],[961,293],[981,314],[978,335],[947,344],[922,335]]},
 {id:'tools',label:'Ferramentas',depth:336,footprint:[[976,315],[1109,315],[1109,338],[976,338]]},
 {id:'quartz',label:'Cristais na parede',depth:329,footprint:[[515,307],[540,293],[584,301],[602,322],[574,336],[528,330]]},
 {id:'entry-left-post',label:'Pilar da entrada',depth:961,footprint:[[535,919],[583,919],[585,962],[534,962]]},
 {id:'entry-right-post',label:'Pilar da entrada',depth:963,footprint:[[801,922],[851,922],[853,967],[799,967]]},
 {id:'north-left-post',label:'Pilar do túnel',depth:329,footprint:[[598,300],[645,300],[646,337],[596,337]]},
 {id:'north-right-post',label:'Pilar do túnel',depth:323,footprint:[[791,292],[830,292],[830,329],[791,329]]},
 {id:'east-left-post',label:'Pilar do túnel',depth:413,footprint:[[1187,384],[1235,384],[1236,421],[1187,421]]},
 {id:'east-right-post',label:'Pilar do túnel',depth:452,footprint:[[1320,410],[1363,410],[1363,460],[1320,460]]},
];
/** Only the timber silhouette overlays actors; never a rectangular piece of floor. */
export const MINE_ENTRY_TIMBER:MinePolygon=[
 [534,737],[580,736],[580,740],[806,740],[807,736],[851,736],[855,781],
 [850,959],[804,959],[804,815],[775,789],[613,789],[583,819],[584,956],[535,956],
];
export const MINE_PORTAL_TIMBERS:readonly MinePolygon[]=[
 [[601,103],[810,62],[834,78],[835,325],[791,329],[791,160],[765,137],[674,153],[645,180],[644,335],[598,337]],
 [[1185,196],[1210,183],[1361,222],[1369,454],[1320,459],[1321,287],[1295,263],[1233,242],[1237,417],[1186,423]],
];
export const MINE_TUNNELS=[
 {id:'north',x:362,y:153,label:'Túnel ao norte'},
 {id:'east',x:639,y:191,label:'Túnel a leste'},
] as const;
export function mineBlockedPoint(x:number,y:number):boolean{
 const px=x/MINE_ROOM.scale,py=y/MINE_ROOM.scale;
 return !Number.isFinite(px)||!Number.isFinite(py)||!pointInPolygon(px,py,MINE_FLOOR)||MINE_SOLIDS.some(o=>pointInPolygon(px,py,o.footprint));
}
export function mineFits(x:number,y:number):boolean{
 return [[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!mineBlockedPoint(x+dx,y+dy));
}
export function mineResumePosition(position?:MinePosition):MinePosition{
 return position&&mineFits(position.x,position.y)?{...position}:{...MINE_ARRIVAL};
}
export function validMineInterior(value:unknown):value is MinePosition{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const p=value as Record<string,unknown>;
 return typeof p.x==='number'&&typeof p.y==='number'&&mineFits(p.x,p.y)&&(p.direction===undefined||CHARACTER_DIRECTIONS.some(d=>d===p.direction));
}
