import type { SaveData, ItemId } from './types';
import { ITEMS } from './data/items';
import { SHELTER_STEPS, SHELTER_SOURCES, PET_SHELTER_CAPACITY } from './systems/pet-shelter';

export function petShelterHTML(save: SaveData): string {
  const stage = save.petShelter?.stage ?? 0, next = SHELTER_STEPS[stage];
  const costs = next ? Object.entries(next.cost).map(([id, amount]) => `
    <li><strong>${ITEMS[id as ItemId].name}: ${save.inventory[id as ItemId]}/${amount}</strong>
      <small>${SHELTER_SOURCES[id as ItemId] ?? ''}</small></li>`).join('') : '';
  const affordable = !!next && save.inventory.hammer > 0
    && Object.entries(next.cost).every(([id, amount]) => save.inventory[id as ItemId] >= amount!);
  return `<section class="panel pet-menu pet-shelter-menu" role="dialog" aria-modal="true" aria-label="Casinha dos companheiros">
    <header class="modal-heading">
      <div><span class="eyebrow">UM LAR PARA ELES</span><h2>Casinha dos companheiros</h2></div>
      <button class="icon-button" data-shelter-close aria-label="Fechar casinha">×</button>
    </header>
    <p><strong>${stage} de 3 melhorias concluídas</strong> · ${save.dungeons?.pets.length ?? 0}/${PET_SHELTER_CAPACITY} companheiros</p>
    <ol>${SHELTER_STEPS.map((step, i) => `<li ${i < stage ? 'class="shelter-step-complete"' : ''}>${i < stage ? '✓ ' : ''}${step.name}</li>`).join('')}</ol>
    ${next ? `
      <h3>${next.name}</h3><p>${next.description}</p>
      <p>É necessário possuir um martelo; ele não será consumido.</p>
      <ul class="shelter-costs">${costs}</ul>
      <button class="button button-light" data-shelter-upgrade ${affordable ? '' : 'disabled'}>Concluir esta melhoria</button>
      <p class="pet-menu-note">A casinha precisa estar totalmente reparada para adquirir companheiros. Depois de pronta, comporta até três pets.</p>
    ` : `
      <p class="pet-menu-note">Abrigo pronto! Seus pets podem descansar, brincar e visitar os potes no quintal. Resgate companheiros nas dungeons enquanto houver vaga.</p>
      <button class="button button-light" data-shelter-pets>Gerenciar companheiros</button>
    `}
  </section>`;
}
