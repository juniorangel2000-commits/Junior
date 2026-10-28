import {SHOP_FACADES,facadeBlockedPoint,facadeSourceSolid} from './shop-facades';
export const AMELIA_SHOP = SHOP_FACADES.amelia;
export const ameliaSourceSolid = (x:number,y:number):boolean => facadeSourceSolid(AMELIA_SHOP,x,y);
export const ameliaShopBlockedPoint = (x:number,y:number,b:{x:number;y:number}):boolean => facadeBlockedPoint(AMELIA_SHOP,x,y,b);
