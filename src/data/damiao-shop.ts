import {SHOP_FACADES,facadeBlockedPoint,facadeSourceSolid} from './shop-facades';
export const DAMIAO_SHOP = SHOP_FACADES.damiao;
export const damiaoSourceSolid = (x:number,y:number):boolean => facadeSourceSolid(DAMIAO_SHOP,x,y);
export const damiaoShopBlockedPoint = (x:number,y:number,b:{x:number;y:number}):boolean => facadeBlockedPoint(DAMIAO_SHOP,x,y,b);
