import {SHOP_FACADES,facadeBlockedPoint,facadeSourceSolid} from './shop-facades';
export const ICARO_SHOP = SHOP_FACADES.icaro;
export const icaroSourceSolid = (x:number,y:number):boolean => facadeSourceSolid(ICARO_SHOP,x,y);
export const icaroShopBlockedPoint = (x:number,y:number,b:{x:number;y:number}):boolean => facadeBlockedPoint(ICARO_SHOP,x,y,b);
