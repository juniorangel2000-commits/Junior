import type {SaveData} from './types';
import {CHAPTERS} from './data/missions';
import {chapterUnlocked,missionViews,type MissionView} from './systems/missions';
import type {MissionLog} from './systems/mission-checks';

/** Painel de missões (preview.49): aba "Missões" com o capítulo atual da trilha e os paralelos,
 * e aba "Conquistas" com todas as medalhas. */
export type JournalTab='missions'|'achievements';
const esc=(t:string)=>t.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]!));
export const MEDAL_SVG='<path class="ribbon" d="M4.5 1h3l1 4.5h-3zM8.5 1h3l-1 4.5h-3z"/><circle class="coin" cx="8" cy="10.5" r="4.6"/><path class="star" d="M8 7.5l.95 1.9 2.1.3-1.5 1.45.35 2.1L8 12.25l-1.9 1 .35-2.1-1.5-1.45 2.1-.3z"/>';
const medal=(earned:boolean)=>`<svg class="medal${earned?' earned':''}" viewBox="0 0 16 16" aria-hidden="true">${MEDAL_SVG}</svg>`;
function chapterHtml(v:MissionView,full:boolean):string{
 const head=`<div class="mission-chapter-head"><span class="eyebrow">${v.chapter.side?'EM PARALELO':'CAPÍTULO'}</span><strong>${esc(v.chapter.title)}</strong><small>${v.done}/${v.total}</small><div class="mission-bar"><span style="width:${Math.round(v.done/v.total*100)}%"></span></div></div>`;
 if(!full)return `<div class="mission-chapter compact" data-chapter="${v.chapter.id}">${head}</div>`;
 const rows=v.missions.map(x=>`<div class="quest${x.done?' complete':''}" data-mission="${x.mission.id}"><span class="quest-circle"></span><span>${esc(x.mission.text)}${x.progress&&!x.done?` <em>${x.progress[0].toLocaleString('pt-BR')}/${x.progress[1].toLocaleString('pt-BR')}</em>`:''}</span></div>`).join('');
 return `<div class="mission-chapter" data-chapter="${v.chapter.id}">${head}${rows}<p class="mission-reward">${medal(false)}<span>Prêmio: <b>${esc(v.chapter.achievement)}</b></span></p></div>`;
}
export function missionJournalKey(s:SaveData,log:MissionLog,tab:JournalTab):string{
 const views=missionViews(s,log);return tab+'|'+views.map(v=>v.chapter.id+':'+v.missions.map(x=>x.done?1:x.progress?.[0]??0).join('.')).join(';')+'|'+Object.keys(log.achievements).length;
}
export function missionJournalHtml(s:SaveData,log:MissionLog,tab:JournalTab):string{
 const earned=CHAPTERS.filter(c=>log.achievements[c.id]!==undefined).length;
 const tabs=`<div class="mission-tabs" role="tablist"><button type="button" role="tab" data-journal-tab="missions" aria-selected="${tab==='missions'}">Missões</button><button type="button" role="tab" data-journal-tab="achievements" aria-selected="${tab==='achievements'}">Conquistas <span>${earned}/${CHAPTERS.length}</span></button></div>`;
 if(tab==='achievements'){
  const list=CHAPTERS.map(c=>{const day=log.achievements[c.id],open=chapterUnlocked(log,c);
   return `<li class="achievement${day!==undefined?' earned':open?' open':' locked'}">${medal(day!==undefined)}<span><b>${day!==undefined||open?esc(c.achievement):'???'}</b><small>${day!==undefined?`${esc(c.description)} · dia ${day}`:open?`Em andamento: ${esc(c.title)}`:'Ainda bloqueada'}</small></span></li>`;}).join('');
  return `${tabs}<div class="achievement-summary"><span>Medalhas</span><span>${earned} de ${CHAPTERS.length}</span></div><div class="achievement-progress"><span style="width:${Math.round(earned/CHAPTERS.length*100)}%"></span></div><ul class="achievement-list">${list}</ul>`;
 }
 const views=missionViews(s,log),main=views.filter(v=>!v.chapter.side),side=views.filter(v=>v.chapter.side);
 const body=main.length?main.map(v=>chapterHtml(v,true)).join(''):'<p class="mission-done">Você terminou a trilha do vale!</p>';
 return `${tabs}${body}${side.length?`<div class="mission-side"><p class="eyebrow">TAMBÉM EM ANDAMENTO</p>${side.map(v=>chapterHtml(v,false)).join('')}</div>`:''}`;
}
