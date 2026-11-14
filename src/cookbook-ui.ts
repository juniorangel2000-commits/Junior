import './cookbook.css';
import type {SaveData} from './types';
import {DISH_RECIPES,STOVE_FUEL} from './data/kitchen';
import {knownDishes,dishIngredients,canCookDish} from './systems/kitchen';
import {itemIconUrl} from './visual-assets';
const esc=(t:string)=>t.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]!);
const img=(id:string,cls:string)=>{const url=itemIconUrl(id);return url?`<img class="${cls}" src="${url}" alt="">`:'';};
/** Caderno de receitas, aberto no fogão a lenha. Mostra as receitas aprendidas com o que
 * falta de cada ingrediente; `onCook` cozinha e devolve a mensagem para a barra de status. */
export function renderCookbook(panel:HTMLElement,save:()=>SaveData,onCook:(id:string)=>{ok:boolean;message:string},onClose:()=>void):void{
 let status='Cada prato gasta 1 madeira como lenha, além dos ingredientes.',error=false;
 const draw=()=>{
  const s=save(),known=knownDishes(s);
  const cards=known.map(r=>{const parts=dishIngredients(s,r),ready=canCookDish(s,r);
   return`<article class="cookbook-recipe${ready?' is-ready':''}"><div class="cookbook-title">${img(r.id,'cookbook-dish')}<div><h3>${esc(r.name)}</h3><small>+${r.vigor} de vigor · na mochila: ${s.inventory[r.id]??0}</small></div></div>
    <ul class="cookbook-ingredients">${parts.map(i=>`<li class="${i.have>=i.need?'has':'missing'}" title="${esc(i.future??'')}">${img(i.item,'cookbook-icon')}<span>${esc(i.name)}${i.item===STOVE_FUEL?' (lenha)':''}</span><b>${Math.min(i.have,i.need)}/${i.need}</b>${i.future&&i.have<i.need?`<em>${esc(i.future)}</em>`:''}</li>`).join('')}</ul>
    <button class="button ${ready?'button-primary':'button-light'}" data-cook="${r.id}" ${ready?'':'disabled'}>Cozinhar</button></article>`;}).join('');
  const missing=DISH_RECIPES.length-known.length;
  panel.innerHTML=`<div class="modal-heading"><div><span class="eyebrow">FOGÃO A LENHA</span><h2>Caderno de receitas</h2></div><button class="icon-button" aria-label="Fechar caderno" data-cook-close>×</button></div>
   ${known.length?`<div class="cookbook-list">${cards}</div>`:'<p class="cookbook-empty">Nenhuma receita ainda. A Helena ensina receitas na pousada, uma por vez.</p>'}
   ${missing&&known.length?`<p class="cookbook-more">${missing} ${missing===1?'receita ainda não aprendida':'receitas ainda não aprendidas'} · a Helena ensina na pousada.</p>`:''}
   <p class="cookbook-status${error?' is-error':''}" role="status">${esc(status)}</p>`;
  panel.querySelector('[data-cook-close]')!.addEventListener('click',onClose);
  for(const b of panel.querySelectorAll<HTMLButtonElement>('[data-cook]'))b.addEventListener('click',()=>{const r=onCook(b.dataset.cook!);status=r.message;error=!r.ok;draw();panel.querySelector<HTMLButtonElement>(`[data-cook="${b.dataset.cook}"]`)?.focus();});
 };
 draw();
}
