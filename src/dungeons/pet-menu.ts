import { petBonusDescription } from "./pet-passives";
import "./pet-menu.css";
import type { OwnedPet } from "./progression";
import { PETS } from "./config";
import { worldPetLocation } from "./world-pet-state";
export type PetCommand =
  { kind: "select"; id?: string } | { kind: "follow" | "stay" | "recall" };
export interface PetMenuView {
  pets: OwnedPet[];
  selected?: string;
  nearby: boolean;
  icons: Record<string, string>;
}
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function petMenuHTML(view: PetMenuView): string {
  const selected = view.pets.find((p) => p.id === view.selected);
  const cards = view.pets
    .map((pet, index) => {
      const status =
        pet.world?.mode === "stay"
          ? `Esperando · ${escape(worldPetLocation(pet.world))}`
          : pet.id === view.selected
            ? "Acompanhando você"
            : "Disponível";
      return `<button class="pet-menu-card" data-pet-select="${escape(pet.id)}" aria-pressed="${pet.id === view.selected}">
      <img src="${escape(view.icons[`${pet.species}${pet.rare ? "-rare" : ""}`] ?? "")}" alt="">
      <span><strong>${PETS[pet.species].name}${pet.rare ? " ✦" : ""} · Companheiro ${index + 1}</strong><small>${status}</small><small>Nas dungeons: ${petBonusDescription(pet)}</small></span>
    </button>`;
    })
    .join("");
  return `<section class="panel pet-menu" role="dialog" aria-modal="true" aria-label="Companheiros">
    <header class="modal-heading">
      <div><span class="eyebrow">AO SEU LADO</span><h2>Companheiros</h2></div>
      <button class="icon-button" data-pet-close aria-label="Fechar companheiros">×</button>
    </header>
    <p>Escolha um pet para acompanhar você nos mapas, um companheiro por vez. Use os comandos para seguir, esperar ou voltar para perto.</p>
    <button class="button button-light" data-pet-collection>Ver coleção de pets</button>
    ${
      view.pets.length
        ? `<div class="pet-menu-list">${cards}</div>`
        : `<p class="pet-menu-empty">
      Você ainda não resgatou um pet. Nas dungeons, siga o alerta de pet encontrado e aproxime-se para resgatar.
      Ele entra na coleção ao encerrar a expedição.
    </p>`
    }
    ${
      selected
        ? `<div class="pet-menu-commands" aria-label="Comandos do companheiro">
      <button class="button button-light" data-pet-command="follow" aria-pressed="${selected.world?.mode === "follow"}">Seguir</button>
      <button class="button button-light" data-pet-command="stay" aria-pressed="${selected.world?.mode === "stay"}" ${!view.nearby ? "disabled" : ""}>Esperar aqui</button>
      <button class="button button-light" data-pet-command="recall">Chamar para perto</button>
    </div>
    <p class="pet-menu-note">Ao esperar, o pet fica nesse mapa até você voltar ou chamar. Nas dungeons, o companheiro escolhido luta automaticamente.</p>
    <button class="button button-light" data-pet-select="">Ficar sem companheiro</button>`
        : ""
    }
  </section>`;
}

export function petCollectionHTML(view: PetMenuView): string {
  const entries = (["dog", "cat"] as const).flatMap((species) =>
    [false, true].map((rare) => {
      const owned = view.pets.filter(
        (p) => p.species === species && p.rare === rare,
      );
      return { species, rare, owned };
    }),
  );
  const unlocked = entries.filter((entry) => entry.owned.length).length;
  return `<section class="panel pet-menu pet-collection" role="dialog" aria-modal="true" aria-label="Coleção de pets">
    <header class="modal-heading"><div><span class="eyebrow">SEUS COMPANHEIROS</span><h2 tabindex="-1">Coleção de pets</h2></div><button class="icon-button" data-pet-close aria-label="Fechar companheiros">×</button></header>
    <p>${unlocked} de ${entries.length} variações desbloqueadas. Resgate animais nas dungeons e encerre a expedição para adicioná-los à coleção.</p>
    <p class="pet-menu-note"><span class="pet-sparkle" aria-label="Variante especial">✦</span> indica uma variante especial, com cores diferentes e bônus adicionais.</p>
    <div class="pet-collection-grid">${entries
      .map((p) => {
        const key = `${p.species}${p.rare ? "-rare" : ""}`;
        return `<article class="pet-collection-card ${p.owned.length ? "unlocked" : "locked"}" data-pet-entry="${key}" data-unlocked="${!!p.owned.length}">
        <img src="${escape(view.icons[key] ?? "")}" alt="${PETS[p.species].name}">
        <h3>${PETS[p.species].name}${p.rare ? ' <span class="pet-sparkle" aria-label="Variante especial">✦</span>' : ""}</h3>
        <strong>${p.owned.length ? `Desbloqueado · ${p.owned.length} na coleção` : "Não desbloqueado"}</strong>
        <p>Bônus nas dungeons: ${petBonusDescription(p)}</p>
        ${p.owned.length ? `<button class="button button-light" data-pet-select="${escape(p.owned[0].id)}">${view.selected && p.owned.some((pet) => pet.id === view.selected) ? "Em uso" : "Usar companheiro"}</button>` : "<small>Encontre e resgate esta variação.</small>"}
      </article>`;
      })
      .join("")}</div>
    <button class="button button-light" data-pet-collection-back>Voltar aos companheiros</button>
  </section>`;
}
