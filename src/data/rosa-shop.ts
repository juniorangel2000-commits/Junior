import {SHOP_FACADES,facadeBlockedPoint,facadeSourceSolid} from './shop-facades';
export const ROSA_SHOP = SHOP_FACADES.rosa;
export const rosaSourceSolid = (x:number,y:number):boolean => facadeSourceSolid(ROSA_SHOP,x,y);
export const rosaShopBlockedPoint = (x:number,y:number,b:{x:number;y:number}):boolean => facadeBlockedPoint(ROSA_SHOP,x,y,b);
