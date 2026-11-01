import type { SaveData, ItemId } from './types';
import { ITEMS } from './data/items';
import { SHELTER_STEPS, SHELTER_SOURCES, PET_SHELTER_CAPACITY, shelterRemainingCost } from './systems/pet-shelter';

export function petShelterHTML(save: SaveData): string {
  const shelter = save.petShelter, stage = shelter?.stage ?? 0, next = SHELTER_STEPS[stage];
  const remaining = shelter ? shelterRemainingCost(shelter) : {};
  const hammer = save.inventory.hammer > 0;
  const affordable = !!shelter && !!next && hammer
    && Object.entries(remaining).every(([id, amount]) => save.inventory[id as ItemId] >= amount!);
  const missing = Object.entries(remaining).filter(([id, amount]) => save.inventory[id as ItemId] < amount!);
  const costs = next ? Object.entries(next.cost).map(([id, amount]) => {
    const item = id as ItemId, delivered = shelter?.delivered?.[item] ?? 0;
    const owned = save.inventory[item], available = Math.min(owned, amount! - delivered);
    return `<li class="shelter-material ${delivered === amount ? 'is-delivered' : ''}">
      <div class="shelter-material-info"><strong>${ITEMS[item].name}</strong>
        <span>Entregue: <b>${delivered}/${amount}</b> · Na mochila: <b>${owned}</b></span>
        <progress value="${delivered}" max="${amount}" aria-label="${ITEMS[item].name}: ${delivered} de ${amount} entregues"></progress>
      </div>
      <div class="shelter-delivery">
        <label for="shelter-quantity-${id}">Quantidade</label>
        <input id="shelter-quantity-${id}" type="number" min="1" max="${Math.max(1, available)}" step="1" value="${Math.max(1, available)}" ${available ? '' : 'disabled'}>
        <button class="button" data-shelter-deliver="${id}" aria-label="Entregar ${ITEMS[item].name}" ${available ? '' : 'disabled'}>${delivered === amount ? 'Entregue ✓' : 'Entregar'}</button>
      </div>
      <details><summary>Onde conseguir</summary><small>${SHELTER_SOURCES[item] ?? ''}</small></details>
    </li>`;
  }).join('') : '';
  return `<section class="panel pet-menu pet-shelter-menu" role="dialog" aria-modal="true" aria-label="Casinha dos companheiros">
    <header class="modal-heading">
      <div><span class="eyebrow">UM LAR PARA ELES</span><h2>Casinha dos companheiros</h2></div>
      <button class="icon-button" data-shelter-close aria-label="Fechar casinha">×</button>
    </header>
    <p><strong>${stage} de 3 melhorias concluídas</strong> · ${save.dungeons?.pets.length ?? 0}/${PET_SHELTER_CAPACITY} companheiros</p>
    <ol class="shelter-stages">${SHELTER_STEPS.map((step, i) => `<li ${i < stage ? 'class="shelter-step-complete"' : i === stage ? 'aria-current="step"' : ''}>${i < stage ? '✓ ' : ''}${step.name}</li>`).join('')}</ol>
    ${next ? `
      <h3>${next.name}</h3><p>${next.description}</p>
      <p class="pet-menu-note">Entregue cada material aos poucos. As entregas ficam salvas mesmo ao fechar esta tela.</p>
      <ul class="shelter-costs">${costs}</ul>
      <p class="shelter-tool ${hammer ? 'is-ready' : ''}"><strong>${hammer ? '✓ Martelo disponível' : 'Falta o martelo'}</strong><br>
        ${hammer ? 'Usado para concluir a etapa; não será consumido.' : 'Você pode entregar materiais agora. Para concluir, traga um martelo — ele não será consumido.'}</p>
      <p class="shelter-feedback" data-shelter-feedback role="status"></p>
      <button class="button button-light" data-shelter-upgrade ${affordable ? '' : 'disabled'}>Concluir esta melhoria</button>
      <p class="pet-menu-note">${missing.length ? `Ainda faltam: ${missing.map(([id, amount]) => `${amount! - save.inventory[id as ItemId]} × ${ITEMS[id as ItemId].name}`).join(', ')}.` : 'Os materiais desta etapa estão disponíveis.'}
        Ao concluir, os materiais restantes serão retirados da mochila. Companheiros são liberados após as três etapas.</p>
    ` : `
      <p class="shelter-feedback" data-shelter-feedback role="status"></p>
      <p class="pet-menu-note">Abrigo pronto! Seus pets podem descansar, brincar e visitar os potes no quintal. Resgate companheiros nas dungeons enquanto houver vaga.</p>
      <button class="button button-light" data-shelter-pets>Gerenciar companheiros</button>
    `}
  </section>`;
}
