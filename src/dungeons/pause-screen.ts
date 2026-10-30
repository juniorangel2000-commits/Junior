import type { DungeonRun } from './run';
import { DUNGEONS, PETS, DUNGEON_BALANCE } from './config';
import { UPGRADES } from './upgrades';
import { weaponIdentity, weaponSpriteFrame, type WeaponIcons } from './weapon-identity';

const escape = (value: string): string => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const clock = (seconds: number): string => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.floor(Math.max(0, seconds)) % 60).padStart(2, '0')}`;
const percent = (n: number): number => Math.max(0, Math.min(100, n));

export function pauseScreen(run: DungeonRun | undefined, icons: WeaponIcons): string {
  const s = run?.state, map = s ? DUNGEONS[s.dungeon] : undefined;
  const waves = map?.mode === 'waves';
  const upgrades = s ? Object.entries(s.levels).filter(([,n]) => n > 0) : [];
  const metrics = s && map ? [
    ['Tempo sobrevivido', clock(s.elapsed)], ['Nível', String(s.level)],
    ['Eliminações', s.kills.toLocaleString('pt-BR')],
    [waves ? 'Rodada atual' : 'Tempo restante', waves ? `${s.round} / ${map.rounds}` : clock(map.duration - s.elapsed)],
  ].map(([label,value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('') : '';
  const arsenal = s ? Array.from({length:DUNGEON_BALANCE.maxWeapons}, (_,i) => {
    const weapon = s.weapons[i];
    if (!weapon) {
      const unlock = [1,10,30,50][i];
      return `<li class="pause-weapon pause-weapon-empty"><span aria-hidden="true">＋</span><strong>${s.level >= unlock ? 'Próxima escolha' : `Nível ${unlock}`}</strong><small>Nova arma</small></li>`;
    }
    const identity = weaponIdentity(weapon,s.levels);
    const src = icons[weaponSpriteFrame(weapon,s.levels)] ?? icons[weapon];
    return `<li class="pause-weapon${identity.evolved ? ' is-evolved' : ''}"><img src="${src}" alt=""><strong>${identity.name}</strong><small>${identity.role}</small>${identity.evolved ? '<span class="pause-evolved">Evoluída</span>' : ''}</li>`;
  }).join('') : '';
  const cards = upgrades.map(([id,n]) => {
    const u = UPGRADES.find(u => u.id === id), max = u?.max ?? n;
    return `<li class="pause-upgrade rarity-${u?.rarity ?? 'common'}"><div><strong>${escape(u?.name ?? id)}</strong><small>${escape(u?.effect ?? '')}</small></div><span class="pause-upgrade-rank">${n}<small> / ${max}</small></span><span class="pause-rank-track" aria-hidden="true"><i style="width:${percent(n / max * 100)}%"></i></span></li>`;
  }).join('');
  const pet = s?.pet;
  return `<section class="dungeon-menu pause-screen" role="dialog" aria-modal="true" aria-labelledby="expedition-pause-title" aria-describedby="expedition-pause-note">
    <header class="pause-header"><div class="pause-heading"><span class="pause-emblem" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="4"><path d="M8 4V20M16 4V20"/></svg></span><div><span class="pause-eyebrow">UMA PAUSA NO CERCO</span><h1 id="expedition-pause-title">Expedição pausada</h1></div><button class="pause-close" data-resume-top aria-label="Fechar pausa e retomar">×</button></div>
      ${map ? `<p class="pause-location">${map.name}<span>${waves ? '50 RODADAS' : '15 MINUTOS'}</span></p><dl class="pause-metrics">${metrics}</dl>` : ''}
      ${s && run ? `<div class="pause-vitals"><span>Vida <strong>${Math.ceil(s.player.hp)} <small>/ ${Math.ceil(run.maxHealth)}</small></strong></span><span class="pause-health-track" role="meter" aria-label="Vida do personagem" aria-valuemin="0" aria-valuemax="${Math.ceil(run.maxHealth)}" aria-valuenow="${Math.ceil(s.player.hp)}"><i style="width:${percent(s.player.hp / run.maxHealth * 100)}%"></i></span></div>` : ''}
    </header>
    <div class="pause-body">${s ? `<section class="pause-section"><div class="pause-section-title"><h2>Seu arsenal</h2><span>${s.weapons.length} / ${DUNGEON_BALANCE.maxWeapons} armas</span></div><ul class="pause-arsenal">${arsenal}</ul></section>
      ${pet ? `<div class="pause-companion"><span>Companheiro</span><strong>${PETS[pet.species].name}${pet.rare ? ' ✦' : ''}</strong><small>${pet.hp > 0 ? `${Math.ceil(pet.hp)} / ${Math.ceil(pet.maxHp)} de vida` : 'Recuperando as forças'}</small></div>` : ''}
      <section class="pause-section"><div class="pause-section-title"><h2>Melhorias da partida</h2><span>${upgrades.length} escolhidas</span></div>${cards ? `<ul class="pause-upgrades">${cards}</ul>` : '<div class="pause-empty"><strong>Sua combinação começa aqui.</strong><p>Recolha experiência e suba de nível para escolher suas primeiras melhorias.</p></div>'}</section>` : ''}</div>
    <footer class="pause-footer"><p id="expedition-pause-note"><span aria-hidden="true">●</span> O tempo, os inimigos e os ataques estão parados.</p><div class="pause-actions"><button class="pause-abandon" data-abandon>Abandonar expedição</button><button class="pause-resume" data-resume>Retomar <kbd>Esc</kbd></button></div></footer>
  </section>`;
}
