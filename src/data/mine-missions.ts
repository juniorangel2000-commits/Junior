import type {ItemId,TilePoint} from '../types';
export const MINE_REQUESTS={repeatDays:4,interactionReach:56,visitReach:34,coinsCap:999999999}as const;
export const MINE_MISSION_IDS=['stone-supply','iron-supply','lost-tool','gallery-survey','abandoned-cart','forgotten-passage','mine-records']as const;
export type MineMissionId=typeof MINE_MISSION_IDS[number];
export interface MineMissionDefinition{
 id:MineMissionId;title:string;kind:'repeat'|'unique';description:string;hint:string;reward:number;
 delivery?:{item:ItemId;quantity:number};visits?:readonly TilePoint[];
 object?:{label:string;frame:number;sites:readonly TilePoint[]};
}
/** Initial request amounts/rewards. One repeat completion per four-day cycle, no rare-metal prizes. */
export const MINE_MISSIONS:readonly MineMissionDefinition[]=[
 {id:'stone-supply',title:'Pedra para a oficina',kind:'repeat',description:'Bento precisa repor pedras para pequenos reparos da ferraria.',hint:'Entregue aos poucos, se preferir. O que já chegou à oficina fica registrado.',reward:24,delivery:{item:'stone',quantity:12}},
 {id:'iron-supply',title:'Um pouco de ferro',kind:'repeat',description:'Alguns fragmentos de ferro vão ajudar Bento a cuidar das ferramentas do dia a dia.',hint:'Leve fragmentos de ferro para Bento. Minérios inteiros e lingotes permanecem com você.',reward:30,delivery:{item:'ironShard',quantity:6}},
 {id:'lost-tool',title:'A ferramenta esquecida',kind:'repeat',description:'Bento deixou um pequeno rolo de ferramentas em uma galeria. Ele gostaria de recuperá-lo.',hint:'Procure perto dos antigos carregamentos. O diário indica a região do pedido aceito.',reward:28,object:{label:'Ferramenta de Bento',frame:2,sites:[{x:58,y:165},{x:93,y:148},{x:92,y:129}]}},
 {id:'gallery-survey',title:'Reconhecer as galerias',kind:'repeat',description:'Observe duas antigas áreas de trabalho e conte a Bento como estão as passagens.',hint:'Visite a primeira câmara dos trilhos e a câmara seguinte, mais ao norte. Não é preciso estar acompanhado.',reward:35,visits:[{x:79,y:165},{x:94,y:148}]},
 {id:'abandoned-cart',title:'O carrinho abandonado',kind:'unique',description:'Um velho carrinho de mineração ainda guarda uma peça que pode contar um pouco da história do lugar.',hint:'Siga a galeria lateral a oeste da primeira câmara e examine o carrinho antigo.',reward:40,object:{label:'Eixo do carrinho antigo',frame:0,sites:[{x:55,y:165}]}},
 {id:'forgotten-passage',title:'A passagem esquecida',kind:'unique',description:'Um ramal termina diante de uma parede de pedra. Pode existir uma antiga área de trabalho do outro lado.',hint:'Na galeria secundária a oeste da câmara intermediária, siga o ramal até o fim. Abra a pedra com sua picareta e explore o que houver adiante.',reward:45,visits:[{x:18,y:89}]},
 {id:'mine-records',title:'Os registros da mina',kind:'unique',description:'Um caderno antigo pode revelar como eram os dias de trabalho nas galerias.',hint:'Examine a caixa abandonada junto à câmara intermediária dos trilhos.',reward:40,object:{label:'Caderno antigo da mina',frame:1,sites:[{x:93,y:130}]}},
];
export const mineMission=(id:MineMissionId)=>MINE_MISSIONS.find(q=>q.id===id)!;
export const mineRequestCycle=(day:number)=>Math.floor((day-1)/MINE_REQUESTS.repeatDays);
export const mineMissionWorld=(p:TilePoint):TilePoint=>({x:p.x*32+16,y:p.y*32+16});
export const mineMissionTarget=(id:MineMissionId)=>{const q=mineMission(id);return q.delivery?.quantity??q.visits?.length??1;};
export const mineMissionOrigin=(id:MineMissionId,cycle=0):TilePoint|undefined=>{const sites=mineMission(id).object?.sites;return sites?mineMissionWorld(sites[cycle%sites.length]):undefined;};
export const mineMissionObjectId=(id:MineMissionId,cycle=0)=>mineMission(id).kind==='unique'?`mine:${id}`:`mine:${id}:${cycle}`;
