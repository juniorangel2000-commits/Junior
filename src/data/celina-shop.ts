import {pointInPolygon} from './architecture-collision';
export const CELINA_SHOP={texture:'village-celina-shop',file:'assets/visual/village/celina/fachada.png',width:1536,height:1024,scale:.255,
 door:{x:800,y:866},foot:958/1024,chimney:{x:570,y:38},lamps:[{x:654,y:646},{x:955,y:645}],
 glass:[{x:759,y:308,width:109,height:92},{x:445,y:351,width:52,height:70},{x:1082,y:350,width:44,height:70},{x:344,y:579,width:262,height:250},{x:1025,y:579,width:238,height:250}],
} as const;
// The roof overhang is not a ground obstacle; the doorway remains walkable.
const walls=[[245,535],[1345,535],[1345,870],[885,870],[885,831],[716,831],[716,870],[245,870]] as const;
export const celinaSourceSolid=(x:number,y:number):boolean=>pointInPolygon(x,y,walls)
;
export function celinaShopBlockedPoint(x:number,y:number,b:{x:number;y:number}):boolean{
 return celinaSourceSolid(CELINA_SHOP.door.x+(x-(b.x+.5)*32)/CELINA_SHOP.scale,CELINA_SHOP.door.y+(y-(b.y*32+25))/CELINA_SHOP.scale);
}
