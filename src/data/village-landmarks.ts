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
 {id:'casa-comunitaria',kind:'community',x:57,y:16,width:320,height:200,footprint:[-150,-60,300,60]},
 {id:'moinho',kind:'windmill',x:20,y:21,width:228,height:300,footprint:[-62,-74,124,74]},
 {id:'coreto',kind:'gazebo',x:44,y:12,width:168,height:194,footprint:[-73,-40,146,40]},
 {id:'celeiro',kind:'granary',x:23,y:36,width:264,height:188,footprint:[-113,-54,226,54]},
 {id:'casa-leste',kind:'cottage',x:76,y:29,width:244,height:184,footprint:[-109,-58,218,58]},
 {id:'casa-sul',kind:'cottage',x:77,y:60,width:244,height:184,footprint:[-109,-58,218,58]},
 {id:'carroca-armazem',kind:'cart',x:29,y:35,width:64,height:49,footprint:[-26,-20,52,20]},
 {id:'carroca-sementes',kind:'cart',x:43,y:58,width:64,height:49,footprint:[-26,-20,52,20]},
 {id:'trigo-moinho-a',kind:'wheat',x:15.5,y:28,width:56,height:120,footprint:[-24,-70,48,70]},
 {id:'trigo-moinho-b',kind:'wheat',x:23.5,y:28,width:56,height:120,footprint:[-24,-70,48,70]},
];

export function villageGazeboContains(x:number,y:number):boolean{
 const p=VILLAGE_LANDMARKS.find(p=>p.kind==='gazebo')!,dx=x-(p.x+.5)*32,dy=y-(p.y*32+25);
 return Math.abs(dx)<55&&dy>-43&&dy<3;
}

function gazeboBlocked(dx:number,dy:number):boolean{
 // Wider than the player's two foot probes, so a thin pillar cannot slip
 // between them. The centre stays clear from the steps to the rear railing.
 const solids=[[-75,-28,20,28],[55,-28,20,28],[-61,-55,18,16],[43,-55,18,16],[-55,-49,110,6],[-72,-43,17,18],[55,-43,17,18]];
 return solids.some(([x,y,w,h])=>dx>=x&&dx<=x+w&&dy>=y&&dy<=y+h);
}

export function villageLandmarkBlockedPoint(x:number,y:number):boolean {
 return VILLAGE_LANDMARKS.some(p=>{
  const ax=(p.x+.5)*32,ay=p.y*32+25,[l,t,w,h]=p.footprint;
  if(p.kind==='fountain')return Math.hypot((x-ax)/(w/2),(y-ay-h/2-t)/(h/2))<=1;
  if(p.kind==='gazebo')return gazeboBlocked(x-ax,y-ay);
  return x>=ax+l&&x<=ax+l+w&&y>=ay+t&&y<=ay+t+h;
 });
}
export const villageLandmarkBlockedTile=(x:number,y:number)=>villageLandmarkBlockedPoint((x+.5)*32,(y+.5)*32);

/** Keep canopies and ground clutter outside the whole visible architecture. */
export function villageLandmarkClearing(x:number,y:number,padding=0):boolean {
 return VILLAGE_LANDMARKS.some(p=>Math.abs((x-p.x)*32)<p.width/2+padding&&y*32>p.y*32-p.height-padding&&y*32<p.y*32+32+padding);
}

/** Soft organic clearings for ground materials. The rectangular exclusion
 * above remains useful for trees; painting its boolean into grass made boxes. */
export function villageLandmarkGroundClearing(x:number,y:number):number {
 let weight=0;
 for(const p of VILLAGE_LANDMARKS){
  const rx=p.width/64+2.5,ry=p.height/64+2;
  const centerY=p.y-p.height/64+.5;
  const distance=Math.hypot((x-p.x)/rx,(y-centerY)/ry)
   +.035*Math.sin(x*.7+y*.43)+.025*Math.cos(y*.91-x*.29);
  const t=Math.max(0,Math.min(1,(distance-.55)/.8));
  weight=Math.max(weight,1-t*t*(3-2*t));
 }
 return weight;
}
