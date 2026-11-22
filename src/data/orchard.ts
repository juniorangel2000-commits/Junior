import {ORCHARD_GATE_Y,orchardGate} from './orchard-gate';
import {orchardArt,type OrchardFruit} from './orchard-art';
import type {RuinLandmark} from './ruins-story';
import {natureArt} from './nature-catalog';
import {paintedWaterPoint} from './terrain-paint';
import {lakeDistance} from './water-contours';
import {TILE,WORLD_HEIGHT,WORLD_WIDTH} from './world-size';
import {editorObjectKind,type EditorObjectKind,type MapEditData} from '../systems/map-editor';

type Point={x:number;y:number};
type ObjectPlacement=Point & {id:string;kind:EditorObjectKind;variant?:number;scale?:number;generated?:true};
type Route=readonly (readonly [number,number])[];
export const ORCHARD_SIZE={width:WORLD_WIDTH*TILE,height:WORLD_HEIGHT*TILE};
export const ORCHARD_PRESS={x:41,y:47};
export const ORCHARD_SHED={x:68,y:47};
export const ORCHARD_POND={x:67,y:19,rx:9.5,ry:6.5};
export const ORCHARD_REGROW_DAYS=3;
export const ORCHARD_TRAILS:readonly Route[]=[
  [[-1,ORCHARD_GATE_Y+.5],[7,ORCHARD_GATE_Y+.5],[14,56],[21,54],[27,52],[34,50],[42,49.8],[50,49],[56,47],[61,49],[68,50]],
  [[34,50],[30,45],[28,37],[28,29],[31,23],[34,17]],
  [[42,49.8],[48,44],[47,38],[49,30],[48,24],[51,17],[56,16]],
  [[49,30],[56,32],[63,31],[68,28],[73,28],[79,25]],
  [[61,49],[61,54],[58,60],[50,64],[42,62],[37,58],[34,50]],
  [[68,50],[74,46],[77,40],[78,34],[79,25]],
];
const segments=ORCHARD_TRAILS.flatMap(path=>path.slice(1).map(([endX,endY],i)=>{
  const [x,y]=path[i],dx=endX-x,dy=endY-y;
  return{x,y,dx,dy,lengthSquared:dx*dx+dy*dy};
}));
const clamp=(value:number)=>Math.max(0,Math.min(1,value));
export function orchardTrailDistance(x:number,y:number):number {
  let min=Infinity;
  for(const s of segments){
    const dx=x-s.x,dy=y-s.y,t=clamp((dx*s.dx+dy*s.dy)/s.lengthSquared);
    min=Math.min(min,(dx-t*s.dx)**2+(dy-t*s.dy)**2);
  }
  return Math.sqrt(min);
}
export const orchardPondDistance=(x:number,y:number)=>lakeDistance(x,y,ORCHARD_POND.x,ORCHARD_POND.y,ORCHARD_POND.rx,ORCHARD_POND.ry,2.2);
export const orchardBaseWater=(x:number,y:number)=>orchardPondDistance(x/TILE,y/TILE)<0;
function seed(x:number,y:number):number {
  let h=Math.imul(x+171,73856093)^Math.imul(y+731,19349663);
  h=Math.imul(h^(h>>>16),0x45d9f3b);
  return ((h^(h>>>16))>>>0)/4294967296;
}
const key=(x:number,y:number)=>`${x},${y}`;
const rows:ObjectPlacement[]=[];
const used=new Set<string>();
function place(kind:EditorObjectKind,x:number,y:number,detail:Partial<Pick<ObjectPlacement,'variant'|'scale'|'generated'>>={}):void {
  const p=key(x,y);
  if(used.has(p))return;
  rows.push({id:`${kind}-${x}-${y}`,kind,x,y,...detail});
  used.add(p);
}
place('orchard-press',ORCHARD_PRESS.x,ORCHARD_PRESS.y);
place('orchard-shed',ORCHARD_SHED.x,ORCHARD_SHED.y);
for(const [x,y] of [[38,48],[46,48],[65,47],[70,48],[73,46],[44,17]] as const)place('orchard-crates',x,y);
for(const [x,y] of [[33,20],[37,20],[41,20],[36,30],[40,30],[56,39],[60,39],[64,39],[28,55],[32,55],[72,54],[76,54],[80,55],[56,14],[60,14]] as const){
  if(orchardTrailDistance(x+.5,y+.5)>2&&orchardPondDistance(x+.5,y+.5)>1)place('orchard-wall',x,y);
}
for(let y=24;y<=60;y+=6)for(let x=32;x<=75;x+=6){
  const variation=seed(x,y),tx=x+Math.round((variation-.45)*2),ty=y+(variation>.73?1:0);
  if(variation<.12||orchardTrailDistance(tx+.5,ty+.5)<2||orchardPondDistance(tx+.5,ty+.5)<1.1||
    Math.hypot(tx-ORCHARD_PRESS.x,ty-ORCHARD_PRESS.y)<5||Math.hypot(tx-ORCHARD_SHED.x,ty-ORCHARD_SHED.y)<5||
    rows.some(o=>Math.hypot(o.x-tx,o.y-ty)<2.4))continue;
  const kind=variation>.86?'orchard-dry-tree':(['orchard-apple','orchard-pear','orchard-orange'] as const)[(x+y+Math.floor(variation*29))%3];
  place(kind,tx,ty,{scale:.93+variation*.18});
}
for(let row=2;row<WORLD_HEIGHT-1;row+=3)for(let col=2;col<WORLD_WIDTH-1;col+=3){
  const x=Math.min(WORLD_WIDTH-2,col+Math.floor(seed(row,col)*3));
  const y=Math.min(WORLD_HEIGHT-2,row+Math.floor(seed(col,row)*3));
  const s=seed(x,y),edge=Math.min(x,y,WORLD_WIDTH-1-x,WORLD_HEIGHT-1-y);
  const inRows=x>=28&&x<=79&&y>=17&&y<=64;
  if(orchardGate(x,y)||orchardTrailDistance(x+.5,y+.5)<2.8||orchardPondDistance(x+.5,y+.5)<1.9||rows.some(o=>Math.hypot(o.x-x,o.y-y)<2.3))continue;
  if(!inRows&&(s>.22||edge<5))place(s>.73?'pine':'standingTree',x,y,{variant:Math.floor(s*31)%3,scale:.81+s*.19,generated:true});
  else if(s>.95)place('mossBoulder',x,y,{generated:true});
}
for(let y=2;y<WORLD_HEIGHT-1;y++)for(let x=2;x<WORLD_WIDTH-1;x++){
  const s=seed(x+300,y+793),coverage=.24+.14*Math.sin(x*.41+y*.2)+.07*Math.cos(y*.62-x*.47);
  if(s>coverage||orchardGate(x,y)||orchardTrailDistance(x+.5,y+.5)<1.4||orchardPondDistance(x+.5,y+.5)<.5)continue;
  const pick=seed(x-50,y+205);
  place(pick>.91?'whiteFlowers':pick>.78?'fern':pick>.69?'bush':pick>.47?'tallGrassA':pick>.24?'tallGrassB':'tallGrassC',x,y,{scale:.75+pick*.38,generated:true});
}
for(const [x,y] of [[56,17],[73,13],[75,24],[61,25],[59,16]] as const){
  if(orchardBaseWater((x+.5)*TILE,(y+.5)*TILE))place('shoreStones',x,y);
}

export const ORCHARD_OBJECTS:readonly ObjectPlacement[]=rows;
const original=new Map(ORCHARD_OBJECTS.map(o=>[o.id,o]));
const landmarkText={
  'orchard-shed':{name:'Galpão de colheita',text:'Um risco na parede marca onde ficavam os caixotes separados para a feira da Vila.'},
  'orchard-press':{name:'Prensa de frutas',text:'O parafuso de ferro emperrou. Embaixo do cesto ainda dá para ver o canal que recolhia o suco.'},
};
type LandmarkKey=keyof typeof landmarkText;
const pivot=(p:Point)=>({x:(p.x+.5)*TILE,y:(p.y+.5)*TILE});
export const orchardFruitReady=(last:number|undefined,day:number)=>last===undefined||day-last>=ORCHARD_REGROW_DAYS;

export function createOrchardLayout(edits?:MapEditData){
  const objects:ObjectPlacement[]=[];
  const cells=new Set<string>();
  const add=(object:ObjectPlacement)=>{
    if(orchardGate(object.x,object.y))return;
    objects.push(object);
    cells.add(key(object.x,object.y));
  };
  for(const [id,edit] of Object.entries(edits?.objects??{})){
    const kind=editorObjectKind(id);
    if(kind&&!edit.removed)add({...original.get(id),id,kind,x:edit.x,y:edit.y});
  }
  for(const o of ORCHARD_OBJECTS){
    const cell=key(o.x,o.y),terrain=edits?.terrain[cell];
    if(edits?.objects[o.id]||cells.has(cell)||o.generated&&terrain&&!['grass','forest','meadow','moss'].includes(terrain))continue;
    add(o);
  }
  const colliders=objects.flatMap(object=>{
    const art=orchardArt(object.kind),p=pivot(object),scale=object.scale??1;
    const solid=natureArt(object.kind)?.solid||object.kind==='standingTree'||object.kind==='pine';
    const bounds=art?.bases??(solid?[[-13,13,-10,5] as const]:[]);
    return bounds.map(([l,r,t,b])=>({l:p.x+l*scale,r:p.x+r*scale,t:p.y+t*scale,b:p.y+b*scale}));
  });
  const water=(x:number,y:number)=>!orchardGate(Math.floor(x/TILE),Math.floor(y/TILE))&&paintedWaterPoint(edits?.terrain,x,y,orchardBaseWater);
  const blocked=(x:number,y:number)=>{
    if(x<TILE||y<TILE||x>=ORCHARD_SIZE.width-TILE||y>=ORCHARD_SIZE.height-TILE)return true;
    const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
    if(orchardGate(tx,ty))return false;
    const edit=edits?.collisions?.[key(tx,ty)];
    return edit?edit==='blocked':colliders.some(b=>x>b.l&&x<b.r&&y>b.t&&y<b.b);
  };
  const fruit=objects.flatMap(o=>{
    const item=orchardArt(o.kind)?.fruit;
    if(!item)return [];
    const {x,y}=pivot(o),at={x:x+20,y:y+18};
    return !blocked(at.x,at.y)&&!water(at.x,at.y)?[{...at,id:o.id,item}]:[];
  });
  const landmarks=objects.flatMap(o=>Object.hasOwn(landmarkText,o.kind)?[{...pivot(o),text:landmarkText[o.kind as LandmarkKey]}]:[]);
  return {
    objects,pivot,fruit,water,inWater:water,blocked,allowsStep:(_from:Point,to:Point)=>!blocked(to.x,to.y),
    inspectNear(x:number,y:number):RuinLandmark|undefined{
      return landmarks.find(p=>Math.hypot(x-p.x,y-p.y)<66)?.text;
    },
  };
}
export type OrchardFruitSpot=Point & {id:string;item:OrchardFruit};

export function validOrchardHarvest(value:Record<string,unknown>,day:number):boolean{
  const entries=Object.entries(value);
  if(entries.length>WORLD_WIDTH*WORLD_HEIGHT)return false;
  return entries.every(([id,when])=>{
    // Um objeto criado no F2 pode ser apagado após a coleta. O histórico desse ID segue válido.
    const kind=original.get(id)?.kind??(id.startsWith('editor-')?editorObjectKind(id):undefined);
    return !!orchardArt(kind??undefined)?.fruit&&typeof when==='number'&&Number.isSafeInteger(when)&&when>=1&&when<=day;
  });
}
