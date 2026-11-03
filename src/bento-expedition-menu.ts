import {createSocialRuntime,openSocialConversation} from './systems/npc-social';
import {showMineMissionJournal} from './mine-mission-journal';
import type {SaveData,TilePoint} from './types';
import type {GameUI} from './ui';
import type {BentoWorkRuntime} from './systems/bento-commit';
import {bentoCommandOptions,commandBento,activeBentoParty} from './systems/bento-expedition';
import type {BentoPartyEnd} from './systems/bento-expedition-state';
import './bento-expedition.css';
export function bentoExpeditionStatus(save:SaveData):string{
 const s=save.bentoExpedition,p=activeBentoParty(save);
 if(s?.safety?.returning)return 'Bento está recuando para sair da mina com segurança.';
 if(s?.safety)return 'Bento está procurando uma passagem segura.';
 if(p?.regrouping)return p.mode==='follow'?'Bento está tentando alcançar você por uma passagem segura.':'Bento espera você alcançar o grupo.';
 if(p)return({guide:'Bento guia o caminho. Você pode acompanhar ou explorar por conta própria.',follow:'Você escolhe o caminho. Bento acompanha por passagens livres e iluminadas.',wait:'Bento espera aqui, enquanto o local estiver seguro.',return:'Vocês estão voltando para a vila.'})[p.mode];
 if(s?.party?.status==='ended'){const messages:Record<BentoPartyEnd,string>={separated:'Vocês se separaram. Bento está voltando para a vila; você pode continuar explorando.',danger:'Bento precisou recuar. Sua exploração pode continuar.',returned:'Bento concluiu a expedição e retomou a rotina.',dismissed:'Bento segue por conta própria. Você pode continuar explorando.',time:'Bento encerrou a expedição de hoje e está voltando.'};return messages[s.party.reason??'returned'];}
 return s?.invitation?'A próxima viagem de Bento está combinada com você. Ele segue a rotina semanal e sai entre 07:00 e 09:00.':'Bento visita a mina em alguns dias da semana. Você pode combinar a próxima viagem ou se juntar a ele durante o caminho.';
}
export function showBentoExpedition(ui:GameUI,save:()=>SaveData,player:()=>TilePoint,runtime:BentoWorkRuntime,portrait?:string):void{
 const social=openSocialConversation(createSocialRuntime(()=>save(),runtime.write,save),'bento');
 ui.showSceneEditor(host=>{
  const panel=document.createElement('section');panel.className='panel bento-expedition-card';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Expedição com Bento');
  panel.innerHTML='<div class="bento-expedition-heading"><div><span class="eyebrow">PELOS CAMINHOS DA MINA</span><h2>Uma expedição com Bento</h2></div></div><p data-bento-status></p><p class="bento-expedition-note" data-bento-note></p><div class="bento-expedition-actions"></div><p class="bento-expedition-feedback" aria-live="polite"></p><button class="button button-light" data-bento-close>Continuar</button>';
  if(portrait){const image=document.createElement('img');image.src=portrait;image.alt='Bento';panel.querySelector('.bento-expedition-heading')!.prepend(image);}
  const note=document.createElement('p');note.className='bento-expedition-note';note.dataset.socialNpc='bento';note.textContent=[social.greeting,social.memory].filter(Boolean).join(' ');panel.querySelector('.bento-expedition-heading')!.after(note);
  const feedback=panel.querySelector<HTMLElement>('.bento-expedition-feedback')!;
  const draw=()=>{const current=save(),trip=current.bentoTravel?.trip;panel.querySelector('[data-bento-status]')!.textContent=bentoExpeditionStatus(current);panel.querySelector('[data-bento-note]')!.textContent=trip?.area==='mining'||trip?.area==='mine'?'Nas galerias, você pode liderar, pedir orientação ou deixar Bento esperando. Perigos podem exigir uma retirada.':'Durante a viagem, Bento guia o grupo. Caminhe junto e atravesse as passagens normalmente.';
   const actions=panel.querySelector('.bento-expedition-actions')!;actions.replaceChildren();for(const option of bentoCommandOptions(current)){const button=document.createElement('button');button.type='button';button.className='button button-primary';button.textContent=option.label;button.dataset.bentoCommand=option.id;button.disabled=!option.enabled;button.onclick=()=>{const result=commandBento(save(),option.id,player(),runtime);feedback.textContent=result.message;if(result.ok)draw();};actions.append(button);}
   if(runtime.missions){const b=document.createElement('button');b.className='button button-light';b.textContent='Pedidos e descobertas da mina';b.dataset.mineRequests='';b.onclick=()=>{ui.closeModal();showMineMissionJournal(ui,runtime.missions!);};actions.append(b);}
  };draw();host.append(panel);panel.querySelector('[data-bento-close]')!.addEventListener('click',()=>ui.closeModal());panel.querySelector<HTMLButtonElement>('[data-bento-close]')!.focus();return()=>panel.remove();
 });
}
