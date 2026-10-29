import silhouettes from './village-building-silhouettes.json';
import {TOBIAS_SHOP} from './tobias-shop';
import {BLACKSMITH_HOUSE} from './blacksmith-house';
import {facadeForMerchant} from './shop-facades';

export interface VillageArtRect {left:number;top:number;right:number;bottom:number}
/** Horizontal opaque envelopes omit PNG padding and roof corners, while
 * keeping open workshop bays reserved between their supporting posts. */
export function villageBuildingArtBands(b:{x:number;y:number;shop?:string}):VillageArtRect[]{
 const art=b.shop==='carpenter'?TOBIAS_SHOP:b.shop==='blacksmith'
  ?{...BLACKSMITH_HOUSE,file:'assets/visual/village/blacksmith-house.png'}:facadeForMerchant(b.shop);
 if(!art)return[];
 const profile=silhouettes[art.file as keyof typeof silhouettes];
 const ox=(b.x+.5)*32-art.door.x*art.scale,oy=b.y*32+25-art.door.y*art.scale;
 const bands=profile?.bands??[[0,0,'width'in art?art.width:art.size,'height'in art?art.height:art.size]];
 return bands.map(([left,top,right,bottom])=>({
  left:ox+left*art.scale,top:oy+top*art.scale,right:ox+right*art.scale,bottom:oy+bottom*art.scale,
 }));
}
export const villageArtRectsOverlap=(a:VillageArtRect,b:VillageArtRect):boolean=>
 a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
