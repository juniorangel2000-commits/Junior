import {recordSocialMemory} from './npc-social';
import {pauseMineMissions,resumeMineMissions} from './mine-mission-lifecycle';
import type {SaveData,TilePoint} from '../types';
import {BENTO_EXPEDITION as B} from '../data/bento-expedition';
import {BENTO_WEEKLY_PLAN} from '../data/bento-schedule';
import type {BentoExpeditionState,BentoPartyMode,BentoPartyEnd} from './bento-expedition-state';
import {changeBentoLeg,bentoReturnLeg,type BentoTrip} from './bento-travel-state';
import {bentoPlayerSpace,bentoMapNavigation,bentoActorFits,planBentoRoute} from './bento-navigation';
import {advanceWorldRoute} from './world-route';
import type {BentoWorkRuntime} from './bento-commit';
export function ensureBentoExpedition(save:SaveData):BentoExpeditionState{return save.bentoExpedition??={version:1,health:100,grace:0,cooldown:0};}
export function joinBentoTrip(save:SaveData):void{
 const trip=save.bentoTravel?.trip;if(!trip||trip.purpose)return;const s=ensureBentoExpedition(save);s.party={tripDay:trip.day,mode:'guide',status:'active',separation:0,waiting:0,regrouping:false};delete s.invitation;resumeMineMissions(save);
}
export function endBentoParty(save:SaveData,reason:BentoPartyEnd):void{const p=save.bentoExpedition?.party;if(p?.status==='active'){pauseMineMissions(save);p.status='ended';p.reason=reason;p.regrouping=false;delete p.goal;delete p.goalArea;}}
export const activeBentoParty=(save:SaveData)=>{const p=save.bentoExpedition?.party;return p?.status==='active'&&p.tripDay===save.bentoTravel?.trip?.day?p:undefined;};
export type BentoCommand='invite'|'cancel-invite'|'join'|'follow'|'guide'|'wait'|'return'|'dismiss';
export function bentoCommandOptions(save:SaveData):Array<{id:BentoCommand;label:string;enabled:boolean}>{
 const trip=save.bentoTravel?.trip,p=activeBentoParty(save),inside=trip?.area==='mining'||trip?.area==='mine',leaving=!!trip&&(p?.mode==='return'||save.bentoExpedition?.safety?.returning||!p&&trip.leg.includes('back')||['unload','settle'].includes(trip.leg)),safe=!save.bentoExpedition?.safety;
 if(!trip||trip.purpose)return[{id:save.bentoExpedition?.invitation?'cancel-invite':'invite',label:save.bentoExpedition?.invitation?'Cancelar combinação':'Quero acompanhar sua próxima ida à mina',enabled:true}];
 if(leaving&&!p)return[];
 if(!p)return[{id:'join',label:'Posso te acompanhar?',enabled:safe&&!leaving}];
 return[{id:'follow',label:'Me acompanhe',enabled:!!inside&&safe&&!leaving},{id:'guide',label:inside?'Mostre o caminho':'Vamos seguir seu caminho',enabled:safe&&!leaving},{id:'wait',label:'Espere aqui',enabled:safe&&!leaving},{id:'return',label:'Vamos voltar',enabled:!leaving},{id:'dismiss',label:'Vou continuar por conta própria',enabled:true}];
}
/** Commands are durable before becoming visible, and never move either actor. */
export function commandBento(save:SaveData,command:BentoCommand,player:TilePoint,runtime:BentoWorkRuntime):{ok:boolean;message:string}{
 const option=bentoCommandOptions(save).find(o=>o.id===command);if(!option?.enabled)return{ok:false,message:'Bento não pode fazer isso neste momento.'};
 const trip=save.bentoTravel?.trip,r=save.villageRoutines?.bento,area=bentoPlayerSpace(save),actor=trip??r;
 if(!actor||Math.hypot(actor.x-player.x,actor.y-player.y)>B.talkDistance||(trip?trip.area!==area:area!=='shop'&&area!=='village'))return{ok:false,message:'Aproxime-se de Bento para combinar a expedição.'};
 const draft=structuredClone(save),s=ensureBentoExpedition(draft),t=draft.bentoTravel?.trip;
 let message='Combinado. Sigo com você.';
 if(command==='invite'){s.invitation={day:save.day};message='Combinado. Na minha próxima viagem à mina, você pode vir comigo. Saio entre 07:00 e 09:00.';}
 else if(command==='cancel-invite'){delete s.invitation;message='Tudo bem. Vou seguir minha rotina.';}
 else if(command==='join'){joinBentoTrip(draft);message='Pode vir. Eu guio a viagem; nas galerias você pode escolher o caminho.';}
 else if(command==='dismiss'){endBentoParty(draft,'dismissed');if(t){changeBentoLeg(t,bentoReturnLeg(t.area));if(draft.bentoWork)delete draft.bentoWork.mining;}message='Tudo bem. Vou voltar para a vila. Pode continuar explorando.';}
 else if(t&&s.party){
  const p=s.party;p.mode=command as BentoPartyMode;p.separation=0;p.waiting=0;p.regrouping=false;delete p.goal;delete p.goalArea;t.route=[];t.index=0;t.moving=false;t.wait=0;
  if(draft.bentoWork)delete draft.bentoWork.mining;
  if(command==='guide'&&t.area==='mining')changeBentoLeg(t,'survey');if(command==='guide'&&t.area==='mine')changeBentoLeg(t,'hall-out');
  if(command==='return'){changeBentoLeg(t,bentoReturnLeg(t.area));message='Vamos voltar pelos caminhos que usamos para chegar.';}
  if(command==='wait')message='Espero aqui. Se precisar recuar por segurança ou anoitecer, volto para a vila.';
  if(command==='follow')message='Você escolhe o caminho. Só vou seguir por passagens livres e seguras.';
 }
 try{if(!runtime.write(draft))return{ok:false,message:'Não foi possível salvar. A combinação foi preservada como estava.'};}catch{return{ok:false,message:'Não foi possível salvar. Tente novamente.'};}
 save.npcSocial=draft.npcSocial;save.mineMissions=draft.mineMissions;save.bentoExpedition=draft.bentoExpedition;save.bentoTravel=draft.bentoTravel;save.bentoWork=draft.bentoWork;return{ok:true,message};
}
function followGoal(save:SaveData,t:BentoTrip,player:TilePoint):TilePoint|undefined{
 const nav=bentoMapNavigation(save,t.area,{mode:'follow',player});const points:TilePoint[]=[];
 for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++){const p={x:(Math.floor((player.x-nav.origin.x)/nav.tile)+x+.5)*nav.tile+nav.origin.x,y:(Math.floor((player.y-nav.origin.y)/nav.tile)+y+.5)*nav.tile+nav.origin.y};if(Math.hypot(p.x-player.x,p.y-player.y)<28||Math.hypot(p.x-player.x,p.y-player.y)>72||!nav.fits(p))continue;points.push(p);}
 points.sort((a,b)=>Math.hypot(a.x-t.x,a.y-t.y)-Math.hypot(b.x-t.x,b.y-t.y));return points[0];
}
/** Returns true when companionship owns this tick; the original route remains authoritative otherwise. */
export function stepBentoParty(save:SaveData,t:BentoTrip,seconds:number,player?:TilePoint):boolean{
 const p=activeBentoParty(save);if(!p||t.purpose)return false;
 const dt=Math.min(.1,seconds),same=bentoPlayerSpace(save)===t.area&&!!player,d=same?Math.hypot(t.x-player!.x,t.y-player!.y):Infinity;
 if(d> B.regroupDistance){p.separation=Math.min(B.separationSeconds+.1,p.separation+dt);p.regrouping=true;}else{p.separation=0;p.regrouping=false;}
 if(p.separation>=B.separationSeconds){endBentoParty(save,'separated');if(save.bentoWork)delete save.bentoWork.mining;changeBentoLeg(t,bentoReturnLeg(t.area));return false;}
 const deadline=(t.day-1)*1440+BENTO_WEEKLY_PLAN.latestReturn;if((save.day-1)*1440+save.time>=deadline){endBentoParty(save,'time');changeBentoLeg(t,bentoReturnLeg(t.area));return false;}
 if(same&&d<=B.talkDistance&&t.area!=='shop'&&(t.distance>24||t.area==='mine'||t.area==='mining'))recordSocialMemory(save,'bento','first-trip',1,undefined,save.day,1);
 if(p.mode==='wait'){p.waiting=Math.min(1440,p.waiting+dt);t.moving=false;return true;}
 if(p.mode==='guide'||p.mode==='return')return p.regrouping;
 if(t.area!=='mine'&&t.area!=='mining'){p.mode='guide';return p.regrouping;}
 if(!same){
  const area=bentoPlayerSpace(save);if(t.area==='mining'&&area==='mine'){if(t.leg!=='mining-back')changeBentoLeg(t,'mining-back');return false;}
  if(t.area==='mine'&&area==='mining'){if(t.leg!=='hall-out')changeBentoLeg(t,'hall-out');return false;}
  if(t.area==='mine'&&area!=='mining'){if(t.leg!=='hall-back')changeBentoLeg(t,'hall-back');return false;}
  t.moving=false;return true;
 }
 if(p.waiting>=B.separationSeconds){endBentoParty(save,'separated');changeBentoLeg(t,bentoReturnLeg(t.area));return false;}
 if(d<=B.followDistance){p.waiting=0;t.route=[];t.index=0;t.moving=false;delete p.goal;return true;}
 const options={mode:'follow' as const,player,avoid:player},nav=bentoMapNavigation(save,t.area,options);
 if(!p.goal||p.goalArea!==t.area||Math.hypot(p.goal.x-player!.x,p.goal.y-player!.y)>100||!nav.fits(p.goal)){p.goal=followGoal(save,t,player!);p.goalArea=t.area;t.route=[];t.index=0;}
 if(!p.goal){p.waiting=Math.min(1440,p.waiting+dt);t.moving=false;p.regrouping=true;p.separation=Math.min(B.separationSeconds+.1,p.separation+dt);return true;}
 if(!t.route.length){const result=planBentoRoute(save,t,p.goal,options);if(result.planning){p.waiting=Math.min(1440,p.waiting+dt);return true;}t.route=result.route;t.index=0;if(!t.route.length){p.waiting=Math.min(1440,p.waiting+dt);delete p.goal;p.regrouping=true;return true;}}
 const moved=advanceWorldRoute(t,dt,BENTO_WEEKLY_PLAN.speed,(to,from)=>bentoActorFits(save,t,to,player,nav)&&nav.allows(from,to));
 if(moved.blocked){p.waiting=Math.min(1440,p.waiting+dt);t.route=[];t.index=0;delete p.goal;p.regrouping=true;}else if(t.moving)p.waiting=0;return true;
}
