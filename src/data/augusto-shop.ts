import {SHOP_FACADES,facadeBlockedPoint,facadeSourceSolid} from './shop-facades';
export const AUGUSTO_SHOP = SHOP_FACADES.augusto;
export const augustoSourceSolid = (x:number,y:number):boolean => facadeSourceSolid(AUGUSTO_SHOP,x,y);
export const augustoShopBlockedPoint = (x:number,y:number,b:{x:number;y:number}):boolean => facadeBlockedPoint(AUGUSTO_SHOP,x,y,b);
export function augustoShopLocal(x:number,y:number,b:{x:number;y:number}) { return {x:AUGUSTO_SHOP.door.x+(x-(b.x+.5)*32)/AUGUSTO_SHOP.scale,y:AUGUSTO_SHOP.door.y+(y-(b.y*32+25))/AUGUSTO_SHOP.scale}; }
