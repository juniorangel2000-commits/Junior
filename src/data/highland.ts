import {pointInPolygon} from './architecture-collision';
import riverContour from './highland-river-contour.json';
import type {SaveData} from '../types';
import type {MapEditData,EditorObjectKind} from '../systems/map-editor';
export const HIGHLAND_SIZE={width:1536,height:1024};
export const HIGHLAND_ENTRY={x:8,y:29},HIGHLAND_EXIT={x:8,y:30};
export const LAKE_HIGHLAND_EXIT={x:34,y:3},LAKE_HIGHLAND_RETURN={x:34,y:7};
export const HIGHLAND_LAKE_PASSAGE={x:271,y:982,halfWidth:46,depth:24,direction:'down'} as const;
// Only the first two native lake treads are visible, at the southern map edge.
export const HIGHLAND_STAIRS={sourceX:385,sourceY:450,width:225,height:48,x:146,y:976};
/** Atlas crops and normalized footprints follow the new independent prop art. */
export const HIGHLAND_ART={
 bridge:{x:76,y:142,width:2019,height:453,frontY:192,deckTop:.29,deckBottom:.49},
 mine:{x:12,y:144,width:2004,height:541,approachX:.495,approachY:.86},
} as const;
const MINE_WALL=[[0,.88],[.02,.60],[.04,.18],[.10,.05],[.38,0],[.63,.03],[.93,.04],[.99,.2],[1,.83],[.97,.98],[.64,.98],[.60,.82],[.40,.82],[.37,.98],[.03,.98]] as const;
export const HIGHLAND_PROPS=['highland-bridge','highland-mine','highland-minecart','highland-toolstand','highland-orepile'] as const;
export const HIGHLAND_PROP_NAMES={'highland-bridge':'Ponte elevada da serra','highland-mine':'Entrada da Mina Antiga','highland-minecart':'Carrinho de minério','highland-toolstand':'Ferramentas da mina','highland-orepile':'Minério e carvão'};
export interface HighlandObject{id:string;kind:EditorObjectKind;x:number;y:number;width:number;height:number;texture:string;rotation:number;footprint?:{halfWidth:number;depth:number}}
export const HIGHLAND_OBJECTS:HighlandObject[]=[
 {id:'editor-highland-bridge-0',kind:'highland-bridge',x:836,y:407,width:200,height:90,texture:'highland-bridge',rotation:0},
 {id:'editor-highland-mine-0',kind:'highland-mine',x:1280,y:90,width:400,height:140,texture:'highland-mine',rotation:0},
 {id:'editor-highland-minecart-0',kind:'highland-minecart',x:1150,y:310,width:56,height:55,texture:'highland-minecart',rotation:0,footprint:{halfWidth:23,depth:16}},
 {id:'editor-highland-toolstand-0',kind:'highland-toolstand',x:1425,y:182,width:43,height:53,texture:'highland-toolstand',rotation:0,footprint:{halfWidth:17,depth:10}},
 {id:'editor-highland-orepile-0',kind:'highland-orepile',x:1100,y:350,width:45,height:30,texture:'highland-orepile',rotation:0,footprint:{halfWidth:19,depth:12}},
 {id:'editor-village-barrel-highland0',kind:'village-barrel',x:1115,y:195,width:28,height:38,texture:'village-prop-barrel',rotation:0,footprint:{halfWidth:11,depth:10}},
 {id:'editor-village-barrel-highland1',kind:'village-barrel',x:1145,y:215,width:26,height:35,texture:'village-prop-barrel',rotation:0,footprint:{halfWidth:10,depth:9}},
 {id:'editor-village-crates-highland0',kind:'village-crates',x:1400,y:205,width:36,height:46,texture:'village-prop-crates',rotation:0,footprint:{halfWidth:15,depth:12}},
 {id:'editor-village-woodpile-highland0',kind:'village-woodpile',x:1392,y:270,width:48,height:30,texture:'village-prop-woodpile',rotation:0,footprint:{halfWidth:21,depth:11}},
 {id:'editor-village-sacks-highland0',kind:'village-sacks',x:1100,y:242,width:32,height:32,texture:'village-prop-sacks',rotation:0,footprint:{halfWidth:13,depth:10}},
 ...[[1068,170],[1450,215],[1355,300]].map(([x,y],i):HighlandObject=>({id:`editor-fern-highland${i}`,kind:'fern',x,y,width:27,height:27,texture:'forest-detail-fern',rotation:0})),
 ...[[1170,268],[1420,328]].map(([x,y],i):HighlandObject=>({id:`editor-stone-highland${i}`,kind:'stone',x,y,width:24,height:19,texture:'asset-small-stones',rotation:0,footprint:{halfWidth:10,depth:7}})),
 // Trees sit in grassy pockets; the stair landing, paths and mine forecourt stay clear.
 ...[[160,160],[635,170],[1380,650],[145,650],[410,350],[190,570],[575,780],[1120,660],[1180,860],[1320,505],[1040,265]].map(([x,y],i):HighlandObject=>({
  id:`editor-standingTree-highland${i}`,kind:'standingTree',x,y,width:90,height:125,texture:`asset-tree-${i%3}`,rotation:0,
 })),
];
const layouts=new WeakMap<MapEditData,HighlandObject[]>();
export function highlandObjects(edits?:MapEditData):HighlandObject[]{
 if(!edits)return HIGHLAND_OBJECTS;const cached=layouts.get(edits);if(cached)return cached;
 const objects=HIGHLAND_OBJECTS.flatMap(o=>{const e=edits.objects[o.id];return e?.removed?[]:[{...o,...(e?{x:(e.x+.5)*32,y:(e.y+.5)*32}:{})}];});
 for(const[id,e]of Object.entries(edits.objects))if(!e.removed&&e.kind&&!HIGHLAND_OBJECTS.some(o=>o.id===id)){
  const template=HIGHLAND_OBJECTS.find(o=>o.kind===e.kind);if(template)objects.push({...template,id,x:(e.x+.5)*32,y:(e.y+.5)*32});
 }
 layouts.set(edits,objects);return objects;
}
/** The water renderer and swimming share the exact artwork shoreline. */
export function highlandWaterPoint(x:number,y:number,edits?:MapEditData):boolean{
 const terrain=edits?.terrain[`${Math.floor(x/32)},${Math.floor(y/32)}`];if(terrain)return terrain==='water';
 return riverContour.rows[Math.floor(y)]?.some(([left,right])=>x>=left&&x<right)??false;
}
export function highlandBridgePose(edits?:MapEditData){
 const o=highlandObjects(edits).find(o=>o.kind==='highland-bridge');if(!o)return undefined;
 const center=(HIGHLAND_ART.bridge.deckTop+HIGHLAND_ART.bridge.deckBottom)/2;
 return {left:o.x-o.width*.48,right:o.x+o.width*.48,y:o.y+(center-.5)*o.height,half:(HIGHLAND_ART.bridge.deckBottom-HIGHLAND_ART.bridge.deckTop)*o.height/2};
}
export function highlandDeck(x:number,y:number,edits?:MapEditData):boolean{
 const b=highlandBridgePose(edits);return !!b&&x>=b.left&&x<=b.right&&Math.abs(y-b.y)<b.half;
}
export function highlandStairsPoint(x:number,y:number):boolean{return x>=226&&x<=317&&y>=983&&y<1024;}
export function highlandAllowsStep(from:{x:number;y:number},to:{x:number;y:number},edits?:MapEditData):boolean{
 const a=highlandDeck(from.x,from.y,edits),b=highlandDeck(to.x,to.y,edits);if(a===b)return true;
 const deck=highlandBridgePose(edits);if(!deck)return false;
 const shore=a?to:from;if(highlandWaterPoint(shore.x,shore.y,edits))return false;
 return [deck.left,deck.right].some(x=>Math.abs(from.x-x)<12&&Math.abs(to.x-x)<12)&&Math.abs(to.y-from.y)<5;
}
/** One level, with solid outer rock rim and a narrow bank beside the channel. */
export function highlandLand(x:number,y:number):boolean{
 if(x<120||x>1440||y<128||y>1010)return false;
 const row=riverContour.rows[Math.floor(y)];if(!row?.length)return true;
 return x<row[0][0]-12||x>row[row.length-1][1]+12;
}
export function highlandMineApproach(edits?:MapEditData){
 const o=highlandObjects(edits).find(o=>o.kind==='highland-mine');return o?{x:o.x+(HIGHLAND_ART.mine.approachX-.5)*o.width,y:o.y+(HIGHLAND_ART.mine.approachY-.5)*o.height}:undefined;
}
export function highlandBlockedPoint(x:number,y:number,edits?:MapEditData,allowWater=false):boolean{
 if(x<16||y<16||x>1520||y>1008)return true;
 if(highlandDeck(x,y,edits))return false;
 const bridge=highlandBridgePose(edits);
 if(bridge&&x>bridge.left&&x<bridge.right&&Math.abs(y-bridge.y)<bridge.half+8)return true;
 if(highlandWaterPoint(x,y,edits))return !allowWater||y>990;
 if(!highlandLand(x,y))return true;
 const mine=highlandObjects(edits).find(o=>o.kind==='highland-mine');
 if(mine){const u=(x-mine.x)/mine.width+.5,v=(y-mine.y)/mine.height+.5;
  if(pointInPolygon(u,v,MINE_WALL))return true;
 }
 return highlandObjects(edits).some(o=>o.footprint?Math.abs(o.x-x)<o.footprint.halfWidth&&y>o.y-o.footprint.depth&&y<o.y+3:(o.kind==='standingTree'||o.kind==='pine')&&Math.abs(o.x-x)<12&&Math.abs(o.y-y)<8);
}
function highlandSafePosition(p:{x:number;y:number},edits?:MapEditData):boolean{
 return [[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!highlandBlockedPoint(p.x+dx,p.y+dy,edits));
}
export function highlandArrivalPosition(edits?:MapEditData){
 const requested=edits?.points?.entry,legacy=requested&&(requested.x===7&&[16,27,29].includes(requested.y)||requested.x===9&&requested.y===29);
 const entry=requested&&!legacy?requested:HIGHLAND_ENTRY,candidate={x:(entry.x+.5)*32,y:(entry.y+.5)*32,direction:'up' as const};
 return highlandSafePosition(candidate,edits)?candidate:{x:(HIGHLAND_ENTRY.x+.5)*32,y:(HIGHLAND_ENTRY.y+.5)*32,direction:'up' as const};
}
export function highlandResumePosition(p:SaveData['highlandPosition'],edits?:MapEditData){return p&&highlandSafePosition(p,edits)?p:highlandArrivalPosition(edits);}
