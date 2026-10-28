import {SHOP_FACADES,facadeBlockedPoint,facadeSourceSolid} from './shop-facades';
export const NILO_SHOP = SHOP_FACADES.nilo;
export const niloSourceSolid = (x:number,y:number):boolean => facadeSourceSolid(NILO_SHOP,x,y);
export const niloShopBlockedPoint = (x:number,y:number,b:{x:number;y:number}):boolean => facadeBlockedPoint(NILO_SHOP,x,y,b);
