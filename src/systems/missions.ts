import type {SaveData} from '../types';
import {CHAPTERS,missionKey,type Chapter,type Mission} from '../data/missions';
import {missionContext,newMissionLog,type MissionContext,type MissionLog} from './mission-checks';

export type {MissionLog} from './mission-checks';
export interface MissionView{chapter:Chapter;missions:{mission:Mission;done:boolean;progress?:readonly [number,number]}[];done:number;total:number}
export const ACHIEVEMENT_EVENT='after-rain-achievement';

const asProgress=(r:boolean|readonly [number,number])=>typeof r==='boolean'?{done:r}:{done:r[0]>=r[1],progress:r};
const strings=(v:unknown,max:number)=>Array.isArray(v)&&v.length<=max&&v.every(x=>typeof x==='string'&&x.length<=80);
export function validMissionLog(v:unknown):v is MissionLog{
 if(!v||typeof v!=='object'||Array.isArray(v))return false;const l=v as Record<string,unknown>;
 if(!strings(l.areas,64)||!strings(l.seen,2000)||!strings(l.excellent,2000)||!strings(l.done,2000))return false;
 if(typeof l.peak!=='number'||!Number.isFinite(l.peak)||l.peak<0)return false;
 if(l.rode!==undefined&&l.rode!==true)return false;
 if(l.events!==undefined&&!strings(l.events,500))return false;
 const a=l.achievements;if(!a||typeof a!=='object'||Array.isArray(a))return false;
 return Object.entries(a).length<=200&&Object.values(a).every(d=>typeof d==='number'&&Number.isSafeInteger(d)&&d>=1);
}
/** Junta dois registros: tudo só cresce, então a união nunca perde progresso. */
export function mergeMissionLogs(a:MissionLog|undefined,b:MissionLog|undefined):MissionLog{
 const x=a??newMissionLog(),y=b??newMissionLog(),u=(p:string[],q:string[])=>[...new Set([...p,...q])];
 const out:MissionLog={areas:u(x.areas,y.areas),seen:u(x.seen,y.seen),excellent:u(x.excellent,y.excellent),peak:Math.max(x.peak,y.peak),done:u(x.done,y.done),achievements:{...y.achievements,...x.achievements}};
 for(const[k,d]of Object.entries(y.achievements))out.achievements[k]=Math.min(d,out.achievements[k]??d);
 if(x.rode||y.rode)out.rode=true;
 const ev=u(x.events??[],y.events??[]);if(ev.length)out.events=ev;return out;
}
export const chapterUnlocked=(log:MissionLog,ch:Chapter)=>(ch.after??[]).every(id=>log.achievements[id]!==undefined);
function chapterView(ctx:MissionContext,ch:Chapter):MissionView{
 const missions=ch.missions.map(mission=>{const r=asProgress(mission.test(ctx));return{mission,done:ctx.log.done.includes(missionKey(ch,mission))||r.done,progress:r.progress};});
 return{chapter:ch,missions,done:missions.filter(x=>x.done).length,total:missions.length};
}
/** Atualiza o registro com o estado atual da partida e devolve os capítulos concluídos agora.
 * Missões já cumpridas ficam marcadas, mesmo que o item seja vendido depois. Saves antigos
 * recebem na hora as conquistas do que já tinham feito. */
export function trackMissions(s:SaveData,base?:MissionLog):Chapter[]{
 const log=mergeMissionLogs(base,s.missions);
 const area=s.miningInterior||s.mineInterior?'mine':s.activeArea??'property';
 if(!log.areas.includes(area))log.areas.push(area);
 if(!log.areas.includes('property'))log.areas.push('property');
 for(const[i,n]of Object.entries(s.inventory))if(typeof n==='number'&&n>0&&!log.seen.includes(i))log.seen.push(i);
 for(const[i,q]of Object.entries(s.itemQuality??{}))if((q?.excellent??0)>0&&!log.excellent.includes(i))log.excellent.push(i);
 log.peak=Math.max(log.peak,s.villageEconomy?.coins??0);
 if(s.riding)log.rode=true;
 if(s.bentoExpedition?.party&&!(log.events??=[]).includes('bento-party'))log.events.push('bento-party');
 const earned:Chapter[]=[];
 for(let changed=true;changed;){
  changed=false;const ctx=missionContext(s,log);
  for(const ch of CHAPTERS){
   const view=chapterView(ctx,ch);
   for(const x of view.missions){const k=missionKey(ch,x.mission);if(x.done&&!log.done.includes(k))log.done.push(k);}
   if(log.achievements[ch.id]===undefined&&chapterUnlocked(log,ch)&&view.done===view.total){log.achievements[ch.id]=Math.max(1,s.day);earned.push(ch);changed=true;}
  }
 }
 s.missions=log;return earned;
}
/** Capítulos para o painel: os abertos e ainda não concluídos, na ordem do jogo. */
export function openChapters(s:SaveData):MissionView[]{
 const log=s.missions??newMissionLog(),ctx=missionContext(s,log);
 return CHAPTERS.filter(ch=>log.achievements[ch.id]===undefined&&chapterUnlocked(log,ch)).map(ch=>chapterView(ctx,ch));
}
export interface AchievementView{chapter:Chapter;day?:number;open:boolean}
export const achievementList=(s:SaveData):AchievementView[]=>{const log=s.missions??newMissionLog();return CHAPTERS.map(ch=>({chapter:ch,day:log.achievements[ch.id],open:chapterUnlocked(log,ch)}));};
export const announceAchievements=(earned:Chapter[])=>{if(earned.length&&typeof window!=='undefined')window.dispatchEvent(new CustomEvent(ACHIEVEMENT_EVENT,{detail:earned.map(c=>({id:c.id,name:c.achievement,description:c.description}))}));};
