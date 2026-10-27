import {CHARACTER_DIRECTIONS,type CharacterDirection,directionFromVector} from '../character-directions';
import {BLACKSMITH_ROOM,BLACKSMITH_DOOR,BLACKSMITH_OUTSIDE} from '../data/blacksmith-interior';
import {villageBlockedAt,villageGround} from '../data/village';
import {VillageWalk} from './village-walk';
export interface BentoRoomNavigation{cellBlocked?:(x:number,y:number)=>boolean;isBlocked:(x:number,y:number)=>boolean;validPosition?:(x:number,y:number)=>boolean;entry?:{x:number;y:number};exit?:{x:number;y:number};width?:number;height?:number;tileSize?:number;stops?:readonly {x:number;y:number}[]}

export type BentoArea='village'|'blacksmith-home';
export interface BentoRoutineState {area:BentoArea;x:number;y:number;direction:CharacterDirection;stop:number;wait:number;doorway:boolean}
const STOPS=[
 {area:'village',x:63,y:31},{area:'village',x:49,y:41},{area:'village',x:35,y:34},
 {area:'village',x:57,y:32},
 {area:'blacksmith-home',x:5,y:7},{area:'blacksmith-home',x:3,y:4},
 {area:'blacksmith-home',x:8,y:4},{area:'blacksmith-home',x:6,y:8},
] as const;
export const createBentoRoutine=():BentoRoutineState=>({area:'village',x:57.5*32,y:33.5*32,direction:'down',stop:0,wait:8,doorway:false});
export function validBentoRoutine(value:unknown,room:BentoRoomNavigation=BLACKSMITH_ROOM):value is BentoRoutineState{
 if(!value||typeof value!=='object')return false;const v=value as BentoRoutineState;
 return Number.isInteger(v.stop)&&v.stop>=0&&v.stop<STOPS.length&&v.area===STOPS[v.stop].area
  &&Number.isFinite(v.x)&&Number.isFinite(v.y)&&CHARACTER_DIRECTIONS.includes(v.direction)
  &&Number.isFinite(v.wait)&&v.wait>=0&&v.wait<=60&&typeof v.doorway==='boolean'
  &&(!v.doorway||v.stop===3||v.stop===7)
  &&(v.area==='blacksmith-home'?(room.validPosition?room.validPosition(v.x,v.y):[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!room.isBlocked(Math.floor((v.x+dx)/32),Math.floor((v.y+dy)/32)))):v.x>=32&&v.x<=3040&&v.y>=32&&v.y<=2272);
}

/** Shares the village A* and authored six-frame walk; changing rooms transfers
 * one actor rather than creating an indoor duplicate. State uses game seconds. */
export class BentoRoutine {
 readonly state:BentoRoutineState;
 private walker?:VillageWalk;
 private distance=0;
 constructor(saved?:BentoRoutineState,private room:BentoRoomNavigation=BLACKSMITH_ROOM){this.state=structuredClone(validBentoRoutine(saved,room)?saved:createBentoRoutine());}
 setRoom(room:BentoRoomNavigation):void {this.room=room;this.walker=undefined;}
 private next():void {this.state.stop=(this.state.stop+1)%STOPS.length;this.state.wait=12;this.state.doorway=false;this.walker=undefined;}
 step(seconds:number,paused=false,outdoorBlocked=villageBlockedAt){
  const s=this.state;let phase=0;
  if(!paused&&Number.isFinite(seconds)&&seconds>0){
   seconds=Math.min(seconds,.1);
   if(s.wait>0)s.wait=Math.max(0,s.wait-seconds);
   else if(s.doorway){
    const goal=s.area==='village'?{x:BLACKSMITH_DOOR.x,y:1028}:(this.room.exit??{x:192,y:296});
    const dx=goal.x-s.x,dy=goal.y-s.y,d=Math.hypot(dx,dy),travel=Math.min(d,34*seconds);
    if(d>.01){s.x+=dx/d*travel;s.y+=dy/d*travel;s.direction=directionFromVector(dx,dy);this.distance+=travel;phase=1+Math.floor(this.distance/5.3)%6;}
    if(d<=travel+.01){
     const entering=s.area==='village';this.next();s.area=entering?'blacksmith-home':'village';
     Object.assign(s,entering?{...(this.room.entry??{x:192,y:296}),direction:'up'}:{...BLACKSMITH_OUTSIDE,direction:'down'});s.wait=0;
    }
   }else{
    let goal:{x:number;y:number}=s.area==='blacksmith-home'&&this.room.stops?this.room.stops[s.stop-4]:STOPS[s.stop];
    const blocked=s.area==='village'?outdoorBlocked:(x:number,y:number)=>this.room.isBlocked(x,y);
    if(s.area==='blacksmith-home'&&blocked(goal.x,goal.y)){
     const candidates=[];for(let y=2;y<=(this.room.height??10)-2;y++)for(let x=1;x<=(this.room.width??12)-2;x++)if(!blocked(x,y))candidates.push({x,y});
     candidates.sort((a,b)=>Math.hypot(a.x-goal.x,a.y-goal.y)-Math.hypot(b.x-goal.x,b.y-goal.y));goal=candidates[0]??goal;
    }
    this.walker??=new VillageWalk([goal],34,0,0,s.area==='blacksmith-home'?(this.room.tileSize??32):32);
    const result=this.walker.step(seconds,s,blocked,s.area==='village'?(x,y)=>['path','paving'].includes(villageGround(x,y))?1:2.4:()=>1);
    s.x=result.x;s.y=result.y;if(result.moving)s.direction=result.direction;phase=result.phase;
    if(result.arrived){if(s.stop===3||s.stop===7)s.doorway=true;else this.next();}
   }
  }
  return{...s,phase};
 }
}
