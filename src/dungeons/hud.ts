import { DUNGEONS, PETS, type WeaponId } from "./config";
import { weaponIdentity } from "./weapon-identity";
import { nextWeaponOfferLevel } from "./upgrades";
import { bossProfile } from "./bosses";
import { BOSS_ATTACK_LABELS } from "./boss-combat";
import type { DungeonRun } from "./run";
const buffNames: Record<string, string> = {
  critical: "Crítico 20%",
  speed: "Velocidade",
  attack: "Ataque",
  invulnerable: "Proteção",
  "last-stand": "Última resistência",
};
export function dungeonHUD(
  run: DungeonRun,
  icons: Record<WeaponId, string>,
): string {
  const s = run.state,
    d = DUNGEONS[s.dungeon],
    time = Math.max(0, d.mode === "timed" ? d.duration - s.elapsed : s.elapsed),
    clock = `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, "0")}`,
    boss = s.enemies.find((e) => e.kind === "boss" && e.hp > 0),
    pet = s.pet;
  const buffs = Object.entries(s.buffs)
    .filter(([, until]) => until > s.elapsed)
    .map(
      ([id, until]) =>
        `<span>${buffNames[id] ?? id} <b>${Math.ceil(until - s.elapsed)}s</b></span>`,
    )
    .join("");
  const weapons =
    s.weapons
      .map((w, i) => {
        const info = weaponIdentity(w, s.levels);
        return `<span class="hud-weapon ${info.evolved ? "evolved" : ""}" title="${info.name} · ${info.role}"><small>${i + 1}</small><img src="${icons[w]}" alt="${info.name}">${info.evolved ? "<b>★</b>" : ""}</span>`;
      })
      .join("") +
    Array.from(
      { length: 4 - s.weapons.length },
      (_, i) =>
        `<span class="hud-weapon empty" title="Espaço livre"><small>${s.weapons.length + i + 1}</small>+</span>`,
    ).join("");
  const shield = s.weapons.includes("orbiting-shield")
    ? `<span>Escudo <b>${s.shield?.charges ?? run.shieldCapacity}/${run.shieldCapacity} cargas</b>${s.shield?.recharge ? ` · recarga ${Math.ceil(s.shield.recharge)}s` : ""}</span>`
    : "";
  return `<section class="hud-layout">

 <div class="hud-location"><span>EXPEDIÇÃO À CIDADE</span><strong>${d.name}</strong></div>
 <div class="hud-clock"><strong>${clock}</strong><span>${d.mode === "timed" ? "SOBREVIVA" : `RODADA ${s.round} / 50`}</span></div>
 <div class="hud-score"><strong>${s.kills.toLocaleString("pt-BR")}</strong><span>ELIMINADOS</span><small>${d.mode === "waves" ? `${s.waveRemaining + s.enemies.length} restantes` : `${s.enemies.length} na horda`}</small></div>
 <button class="hud-pause" data-pause aria-label="Pausar expedição" title="Pausar · ESC"><svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true"><rect x="1" y="1" width="3" height="12"/><rect x="8" y="1" width="3" height="12"/></svg></button>
 ${boss ? `<div class="dungeon-boss"><strong>${bossProfile(boss.bossTier ?? s.round).name}${(boss.bossTier ?? s.round) === 50 && boss.hp <= boss.maxHp / 2 ? " · Enfurecido" : ""}</strong><meter aria-label="Vida do chefe" min="0" max="${boss.maxHp}" value="${boss.hp}"></meter><span>${Math.ceil(boss.hp)} / ${Math.ceil(boss.maxHp)}</span>${boss.boss?.action && boss.boss.action.stage !== "recovery" ? `<small class="boss-skill">${BOSS_ATTACK_LABELS[boss.boss.action.kind]}</small>` : ""}</div>` : ""}
 <div class="dungeon-buffs"><span class="hud-stage">${run.horde.name}</span>${buffs}${shield}${s.pickups.some((p) => p.kind === "xp" && p.attracted) ? "<span>Ímã atraindo experiência</span>" : ""}${s.foundPet ? `<span>${PETS[s.foundPet].name}${s.foundPetRare ? " raro" : ""} resgatado</span>` : ""}</div>
 <div class="hud-bottom">
 <div class="hud-vitals"><div class="hud-health ${s.player.hp / run.maxHealth < 0.25 ? "low" : ""}"><div><span>VIDA</span><strong>${Math.ceil(s.player.hp)} <small>/ ${Math.round(run.maxHealth)}</small></strong></div><meter aria-label="Vida do personagem" min="0" max="${run.maxHealth}" value="${s.player.hp}"></meter></div>
 <div class="hud-experience" title="${run.buildComplete ? "Todas as cartas concluídas; os níveis continuam avançando" : "Experiência da expedição"}"><span>NÍVEL ${s.level} <small>${Math.floor(s.xp)} / ${run.xpNeeded} XP</small></span><meter aria-label="Experiência" min="0" max="${run.xpNeeded}" value="${s.xp}"></meter></div></div>
 <div class="hud-arsenal"><div class="dungeon-loadout">${weapons}</div><small>${s.weapons.length < 4 ? `Nova arma no nível ${nextWeaponOfferLevel(s.level)}` : `${Object.keys(s.levels).length} melhorias · ESC para pausar`}</small></div>
 <div class="hud-pet"><div><span>COMPANHEIRO</span><strong>${pet ? PETS[pet.species].name : "Sem pet"}</strong></div>${pet ? `<meter aria-label="Vida do pet" min="0" max="${pet.maxHp}" value="${pet.hp}"></meter><small>${pet.hp <= 0 ? "Recuperando forças" : `${Math.ceil(pet.hp)} / ${Math.round(pet.maxHp)} de vida`}</small>` : "<small>Escolha no menu da cidade</small>"}</div>
 </div></section>`;
}
