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
      <img src="${escape(view.icons[pet.species] ?? "")}" alt="">
      <span><strong>${PETS[pet.species].name} · Companheiro ${index + 1}${pet.rare ? " ★" : ""}</strong><small>${status}</small></span>
    </button>`;
    })
    .join("");
  return `<section class="panel pet-menu" role="dialog" aria-modal="true" aria-label="Companheiros">
    <header class="modal-heading">
      <div><span class="eyebrow">AO SEU LADO</span><h2>Companheiros</h2></div>
      <button class="icon-button" data-pet-close aria-label="Fechar companheiros">×</button>
    </header>
    <p>Escolha um pet para acompanhar você nos mapas, um companheiro por vez. Use os comandos para seguir, esperar ou voltar para perto.</p>
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
