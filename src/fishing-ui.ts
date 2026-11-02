import {fishingSupplyIcon} from './data/fishing-supplies';
import {BAITS,RODS,fishingConditions} from './systems/fishing-progress';
import {fishingFloatMotion} from './data/fishing-float';
import {fishingResultMarkup} from './fishing-result';
import type {SaveData} from './types';
import {FishingSession,beginFishingCast,collectFishingCatch,FISHING_RULES} from './systems/fishing';
import {saveGame} from './systems/save';
import {gameAudio} from './audio';
import './fishing.css';

let active:Promise<string>|undefined;
const random=()=>{const n=new Uint32Array(1);crypto.getRandomValues(n);return n[0]/4294967296;};
const fishIcon='<svg viewBox="0 0 28 18" aria-hidden="true"><path d="M6 9 1 3v12Zm0 0c3-9 16-9 21 0-5 9-18 9-21 0Z" fill="currentColor"/><path d="m13 4 4-4 3 5M12 14l5 4 3-5" fill="currentColor"/><rect x="22" y="6" width="2" height="2" fill="#173d40"/></svg>';

/** A single paused-world session. The cast and the catch each save an atomic draft. */
export function fishAtBank(save:SaveData,net:boolean,onChange:()=>void,visual?:{ready?:boolean;start:()=>Promise<boolean>;destroy:()=>void;signal?:AbortSignal}):Promise<string>{
 if(active)return active;
 if(visual?.ready===false){visual.destroy();return Promise.resolve(net?'Procure um trecho com água livre para abrir a rede inteira. A isca foi preservada.':'Aproxime-se de um trecho com água livre para lançar a linha. A isca foi preservada.');}
 const session=new FishingSession(save.villageProgress?.fishingSkill??0,net,save.inventory.accessory>0,random,save.activeArea==='fishingLake'?'lake':'other',{rodTier:save.fishingProgress?.rodTier,bait:save.fishingProgress?.bait,time:save.time,day:save.day});
 const cast=beginFishingCast(save,net,session.reward,saveGame);
 if(!cast.ok){visual?.destroy();return Promise.resolve(cast.message);}
 onChange();if(!visual)gameAudio.play('fishing-cast');
 let released=false;const releaseVisual=()=>{if(!released){released=true;visual?.destroy();}};
 active=(async()=>{try{
  if(visual){
   const cancelCast=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();releaseVisual();}};
   window.addEventListener('keydown',cancelCast,true);
   let started=false;try{started=await visual.start();}finally{window.removeEventListener('keydown',cancelCast,true);}
   if(!started||visual.signal?.aborted)return 'Lançamento encerrado. A isca foi utilizada.';
  }
  return await showFishing(save,session,onChange,!!visual,releaseVisual,visual?.signal);
 }finally{releaseVisual();}})().finally(()=>{active=undefined;});return active;
}
function showFishing(save:SaveData,session:FishingSession,onChange:()=>void,worldView=false,onResult:()=>void=()=>{},signal?:AbortSignal):Promise<string>{
 return new Promise(resolve=>{
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:undefined;
  const layer=document.createElement('div');layer.className='village-layer fishing-layer'+(worldView?' fishing-world-view':'');
  const location={property:'Propriedade',forest:'Floresta Antiga',village:'Vila do Recomeço',cityForest:'Floresta de Acesso à Cidade',fishingLake:'Lago entre as Serras',highland:'Alto da Serra',survivorCamp:'Acampamento de Sobreviventes'}[save.activeArea??'property'];
  layer.innerHTML=`<section class="village-panel fishing-panel" role="dialog" aria-modal="true" aria-labelledby="fishing-title" tabindex="-1">
   <div class="fishing-main"><header class="village-panel-heading"><div><span class="village-eyebrow">${location}</span><h2 id="fishing-title">Pescaria</h2><p class="village-npc-role">${session.net?`<img class="fishing-equipment-icon" src="${fishingSupplyIcon('net')}" alt=""/>`:''}${session.net?'Rede · até dois peixes':RODS[save.fishingProgress?.rodTier??0]+' · '+BAITS[save.fishingProgress?.bait??'worm'].name}</p></div><button type="button" class="village-close" data-fishing-cancel aria-label="Cancelar pesca">×</button></header>
   <div class="fishing-body"><p class="fishing-status" data-fishing-prompt role="status" aria-live="polite">A linha está na água. Observe a boia…</p>
    <div class="fishing-play-area"><div class="fishing-water" aria-hidden="true"><div class="fishing-bank"></div><svg class="fishing-line-svg" aria-hidden="true"><path data-float-line fill="none" stroke="#e8ddbb" stroke-width="1" opacity=".8"/></svg><svg class="fishing-float-svg" viewBox="-40 -35 80 70" aria-hidden="true"><defs><clipPath id="fishing-float-above"><rect x="-40" y="-35" width="80" height="35"/></clipPath><clipPath id="fishing-float-below"><rect x="-40" y="0" width="80" height="35"/></clipPath><g id="fishing-float-shape"><path d="M0-24v9" stroke="#e9dbaf" stroke-width="2"/><rect x="-5" y="-15" width="10" height="20" rx="4" fill="#c95743" stroke="#653b2c" stroke-width="1.5"/><path d="M-4-7v-4a4 4 0 0 1 8 0v4Z" fill="#f4ebce"/><path d="M-2-10v5" stroke="#fff6da" opacity=".65"/></g></defs><ellipse cx="0" cy="1" rx="9" ry="2.5" fill="#163a43" opacity=".3"/><g class="fishing-float-rings">${[0,1,2].map(()=>'<ellipse cx="0" cy="0" rx="8" ry="2" fill="none" stroke="#d6eee2" stroke-width=".8"/>').join('')}</g><g clip-path="url(#fishing-float-below)" opacity=".3"><use href="#fishing-float-shape" data-float-body/></g><g clip-path="url(#fishing-float-above)"><use href="#fishing-float-shape" data-float-body/></g><path d="M-7 0q7 2 14 0" fill="none" stroke="#c7e1d4" stroke-width=".8" opacity=".55"/></svg><div class="fishing-water-fish">${fishIcon}</div><span class="fishing-water-caption">Aguarde...</span></div>
     <div class="fishing-track-wrap" hidden><span class="fishing-track-label">Acompanhe o peixe</span><div class="fishing-track" role="img" aria-label="Peixe e faixa de controle"><div class="fishing-band"></div><span class="fishing-target">${fishIcon}</span><span class="fishing-track-top">↑ segurar</span><span class="fishing-track-bottom">↓ soltar</span></div></div></div>
    <p class="fishing-instructions" hidden></p>
    <div class="fishing-hook-timer" hidden role="progressbar" aria-label="Tempo para fisgar" aria-valuemin="0" aria-valuemax="3"><span></span></div>
    <div class="fishing-capture" hidden><div><span>Captura</span><strong data-fishing-percent>28%</strong></div><div class="fishing-capture-track" role="progressbar" aria-label="Progresso da captura" aria-valuemin="0" aria-valuemax="100"><span></span></div></div>
    <p class="fishing-feedback" role="status" aria-live="polite"></p>
    <button type="button" class="village-primary fishing-control" data-fishing-reel disabled>Aguarde...</button>
   </div><footer class="fishing-footer"><span>${BAITS[save.fishingProgress?.bait??'worm'].cost} ${BAITS[save.fishingProgress?.bait??'worm'].cost===1?'isca':'iscas'} e ${FISHING_RULES.vigorCost} de vigor utilizados</span><span>${fishingConditions(save.day,save.time)} · <kbd>Esc</kbd> desistir</span></footer></div>
   <div class="fishing-pause" hidden><span>Ⅱ</span><h3>Pescaria pausada</h3><p>Continue quando estiver pronto. A linha está segura.</p><button type="button" class="village-primary" data-fishing-resume>Continuar pescaria</button><button type="button" class="fishing-pause-cancel" data-fishing-cancel>Encerrar pescaria</button></div>
  </section>`;
  (document.querySelector('#ui')??document.body).append(layer);
  const get=<T extends HTMLElement=HTMLElement>(selector:string)=>layer.querySelector<T>(selector)!;
  const panel=get('.fishing-panel'),main=get('.fishing-main'),prompt=get('[data-fishing-prompt]'),button=get<HTMLButtonElement>('[data-fishing-reel]'),resume=get<HTMLButtonElement>('[data-fishing-resume]'),pausePanel=get('.fishing-pause');
  const track=get('.fishing-track'),band=get('.fishing-band'),target=get('.fishing-target'),capture=get('.fishing-capture-track'),captureFill=get('.fishing-capture-track span'),percent=get('[data-fishing-percent]'),hookMeter=get('.fishing-hook-timer'),hookFill=get('.fishing-hook-timer span'),feedback=get('.fishing-feedback');
  const water=get('.fishing-water'),float=get('.fishing-float-svg'),line=get<SVGElement&HTMLElement>('[data-float-line]'),floatBodies=layer.querySelectorAll<SVGUseElement>('[data-float-body]'),rings=layer.querySelectorAll<SVGEllipseElement>('.fishing-float-rings ellipse'),reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const events=new AbortController(),held=new Set<string>();let frame=0,last=performance.now(),finished=false,paused=false,phase=session.phase,collecting=false,visualSeconds=0,outcome=false,resultMessage='',resultReady=0;
  const finish=(message:string)=>{if(finished)return;finished=true;cancelAnimationFrame(frame);events.abort();held.clear();layer.remove();if(previous?.isConnected&&!document.hidden)previous.focus();resolve(message);};
  const closeResult=()=>{if(outcome)finish(resultMessage);};
  const showResult=()=>{if(outcome||finished)return;outcome=true;held.clear();cancelAnimationFrame(frame);onResult();const result=fishingResultMarkup(session);resultMessage=result.message;resultReady=performance.now()+350;main.hidden=true;pausePanel.hidden=true;panel.classList.remove('is-paused');panel.classList.add('is-result');panel.dataset.fishingOutcome=result.outcome;panel.setAttribute('aria-labelledby','fishing-result-title');const card=document.createElement('div');card.className='fishing-result';card.innerHTML=result.html;panel.append(card);card.querySelectorAll<HTMLButtonElement>('[data-fishing-result-close]').forEach(b=>b.addEventListener('click',()=>{if(performance.now()>=resultReady)closeResult();},{signal:events.signal}));card.querySelector<HTMLButtonElement>('footer button')!.focus();};
  const cancel=()=>{if(outcome){closeResult();return;}session.cancel();finish('Pesca encerrada. A isca foi utilizada.');};
  const collect=()=>{if(finished||collecting||session.phase!=='caught')return;collecting=true;const result=collectFishingCatch(save,session.net,session.reward,saveGame);if(result.ok){try{onChange();gameAudio.play('pickup');}finally{showResult();}}else{collecting=false;feedback.textContent=result.message;button.textContent='Tentar guardar a captura novamente';button.disabled=false;}};
  const render=()=>{
   if(outcome||finished)return;
   const motion=fishingFloatMotion(visualSeconds,session.phase,held.size>0,session.fish,reduced),w=water.clientWidth,h=water.clientHeight,angle=motion.angle*Math.PI/180;
   float.style.left=`calc(58% + ${motion.x}px)`;float.style.top=`calc(61% + ${motion.surfaceY}px)`;
   floatBodies.forEach(b=>b.setAttribute('transform',`translate(0 ${motion.dip}) rotate(${motion.angle})`));rings.forEach((ring,i)=>{const r=motion.rings[i];ring.setAttribute('rx',String(r.rx));ring.setAttribute('ry',String(r.ry));ring.setAttribute('opacity',String(r.alpha));});
   const endX=w*.58+motion.x+Math.sin(angle)*24,endY=h*.61+motion.surfaceY+motion.dip-Math.cos(angle)*24,slack=1-motion.tension;
   get('.fishing-line-svg').setAttribute('viewBox',`0 0 ${w} ${h}`);line.setAttribute('d',`M ${w*.24} ${h*.1} Q ${(w*.24+endX)/2+slack*25} ${(h*.1+endY)/2+slack*20} ${endX} ${endY}`);
   panel.dataset.phase=session.phase;
   if(session.phase!==phase){
    phase=session.phase;
    if(phase==='bite'){prompt.textContent='Mordeu! Você tem 3 segundos para fisgar.';button.textContent='Fisgar! · E / Espaço / Clique';button.disabled=false;get('.fishing-instructions').hidden=false;get('.fishing-instructions').textContent='Aperte uma vez para começar a disputa.';hookMeter.hidden=false;gameAudio.play('ui');}
    if(phase==='fighting'){prompt.textContent='Acompanhe o movimento dentro da faixa verde.';button.textContent='Segure para subir · solte para descer';button.disabled=false;get('.fishing-instructions').textContent='Segure E, Espaço ou este botão. Dentro da faixa, a captura avança.';get('.fishing-track-wrap').hidden=false;get('.fishing-capture').hidden=false;hookMeter.hidden=true;get('.fishing-water-caption').textContent='Algo na linha';}

    if(phase==='caught'){prompt.textContent='Você conseguiu! Guardando a captura…';button.disabled=true;hookMeter.hidden=true;collect();}
    if(phase==='escaped'){showResult();return;}
   }
   if(session.phase==='bite'){hookFill.style.width=`${session.biteRemaining/3*100}%`;hookMeter.setAttribute('aria-valuenow',session.biteRemaining.toFixed(1));}
   if(session.phase==='fighting'||session.phase==='caught'){
    band.style.height=`${session.bandSize*100}%`;band.style.bottom=`${(session.band-session.bandSize/2)*100}%`;target.style.bottom=`${session.fish*100}%`;
    const inside=Math.abs(session.fish-session.band)<=session.bandSize/2;track.classList.toggle('is-tracking',inside);button.classList.toggle('is-held',held.size>0);
    const value=Math.round(session.progress*100);captureFill.style.width=value+'%';percent.textContent=value+'%';capture.setAttribute('aria-valuenow',String(value));
   }
  };
  const advance=(now:number)=>{const dt=Math.max(0,(now-last)/1000);last=now;if(!paused&&!finished&&!outcome){visualSeconds+=dt;session.step(dt,held.size>0);render();}};
  const act=()=>{if(paused||finished||outcome)return;advance(performance.now());if(session.phase==='bite'){session.hook();render();}else if(session.phase==='caught')collect();};
  const pause=()=>{if(finished||paused||outcome)return;advance(performance.now());if(finished||outcome)return;paused=true;held.clear();main.inert=true;pausePanel.hidden=false;panel.classList.add('is-paused');};
  resume.addEventListener('click',()=>{paused=false;held.clear();last=performance.now();main.inert=false;pausePanel.hidden=true;panel.classList.remove('is-paused');button.disabled?panel.focus():button.focus();},{signal:events.signal});
  layer.querySelectorAll('[data-fishing-cancel]').forEach(b=>b.addEventListener('click',cancel,{signal:events.signal}));
  const key=(event:KeyboardEvent)=>{
   event.stopImmediatePropagation();
   if(event.key==='Escape'){event.preventDefault();cancel();return;}
   if(event.key==='Tab'){
    const controls=[...layer.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')].filter(b=>b.getClientRects().length&&!b.closest('[inert]')),first=controls[0],end=controls[controls.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();end?.focus();}else if(!event.shiftKey&&document.activeElement===end){event.preventDefault();first?.focus();}return;
   }
   if(outcome){if(['Enter','KeyE','Space'].includes(event.code)){event.preventDefault();if(!event.repeat&&performance.now()>=resultReady)closeResult();}return;}
   if(paused)return;
   if(event.code==='KeyE'||event.code==='Space'){event.preventDefault();if(!event.repeat)act();if(session.phase==='fighting')held.add(event.code);}
  };
  window.addEventListener('keydown',key,{capture:true,signal:events.signal});
  window.addEventListener('keyup',event=>{event.stopImmediatePropagation();held.delete(event.code);},{capture:true,signal:events.signal});
  button.addEventListener('pointerdown',event=>{if(event.button!==0||paused)return;event.preventDefault();act();if(session.phase==='fighting'){held.add('pointer');button.setPointerCapture(event.pointerId);}},{signal:events.signal});
  window.addEventListener('pointerup',()=>held.delete('pointer'),{capture:true,signal:events.signal});button.addEventListener('lostpointercapture',()=>held.delete('pointer'),{signal:events.signal});button.addEventListener('pointercancel',()=>held.delete('pointer'),{signal:events.signal});
  button.addEventListener('click',()=>{if(session.phase!=='fighting')act();},{signal:events.signal});
  layer.addEventListener('pointerdown',event=>event.stopPropagation(),{signal:events.signal});layer.addEventListener('pointerup',event=>event.stopPropagation(),{signal:events.signal});layer.addEventListener('contextmenu',event=>{event.preventDefault();event.stopPropagation();},{signal:events.signal});
  window.addEventListener('blur',pause,{signal:events.signal});window.addEventListener('focus',()=>{if(paused)resume.focus();},{signal:events.signal});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();},{signal:events.signal});window.addEventListener('pagehide',cancel,{capture:true,signal:events.signal});
  signal?.addEventListener('abort',()=>{if(!outcome)cancel();},{once:true,signal:events.signal});if(signal?.aborted){cancel();return;}
  const tick=(now:number)=>{if(finished)return;advance(now);if(!finished&&!outcome)frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);if(document.hidden)pause();get<HTMLButtonElement>('[data-fishing-cancel]').focus();
 });
}
