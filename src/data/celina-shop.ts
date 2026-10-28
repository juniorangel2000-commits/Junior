import {SHOP_FACADES,facadeBlockedPoint,facadeSourceSolid} from './shop-facades';
export const CELINA_SHOP = SHOP_FACADES.celina;
export const celinaSourceSolid = (x:number,y:number):boolean => facadeSourceSolid(CELINA_SHOP,x,y);
export const celinaShopBlockedPoint = (x:number,y:number,b:{x:number;y:number}):boolean => facadeBlockedPoint(CELINA_SHOP,x,y,b);
