import { bossProfile } from "./bosses";
import { weaponIdentity } from "./weapon-identity";
import { UPGRADES, nextWeaponOfferLevel } from "./upgrades";
import type { UpgradeCard } from "./upgrades";
import { ITEM_NAMES } from "../data/items";
import type { ItemId } from "../types";
import type { DungeonId, WeaponId } from "./config";
import { DUNGEONS, WEAPONS, PETS } from "./config";
import {
  CHARACTER_ATTRIBUTES,
  PET_ATTRIBUTES,
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
const attributeHelp: Record<string, string> = {
  strength: "+2% de dano corpo a corpo",
  resistance: "+2% de redução de dano",
  agility: "+2% de velocidade",
  vitality: "+3% de vida máxima",
  precision: "+1% de precisão",
  survival: "+0,02 de vida por segundo",
};
const petHelp: Record<string, string> = {
  speed: "+3% de velocidade",
  resistance: "+5% de resistência e vida",
  perception: "+3% de alcance de coleta",
  protection: "+1% de proteção ao personagem",
  efficiency: "Melhora ataques e habilidade da espécie",
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
  constructor(
    private readonly callbacks: Callbacks,
    private readonly icons: Record<WeaponId, string>,
  ) {
    this.root.id = "dungeon-ui";
    this.hud.className = "dungeon-hud";
    this.panel.className = "dungeon-overlay";
    this.root.append(this.hud, this.panel);
    document.body.append(this.root);
  }
  private show(html: string): void {
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
        )}</div><label>Companheiro <select data-pet><option value="">Sem pet</option>${progress.pets.map((p) => `<option value="${escape(p.id)}" ${p.id === progress.selectedPet ? "selected" : ""}>${PETS[p.species].name}${p.rare ? " · variante rara" : ""}</option>`).join("")}</select></label><p class="dungeon-note">A espada ocupa o primeiro dos quatro espaços. O pet tem seu próprio espaço. A partida é salva durante a exploração.</p><footer><button data-evolution>Evolução permanente</button><button data-back>Voltar ao acesso</button></footer></section>`,
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
    this.panel.querySelector<HTMLSelectElement>("[data-pet]")!.onchange = (e) =>
      this.callbacks.pet((e.target as HTMLSelectElement).value || undefined);
    this.panel.querySelector<HTMLButtonElement>("[data-evolution]")!.onclick =
      () => this.evolution(progress, () => this.menu(progress, previews));
    this.panel.querySelector<HTMLButtonElement>("[data-back]")!.onclick =
      this.callbacks.back;
  }
  private evolution(progress: DungeonProgress, back: () => void): void {
    this.show(
      `<section class="dungeon-menu"><h1>Evolução permanente</h1><p>Experiência do personagem: ${progress.xp}</p><div class="dungeon-attributes">${CHARACTER_ATTRIBUTES.map((a) => `<button data-attribute="${a}" ${progress.attributes[a] >= 20 || progress.xp < 25 * (progress.attributes[a] + 1) ? "disabled" : ""}>${labels[a]} · ${progress.attributes[a]}/20 <small>${attributeHelp[a]}</small><small>${25 * (progress.attributes[a] + 1)} XP</small></button>`).join("")}</div>${progress.pets.map((p) => `<h2>${PETS[p.species].name}${p.rare ? " · raro" : ""} · ${p.xp} XP</h2><div class="dungeon-attributes">${PET_ATTRIBUTES.map((a) => `<button data-pet-id="${escape(p.id)}" data-pet-attribute="${a}" ${p.attributes[a] >= 20 || p.xp < 20 * (p.attributes[a] + 1) ? "disabled" : ""}>${labels[a]} · ${p.attributes[a]}/20 <small>${petHelp[a]}</small><small>${20 * (p.attributes[a] + 1)} XP</small></button>`).join("")}</div>`).join("")}<footer><button data-back>Voltar às expedições</button></footer></section>`,
    );
    this.panel.querySelectorAll<HTMLButtonElement>("[data-attribute]").forEach(
      (b) =>
        (b.onclick = () => {
          this.callbacks.evolve(b.dataset.attribute as Attribute);
          this.evolution(progress, back);
        }),
    );
    this.panel
      .querySelectorAll<HTMLButtonElement>("[data-pet-attribute]")
      .forEach(
        (b) =>
          (b.onclick = () => {
            this.callbacks.evolve(
              "strength",
              b.dataset.petId,
              b.dataset.petAttribute as PetAttribute,
            );
            this.evolution(progress, back);
          }),
      );
    this.panel.querySelector<HTMLButtonElement>("[data-back]")!.onclick = back;
  }
  update(run: DungeonRun): void {
    const s = run.state,
      d = DUNGEONS[s.dungeon],
      time = Math.max(
        0,
        d.mode === "timed" ? d.duration - s.elapsed : s.elapsed,
      ),
      minutes = Math.floor(time / 60),
      seconds = Math.floor(time % 60);
    const buffNames: Record<string, string> = {
      critical: "Crítico 20%",
      speed: "Velocidade",
      attack: "Ataque",
      invulnerable: "Proteção temporária",
      "last-stand": "Última resistência",
    };
    const buffs = Object.entries(s.buffs)
      .filter(([, until]) => until > s.elapsed)
      .map(
        ([id, until]) =>
          `<span>${buffNames[id] ?? id} · ${Math.ceil(until - s.elapsed)}s</span>`,
      )
      .join("");
    const shieldStatus = s.weapons.includes("orbiting-shield")
      ? `<span>Escudo: ${s.shield?.charges ?? run.shieldCapacity}/${run.shieldCapacity} cargas${s.shield?.recharge ? ` · recarga ${Math.ceil(s.shield.recharge)}s` : " · pronto"}</span>`
      : "";
    const rescue = s.foundPet
      ? `<span>Resgatado: ${PETS[s.foundPet].name}${s.foundPetRare ? " · raro" : ""} · entra na coleção ao encerrar</span>`
      : "";
    const boss = s.enemies.find((e) => e.kind === "boss" && e.hp > 0);
    const html = `<section><strong>${d.name}</strong>${boss ? `<div class="dungeon-boss"><strong>${bossProfile(s.round).name}</strong><meter min="0" max="${boss.maxHp}" value="${boss.hp}"></meter><span>${Math.ceil(boss.hp)}/${Math.ceil(boss.maxHp)}</span></div>` : ""}<div class="dungeon-meters"><label>Vida <meter min="0" max="${run.maxHealth}" value="${s.player.hp}"></meter> ${Math.ceil(s.player.hp)}/${Math.round(run.maxHealth)}</label><label>${run.buildComplete ? "Combinação completa" : `Nível ${s.level}`} <meter min="0" max="${run.xpNeeded}" value="${run.buildComplete ? run.xpNeeded : s.xp}"></meter></label></div><div class="dungeon-counters"><span>${d.mode === "timed" ? `${minutes}:${String(seconds).padStart(2, "0")}` : `Rodada ${s.round}/50`}</span><span>${s.kills} eliminados</span><span>${d.mode === "waves" ? s.waveRemaining + s.enemies.length + " inimigos na rodada" : s.enemies.length + " inimigos próximos"}</span></div><div class="dungeon-buffs"><span>${run.horde.name}</span>${s.pickups.some((p) => p.kind === "xp" && p.attracted) ? "<span>Ímã atraindo experiência</span>" : ""}${buffs}${rescue}${shieldStatus}${s.weapons.length < 4 ? `<span>Próxima escolha de arma: nível ${nextWeaponOfferLevel(s.level)}</span>` : ""}</div><div class="dungeon-loadout">${s.weapons.map((w) => `<span class="${weaponIdentity(w, s.levels).evolved ? "evolved" : ""}" title="${weaponIdentity(w, s.levels).name} · ${weaponIdentity(w, s.levels).role}"><img src="${this.icons[w]}" alt="${weaponIdentity(w, s.levels).name}">${weaponIdentity(w, s.levels).evolved ? "<b>★</b>" : ""}</span>`).join("")}${Array.from({ length: 4 - s.weapons.length }, () => '<span class="empty">+</span>').join("")}<b>Pet: ${s.pet ? PETS[s.pet.species].name + (s.pet.hp <= 0 ? " · recuperando" : "") : "nenhum"}</b></div><small>${Object.keys(s.levels).length} melhorias · WASD / setas para mover · ESC para pausar</small><button data-pause>Pausar</button></section>`;
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
  private cardIcon(card: UpgradeCard): string {
    const weapon =
      card.kind === "arsenal"
        ? card.id
        : UPGRADES.find((u) => u.id === card.id)?.weapon;
    if (weapon)
      return `<img class="dungeon-card-icon" src="${this.icons[weapon]}" alt="">`;
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
      `<section class="dungeon-menu compact"><h1>${title}</h1><p>${s.kills} inimigos · nível temporário ${s.level} · ${Math.floor(s.elapsed / 60)} min ${Math.floor(s.elapsed % 60)} s</p><p>${reward.xp} XP permanente · ${reward.coins} moedas${s.foundPet ? " · novo pet encontrado" : ""}</p><p>${Object.entries(
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
