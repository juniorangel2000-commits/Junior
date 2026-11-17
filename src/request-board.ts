import type {SaveData,ItemId} from './types';
import type {GameUI} from './ui';
import {ITEMS} from './data/items';
import {VILLAGE_NPCS} from './data/village';
import {ECONOMY_BALANCE as B} from './data/economy-balance';
import {fishingOrder,availableSpecimens} from './systems/fishing-progress';
import {fishSpecies} from './data/fishing-catches';
import {itemIconUrl} from './visual-assets';
import {gameAudio} from './audio';
import './request-board.css';
/** Quadro de pedidos (preview.41, pedido do Junior): os pedidos dos moradores ficam num quadro
 * na frente do centro comunitário, funcionando desde o começo. Cada pedido é um cartão com o
 * retrato do morador, o que ele pede, quanto você já tem, o prazo, a recompensa e o botão de
 * entregar. As entregas usam os mesmos serviços de antes (village-services.ts). */
/** Na frente do quadro com telhado (`avisos-comunitarios` em data/village-dressing.ts). */
export const BOARD_POINT={x:1741,y:612};
export const BOARD_SERVICE_IDS:readonly string[]=['contract-accept','contract-deliver','rare-fish-task','fishing-order',...B.contracts.map(c=>`request-${c.npc}`)];
export interface BoardAction{service:string;label:string;disabled?:boolean}
export interface BoardCard{id:string;npc:string;title:string;text:string;item?:ItemId;have?:number;need?:number;reward:string;due?:string;done:boolean;actions:BoardAction[];mine?:boolean}
const npcName=(id:string)=>VILLAGE_NPCS.find(n=>n.id===id)?.name??id;
const plural=(n:number,one:string,many:string)=>`${n} ${n===1?one:many}`;
/** Os pedidos do dia, montados a partir do estado da partida. */
export function boardRequests(save:SaveData):BoardCard[]{
 const day=save.day,inv=save.inventory,cards:BoardCard[]=[];
 // Rosa: contrato de colheita (aceitar e entregar aos poucos).
 const c=save.villageProgress?.contract,active=!!c&&!c.completed&&day<=c.dueDay;
 if(active)cards.push({id:'rosa-contract',npc:'rosa',title:'Contrato de colheita',text:'Entregue os nabos aos poucos; a recompensa sai ao completar.',item:'turnip',have:c!.delivered,need:10,reward:'220 C',
  due:c!.dueDay===day?'Último dia':`${plural(c!.dueDay-day+1,'dia','dias')} restantes`,done:false,actions:[{service:'contract-deliver',label:inv.turnip>0?`Entregar ${Math.min(inv.turnip,10-c!.delivered)} nabo${Math.min(inv.turnip,10-c!.delivered)===1?'':'s'}`:'Sem nabos na mochila',disabled:inv.turnip<1}]});
 else{const takenToday=!!c&&c.day>=day;cards.push({id:'rosa-contract',npc:'rosa',title:'Contrato de colheita',text:'A Rosa precisa de 10 nabos em até 3 dias. Um contrato por dia.',item:'turnip',have:Math.min(inv.turnip,10),need:10,reward:'220 C',
  done:!!c&&c.completed&&c.day===day,actions:takenToday?[]:[{service:'contract-accept',label:'Aceitar contrato'}]});}
 // Pedidos que se renovam: Tobias, Helena, Amélia e Bento.
 for(const spec of B.contracts){
  const cycle=Math.floor((day-1)/spec.interval),state=save.economy6?.contracts[spec.npc],done=state?.cycle===cycle&&!!state.completed;
  const renew=(cycle+1)*spec.interval+1-day,item=spec.item as ItemId,have=inv[item]??0;
  cards.push({id:`request-${spec.npc}`,npc:spec.npc,title:`${ITEMS[item].name} para ${npcName(spec.npc)}`,text:`${npcName(spec.npc)} precisa de ${spec.quantity} ${ITEMS[item].name.toLowerCase()}.`,item,have:Math.min(have,spec.quantity),need:spec.quantity,
   reward:`${spec.reward} C`,due:done?`Novo pedido em ${plural(renew,'dia','dias')}`:`Renova em ${plural(renew,'dia','dias')}`,done,actions:done?[]:[{service:`request-${spec.npc}`,label:have>=spec.quantity?'Entregar':'Faltam itens',disabled:have<spec.quantity}]});
 }
 // Damião: encomenda de pesca do dia e o primeiro peixe raro.
 const order=fishingOrder(day),species=fishSpecies(order.species),held=availableSpecimens(save).filter(f=>f.species===order.species).length,orderDone=save.fishingProgress?.orderDay===day;
 cards.push({id:'fishing-order',npc:'damiao',title:'Encomenda de pesca do dia',text:`${species.name}: capturas registradas no diário de pesca.`,have:Math.min(held,order.quantity),need:order.quantity,reward:`${order.reward} C`,due:'Hoje',done:orderDone,
  actions:orderDone?[]:[{service:'fishing-order',label:held>=order.quantity?'Entregar':'Faltam peixes',disabled:held<order.quantity}]});
 const rareDone=!!save.villageProgress?.rareFishTaskCompleted;
 cards.push({id:'rare-fish',npc:'damiao',title:'Primeiro peixe raro',text:'Damião estuda as espécies raras do lago. Uma única entrega.',item:'rareFish',have:Math.min(inv.rareFish??0,1),need:1,reward:'180 C',done:rareDone,
  actions:rareDone?[]:[{service:'rare-fish-task',label:(inv.rareFish??0)>0?'Entregar':'Falta o peixe raro',disabled:(inv.rareFish??0)<1}]});
 return cards;
}
/** Há algum pedido que dá para entregar agora? (o "!" sobre o quadro). */
export const boardHasReady=(save:SaveData)=>boardRequests(save).some(c=>!c.done&&c.actions.some(a=>!a.disabled&&a.service!=='contract-accept'));

export interface BoardOptions{get:()=>SaveData;perform:(service:string)=>{ok:boolean;message:string};portrait?:(npc:string)=>string|undefined;openMine?:()=>void}
export function showRequestBoard(ui:GameUI,o:BoardOptions):void{
 let tab:'open'|'done'='open';
 ui.showSceneEditor(host=>{
  const render=(message='',ok=true,flash?:{card:string;text:string})=>{
   const save=o.get(),cards=boardRequests(save),open=cards.filter(c=>!c.done),done=cards.filter(c=>c.done),shown=tab==='open'?open:done;
   host.innerHTML=`<section class="panel request-board" role="dialog" aria-modal="true" aria-label="Quadro de pedidos">
    <header class="modal-heading"><div><span class="eyebrow">CENTRO COMUNITÁRIO · VILA</span><h2>Quadro de pedidos</h2></div>
     <div class="rb-coins"><span>Coroas</span><strong>${save.villageEconomy?.coins??0}</strong></div><button class="icon-button" data-close aria-label="Fechar">×</button></header>
    <nav class="rb-tabs"><button data-tab="open" aria-pressed="${tab==='open'}">Abertos <b>${open.length}</b></button><button data-tab="done" aria-pressed="${tab==='done'}">Concluídos <b>${done.length}</b></button>
     ${o.openMine?'<button class="rb-mine" data-mine>⛏ Pedidos da mina do Bento</button>':''}</nav>
    <div class="rb-grid">${shown.map(card).join('')||`<p class="rb-empty">${tab==='open'?'Nenhum pedido aberto agora. Volte amanhã.':'Nenhum pedido concluído ainda.'}</p>`}</div>
    <p class="rb-feedback ${ok?'':'is-error'}" role="status"></p></section>`;
   host.querySelector('.rb-feedback')!.textContent=message;
   host.querySelector<HTMLButtonElement>('[data-close]')!.onclick=()=>ui.closeModal();
   host.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab as 'open'|'done';gameAudio.play('ui');render();});
   const mine=host.querySelector<HTMLButtonElement>('[data-mine]');if(mine)mine.onclick=()=>{ui.closeModal();o.openMine?.();};
   host.querySelectorAll<HTMLButtonElement>('[data-service]').forEach(b=>b.onclick=()=>{
    const before=o.get().villageEconomy?.coins??0,r=o.perform(b.dataset.service!),after=o.get().villageEconomy?.coins??0;
    if(r.ok)gameAudio.play(after>before?'pickup':'craft');
    render(r.message,r.ok,r.ok?{card:b.dataset.card!,text:after>before?`+${after-before} C`:'✓'}:undefined);
   });
   if(flash){const el=host.querySelector<HTMLElement>(`[data-card-id="${flash.card}"]`)??host.querySelector<HTMLElement>('.rb-grid');if(el){const f=document.createElement('span');f.className='rb-float';f.textContent=flash.text;el.append(f);}}
   host.querySelector<HTMLButtonElement>('[data-close]')!.focus();
  };
  const card=(c:BoardCard)=>{
   const img=o.portrait?.(c.npc),icon=c.item?itemIconUrl(c.item):undefined,pct=c.need?Math.round(100*Math.min(1,(c.have??0)/c.need)):0;
   return `<article class="rb-card ${c.done?'is-done':''} ${!c.done&&c.need&&(c.have??0)>=c.need?'is-ready':''}" data-card-id="${c.id}">
    <div class="rb-pin" aria-hidden="true"></div>
    <header><div class="rb-face">${img?`<img src="${img}" alt="">`:`<span>${npcName(c.npc)[0]}</span>`}</div><div><small>${npcName(c.npc)}</small><h3>${c.title}</h3></div></header>
    <p>${c.text}</p>
    ${c.need?`<div class="rb-progress">${icon?`<img src="${icon}" alt="">`:''}<div class="rb-bar"><i style="width:${pct}%"></i></div><b>${c.have??0}/${c.need}</b></div>`:''}
    <footer><span class="rb-reward">🪙 ${c.reward}</span>${c.due?`<span class="rb-due">${c.due}</span>`:''}</footer>
    ${c.done?'<div class="rb-stamp">Concluído</div>':c.actions.map(a=>`<button class="button button-light" data-service="${a.service}" data-card="${c.id}" ${a.disabled?'disabled':''}>${a.label}</button>`).join('')}
   </article>`;
  };
  render();return()=>{host.replaceChildren();};
 });
}
