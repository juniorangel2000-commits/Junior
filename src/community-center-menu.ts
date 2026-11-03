import type {SaveData,ItemId} from './types';
import type {GameUI} from './ui';
import {ITEMS} from './data/items';
import {SHELTER_SOURCES} from './systems/pet-shelter';
import {COMMUNITY_STEPS,communityStage,communityRemaining,type CommunityAction} from './systems/community-center';
export function showCommunityRepair(ui:GameUI,get:()=>SaveData,act:(action:CommunityAction)=>{ok:boolean;message:string},enter:()=>void):void{
 ui.showSceneEditor(host=>{
  const render=(message='')=>{
   const save=get(),stage=communityStage(save),step=COMMUNITY_STEPS[stage],remaining=communityRemaining(save);
   host.innerHTML=`<section class="panel pet-menu pet-shelter-menu community-menu" role="dialog" aria-modal="true" aria-label="Reforma do centro comunitário">
    <header class="modal-heading"><div><span class="eyebrow">UM LAR PARA RECOMEÇAR</span><h2>Centro comunitário</h2></div><button class="icon-button" data-close aria-label="Fechar">×</button></header>
    <p>Um abrigo seguro para oito sobreviventes. <strong>${stage} de 3 etapas concluídas.</strong></p>
    <ol class="shelter-stages">${COMMUNITY_STEPS.map((s,i)=>`<li ${i<stage?'class="shelter-step-complete"':i===stage?'aria-current="step"':''}>${i<stage?'✓ ':''}${s.name}</li>`).join('')}</ol>
    ${step?`<h3>${step.name}</h3><p>${step.description}</p><p class="pet-menu-note">Entregue os materiais separadamente, na quantidade que puder. Cada entrega fica salva.</p>
    <ul class="shelter-costs">${Object.entries(step.cost).map(([id,total])=>{
     const item=id as ItemId,delivered=save.communityCenter?.delivered?.[item]??0,available=Math.min(save.inventory[item],remaining[item]!);
     return `<li class="shelter-material ${delivered===total?'is-delivered':''}"><div class="shelter-material-info"><strong>${ITEMS[item].name}</strong><span>Entregue: <b>${delivered}/${total}</b> · Na mochila: <b>${save.inventory[item]}</b></span><progress value="${delivered}" max="${total}" aria-label="${ITEMS[item].name}"></progress></div><div class="shelter-delivery"><label for="community-${id}">Quantidade</label><input id="community-${id}" type="number" min="1" max="${Math.max(1,available)}" value="${Math.max(1,available)}" step="1" ${available?'':'disabled'}><button class="button" data-deliver="${id}" ${available?'':'disabled'}>${delivered===total?'Entregue ✓':'Entregar'}</button></div><details><summary>Onde conseguir</summary><small>${SHELTER_SOURCES[item]??''}</small></details></li>`;
    }).join('')}</ul><p class="shelter-tool">${save.inventory.hammer?'✓ Martelo disponível — não será consumido.':'Traga um martelo para concluir a etapa. Você já pode entregar materiais.'}</p>`:'<p class="pet-menu-note">A casa está pronta para receber moradores. As pegadas ao norte da Floresta Antiga levam ao acampamento. Converse com os visitantes pacíficos para recrutá-los.</p>'}
    <p class="shelter-feedback" role="status"></p>
    ${step?`<button class="button button-light" data-upgrade ${save.inventory.hammer>0&&Object.entries(remaining).every(([id,n])=>save.inventory[id as ItemId]>=n!)?'':'disabled'}>Concluir esta etapa</button><p class="pet-menu-note">Ao concluir, os materiais que faltarem serão retirados da mochila. O interior e o acampamento abrem após a última etapa.</p>`:'<button class="button button-light" data-enter>Entrar no centro comunitário</button>'}
   </section>`;
   host.querySelector<HTMLElement>('[role="status"]')!.textContent=message;
   host.querySelector<HTMLButtonElement>('[data-close]')!.onclick=()=>ui.closeModal();
   host.querySelectorAll<HTMLButtonElement>('[data-deliver]').forEach(b=>b.onclick=()=>{const item=b.dataset.deliver as ItemId,n=Number(host.querySelector<HTMLInputElement>(`#community-${item}`)!.value);run({kind:'deliver',item,amount:n});});
   const upgrade=host.querySelector<HTMLButtonElement>('[data-upgrade]');if(upgrade)upgrade.onclick=()=>run({kind:'upgrade'});
   const go=host.querySelector<HTMLButtonElement>('[data-enter]');if(go)go.onclick=()=>{ui.closeModal();enter();};
   host.querySelector<HTMLButtonElement>('[data-close]')!.focus();
  };
  const run=(action:CommunityAction)=>{const result=act(action);render(result.message);};
  render();return()=>{host.replaceChildren();};
 });
}
