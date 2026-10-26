import {Home,validateHome,HOME_INTERIOR_DOORWAY,HOME_SPAWN,type HomeData,type FurnitureKind} from '../systems/home';
import type {Doorway} from '../systems/map-transition';

export const BLACKSMITH_COUNTER={x:6,y:5,length:4} as const;
export function blacksmithCounterPart(index:number,length:number):'left'|'middle'|'right'{
 if(!Number.isInteger(index)||!Number.isInteger(length)||length<2||index<0||index>=length)throw new RangeError('O balcão precisa de pelo menos duas peças válidas.');
 return index===0?'left':index===length-1?'right':'middle';
}

/** Shop fixtures reuse existing furniture footprints and collision. Their
 * authored visuals are chosen by ID, without adding residential furniture. */
const legacyInterior:HomeData={floor:'stone',wall:'cream',furniture:[
 {id:'home-plant-1',kind:'plant',x:2,y:3}, // Armor stand.
 {id:'home-shelf-2',kind:'shelf',x:8,y:2},
 {id:'home-shelf-3',kind:'shelf',x:2,y:5}, // Workbench.
 {id:'home-chair-5',kind:'chair',x:8,y:7}, // Anvil.
 {id:'home-shelf-6',kind:'shelf',x:8,y:8}, // Stock pallet.
 {id:'home-chair-7',kind:'chair',x:2,y:7}, // Grindstone.
 {id:'home-table-8',kind:'table',x:4,y:2}, // Weapons/shield display.
 {id:'home-plant-9',kind:'plant',x:4,y:7}, // Bellows.
 {id:'home-plant-14',kind:'plant',x:10,y:6}, // Coal scuttle.
 {id:'home-table-15',kind:'table',x:6,y:2}, // Stone fireplace against the rear wall.
 ...Array.from({length:BLACKSMITH_COUNTER.length},(_,i)=>({id:`home-chair-${10+i}`,kind:'chair' as const,x:BLACKSMITH_COUNTER.x+i,y:BLACKSMITH_COUNTER.y})),
]};
const fixtureKinds:Record<string,FurnitureKind>={'home-plant-1':'armorStand','home-shelf-2':'partsShelf','home-shelf-3':'smithWorkbench','home-chair-5':'anvil','home-shelf-6':'ironStock','home-chair-7':'grindstone','home-table-8':'weaponRack','home-plant-9':'bellows','home-plant-14':'coalBin','home-table-15':'fireplace'};
export const BLACKSMITH_CATALOG:readonly FurnitureKind[]=['counter','smithWorkbench','armorStand','partsShelf','anvil','ironStock','grindstone','weaponRack','bellows','coalBin','fireplace','toolRack','tongs'];
export const BLACKSMITH_INTERIOR:HomeData={floor:legacyInterior.floor,wall:legacyInterior.wall,furniture:[
 ...legacyInterior.furniture.map(p=>{const kind=fixtureKinds[p.id]??'counter',number=p.id.split('-').at(-1);return{...p,kind,id:`home-${kind}-${number}`};}),
 {id:'home-toolRack-16',kind:'toolRack',x:3,y:0},
 {id:'home-tongs-17',kind:'tongs',x:2,y:5},
]};
export function validateBlacksmithHome(value:unknown):value is HomeData{return validateHome(value,false)&&(value as HomeData).furniture.every(p=>BLACKSMITH_CATALOG.includes(p.kind));}
export const BLACKSMITH_ROOM=new Home(BLACKSMITH_INTERIOR,false);
export const BLACKSMITH_DOOR:Doorway={x:57.5*32,y:1030,halfWidth:16,depth:12,direction:'up'};
export const BLACKSMITH_OUTSIDE={x:BLACKSMITH_DOOR.x,y:1052};
export const BLACKSMITH_INSIDE={...HOME_SPAWN,x:192};
export const BLACKSMITH_ROOM_EXIT=HOME_INTERIOR_DOORWAY;
const previousRoom=new Home({floor:'stone',wall:'cream',furniture:[
 {id:'home-plant-1',kind:'plant',x:2,y:3},{id:'home-shelf-2',kind:'shelf',x:8,y:2},
 {id:'home-shelf-3',kind:'shelf',x:2,y:6},{id:'home-shelf-4',kind:'shelf',x:7,y:5},{id:'home-chair-5',kind:'chair',x:8,y:7},
]},false);
const previousRoom2=new Home({...legacyInterior,furniture:legacyInterior.furniture.filter(p=>p.id!=='home-table-15')},false);
function fits(room:Home,x:number,y:number):boolean{
 return Number.isFinite(x)&&Number.isFinite(y)&&[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!room.isBlocked(Math.floor((x+dx)/32),Math.floor((y+dy)/32)));
}
export const blacksmithRoomPosition=(x:number,y:number,room:Home=BLACKSMITH_ROOM)=>fits(room,x,y);
export const previousBlacksmithPosition=(x:number,y:number,revision?:number)=>fits(revision===2?previousRoom2:previousRoom,x,y);
