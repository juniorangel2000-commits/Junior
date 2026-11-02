import type {SaveData} from './types';
import type {GameUI} from './ui';
import type {SurvivorTaskKind} from './systems/survivor-camp';
import {SURVIVOR_TASKS,askSurvivorHelp,collectSurvivorHelp} from './systems/survivor-residents';
export function showSurvivorHelp(ui:GameUI,save:SaveData,id:string,write:(draft:SaveData)=>boolean,onChange:()=>void=()=>{}):void {
 const p=save.survivorCamp?.residents.find(p=>p.id===id);if(!p)return;
 ui.showSceneEditor(host=>{
  const panel=document.createElement('section');panel.className='panel camp-dialog';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',`Conversar com ${p.name}`);
  panel.innerHTML='<div class="modal-heading"><div><span class="eyebrow">CASA COMUNITÁRIA · VILA DO RECOMEÇO</span><h2 data-name></h2></div><button class="icon-button" data-close aria-label="Fechar conversa">×</button></div><p data-speech></p><div data-options class="camp-help-options"></div><p data-feedback role="status"></p><div class="pause-actions"><button class="button button-light" data-close>Até mais</button></div>';
  panel.querySelector('[data-name]')!.textContent=p.name;
  const speech=panel.querySelector('[data-speech]')!,options=panel.querySelector('[data-options]')!,feedback=panel.querySelector('[data-feedback]')!;
  speech.textContent=!p.settled?'Obrigado por me acolher. Vou seguir a pé até a casa comunitária da vila. Precisa de ajuda com alguma tarefa depois que eu chegar?':p.task?.phase==='ready'?'Voltei! Podemos conversar sobre o que você pediu.':p.task?'Estou cuidando do que você pediu. Depois volto para a casa comunitária.':'Estou morando na casa comunitária. No que posso ajudar hoje?';
  const action=(label:string,description:string,run:()=>{ok:boolean;message:string})=>{const b=document.createElement('button');b.className='button button-light';b.textContent=label;const detail=document.createElement('small');detail.textContent=description;b.append(document.createElement('br'),detail);b.onclick=()=>{const result=run();feedback.textContent=result.message;if(result.ok){onChange();ui.closeModal();ui.toast(result.message);showSurvivorHelp(ui,save,id,write,onChange);}};options.append(b);};
  if(p.task?.phase==='ready')action('Como foi a tarefa?',p.task.message??SURVIVOR_TASKS[p.task.kind].description,()=>collectSurvivorHelp(save,id,write));
  else if(!p.task)for(const[kind,t]of Object.entries(SURVIVOR_TASKS))action(`Pode ${t.label.toLowerCase()}?`,t.description,()=>askSurvivorHelp(save,id,kind as SurvivorTaskKind,write));
  host.append(panel);panel.querySelectorAll<HTMLButtonElement>('[data-close]').forEach(b=>b.onclick=()=>ui.closeModal());panel.querySelector<HTMLButtonElement>('button')!.focus();return()=>panel.remove();
 });
}
