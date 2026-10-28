import {pointInPolygon} from './architecture-collision';
export const NILO_SHOP={texture:'village-nilo-shop',file:'assets/visual/village/nilo/fachada.png',width:1536,height:1024,scale:.255,
 door:{x:800,y:866},foot:958/1024,chimney:{x:600,y:38},lamps:[{x:657,y:646},{x:949,y:645}],
 glass:[{x:759,y:308,width:109,height:92},{x:445,y:351,width:52,height:70},{x:1082,y:350,width:44,height:70},{x:344,y:579,width:262,height:250},{x:1025,y:579,width:238,height:250}],
} as const;
// The roof overhang is not a ground obstacle; the doorway remains walkable.
const walls=[[298,532],[1293,532],[1293,867],[875,867],[875,831],[724,831],[724,867],[298,867]] as const;
export const niloSourceSolid=(x:number,y:number):boolean=>pointInPolygon(x,y,walls)
 ||((x-660)/61)**2+((y-903)/43)**2<=1||((x-952)/63)**2+((y-903)/43)**2<=1;
export function niloShopBlockedPoint(x:number,y:number,b:{x:number;y:number}):boolean{
 return niloSourceSolid(NILO_SHOP.door.x+(x-(b.x+.5)*32)/NILO_SHOP.scale,NILO_SHOP.door.y+(y-(b.y*32+25))/NILO_SHOP.scale);
}
