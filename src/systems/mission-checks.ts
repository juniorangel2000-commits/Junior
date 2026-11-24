import type {ItemId,SaveData} from '../types';
import {domesticAnimal} from '../data/domestic-animals';
import {SOCIAL_NPCS} from '../data/npc-social';
import {isDish} from '../data/kitchen';
import {projectDone} from './projects';

/** Registro das missões (preview.49). Guarda só o que o save não guarda sozinho: cenários
 * visitados, itens que já passaram pela mochila, itens já tidos em qualidade excelente, o maior
 * saldo de coroas e se já montou no cavalo. Tudo só cresce, então juntar dois registros é seguro. */
export interface MissionLog{areas:string[];seen:string[];excellent:string[];peak:number;rode?:true;done:string[];achievements:Record<string,number>;
 /** Ações que o save não guarda: serviços usados (`service:<id>`), viagem de trem, pesca com o farol… */
 events?:string[]}
export const newMissionLog=():MissionLog=>({areas:[],seen:[],excellent:[],peak:0,done:[],achievements:{}});

export interface MissionContext{
 s:SaveData;log:MissionLog;
 has(item:ItemId):boolean;seen(item:string):boolean;seenAny(...items:string[]):boolean;excellent(item:string):boolean;area(id:string):boolean;
 count(value:number,goal:number):readonly [number,number];
 met():number;learned(id:string):boolean;dishes():number;dishesMade():number;species():number;speciesHas(id:string):boolean;
 animals():number;housed(kind:string):number;site(kind:string):boolean;machine(kind:string):boolean;bonds(min:number):number;
 friends(min:number):number;stories(parts:number):number;festival(id:string):boolean;project(id:string):boolean;
 tier(tool:string,min:number):boolean;mineQuests():number;installs(kind:'pump'|'lamp'|'forge'):number;pets():number;dungeon(id:string):number;
 dungeonAttributes():number;petAttributes():number;petSpecies():number;rarePet():boolean;
 ev(id:string):boolean;evPrefix(prefix:string):boolean;campResidents():number;
}
export function missionContext(s:SaveData,log:MissionLog):MissionContext{
 const seen=new Set(log.seen),excellent=new Set(log.excellent),areas=new Set(log.areas),recipes=s.villageProgress?.recipes??[];
 const sites=(s.farmConstruction?.sites??[]).filter(x=>x.finished);
 return{s,log,
  has:i=>(s.inventory[i]??0)>0,seen:i=>seen.has(i),seenAny:(...i)=>i.some(x=>seen.has(x)),excellent:i=>excellent.has(i),area:a=>areas.has(a),
  count:(v,g)=>[Math.min(v,g),g] as const,
  met:()=>(s.villageEconomy?.met??[]).filter(n=>(SOCIAL_NPCS as readonly string[]).includes(n)).length,
  learned:id=>recipes.includes(id),
  dishes:()=>recipes.filter(r=>isDish(r as ItemId)).length,
  dishesMade:()=>log.seen.filter(i=>isDish(i as ItemId)).length,
  species:()=>Object.keys(s.fishingProgress?.records??{}).length,
  speciesHas:id=>Object.hasOwn(s.fishingProgress?.records??{},id),
  animals:()=>(s.recruitedAnimals??[]).filter(id=>domesticAnimal(id)?.kind!=='horse').length,
  housed:k=>sites.reduce((n,x)=>n+x.animals.filter(id=>domesticAnimal(id)?.kind===k).length,0),
  site:k=>sites.some(x=>x.kind===k),
  machine:k=>(s.machines?.items??[]).some(x=>x.kind===k),
  bonds:min=>Object.values(s.animalCare?.animals??{}).filter(a=>(a.bond??0)>=min).length,
  friends:min=>Object.values(s.npcSocial?.players??{}).filter(p=>(p?.affinity??0)>=min).length,
  stories:parts=>Object.values(s.npcStories??{}).filter(p=>(p??0)>=parts).length,
  festival:id=>s.festivalDone?.[id]!==undefined,
  project:id=>projectDone(s,id),
  tier:(tool,min)=>((s.economy6?.tools as Record<string,{tier?:number}>|undefined)?.[tool]?.tier??0)>=min,
  mineQuests:()=>Object.values(s.mineMissions?.quests??{}).filter(q=>q.completedDay!==undefined||q.status==='completed').length,
  installs:k=>(s.villageInstallations??[]).filter(x=>x.kind===k).length,
  pets:()=>s.dungeons?.pets.length??0,
  dungeon:id=>(s.dungeons?.completed as Record<string,number>|undefined)?.[id]??0,
  dungeonAttributes:()=>Object.values(s.dungeons?.attributes??{}).reduce((n,v)=>n+(v??0),0),
  petAttributes:()=>Math.max(0,...(s.dungeons?.pets??[]).map(p=>Object.values(p.attributes).reduce((n,v)=>n+v,0))),
  petSpecies:()=>new Set((s.dungeons?.pets??[]).map(p=>p.species)).size,
  rarePet:()=>(s.dungeons?.pets??[]).some(p=>p.rare),
  ev:id=>(log.events??[]).includes(id),
  campResidents:()=>s.survivorCamp?.residents?.length??0,
  evPrefix:p=>(log.events??[]).some(e=>e.startsWith(p)),
 };
}
/** Registra uma ação para as missões (ex.: `service:inn-rest`, `train`). Junta-se ao registro no próximo save. */
export function markMissionEvent(s:SaveData,id:string):void{const log=s.missions??=newMissionLog();const ev=log.events??=[];if(!ev.includes(id)&&ev.length<500)ev.push(id);}
