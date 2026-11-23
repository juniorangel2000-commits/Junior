import type {SaveData} from '../types';
import {WILD_GROUPS,WILD_SPOTS,TILE_SPOTS,type WildArea,type WildSpot} from '../data/wild-animals';
import type {AnimalKind} from '../data/ancient-forest';

export interface WildSpawn{id:string;kind:AnimalKind;x:number;y:number}
/** Sorteio sem estado: o mesmo dia e cenário dão sempre o mesmo resultado (recarregar não muda),
 * mas cada manhã é diferente. */
function rng(seed:number){let s=seed>>>0||1;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
const AREA_SEED:Record<WildArea,number>={forest:7919,openFields:104729,swamp:15485863,coast:32452843,orchard:49979687,ruins:67867967,railway:86028121};
/** Quem não entra no sorteio: já é do jogador ou está na corda agora. */
export function wildTaken(s:Pick<SaveData,'recruitedAnimals'|'animalEscort'>):Set<string>{
 return new Set([...(s.recruitedAnimals??[]),...(s.animalEscort?[s.animalEscort.id]:[])]);
}
/** Animais soltos de um cenário no dia. Posição em px do mapa (centro do bloco no Bosque). */
export function wildSpawns(area:WildArea|string,day:number,taken:ReadonlySet<string>):WildSpawn[]{
 if(!(area in WILD_GROUPS))return[];
 const r=rng(Math.imul(Math.max(1,Math.floor(day)),2654435761)^AREA_SEED[area as WildArea]);for(let i=0;i<3;i++)r();
 const pools=new Map<WildSpot,number[][]>();
 const take=(kind:WildSpot)=>{
  let list=pools.get(kind);if(!list){list=WILD_SPOTS[kind].map(p=>[...p]);for(let i=list.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[list[i],list[j]]=[list[j],list[i]];}pools.set(kind,list);}
  return list.shift();
 };
 const out:WildSpawn[]=[];
 for(const g of WILD_GROUPS[area as WildArea]){
  const free=g.ids.filter(id=>!taken.has(id));
  // Também embaralha quem aparece, para não ser sempre o primeiro da lista.
  for(let i=free.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[free[i],free[j]]=[free[j],free[i]];}
  const n=Math.min(free.length,g.min+Math.floor(r()*(g.max-g.min+1)));
  for(const id of free.slice(0,n)){const p=take(g.spots);if(!p)break;
   const [x,y]=TILE_SPOTS.includes(g.spots)?[p[0]*32+16,p[1]*32+16]:p;out.push({id,kind:g.kind,x,y});}
 }
 return out;
}
