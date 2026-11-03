import type {SaveData,TilePoint} from '../types';
import {smithAsset,smithPieceVisible,resolveSmithLayout,type SmithLayout} from './smith-layout';
import {bentoSmithNavigation} from './bento-navigation';
import {BENTO_WORK as B} from '../data/bento-work';
export type BentoFixture='stone'|'iron'|'anvil';
interface Fixture{point:TilePoint;rect:{left:number;right:number;top:number;bottom:number};pieceId:string}
let cache:{signature:string;layout:SmithLayout;fixtures:Map<BentoFixture,Fixture|undefined>}|undefined;
const distance=(p:TilePoint,r:Fixture['rect'])=>Math.hypot(Math.max(r.left-p.x,0,p.x-r.right),Math.max(r.top-p.y,0,p.y-r.bottom));
/** Uses the existing editable pieces; this never adds or moves workshop furniture. */
export function bentoFixture(save:SaveData,kind:BentoFixture):Fixture|undefined{
 const signature=JSON.stringify(save.blacksmithScene??null);if(cache?.signature!==signature)cache={signature,layout:resolveSmithLayout(save.blacksmithScene),fixtures:new Map()};
 if(cache.fixtures.has(kind))return cache.fixtures.get(kind);
 const layout=cache.layout,asset=kind==='anvil'?B.anvil:B.storage[kind],piece=layout.pieces.find(p=>p.asset===asset&&smithPieceVisible(layout,p));
 if(!piece){cache.fixtures.set(kind,undefined);return;}
 const art=smithAsset(piece.asset)!,r=art.collision??{x:art.bounds[0],y:art.bounds[1],width:art.bounds[2]-art.bounds[0],height:art.bounds[3]-art.bounds[1]},left=piece.x+(r.x-art.ox*art.w)*piece.sx,top=piece.y+(r.y-art.oy*art.h)*piece.sy;
 const rect={left,top,right:left+r.width*piece.sx,bottom:top+r.height*piece.sy},nav=bentoSmithNavigation(save),candidates:TilePoint[]=[];
 for(let y=124;y<324;y+=8)for(let x=68;x<524;x+=8){const p={x,y};if(distance(p,rect)>B.interactionReach||!nav.validPosition?.(x,y))continue;candidates.push(p);}
 const score=(p:TilePoint)=>distance(p,rect)+(kind==='anvil'?(p.x<rect.left-10?0:30):(p.y>rect.bottom+8?0:p.x>rect.right+12?12:p.x<rect.left-12?18:35));
 candidates.sort((a,b)=>score(a)-score(b));const point=candidates[0],fixture=point?{point,rect,pieceId:piece.id}:undefined;cache.fixtures.set(kind,fixture);return fixture;
}
export const bentoAtFixture=(save:SaveData,kind:BentoFixture,p:TilePoint):boolean=>{const f=bentoFixture(save,kind);return!!f&&distance(p,f.rect)<=B.interactionReach&&!!bentoSmithNavigation(save).validPosition?.(p.x,p.y);};
export function nearBentoDepot(save:SaveData,p:TilePoint):boolean{return(['stone','iron']as const).some(kind=>{const f=bentoFixture(save,kind);return!!f&&distance(p,f.rect)<35;});}
