import { petBonusDescription } from "./pet-passives";
import { petRescueMarker } from "./pet-rescue-marker";
import { permanentEvolutionHTML } from "./permanent-ui";
import { dungeonHUD } from "./hud";
import { WEAPON_EVOLUTIONS, type WeaponIcons } from "./weapon-identity";
import { UPGRADES } from "./upgrades";
import type { UpgradeCard } from "./upgrades";
import { ITEM_NAMES } from "../data/items";
import type { ItemId } from "../types";
import type { DungeonId } from "./config";
import { DUNGEONS, WEAPONS, PETS } from "./config";
import {
  type DungeonProgress,
  type Attribute,
  type PetAttribute,
} from "./progression";
import type { DungeonRun } from "./run";
import "./ui.css";
const rarityNames = {
  common: "Comum",
  rare: "Rara",
  "super-rare": "Super-rara",
  legendary: "Lendária",
  arsenal: "Arsenal",
};
const labels: Record<string, string> = {
  strength: "Força",
  resistance: "Resistência",
  agility: "Agilidade",
  vitality: "Vitalidade",
  precision: "Precisão",
  survival: "Sobrevivência",
  speed: "Velocidade",
  perception: "Percepção",
  protection: "Proteção",
  efficiency: "Eficiência",
};
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
interface Callbacks {
  start: (id: DungeonId, pet?: string) => void;
  back: () => void;
  choose: (id: string) => void;
  resume: () => void;
  abandon: () => void;
  evolve: (key: Attribute, pet?: string, petKey?: PetAttribute) => void;
  pet: (id?: string) => void;
  retry: () => void;
}
export class DungeonUI {
  private readonly root = document.createElement("div");
  private readonly hud = document.createElement("div");
  private readonly panel = document.createElement("div");
  private lastHUD = "";
  private readonly rescueMarker = document.createElement("div");
  constructor(
    private readonly callbacks: Callbacks,
    private readonly icons: WeaponIcons,
  ) {
    this.root.id = "dungeon-ui";
    this.hud.className = "dungeon-hud";
    this.panel.className = "dungeon-overlay";
    this.rescueMarker.className = "dungeon-rescue-marker";
    this.rescueMarker.hidden = true;
    this.rescueMarker.setAttribute("role", "status");
    this.rescueMarker.innerHTML =
      '<span class="rescue-direction" aria-hidden="true">➤</span><span><strong>Pet encontrado</strong><small></small></span>';
    this.root.append(this.hud, this.rescueMarker, this.panel);
    document.body.append(this.root);
  }
  private show(html: string): void {
    this.rescueMarker.hidden = true;
    this.panel.innerHTML = html;
    this.panel.hidden = false;
    this.panel.querySelector<HTMLButtonElement>("button")?.focus();
  }
  resume(): void {
    this.close();
  }
  private close(): void {
    this.panel.replaceChildren();
    this.panel.hidden = true;
  }
  menu(progress: DungeonProgress, previews: Record<DungeonId, string>): void {
    this.hud.hidden = true;
    this.show(
      `<section class="dungeon-menu"><p class="dungeon-eyebrow">JARDIM DEPOIS DA CHUVA</p><h1>Expedições à cidade</h1><p>Escolha um desafio de sobrevivência. Seus ataques são automáticos.</p><div class="dungeon-destinations">${(
        Object.keys(DUNGEONS) as DungeonId[]
      )
        .map((id) => {
          const d = DUNGEONS[id];
          return `<article><img src="${previews[id]}" alt="Prévia de ${d.name}"><h2>${d.name}</h2><p>${d.mode === "timed" ? "Sobrevivência · 15 minutos" : "Sobrevivência · 50 rodadas"}</p><small>${d.difficulty}</small><button data-start="${id}">Iniciar expedição</button></article>`;
        })
        .join(
          "",
        )}</div><label>Companheiro <select data-pet><option value="">Sem pet</option>${progress.pets.map((p) => `<option value="${escape(p.id)}" ${p.id === progress.selectedPet ? "selected" : ""}>${PETS[p.species].name}${p.rare ? " ✦" : ""}</option>`).join("")}</select></label><p class="dungeon-note" data-pet-bonuses></p><p class="dungeon-note">A espada ocupa o primeiro dos quatro espaços. O pet tem seu próprio espaço. A partida é salva durante a exploração.</p><footer><button data-evolution>Evolução permanente</button><button data-back>Voltar ao acesso</button></footer></section>`,
    );
    this.panel.querySelectorAll<HTMLButtonElement>("[data-start]").forEach(
      (b) =>
        (b.onclick = () => {
          this.close();
          this.hud.hidden = false;
          this.callbacks.start(
            b.dataset.start as DungeonId,
            progress.selectedPet,
          );
        }),
    );
    const updateBonuses = () => {
      const pet = progress.pets.find((p) => p.id === progress.selectedPet);
      this.panel.querySelector<HTMLElement>("[data-pet-bonuses]")!.textContent =
        pet
          ? `Bônus ao jogador nas dungeons: ${petBonusDescription(pet)}. Ativos também durante a recuperação do pet.`
          : "Sem bônus de companheiro.";
    };
    updateBonuses();
    this.panel.querySelector<HTMLSelectElement>("[data-pet]")!.onchange = (
      e,
    ) => {
      this.callbacks.pet((e.target as HTMLSelectElement).value || undefined);
      (e.target as HTMLSelectElement).value = progress.selectedPet ?? "";
      updateBonuses();
    };
    this.panel.querySelector<HTMLButtonElement>("[data-evolution]")!.onclick =
      () => this.evolution(progress, () => this.menu(progress, previews));
    this.panel.querySelector<HTMLButtonElement>("[data-back]")!.onclick =
      this.callbacks.back;
  }
  private focusEvolutionButton(selector: string): void {
    const button = this.panel.querySelector<HTMLButtonElement>(selector);
    if (button && !button.disabled) button.focus({ preventScroll: true });
    else
      this.panel
        .querySelector<HTMLElement>(".permanent-menu h1")
        ?.focus({ preventScroll: true });
  }
  private evolution(
    progress: DungeonProgress,
    back: () => void,
    target = "character",
    message = "",
  ): void {
    const scrollTop =
      this.panel.querySelector(".permanent-menu")?.scrollTop ?? 0;
    this.show(permanentEvolutionHTML(progress, target, message));
    this.panel.querySelector(".permanent-menu")!.scrollTop = scrollTop;
    this.panel.querySelector<HTMLSelectElement>(
      "[data-evolution-target]",
    )!.onchange = (e) =>
      this.evolution(progress, back, (e.target as HTMLSelectElement).value);
    this.panel.querySelectorAll<HTMLButtonElement>("[data-attribute]").forEach(
      (b) =>
        (b.onclick = () => {
          const key = b.dataset.attribute as Attribute,
            before = progress.attributes[key];
          this.callbacks.evolve(key);
          this.evolution(
            progress,
            back,
            target,
            progress.attributes[key] > before
              ? `${labels[key]} evoluiu para o nível ${progress.attributes[key]}.`
              : "A melhoria não foi aplicada. Confira o saldo e tente novamente.",
          );
          this.focusEvolutionButton(`[data-attribute="${key}"]`);
        }),
    );
    this.panel
      .querySelectorAll<HTMLButtonElement>("[data-pet-attribute]")
      .forEach(
        (b) =>
          (b.onclick = () => {
            const before = progress.pets.find((p) => p.id === b.dataset.petId)!
              .attributes[b.dataset.petAttribute as PetAttribute];
            this.callbacks.evolve(
              "strength",
              b.dataset.petId,
              b.dataset.petAttribute as PetAttribute,
            );
            const after = progress.pets.find((p) => p.id === b.dataset.petId)!
              .attributes[b.dataset.petAttribute as PetAttribute];
            this.evolution(
              progress,
              back,
              target,
              after > before
                ? `${labels[b.dataset.petAttribute!]} evoluiu para o nível ${after}.`
                : "A melhoria não foi aplicada. Confira o saldo e tente novamente.",
            );
            this.focusEvolutionButton(
              `[data-pet-attribute="${b.dataset.petAttribute}"]`,
            );
          }),
      );
    this.panel.querySelector<HTMLButtonElement>("[data-back]")!.onclick = back;
  }
  update(run: DungeonRun): void {
    const html = dungeonHUD(run, this.icons);
    if (html !== this.lastHUD) {
      this.lastHUD = html;
      this.hud.innerHTML = html;
      this.hud.querySelector<HTMLButtonElement>("[data-pause]")!.onclick =
        () => {
          run.pause();
          this.pause(run);
        };
    }
  }
  updateRescue(
    run: DungeonRun,
    view: { x: number; y: number; width: number; height: number },
    screen: DOMRect,
  ): void {
    const pet = run.state.pickups.find((p) => p.kind === "pet" && p.species);
    const visible =
      !!pet &&
      run.state.phase === "fighting" &&
      this.panel.hidden &&
      view.width > 0 &&
      view.height > 0;
    this.rescueMarker.hidden = !visible;
    if (!visible || !pet?.species) return;
    const marker = petRescueMarker(run.state.player, pet, view, {
      x: screen.left,
      y: screen.top,
      width: screen.width,
      height: screen.height,
    });
    // The canvas can briefly retain its old size during a window resize.
    const marginX = Math.min(90, innerWidth / 2),
      marginY = Math.min(150, innerHeight / 2);
    this.rescueMarker.style.left = `${Math.max(marginX, Math.min(innerWidth - marginX, marker.x))}px`;
    this.rescueMarker.style.top = `${Math.max(marginY, Math.min(innerHeight - marginY, marker.y))}px`;
    this.rescueMarker.querySelector<HTMLElement>(
      ".rescue-direction",
    )!.style.transform = `rotate(${marker.angle}deg)`;
    const label = `${PETS[pet.species].name} · ${marker.near ? "aproxime-se" : "siga a seta"}`;
    const text = this.rescueMarker.querySelector("small")!;
    if (text.textContent !== label) text.textContent = label;
  }
  private cardIcon(card: UpgradeCard): string {
    const weapon =
      card.kind === "arsenal"
        ? card.id
        : UPGRADES.find((u) => u.id === card.id)?.weapon;
    if (weapon)
      return `<img class="dungeon-card-icon" src="${card.id === WEAPON_EVOLUTIONS[weapon].id ? (this.icons[`${weapon}-evolved`] ?? this.icons[weapon]) : this.icons[weapon]}" alt="">`;
    const pet =
      card.id.startsWith("pet-") || card.id === "relentless-companion";
    const path = pet
      ? '<circle cx="6" cy="8" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 17Q12 5 18 17Q18 22 12 20Q6 22 6 17Z"/>'
      : card.id.includes("health") ||
          card.id.includes("recovery") ||
          card.id === "regeneration"
        ? '<path d="M9 3H15V9H21V15H15V21H9V15H3V9H9Z"/>'
        : card.id.includes("defense") || card.id === "last-stand"
          ? '<path d="M12 2L21 6V13Q21 19 12 22Q3 19 3 13V6Z"/>'
          : card.id.includes("accuracy") ||
              card.id.includes("precision") ||
              card.id === "range"
            ? '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 0V5M12 19V24M0 12H5M19 12H24"/>'
            : '<path d="M4 18L10 12L4 6M12 18L18 12L12 6"/>';
    return `<svg class="dungeon-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${path}</svg>`;
  }
  cards(run: DungeonRun): void {
    const cards = run.state.cards;
    this.show(
      `<section class="dungeon-menu"><h1>Nível ${run.state.level}</h1><p>${cards.every((c) => c.kind === "arsenal") ? "Escolha uma das três armas." : "Escolha uma melhoria."} O combate está pausado.</p><div class="dungeon-cards">${cards.map((c) => `<button class="rarity-${c.rarity}" data-card="${c.id}">${this.cardIcon(c)}<small>${rarityNames[c.rarity]}</small><h2>${c.name}</h2><p>${c.effect}</p><strong>Nível ${c.level} → ${c.level + 1} · máximo ${c.max}</strong></button>`).join("")}</div><button data-abandon>Abandonar partida</button></section>`,
    );
    this.panel.querySelectorAll<HTMLButtonElement>("[data-card]").forEach(
      (b) =>
        (b.onclick = () => {
          this.close();
          this.callbacks.choose(b.dataset.card!);
        }),
    );
    this.panel.querySelector<HTMLButtonElement>("[data-abandon]")!.onclick =
      () => this.confirmAbandon(() => this.cards(run));
  }
  pause(run?: DungeonRun): void {
    const upgrades = run
      ? Object.entries(run.state.levels)
          .map(([id, n]) => {
            const u = UPGRADES.find((u) => u.id === id);
            return `<li>${u?.name ?? id} · ${n}/${u?.max ?? n}</li>`;
          })
          .join("")
      : "";
    const build = run
      ? `<div class="dungeon-build"><strong>Arsenal</strong><p>${run.state.weapons.map((w) => WEAPONS[w].name).join(" · ")}</p><strong>Melhorias atuais</strong><ul>${upgrades || "<li>Nenhuma melhoria escolhida ainda.</li>"}</ul></div>`
      : "";
    this.show(
      `<section class="dungeon-menu compact"><h1>Expedição pausada</h1><p>O tempo, os inimigos e os ataques estão parados.</p>${build}<button data-resume>Retomar</button><button data-abandon>Abandonar e voltar ao acesso</button></section>`,
    );
    this.panel.querySelector<HTMLButtonElement>("[data-resume]")!.onclick =
      () => {
        this.close();
        this.callbacks.resume();
      };
    this.panel.querySelector<HTMLButtonElement>("[data-abandon]")!.onclick =
      () => this.confirmAbandon(() => this.pause(run));
  }
  private confirmAbandon(back: () => void): void {
    this.show(
      '<section class="dungeon-menu compact"><h1>Abandonar a expedição?</h1><p>As melhorias temporárias terminam aqui. A experiência permanente já conquistada será registrada.</p><button data-abandon>Confirmar abandono</button><button data-back>Continuar na partida</button></section>',
    );
    this.panel.querySelector<HTMLButtonElement>("[data-abandon]")!.onclick =
      this.callbacks.abandon;
    this.panel.querySelector<HTMLButtonElement>("[data-back]")!.onclick = back;
  }
  result(
    run: DungeonRun,
    reward: {
      coins: number;
      xp: number;
      survivalXP?: number;
      learningXP?: number;
      materials?: Partial<Record<ItemId, number>>;
      waiting?: boolean;
    },
    saved: boolean,
  ): void {
    const s = run.state,
      title =
        s.phase === "victory"
          ? "Expedição concluída"
          : s.phase === "defeat"
            ? "Você foi derrotado"
            : "Expedição encerrada";
    this.show(
      `<section class="dungeon-menu compact"><h1>${title}</h1><p>${s.kills} inimigos · nível temporário ${s.level} · ${Math.floor(s.elapsed / 60)} min ${Math.floor(s.elapsed % 60)} s</p><p>${reward.xp} XP permanente · ${reward.coins} moedas${s.foundPet ? " · novo pet encontrado" : ""}</p>${reward.survivalXP || reward.learningXP ? `<p>Inclui ${reward.survivalXP ?? 0} XP por sobrevivência${reward.learningXP ? ` e ${reward.learningXP} XP de apoio às primeiras tentativas` : ""}.</p>` : ""}<p>${Object.entries(
        reward.materials ?? {},
      )
        .map(([item, n]) => `${n} × ${ITEM_NAMES[item as ItemId]}`)
        .join(
          " · ",
        )}${reward.waiting ? " · Materiais guardados até haver espaço no inventário." : ""}</p><p>As melhorias temporárias serão reiniciadas na próxima expedição.</p>${saved ? "<button data-back>Voltar ao ponto de acesso</button>" : '<p role="alert">Não foi possível salvar o resultado. Tente novamente.</p><button data-retry>Tentar salvar novamente</button>'}</section>`,
    );
    if (saved)
      this.panel.querySelector<HTMLButtonElement>("[data-back]")!.onclick =
        this.callbacks.back;
    else
      this.panel.querySelector<HTMLButtonElement>("[data-retry]")!.onclick =
        this.callbacks.retry;
  }
  travel(): void {
    this.hud.hidden = true;
    this.show(
      '<div class="dungeon-travel"><p>A estrada para a cidade</p><span>Chuva sobre um lugar esquecido…</span></div>',
    );
  }
  destroy(): void {
    this.root.remove();
  }
}
