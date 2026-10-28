/** Static public buildings share their ground footprint with NPC navigation.
 * Roofs and windmill sails overhang freely; no new indoor scene is implied. */
export type LandmarkKind = 'fountain' | 'community' | 'windmill' | 'gazebo' | 'granary' | 'cottage' | 'cart' | 'wheat';
export interface VillageLandmark {
 id: string;
 kind: LandmarkKind;
 x: number;
 y: number;
 width: number;
 height: number;
 /** Left, top, width, height relative to the ground anchor, in world pixels. */
 footprint: readonly [number, number, number, number];
}
export const VILLAGE_LANDMARKS: readonly VillageLandmark[] = [
 {id:'praca-fonte',kind:'fountain',x:46,y:37,width:116,height:100,footprint:[-53,-42,106,42]},
 {id:'casa-comunitaria',kind:'community',x:62,y:12,width:320,height:200,footprint:[-150,-60,300,60]},
 {id:'moinho',kind:'windmill',x:12,y:16,width:228,height:300,footprint:[-62,-74,124,74]},
 {id:'coreto',kind:'gazebo',x:50,y:9,width:168,height:194,footprint:[-73,-40,146,40]},
 {id:'celeiro',kind:'granary',x:10,y:36,width:156,height:164,footprint:[-66,-42,132,42]},
 {id:'casa-leste',kind:'cottage',x:84,y:22,width:206,height:162,footprint:[-92,-49,184,49]},
 {id:'casa-sul',kind:'cottage',x:83,y:63,width:206,height:162,footprint:[-92,-49,184,49]},
 {id:'carroca-armazem',kind:'cart',x:29,y:35,width:64,height:49,footprint:[-26,-20,52,20]},
 {id:'carroca-sementes',kind:'cart',x:41,y:58,width:64,height:49,footprint:[-26,-20,52,20]},
 {id:'trigo-moinho-a',kind:'wheat',x:8,y:20,width:94,height:65,footprint:[-42,-23,84,23]},
 {id:'trigo-moinho-b',kind:'wheat',x:8,y:23,width:94,height:65,footprint:[-42,-23,84,23]},
];

export function villageLandmarkBlockedPoint(x:number,y:number):boolean {
 return VILLAGE_LANDMARKS.some(p=>{
  const ax=(p.x+.5)*32,ay=p.y*32+25,[l,t,w,h]=p.footprint;
  if(p.kind==='fountain')return Math.hypot((x-ax)/(w/2),(y-ay-h/2-t)/(h/2))<=1;
  return x>=ax+l&&x<=ax+l+w&&y>=ay+t&&y<=ay+t+h;
 });
}
export const villageLandmarkBlockedTile=(x:number,y:number)=>villageLandmarkBlockedPoint((x+.5)*32,(y+.5)*32);

/** Keep canopies and ground clutter outside the whole visible architecture. */
export function villageLandmarkClearing(x:number,y:number,padding=0):boolean {
 return VILLAGE_LANDMARKS.some(p=>Math.abs((x-p.x)*32)<p.width/2+padding&&y*32>p.y*32-p.height-padding&&y*32<p.y*32+32+padding);
}
