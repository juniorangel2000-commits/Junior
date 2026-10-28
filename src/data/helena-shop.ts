import {SHOP_FACADES,facadeBlockedPoint,facadeSourceSolid} from './shop-facades';
export const HELENA_SHOP = SHOP_FACADES.helena;
export const helenaSourceSolid = (x:number,y:number):boolean => facadeSourceSolid(HELENA_SHOP,x,y);
export const helenaShopBlockedPoint = (x:number,y:number,b:{x:number;y:number}):boolean => facadeBlockedPoint(HELENA_SHOP,x,y,b);
