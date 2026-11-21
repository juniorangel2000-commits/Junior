import type {SaveData} from '../types';
import {Inventory} from './inventory';
/** Fogueiras montadas no chão (preview.42, pedido do Junior). Usar a fogueira portátil monta
 * ela acesa na frente do personagem, em qualquer cenário ao ar livre, e ela fica ali. Perto
 * dela, E abre o caderno da fogueira; o caderno tem o botão de recolher, que a devolve à mochila. */
export interface PlacedCampfire{space:string;x:number;y:number}
export const CAMPFIRE_SPACES=['property','forest','openFields','village','cityForest','fishingLake','highland','survivorCamp','swamp'] as const;
export const MAX_CAMPFIRES_PER_SPACE=3;
export const CAMPFIRE_REACH=44;
const fail=(message:string)=>({ok:false,message});

/** Onde a fogueira fica: um pouco à frente do personagem, como a fogueira passageira de antes. */
export function campfireSpot(p:{x:number;y:number;facing?:{x:number;y:number}}):{x:number;y:number}{
 const f=p.facing??{x:0,y:1};
 return{x:Math.round(p.x+Math.sign(f.x)*26),y:Math.round(p.y+(f.y>0?24:f.y<0?-14:6))};
}
export function campfiresIn(s:Pick<SaveData,'campfires'>,space:string):PlacedCampfire[]{return(s.campfires??[]).filter(c=>c.space===space);}
export function nearCampfire(s:Pick<SaveData,'campfires'>,space:string,p:{x:number;y:number}):PlacedCampfire|undefined{
 return campfiresIn(s,space).find(c=>Math.hypot(c.x-p.x,c.y-p.y)<=CAMPFIRE_REACH);
}
/** Monta a fogueira (gasta 1 da mochila). `blocked` diz se o ponto está ocupado (água, parede). */
export function placeCampfire(s:SaveData,space:string,p:{x:number;y:number;facing?:{x:number;y:number}},blocked:(x:number,y:number)=>boolean=()=>false):{ok:boolean;message:string}{
 if(!(CAMPFIRE_SPACES as readonly string[]).includes(space))return fail('Monte a fogueira ao ar livre.');
 if((s.inventory.campfire??0)<1)return fail('Você não tem uma fogueira portátil na mochila.');
 const spot=campfireSpot(p);
 if(blocked(spot.x,spot.y))return fail('Escolha um lugar livre, em terra firme, para a fogueira.');
 if(campfiresIn(s,space).some(c=>Math.hypot(c.x-spot.x,c.y-spot.y)<40))return fail('Já há uma fogueira aqui perto.');
 if(campfiresIn(s,space).length>=MAX_CAMPFIRES_PER_SPACE)return fail(`No máximo ${MAX_CAMPFIRES_PER_SPACE} fogueiras por lugar. Recolha uma antes.`);
 const inv=new Inventory(s.inventory);if(!inv.spend({campfire:1}))return fail('Você não tem uma fogueira portátil na mochila.');
 s.inventory=inv.data;(s.campfires??=[]).push({space,...spot});
 return{ok:true,message:'Fogueira montada. Perto dela, E abre o caderno para assar.'};
}
/** Recolhe a fogueira de volta para a mochila. */
export function pickUpCampfire(s:SaveData,fire:PlacedCampfire):{ok:boolean;message:string}{
 const i=(s.campfires??[]).findIndex(c=>c.space===fire.space&&c.x===fire.x&&c.y===fire.y);
 if(i<0)return fail('Esta fogueira já foi recolhida.');
 const inv=new Inventory(s.inventory);if(!inv.transact({},{campfire:1}))return fail('Libere espaço na mochila para recolher a fogueira.');
 s.inventory=inv.data;s.campfires!.splice(i,1);if(!s.campfires!.length)delete s.campfires;
 return{ok:true,message:'Fogueira recolhida para a mochila.'};
}
export function validCampfires(v:unknown):boolean{
 if(v===undefined)return true;
 if(!Array.isArray(v)||v.length>CAMPFIRE_SPACES.length*MAX_CAMPFIRES_PER_SPACE)return false;
 return v.every(c=>!!c&&typeof c==='object'&&Object.keys(c).every(k=>['space','x','y'].includes(k))&&(CAMPFIRE_SPACES as readonly string[]).includes((c as PlacedCampfire).space)
  &&Number.isSafeInteger((c as PlacedCampfire).x)&&Number.isSafeInteger((c as PlacedCampfire).y)&&Math.abs((c as PlacedCampfire).x)<1e6&&Math.abs((c as PlacedCampfire).y)<1e6);
}
