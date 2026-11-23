import type {ItemId} from '../types';
import {VILLAGE_LANDMARKS} from './village-landmarks';

/** Moradores novos das casinhas reformadas (preview.48). Por enquanto atendem pela placa na porta,
 * das 8h às 18h; personagem, retrato e interior entram quando a arte chegar
 * (docs/planejamento/PEDIDO-ARTE-OBRAS.md). */
export type NewResidentId='lucia'|'jonas';
export interface NewResident{id:NewResidentId;name:string;role:string;house:string;project:string;sign:string;greeting:string}
export const NEW_RESIDENTS:readonly NewResident[]=[
 {id:'lucia',name:'Lúcia',role:'Padeira',house:'casa-leste',project:'casa-leste',sign:'Padaria da Lúcia',greeting:'Pão quentinho saindo do forno! E pago bem pelo trigo, pelos ovos e pelo leite da sua fazenda.'},
 {id:'jonas',name:'Jonas',role:'Veterinário',house:'casa-sul',project:'casa-sul',sign:'Consultório do Jonas',greeting:'Bichos saudáveis rendem mais. Trouxe animais de raça de fora do Vale, se você tiver onde criar.'},
];
export const RESIDENT_HOURS={open:8*60,close:18*60} as const;
/** Ponto da porta (px), na frente da casinha. */
export function residentDoor(r:NewResident){const h=VILLAGE_LANDMARKS.find(l=>l.id===r.house)!;return{x:(h.x+.5)*32,y:(h.y+1)*32+6};}
/** Lúcia paga 30% a mais que as lojas por estes ingredientes. */
export const LUCIA_BUYS:readonly ItemId[]=['wheat','flour','egg','milk','duckEgg','butter'];
export const LUCIA_PREMIUM=1.3;
/** Pães e café da manhã da Lúcia (preço de compra). */
export const LUCIA_SELLS:Readonly<Partial<Record<ItemId,number>>>={homemadeBread:240,heartyBreakfast:400};
/** Animais de raça do Jonas. */
export const JONAS_BREEDS=[{kind:'chicken',name:'Galinha caipira',price:1500},{kind:'goat',name:'Cabra leiteira',price:5000},{kind:'cow',name:'Vaca leiteira',price:6000}] as const;
