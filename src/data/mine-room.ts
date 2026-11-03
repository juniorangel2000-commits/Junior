import legacyCollision from './mine-room-collision-v1.json';
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
 [236,445],[239,417],[265,378],[359,379],[398,391],[428,355],[495,342],[598,337],
 [636,321],[648,289],[683,276],[771,277],[800,312],[808,337],
 [932,348],[1064,350],[1137,380],[1198,414],[1240,407],[1244,356],[1311,355],[1320,425],
 [1320,456],[1304,512],[1284,566],[1270,610],[1254,640],[1248,684],[1226,716],
 [1180,741],[1114,770],[1030,794],[954,814],[886,844],[836,868],[795,894],
 [790,1024],[596,1024],[590,941],[553,880],[510,842],[437,804],[373,773],[313,737],
 [286,690],[264,650],[248,606],[240,563],[230,535],[237,488],
];
export interface MineSolid{id:string;label:string;footprint:MinePolygon;art?:MinePolygon;depth:number}
/** Source-space solid volumes keep actors off rock faces, containers and timber posts. */
export const MINE_SOLIDS:readonly MineSolid[]=[
 {id:'stone',label:'Depósito de pedra',depth:438,
  footprint:[[245,378],[252,345],[289,308],[328,305],[347,340],[374,345],[391,390],[395,415],[372,432],[327,442],[270,427],[242,407]],
  art:[[245,378],[252,345],[289,308],[328,305],[347,340],[374,345],[391,390],[395,415],[372,432],[327,442],[270,427],[242,407]]},
 {id:'coal',label:'Depósito de carvão',depth:747,
  footprint:[[239,686],[263,648],[309,637],[337,651],[350,676],[378,687],[392,724],[374,747],[312,758],[250,739],[230,715]],
  art:[[239,686],[263,648],[309,637],[337,651],[350,676],[378,687],[392,724],[374,747],[312,758],[250,739],[230,715]]},
 {id:'copper-north',label:'Rocha mineralizada',depth:406,
  footprint:[[1072,350],[1096,315],[1117,280],[1155,277],[1175,308],[1186,348],[1196,378],[1179,408],[1124,416],[1080,398],[1067,376]],
  art:[[1072,350],[1096,315],[1117,280],[1155,277],[1175,308],[1186,348],[1196,378],[1179,408],[1124,416],[1080,398],[1067,376]]},
 {id:'copper-south',label:'Rocha mineralizada',depth:739,
  footprint:[[1129,681],[1163,639],[1190,602],[1219,585],[1250,588],[1269,622],[1288,650],[1305,701],[1282,741],[1200,752],[1144,728]],
  art:[[1129,681],[1163,639],[1190,602],[1219,585],[1250,588],[1269,622],[1288,650],[1305,701],[1282,741],[1200,752],[1144,728]]},
 {id:'cart',label:'Carrinho da mina',depth:588,
  footprint:[[285,478],[354,449],[435,471],[424,529],[438,546],[425,572],[380,597],[324,577],[276,553],[273,534],[288,517]],
  art:[[285,478],[354,449],[435,471],[424,529],[438,546],[425,572],[380,597],[324,577],[276,553],[273,534],[288,517]]},
 {id:'crate',label:'Caixote',depth:341,
  footprint:[[822,254],[868,231],[922,252],[924,324],[875,347],[821,327]],
  art:[[822,254],[868,231],[922,252],[924,324],[875,347],[821,327]]},
 {id:'sack',label:'Saco de minério',depth:337,footprint:[[918,310],[931,294],[961,293],[981,314],[978,335],[947,344],[922,335]]},
 {id:'tools',label:'Ferramentas',depth:336,footprint:[[976,315],[1109,315],[1109,338],[976,338]]},
 {id:'quartz',label:'Cristais na parede',depth:329,footprint:[[515,307],[540,293],[584,301],[602,322],[574,336],[528,330]]},
 {id:'entry-left-post',label:'Pilar da entrada',depth:961,footprint:[[534,780],[584,780],[585,962],[534,962]]},
 {id:'entry-right-post',label:'Pilar da entrada',depth:963,footprint:[[800,780],[855,780],[853,967],[799,967]]},
 {id:'north-left-post',label:'Pilar do túnel',depth:329,footprint:[[598,150],[645,150],[646,337],[596,337]]},
 {id:'north-right-post',label:'Pilar do túnel',depth:323,footprint:[[791,160],[835,160],[835,329],[791,329]]},
 {id:'east-left-post',label:'Pilar do túnel',depth:413,footprint:[[1187,240],[1235,240],[1236,421],[1187,421]]},
 {id:'east-right-post',label:'Pilar do túnel',depth:452,footprint:[[1320,282],[1369,282],[1363,460],[1320,460]]},
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

/** Recover only positions accepted by the previous collision layout. */
export function previousMinePosition(x:number,y:number):boolean{
 return Number.isFinite(x)&&Number.isFinite(y)&&[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>{
  const px=(x+dx)/MINE_ROOM.scale,py=(y+dy)/MINE_ROOM.scale;
  return pointInPolygon(px,py,legacyCollision.floor as unknown as MinePolygon)&&!legacyCollision.solids.some(p=>pointInPolygon(px,py,p as unknown as MinePolygon));
 });
}
export function recoverMinePosition(p:MinePosition):MinePosition{
 if(mineFits(p.x,p.y))return{...p};
 for(let radius=2;radius<=96;radius+=2)for(let dy=-radius;dy<=radius;dy+=2)for(const dx of [-radius,radius])if(mineFits(p.x+dx,p.y+dy))return{...p,x:p.x+dx,y:p.y+dy};
 return{...MINE_ARRIVAL};
}
