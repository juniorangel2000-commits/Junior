import type {FishingSession} from './systems/fishing';
import {FISHING_RULES} from './systems/fishing';
import {fishSpecies,fishingTrash,fishingCatchIcon,formatFishLength,formatFishWeight} from './data/fishing-catches';
import {BAITS,specimenPrice} from './systems/fishing-progress';
import {ITEM_NAMES} from './data/items';
export function fishingResultMarkup(session:FishingSession):{html:string;outcome:'caught'|'escaped'|'trash';message:string}{
 const caught=session.phase==='caught',reward=session.reward,trash=reward.kind==='trash';
 let title='',body='',message='',outcome:'caught'|'escaped'|'trash'='escaped';
 if(caught&&reward.kind==='fish'){
  outcome='caught';title=reward.specimens.length===1?'Peixe capturado!':'Boa pescaria!';message=reward.specimens.length===1?'Peixe capturado!':'Você capturou 2 peixes!';
  body=`<div class="fishing-result-catches">${reward.specimens.map(f=>{const species=fishSpecies(f.species);return `<article class="fishing-catch-card" data-species="${species.id}"><span class="fishing-rarity" data-rarity="${species.rarity}">${species.label}</span><img class="fishing-catch-art" src="${fishingCatchIcon(species.id)}" alt="${species.name}"/><h3>${species.name}</h3><dl><div><dt>Comprimento</dt><dd>${formatFishLength(f.lengthCm)}</dd></div><div><dt>Peso</dt><dd>${formatFishWeight(f.weightGrams)}</dd></div></dl><p>${species.description}</p><strong class="fishing-catch-value">${specimenPrice(f)} C <small>· venda com Damião</small></strong></article>`;}).join('')}</div><p class="fishing-result-saved">${reward.specimens.length===1?'Guardado':'Guardados'} na mochila.</p>`;
 }else if(caught&&reward.kind==='trash'){
  outcome='trash';const item=fishingTrash(reward.id);title='Veio lixo na linha';message='Material recolhido e guardado na mochila.';
  body=`<article class="fishing-catch-card fishing-trash-card" data-trash="${item.id}"><span class="fishing-rarity" data-rarity="salvage">Reaproveitável</span><img class="fishing-catch-art" src="${fishingCatchIcon(item.id)}" alt="${item.name}"/><h3>${reward.quantity>1?reward.quantity+' × ':''}${item.name}</h3><p>${item.description}</p><strong class="fishing-salvage">+${reward.quantity} × ${ITEM_NAMES[item.item]}</strong></article><p class="fishing-result-saved">Material recuperado e guardado na mochila.</p>`;
 }else{
  title=trash?'A linha se soltou':'O peixe escapou';message=trash?'O objeto escapou da linha.':'O peixe escapou.';
  const reason=session.escapeReason==='late-hook'?'A janela de 3 segundos para fisgar terminou.':session.escapeReason==='timeout'?'A disputa demorou demais e a linha se soltou.':trash?'O peso saiu da faixa de controle.':'O peixe ficou fora da faixa verde por muito tempo.';
  body=`<div class="fishing-escaped-art" aria-hidden="true"><svg viewBox="0 0 120 60"><path d="M26 30 4 12v36Zm0 0C42 0 93 0 115 30 93 60 42 60 26 30Z" fill="currentColor"/></svg><span>…</span></div><p class="fishing-escape-reason">${reason}</p><p class="fishing-result-saved">Nada foi adicionado à mochila.</p>`;
 }
 return{outcome,message,html:`<header class="fishing-result-heading"><span class="village-eyebrow">RESULTADO DA PESCARIA</span><h2 id="fishing-result-title">${title}</h2><button type="button" class="village-close" data-fishing-result-close aria-label="Fechar resultado da pescaria">×</button></header><div class="fishing-result-body">${body}</div><footer class="fishing-result-footer"><small>${BAITS[session.equipment.bait??'worm'].cost} ${BAITS[session.equipment.bait??'worm'].cost===1?'isca':'iscas'} · ${BAITS[session.equipment.bait??'worm'].name} · ${FISHING_RULES.vigorCost} de vigor utilizados</small><button type="button" class="village-primary" data-fishing-result-close>Continuar</button></footer>`};
}
