import {activateSavedGame,deleteSavedGame,listSavedGames,renameSavedGame} from './systems/save-library';
import './save-library.css';

export function createSaveLibraryPanel(host:HTMLElement,callbacks:{close():void;newGame():void;load():void}):()=>void{
 const panel=document.createElement('section');panel.className='panel save-library';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Partidas salvas');
 const content=document.createElement('div');
 content.innerHTML=`<header class="modal-heading"><div><span class="eyebrow">SUAS HISTÓRIAS NO VALE</span><h2>Partidas salvas</h2></div><button class="icon-button" data-library-close aria-label="Fechar partidas salvas">×</button></header><p>Cada partida tem seu próprio progresso. Criar uma nova mantém as anteriores.</p><button class="button button-light" data-library-new>Criar novo jogo</button><p class="save-library-feedback" role="status"></p><div class="save-library-list"></div>`;
 panel.append(content);
 const confirmation=document.createElement('div');confirmation.className='save-delete-confirm';confirmation.hidden=true;
 confirmation.innerHTML=`<header class="modal-heading"><div><span class="eyebrow">PARTIDAS SALVAS</span><h2>Excluir partida?</h2></div><button class="icon-button" data-library-delete-cancel aria-label="Cancelar exclusão">×</button></header>
  <p>Você está prestes a excluir esta história:</p><div class="save-delete-name"></div>
  <p class="save-delete-warning" id="save-delete-description">O progresso e todas as cópias de segurança desta partida serão apagados. <strong>Esta ação não pode ser desfeita.</strong></p>
  <p class="save-library-feedback" data-library-delete-feedback role="status"></p>
  <footer class="save-delete-actions"><button type="button" class="button button-light" data-library-delete-cancel>Cancelar</button><button type="button" class="button save-delete-danger" data-library-delete-confirm>Excluir partida</button></footer>`;
 panel.append(confirmation);host.replaceChildren(panel);
 let pendingDelete:string|undefined,deleteTrigger:HTMLButtonElement|undefined;
 const cancelDelete=()=>{
  pendingDelete=undefined;confirmation.hidden=true;content.hidden=false;panel.classList.remove('is-confirming-delete');
  panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Partidas salvas');panel.removeAttribute('aria-describedby');deleteTrigger?.focus();
 };
 confirmation.querySelectorAll<HTMLButtonElement>('[data-library-delete-cancel]').forEach(b=>b.onclick=cancelDelete);
 confirmation.querySelector<HTMLButtonElement>('[data-library-delete-confirm]')!.onclick=()=>{
  if(!pendingDelete)return;
  const result=deleteSavedGame(pendingDelete);
  if(!result.ok){confirmation.querySelector<HTMLElement>('[data-library-delete-feedback]')!.textContent=result.message;return;}
  cancelDelete();feedback.textContent=result.message;render();panel.querySelector<HTMLButtonElement>('[data-library-close]')!.focus();
 };
 const list=panel.querySelector<HTMLElement>('.save-library-list')!,feedback=panel.querySelector<HTMLElement>('[role=status]')!;
 const button=(label:string,action:()=>void)=>{const b=document.createElement('button');b.type='button';b.className='button button-light';b.textContent=label;b.onclick=action;return b;};
 const render=()=>{
  list.replaceChildren();const {games,error}=listSavedGames();
  if(error){feedback.textContent=error;return;}
  if(!games.length){const empty=document.createElement('p');empty.textContent='Você ainda não tem partidas salvas. Comece uma nova história.';list.append(empty);}
  for(const game of games){
   const card=document.createElement('article');card.className='saved-game';card.dataset.savedGame=game.id;
   const title=document.createElement('h3');title.textContent=game.name;
   const info=document.createElement('p'),data=game.read.data;
   const areas={property:'Propriedade',forest:'Floresta Antiga',village:'Vila',cityForest:'Estrada da cidade',fishingLake:'Lago entre as Serras'};
   info.textContent=data?`${data.profile.name} · Dia ${data.day} · ${areas[data.activeArea??'property']}${game.active?' · Última selecionada':''}`:'O arquivo foi mantido para que seu progresso não seja substituído.';
   const state=document.createElement('small');
   state.textContent=game.read.status==='recovered'?'Uma cópia de segurança está disponível.':game.read.status==='future'?'Criada em uma versão mais recente do jogo.':game.read.status==='valid'?'Pronta para continuar.':game.read.status==='unavailable'?'Armazenamento indisponível.':'Não foi possível ler esta partida.';
   const actions=document.createElement('div');actions.className='saved-game-actions';
   const load=button('Carregar',()=>{const result=activateSavedGame(game.id);if(result.ok)callbacks.load();else feedback.textContent=result.message;});load.disabled=!data;
   const rename=button('Renomear',()=>{
    const form=document.createElement('form');form.className='saved-game-rename';
    const label=document.createElement('label');label.textContent='Nome da partida';
    const input=document.createElement('input');input.value=game.name;input.maxLength=40;input.required=true;label.append(input);
    const submit=document.createElement('button');submit.type='submit';submit.className='button button-light';submit.textContent='Salvar nome';
    const cancel=button('Cancelar',render);
    form.append(label,submit,cancel);actions.replaceWith(form);input.focus();input.select();
    form.onsubmit=e=>{e.preventDefault();const result=renameSavedGame(game.id,input.value);feedback.textContent=result.message;if(result.ok)render();};
   });
   const remove=button('Excluir',()=>{
    pendingDelete=game.id;deleteTrigger=remove;
    confirmation.querySelector<HTMLElement>('.save-delete-name')!.textContent=game.name;
    confirmation.querySelector<HTMLElement>('[data-library-delete-feedback]')!.textContent='';
    content.hidden=true;confirmation.hidden=false;panel.classList.add('is-confirming-delete');
    panel.setAttribute('role','alertdialog');panel.setAttribute('aria-label','Excluir partida?');panel.setAttribute('aria-describedby','save-delete-description');
    confirmation.querySelector<HTMLButtonElement>('footer [data-library-delete-cancel]')!.focus();
   });remove.classList.add('saved-game-delete');
   actions.append(load,rename,remove);card.append(title,info,state,actions);list.append(card);
  }
 };
 panel.querySelector<HTMLButtonElement>('[data-library-close]')!.onclick=callbacks.close;
 panel.querySelector<HTMLButtonElement>('[data-library-new]')!.onclick=callbacks.newGame;
 const key=(event:KeyboardEvent)=>{
  if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();if(pendingDelete)cancelDelete();else callbacks.close();return;}
  if(event.key!=='Tab')return;
  const all=[...panel.querySelectorAll<HTMLElement>('button:not(:disabled), input')].filter(e=>e.getClientRects().length),first=all[0],last=all.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 };
 window.addEventListener('keydown',key,true);render();panel.querySelector<HTMLButtonElement>('[data-library-close]')!.focus();
 return()=>{window.removeEventListener('keydown',key,true);panel.remove();};
}
