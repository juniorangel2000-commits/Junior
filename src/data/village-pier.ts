import {TILE} from './world-size';

/** World pixels. These bounds match the flat boards between the two ropes. */
export const VILLAGE_PIER={x:73*TILE,y:45.5*TILE-39.5,width:224,height:83.3,deckLeft:5,deckRight:219,deckTop:24,deckBottom:55} as const;
export const VILLAGE_PIER_ACCESS={
 startX:68.5*TILE,endX:VILLAGE_PIER.x+6,
 centerY:VILLAGE_PIER.y+(VILLAGE_PIER.deckTop+VILLAGE_PIER.deckBottom)/2,
 startHalfWidth:.65*TILE,endHalfWidth:(VILLAGE_PIER.deckBottom-VILLAGE_PIER.deckTop)/2-6,
} as const;
/** A gently narrowing stone approach ends flat under the entrance boards.
 * The two stone curbs fit between the pier's posts instead of crossing them. */
export function villagePierAccessDistance(x:number,y:number):number{
 const p=VILLAGE_PIER_ACCESS,t=Math.max(0,Math.min(1,(x-p.startX)/(p.endX-p.startX)));
 const half=p.startHalfWidth+(p.endHalfWidth-p.startHalfWidth)*t;
 return Math.max(p.startX-x,x-p.endX,Math.abs(y-p.centerY)-half);
}
export const villagePierDeckContains=(x:number,y:number):boolean=>
 x>=VILLAGE_PIER.x+VILLAGE_PIER.deckLeft&&x<VILLAGE_PIER.x+VILLAGE_PIER.deckRight
 &&y>=VILLAGE_PIER.y+VILLAGE_PIER.deckTop&&y<VILLAGE_PIER.y+VILLAGE_PIER.deckBottom;

export const villagePierNear=(x:number,y:number):boolean=>
 x>=VILLAGE_PIER.x-TILE&&x<VILLAGE_PIER.x+VILLAGE_PIER.width+TILE
 &&y>=VILLAGE_PIER.y-TILE&&y<VILLAGE_PIER.y+VILLAGE_PIER.height+TILE;

export function villagePierRailAtPoint(x:number,y:number):boolean{
 const p=VILLAGE_PIER;
 return x>=p.x&&x<p.x+p.width&&(
  y>=p.y+18&&y<p.y+p.deckTop||y>=p.y+p.deckBottom&&y<p.y+68
 );
}

export const VILLAGE_FISHING_PROPS=[
 {id:'varas-e-rede',frame:'rods',x:71.5,y:43.2,width:52,height:64,footprint:[-18,-10,36,10]},
 {id:'caixa-e-cordas',frame:'crate',x:73,y:47,width:50,height:38,footprint:[-18,-10,36,10]},
 {id:'cesta-de-peixes',frame:'fish',x:78.3,y:45.2,width:46,height:35,footprint:[-18,-9,36,9]},
 {id:'ancora-e-rede',frame:'anchor',x:71.8,y:47.3,width:48,height:44,footprint:[-17,-9,34,9]},
] as const;

export function villageFishingPropAtPoint(x:number,y:number):boolean{
 return VILLAGE_FISHING_PROPS.some(p=>{
  const [left,top,width,height]=p.footprint,px=(p.x+.5)*TILE,py=p.y*TILE+25;
  return x>=px+left&&x<px+left+width&&y>=py+top&&y<py+top+height;
 });
}
