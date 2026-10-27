import {pointInPolygon} from './architecture-collision';
export const TOBIAS_SHOP={texture:'village-tobias-shop',file:'assets/visual/village/tobias/fachada.png',width:1536,height:1024,scale:.30,
 door:{x:452,y:790},foot:890/1024,chimney:{x:380,y:43},lamps:[{x:350,y:602},{x:1054,y:609}],
 glass:[{x:507,y:333,width:83,height:84},{x:587,y:614,width:73,height:72},{x:274,y:376,width:43,height:56}],
} as const;
export const TOBIAS_BENCH_OUTLINE=[[839,695],[1134,695],[1134,739],[1101,739],[1101,801],[1068,801],[1068,750],[873,750],[873,804],[843,804]] as const;
const closedWalls=[[260,522],[748,522],[748,792],[520,792],[520,765],[392,765],[392,792],[260,792]] as const;
const solids=[{x:800,y:584,w:479,h:111},{x:842,y:736,w:292,h:62},{x:756,y:775,w:40,h:81},{x:1278,y:775,w:51,h:91},{x:1165,y:709,w:114,h:149},{x:1112,y:793,w:116,h:65}] as const;
export function tobiasSourceSolid(x:number,y:number):boolean{return pointInPolygon(x,y,closedWalls)||solids.some(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);}
export function tobiasShopBlockedPoint(x:number,y:number,b:{x:number;y:number}):boolean{
 return tobiasSourceSolid(TOBIAS_SHOP.door.x+(x-(b.x+.5)*32)/TOBIAS_SHOP.scale,TOBIAS_SHOP.door.y+(y-(b.y*32+25))/TOBIAS_SHOP.scale);
}
