import type {ItemId,SaveData} from '../types';
import type {SocialNpc} from '../data/npc-social';
import type {GameClock} from './clock';
import {NPC_SOCIAL,SOCIAL_NPCS} from '../data/npc-social';
import {ITEM_NAMES} from '../data/items';
import {CROP_CATALOG} from '../data/crop-catalog';
import {DISH_IDS} from '../data/kitchen';
import {calendarDate,SEASON_NAMES,SEASONS} from './calendar';
import {Inventory} from './inventory';
import {commitSocial,ensureNpcSocial,type SocialRuntime} from './npc-social';
import type {SocialResult} from './npc-gifts';

/** Festivais da vila (preview.47): um por estação, num dia fixo. As lojas fecham, os moradores se
 * juntam na praça (ou na praia, no verão) e o anfitrião recebe a entrega do concurso, uma vez por ano. */
export interface Festival{
 id:string;name:string;seasonIndex:number;dayOfSeason:number;start:number;end:number;
 place:'village'|'coast';host:SocialNpc;
 /** Concurso: entregar `amount` de qualquer um dos itens da lista. */
 contest:{name:string;options:readonly ItemId[];amount:number};
 reward:{coins:number;items?:Partial<Record<ItemId,number>>;affinityAll?:number};
 intro:string;lines:readonly string[];thanks:string;
}
const H=(h:number)=>h*60;
/** Concurso da colheita: só o que se colhe no outono (o que sobrou do verão não vale). */
const crops=[...new Set(CROP_CATALOG.filter(c=>(c.seasons as readonly string[]).includes('autumn')).map(c=>c.harvest))] as ItemId[];
export const FESTIVALS:readonly Festival[]=[
 {id:'seed-fair',name:'Feira das Sementes',seasonIndex:0,dayOfSeason:14,start:H(10),end:H(18),place:'village',host:'rosa',
  contest:{name:'Concurso de flores',options:['daisy','blueIris'] as ItemId[],amount:3},
  reward:{coins:200,items:{fertilizer:10}},
  intro:'Hoje é a Feira das Sementes! Tem barraca na praça até as 18:00.',
  lines:['A feira é o dia mais bonito da primavera. Todo mundo traz alguma coisa para trocar.','Traga três flores para o concurso: margaridas da sua horta ou íris azuis do Pântano.'],
  thanks:'Que flor linda! O júri ficou encantado. O prêmio é seu.'},
 {id:'beach-party',name:'Festa da Praia',seasonIndex:1,dayOfSeason:14,start:H(15),end:H(21),place:'coast',host:'damiao',
  contest:{name:'Concurso do caranguejo',options:['crab'] as ItemId[],amount:3},
  reward:{coins:300,items:{bait:10,fish:3}},
  intro:'Hoje é a Festa da Praia! A vila inteira vai à Costa das Marés, das 15:00 às 21:00.',
  lines:['Na Festa da Praia a vila inteira desce para a costa. Tem fogueira até a noite.','O concurso é de caranguejo: quem trouxer três primeiro ganha. A rede ajuda muito!'],
  thanks:'Três caranguejos! Você ganhou o concurso. Vamos assar na fogueira?'},
 {id:'harvest-festival',name:'Festa da Colheita',seasonIndex:2,dayOfSeason:21,start:H(10),end:H(19),place:'village',host:'augusto',
  contest:{name:'Concurso da colheita',options:crops,amount:5},
  reward:{coins:400,items:{homemadeBread:2}},
  intro:'Hoje é a Festa da Colheita! Banquete na praça até as 19:00.',
  lines:['A Festa da Colheita agradece a terra por mais um ano. A Helena preparou um banquete.','Traga cinco da colheita de outono para o concurso: abóbora, batata-doce, trigo… o júri olha o cuidado.'],
  thanks:'Que colheita caprichada! O júri não teve dúvida. Parabéns!'},
 {id:'lantern-night',name:'Noite das Lanternas',seasonIndex:3,dayOfSeason:21,start:H(17),end:H(23),place:'village',host:'helena',
  contest:{name:'Troca de presentes',options:[...DISH_IDS] as ItemId[],amount:1},
  reward:{coins:150,items:{cloth:2,candle:2},affinityAll:1},
  intro:'Hoje é a Noite das Lanternas! Lanternas acesas na praça das 17:00 às 23:00.',
  lines:['Na Noite das Lanternas a gente lembra de quem se foi e agradece por quem ficou.','É costume trocar presentes: traga um prato feito por você e receba um de volta.'],
  thanks:'Que presente gostoso! Tome, este é seu. E todo mundo da vila mandou um abraço.'},
];
export function festivalOn(day:number):Festival|undefined{
 const c=calendarDate(day);return FESTIVALS.find(f=>f.seasonIndex===c.seasonIndex&&f.dayOfSeason===c.dayOfSeason);
}
export function festivalNow(clock:GameClock):Festival|undefined{
 const f=festivalOn(clock.day);return f&&clock.time>=f.start&&clock.time<f.end?f:undefined;
}
const clockText=(t:number)=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
export const festivalHours=(f:Festival)=>`${clockText(f.start)}–${clockText(f.end)}`;
export const festivalDate=(f:Festival)=>`${SEASON_NAMES[SEASONS[f.seasonIndex]]} ${f.dayOfSeason}`;
/** O morador está na festa (fora da loja) agora. */
export const atFestival=(id:string,clock:GameClock)=>!!festivalNow(clock)&&(SOCIAL_NPCS as readonly string[]).includes(id);
/** Próximo festival a partir de hoje (inclusive), para a dica no calendário. */
export function nextFestival(day:number):{festival:Festival;inDays:number}{
 for(let d=0;d<112;d++){const f=festivalOn(day+d);if(f)return{festival:f,inDays:d};}
 return{festival:FESTIVALS[0],inDays:0};
}
const year=(day:number)=>calendarDate(day).year;
export const festivalContestDone=(s:Pick<SaveData,'day'|'festivalDone'>,f:Festival)=>s.festivalDone?.[f.id]===year(s.day);
/** Qual item da lista o jogador tem em quantidade suficiente (o primeiro). */
export function contestItem(s:Pick<SaveData,'inventory'>,f:Festival):ItemId|undefined{
 return f.contest.options.find(id=>((s.inventory as Record<string,number>)[id]??0)>=f.contest.amount);
}
export function enterFestivalContest(runtime:SocialRuntime,f:Festival):SocialResult{
 const draft=structuredClone(runtime.snapshot());
 if(festivalNow(draft)!==f)return{ok:false,message:'O festival já terminou.'};
 if(festivalContestDone(draft,f))return{ok:false,message:`Você já participou do ${f.contest.name.toLowerCase()} este ano.`};
 const item=contestItem(draft,f);
 if(!item)return{ok:false,message:`Para o ${f.contest.name.toLowerCase()}, traga ${f.contest.amount} de: ${f.contest.options.slice(0,6).map(i=>ITEM_NAMES[i]).join(', ')}${f.contest.options.length>6?'…':''}.`};
 const inv=new Inventory(draft.inventory);
 if(!inv.transact({[item]:f.contest.amount},f.reward.items??{}))return{ok:false,message:'Libere espaço na mochila para o prêmio.'};
 draft.inventory=inv.data;
 if(draft.villageEconomy)draft.villageEconomy={...draft.villageEconomy,coins:draft.villageEconomy.coins+f.reward.coins};
 draft.festivalDone={...draft.festivalDone,[f.id]:year(draft.day)};
 const social=ensureNpcSocial(draft);
 const raise=(id:string,n:number)=>{const p=social.players[id as SocialNpc]??={affinity:0};p.affinity=Math.min(NPC_SOCIAL.max,p.affinity+n);};
 raise(f.host,2);if(f.reward.affinityAll)for(const id of SOCIAL_NPCS)raise(id,f.reward.affinityAll);
 if(!commitSocial(runtime,draft,true))return{ok:false,message:'Não foi possível salvar. Nada foi entregue.'};
 const prize=[`${f.reward.coins} coroas`,...Object.entries(f.reward.items??{}).map(([i,n])=>`${n} × ${ITEM_NAMES[i as ItemId]}`)].join(', ');
 return{ok:true,message:`${f.contest.name}: você entregou ${f.contest.amount} × ${ITEM_NAMES[item]} e ganhou ${prize}.`,lines:[f.thanks]};
}
export function validFestivalDone(v:unknown):boolean{
 if(v===undefined)return true;
 if(!v||typeof v!=='object'||Array.isArray(v))return false;
 return Object.entries(v).every(([id,y])=>FESTIVALS.some(f=>f.id===id)&&Number.isSafeInteger(y)&&(y as number)>=1&&(y as number)<=99_999);
}
