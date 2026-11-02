import {pointInPolygon} from './architecture-collision';
import type {MapEditData,EditorObjectKind} from '../systems/map-editor';
export const HIGHLAND_SIZE={width:1536,height:1024};
export const HIGHLAND_ENTRY={x:7,y:27},HIGHLAND_EXIT={x:7,y:28};
export const LAKE_HIGHLAND_EXIT={x:34,y:3},LAKE_HIGHLAND_RETURN={x:34,y:5};
export const HIGHLAND_PROPS=['highland-bridge','highland-mine'] as const;
export const HIGHLAND_PROP_NAMES={'highland-bridge':'Ponte elevada da serra','highland-mine':'Entrada da mina abandonada'};
export interface HighlandObject{id:string;kind:EditorObjectKind;x:number;y:number;width:number;height:number;texture:string;rotation:number}
export const HIGHLAND_OBJECTS:HighlandObject[]=[
 {id:'editor-highland-bridge-0',kind:'highland-bridge',x:820,y:462,width:600,height:223,texture:'highland-bridge',rotation:.07},
 {id:'editor-highland-mine-0',kind:'highland-mine',x:1315,y:215,width:450,height:300,texture:'highland-mine',rotation:0},
 ...[[70,160],[330,140],[520,215],[150,335],[490,330],[73,510],[300,640],[90,850],[385,825],[1490,170],[1510,470],[1350,610],[1450,740],[1240,850]].map(([x,y],i):HighlandObject=>({id:`editor-${i%3?'standingTree':'pine'}-highland${i}`,kind:i%3?'standingTree':'pine',x,y,width:i%3?110:85,height:i%3?150:170,texture:`asset-${i%3?'tree':'pine'}-${i%3}`,rotation:0}))
];
const layouts=new WeakMap<MapEditData,HighlandObject[]>();
export function highlandObjects(edits?:MapEditData):HighlandObject[]{if(!edits)return HIGHLAND_OBJECTS;const cached=layouts.get(edits);if(cached)return cached;const base=HIGHLAND_OBJECTS.flatMap(o=>{const e=edits?.objects[o.id];return e?.removed?[]:[{...o,...(e?{x:(e.x+.5)*32,y:(e.y+.5)*32}:{})}];});for(const[id,e]of Object.entries(edits?.objects??{}))if(!e.removed&&e.kind&&!HIGHLAND_OBJECTS.some(o=>o.id===id)){const t=HIGHLAND_OBJECTS.find(o=>o.kind===e.kind);if(t)base.push({...t,id,x:(e.x+.5)*32,y:(e.y+.5)*32});}layouts.set(edits,base);return base;}
const WEST=[[110,85],[285,75],[325,135],[405,145],[438,182],[505,195],[540,250],[638,280],[677,332],[682,365],[600,389],[565,414],[555,458],[425,464],[340,510],[275,570],[240,645],[242,690],[274,846],[285,887],[245,926],[205,898],[195,849],[178,715],[172,672],[187,624],[235,571],[267,509],[288,459],[284,422],[160,470],[70,435],[95,366],[177,339],[235,282],[238,232],[164,205],[126,164]] as const;
const EAST=[[1040,424],[1140,398],[1220,365],[1215,330],[1190,295],[1200,240],[1240,204],[1380,204],[1440,265],[1502,302],[1460,350],[1390,352],[1370,400],[1450,455],[1430,505],[1350,560],[1280,565],[1190,520],[1100,512],[1040,470]] as const;
const STREAM=[[0,695,35],[90,706,32],[180,740,35],[280,788,45],[350,823,55],[450,856,67],[500,845,57],[590,867,65],[680,927,65],[760,910,60],[850,851,50],[920,850,62]];
export function highlandRiverBanks(y:number):{center:number;half:number}{let i=0;while(i<STREAM.length-2&&y>STREAM[i+1][0])i++;const a=STREAM[i],b=STREAM[i+1],t=Math.max(0,Math.min(1,(y-a[0])/(b[0]-a[0])));return{center:a[1]+(b[1]-a[1])*t,half:a[2]+(b[2]-a[2])*t};}
export function highlandWaterPoint(x:number,y:number,edits?:MapEditData):boolean{const t=edits?.terrain[`${Math.floor(x/32)},${Math.floor(y/32)}`];if(t)return t==='water';const b=highlandRiverBanks(y);return y>=0&&y<920&&Math.abs(x-b.center)<b.half;}
export function highlandBridgePose(edits?:MapEditData){const o=highlandObjects(edits).find(o=>o.kind==='highland-bridge');return o?{left:o.x-267,right:o.x+267,y:o.y-34}:undefined;}
export function highlandDeck(x:number,y:number,edits?:MapEditData):boolean {const b=highlandBridgePose(edits);return !!b&&x>=b.left&&x<=b.right&&Math.abs(y-(b.y+.07*(x-(b.left+b.right)/2)))<16;}
export function highlandAllowsStep(from:{x:number;y:number},to:{x:number;y:number},edits?:MapEditData):boolean {const a=highlandDeck(from.x,from.y,edits),b=highlandDeck(to.x,to.y,edits);if(a===b)return true;const deck=highlandBridgePose(edits);if(!deck)return false;if(highlandWaterPoint(...(a?[to.x,to.y] as const:[from.x,from.y] as const),edits))return false;return [deck.left,deck.right].some(x=>Math.abs(from.x-x)<12&&Math.abs(to.x-x)<12)&&Math.abs(to.y-from.y)<5;}
export function highlandLand(x:number,y:number):boolean{return pointInPolygon(x,y,WEST)||pointInPolygon(x,y,EAST)||x>=520&&x<=575&&y>=388&&y<=470;}
export function highlandMineApproach(edits?:MapEditData){const o=highlandObjects(edits).find(o=>o.kind==='highland-mine');return o?{x:o.x,y:o.y+22}:undefined;}
export function highlandBlockedPoint(x:number,y:number,edits?:MapEditData,allowWater=false):boolean {
 if(x<16||y<16||x>1520||y>1008)return true;
 if(highlandDeck(x,y,edits))return false;
 const bridge=highlandBridgePose(edits);if(bridge&&x>bridge.left&&x<bridge.right&&Math.abs(y-(bridge.y+.07*(x-(bridge.left+bridge.right)/2)))<27)return true;
 if(highlandWaterPoint(x,y,edits))return !allowWater;
 if(!highlandLand(x,y))return true;
 const mine=highlandMineApproach(edits);if(mine){const dx=x-mine.x,dy=y-mine.y;if(dy<-20&&Math.abs(dx)<170||dx>110&&dx<205&&dy>-5&&dy<105||dx<-105&&dx>-210&&dy>-5&&dy<85)return true;}
 return highlandObjects(edits).some(o=>(o.kind==='standingTree'||o.kind==='pine')&&Math.abs(o.x-x)<12&&Math.abs(o.y-y)<8);
}
