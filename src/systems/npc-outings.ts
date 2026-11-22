import type {ItemId,SaveData} from '../types';
import type {SocialNpc} from '../data/npc-social';
import type {GameClock} from './clock';
import type {CharacterDirection} from '../character-directions';
import {NPC_SOCIAL,SOCIAL_NPCS} from '../data/npc-social';
import {festivalNow} from './festivals';
import {directionFromVector} from '../character-directions';
import {ITEM_NAMES} from '../data/items';
import {AREA_NAMES} from '../data/area-names';
import {calendarDate} from './calendar';
import {restDay,rainyDay} from '../data/village-schedule';
import {Inventory} from './inventory';
import {commitSocial,ensureNpcSocial,type SocialRuntime} from './npc-social';
import type {SocialResult} from './npc-gifts';

/** Cenários fora da vila que os moradores visitam para trabalhar. */
export type OutingArea='orchard'|'swamp'|'ruins'|'railway'|'coast'|'openFields';
export interface NpcOuting{
 readonly id:SocialNpc;readonly area:OutingArea;
 /** Dias da semana (dia da estação % 7), sempre fora da folga do morador. */
 readonly weekdays:readonly number[];
 readonly start:number;readonly end:number;
 /** Onde fica trabalhando (pixels do cenário) e para onde olha. */
 readonly spot:{readonly x:number;readonly y:number};readonly facing:CharacterDirection;
 /** O que está fazendo, para a placa da loja e o rótulo em cima da cabeça. */
 readonly activity:string;
 readonly lines:readonly string[];
 readonly gift:{readonly items:Partial<Record<ItemId,number>>;readonly line:string};
 /** Presença num festival (sem presente; o concurso fica com o anfitrião). */
 readonly festival?:string;
}
const H=(h:number,m=0)=>h*60+m;
/** Saem de manhã, antes do almoço; o Damião só à tarde, porque de manhã pesca no lago. */
export const NPC_OUTINGS:readonly NpcOuting[]=[
 {id:'rosa',area:'orchard',weekdays:[2,5],start:H(9),end:H(11,30),spot:{x:1328,y:1616},facing:'up',activity:'Colhendo frutas',
  lines:['Estas árvores ficaram anos sem ninguém, e mesmo assim continuam dando fruta. A terra daqui é generosa.','Venho no começo da semana e no fim. O que eu colho vira muda e semente para a loja.','Se achar fruta caída, pode levar. Eu compro na vila, se quiser vender.'],
  gift:{items:{apple:2,pear:1},line:'Separei umas frutas das melhores árvores. Leve, estão docinhas.'}},
 {id:'amelia',area:'swamp',weekdays:[1,4],start:H(9),end:H(11,30),spot:{x:416,y:1312},facing:'left',activity:'Colhendo ervas',
  lines:['O pântano assusta quem não conhece. Para mim é a melhor farmácia do vale.','Cuidado com os jacarés da lagoa. Eles não incomodam quem passa longe da água.','Dizem que uma íris azul cresce por aqui. Minha avó falava dela. Ainda vou encontrá-la.'],
  gift:{items:{rareHerb:2},line:'Achei estas ervas na beira da lagoa. Guarde, são difíceis de encontrar.'}},
 {id:'nilo',area:'ruins',weekdays:[2,6],start:H(9),end:H(11,30),spot:{x:384,y:496},facing:'up',activity:'Estudando as ruínas',
  lines:['Cada pedra daqui tem uma história. Este era o posto de pedágio da estrada antiga.','Ainda não entendi tudo o que o selo de bronze quer dizer. As ruínas guardam mais pistas.','Se achar alguma peça curiosa no caminho, traga para a loja. Pago bem por antiguidades.'],
  gift:{items:{goldShard:1},line:'Encontrei isto entre os escombros. Fica com você, de lembrança.'}},
 {id:'icaro',area:'railway',weekdays:[1,3],start:H(9),end:H(11,30),spot:{x:47*32,y:36*32+16},facing:'down',activity:'Consertando os trilhos',
  lines:['Os trilhos ainda estão inteiros! Com algumas peças, dava para fazer uma vagoneta andar de novo.','O relógio da sala de espera parou na mesma hora em que a última composição saiu.','Venho medir, desenhar e sonhar um pouco. Um dia esta linha volta a funcionar.'],
  gift:{items:{spring:2,gear:1},line:'Sobraram peças do conserto. Para mim são sucata, para você podem ser úteis.'}},
 {id:'damiao',area:'coast',weekdays:[2,5],start:H(14),end:H(17),spot:{x:1600,y:1600},facing:'right',activity:'Pescando na enseada',
  lines:['De manhã é o lago; à tarde, às vezes, venho sentir o vento do mar.','Na foz, a água doce encontra a salgada. Os peixes gostam dessa mistura.','Este barco é velho, mas ainda flutua. Quem sabe um dia a gente sai para o largo.'],
  gift:{items:{fish:2},line:'Pesquei mais do que preciso hoje. Leve dois, frescos.'}},
 {id:'celina',area:'coast',weekdays:[3,6],start:H(9),end:H(11,30),spot:{x:1472,y:1760},facing:'down',activity:'Pintando a praia',
  lines:['A luz da praia muda a cada minuto. Venho pintar antes que o sol fique alto.','Recolho conchas para enfeitar as peças do ateliê. Cada uma tem uma cor diferente.','Sente o cheiro de sal? Na vila a gente esquece que o mar fica tão perto.'],
  gift:{items:{cloth:2},line:'Trouxe uns retalhos tingidos com as cores do mar. Ficaram lindos.'}},
 {id:'tobias',area:'openFields',weekdays:[1,4],start:H(9),end:H(11,30),spot:{x:1720,y:790},facing:'up',activity:'Escolhendo madeira',
  lines:['Os ipês daqui dão a melhor madeira do vale. Mas só corto o que a árvore pode dar.','Cada tábua da carpintaria começa num passeio desses. Gosto de escolher a madeira com calma.','Se você derrubar um ipê com machadinha de ferro, a madeira nobre vale ouro na oficina.'],
  gift:{items:{plank:4},line:'Aparei estas tábuas aqui mesmo. Leve para as suas construções.'}},
];
const weekday=(day:number)=>calendarDate(day).dayOfSeason%7;
/** A saída de hoje do morador, se houver: dia certo, fora da folga e sem chuva. */
export function outingToday(id:string,day:number):NpcOuting|undefined{
 if(rainyDay(day))return;
 const o=NPC_OUTINGS.find(n=>n.id===id&&n.weekdays.includes(weekday(day)));
 return o&&!restDay(o.id as never,day)?o:undefined;
}
/** Lugares em volta da fogueira da Festa da Praia (areia da Costa). */
export const BEACH_FIRE={x:1500,y:1640};
const BEACH_RING:readonly [number,number][]=[[110,0],[89,47],[34,76],[-34,76],[-89,47],[-110,0],[-89,-47],[-34,-76],[34,-76],[89,-47]];
function festivalOuting(id:string,clock:GameClock):NpcOuting|undefined{
 const f=festivalNow(clock);if(!f||f.place!=='coast')return;
 const i=(SOCIAL_NPCS as readonly string[]).indexOf(id);if(i<0)return;
 const [dx,dy]=BEACH_RING[i%BEACH_RING.length],spot={x:BEACH_FIRE.x+dx,y:BEACH_FIRE.y+dy};
 return{id:id as SocialNpc,area:'coast',weekdays:[],start:f.start,end:f.end,spot,facing:directionFromVector(-dx,-dy),activity:f.name,
  lines:f.lines,gift:{items:{},line:''},festival:f.id};
}
/** O morador está agora fora da vila, num dos cenários. */
export function onOuting(id:string,clock:GameClock):NpcOuting|undefined{
 const fest=festivalNow(clock);if(fest)return festivalOuting(id,clock);
 const o=outingToday(id,clock.day);
 return o&&clock.time>=o.start&&clock.time<o.end?o:undefined;
}
export const outingsAt=(area:string,clock:GameClock)=>{
 const fest=festivalNow(clock);
 if(fest)return (SOCIAL_NPCS as readonly string[]).map(id=>onOuting(id,clock)).filter((o):o is NpcOuting=>!!o&&o.area===area);
 return NPC_OUTINGS.filter(o=>o.area===area&&onOuting(o.id,clock)===o);
};
const clockText=(t:number)=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
/** Aviso na loja e na janela do morador. */
export const outingMessage=(o:NpcOuting)=>`${o.activity} · ${AREA_NAMES[o.area]} · volta às ${clockText(o.end)}`;

export const outingGiftReceived=(s:Pick<SaveData,'day'|'npcOutingGifts'>,id:string)=>s.npcOutingGifts?.[id]===s.day;
/** Falas no cenário: o presente do dia (se ainda não recebido) e uma fala sobre o lugar. */
export function outingDialogue(s:SaveData,o:NpcOuting):string[]{
 if(o.festival)return[o.lines[s.day%o.lines.length]];
 const talk=o.lines[s.day%o.lines.length];
 return outingGiftReceived(s,o.id)?[talk]:[o.gift.line,talk];
}
/** Presente da saída: uma vez por dia e por morador, itens na mochila e +1 de amizade. */
export function receiveOutingGift(runtime:SocialRuntime,id:SocialNpc):SocialResult{
 const draft=structuredClone(runtime.snapshot()),o=onOuting(id,draft);
 if(!o||o.festival||draft.activeArea!==o.area)return{ok:false,message:'Já voltou para a vila.'};
 if(outingGiftReceived(draft,id))return{ok:false,message:'Você já recebeu o presente de hoje.'};
 const inv=new Inventory(draft.inventory);
 if(!inv.transact({},o.gift.items))return{ok:false,message:'Libere espaço na mochila para receber o presente.'};
 draft.inventory=inv.data;draft.npcOutingGifts={...draft.npcOutingGifts,[id]:draft.day};
 const p=ensureNpcSocial(draft).players[id]??={affinity:0};p.affinity=Math.min(NPC_SOCIAL.max,p.affinity+1);
 if(!commitSocial(runtime,draft,true))return{ok:false,message:'Não foi possível salvar. O presente foi devolvido.'};
 const names=Object.entries(o.gift.items).map(([item,n])=>`${n} × ${ITEM_NAMES[item as ItemId]}`).join(', ');
 return{ok:true,message:`Recebido: ${names}.`,lines:[o.gift.line]};
}
export function validOutingGifts(v:unknown):boolean{
 if(v===undefined)return true;
 if(!v||typeof v!=='object'||Array.isArray(v))return false;
 return Object.entries(v).every(([id,day])=>NPC_OUTINGS.some(o=>o.id===id)&&Number.isSafeInteger(day)&&(day as number)>=1&&(day as number)<=999_999);
}
