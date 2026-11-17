import './cookbook.css';
import type {SaveData} from './types';
import {DISH_RECIPES,HIDDEN_DISH_HINTS,dishSource,type CookingStation} from './data/kitchen';
import {knownDishes,hiddenDishes,dishIngredients,canCookDish,STATION_NAMES} from './systems/kitchen';
import {DISH_EFFECT,FOOD_EFFECTS,activeFoodEffect} from './systems/food-effects';
import {farmClock} from './systems/farm-interior';
import {itemIconUrl} from './visual-assets';
const esc=(t:string)=>t.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]!);
const img=(id:string,cls:string)=>{const url=itemIconUrl(id);return url?`<img class="${cls}" src="${url}" alt="">`:'';};
export interface CookbookOptions{station:CookingStation;onPickUp?:()=>{ok:boolean;message:string};/** Chamado quando o caderno fecha (a fogueira acesa some). */onClose?:()=>void}
const TITLES:Record<CookingStation,[string,string,string]>={
 stove:['FOGÃO A LENHA','Caderno de receitas','Cozinhar'],
 oven:['FORNO DE BARRO','Fornada','Assar (meio dia)'],
 campfire:['FOGUEIRA PORTÁTIL','Assar na brasa','Assar'],
};
/** Caderno de receitas, aberto no fogão, no forno ou na fogueira. Mostra as receitas da estação
 * com o que falta de cada ingrediente, o efeito do prato e as receitas escondidas como "???". */
export function renderCookbook(panel:HTMLElement,save:()=>SaveData,onCook:(id:string)=>{ok:boolean;message:string},onClose:()=>void,options:CookbookOptions={station:'stove'}):void{
 const station=options.station,[eyebrow,title,action]=TITLES[station];
 let status=station==='oven'?'A fornada assa em meio dia e gasta 1 madeira de lenha.':'Cada prato gasta 1 madeira como lenha, além dos ingredientes.',error=false;
 const draw=()=>{
  const s=save(),known=knownDishes(s,station),hidden=hiddenDishes(s,station),effect=activeFoodEffect(s);
  const cards=known.map(r=>{const parts=dishIngredients(s,r),ready=canCookDish(s,r),fx=DISH_EFFECT[r.id];
   return`<article class="cookbook-recipe${ready?' is-ready':''}"><div class="cookbook-title">${img(r.id,'cookbook-dish')}<div><h3>${esc(r.name)}</h3><small>+${r.vigor} de vigor · na mochila: ${s.inventory[r.id]??0}</small>${fx?`<small class="cookbook-effect">${esc(FOOD_EFFECTS[fx].name)} · ${esc(FOOD_EFFECTS[fx].description)} · ${FOOD_EFFECTS[fx].minutes/60}h</small>`:''}</div></div>
    <ul class="cookbook-ingredients">${parts.map(i=>`<li class="${i.have>=i.need?'has':'missing'}" title="${esc(i.future??'')}">${img(i.item,'cookbook-icon')}<span>${esc(i.name)}${i.item==='wood'?' (lenha)':''}</span><b>${Math.min(i.have,i.need)}/${i.need}</b>${i.future&&i.have<i.need?`<em>${esc(i.future)}</em>`:''}</li>`).join('')}</ul>
    <button class="button ${ready?'button-primary':'button-light'}" data-cook="${r.id}" ${ready?'':'disabled'}>${action}</button></article>`;}).join('');
  const secrets=hidden.map(r=>`<article class="cookbook-recipe is-hidden"><div class="cookbook-title"><span class="cookbook-secret">?</span><div><h3>???</h3><small>${esc(HIDDEN_DISH_HINTS[dishSource(r)]??'receita escondida')}</small></div></div></article>`).join('');
  const missing=station==='stove'?DISH_RECIPES.filter(r=>dishSource(r)==='helena'&&(r.station??'stove')!=='campfire').length-knownDishes(s).filter(r=>dishSource(r)==='helena').length:0;
  const left=effect?Math.max(0,Math.ceil(effect.until-farmClock(s))):0;
  panel.innerHTML=`<div class="modal-heading"><div><span class="eyebrow">${eyebrow}</span><h2>${title}</h2></div><button class="icon-button" aria-label="Fechar" data-cook-close>×</button></div>
   ${effect?`<p class="cookbook-active">Efeito ativo: <b>${esc(FOOD_EFFECTS[effect.id].name)}</b> · ${esc(FOOD_EFFECTS[effect.id].description)} · ${Math.floor(left/60)}h ${left%60}min</p>`:''}
   ${known.length||hidden.length?`<div class="cookbook-list">${cards}${secrets}</div>`:`<p class="cookbook-empty">${station==='oven'?'Nenhuma receita de forno ainda. A Helena ensina pães e bolos na pousada.':'Nenhuma receita ainda. A Helena ensina receitas na pousada, uma por vez.'}</p>`}
   ${missing>0&&known.length?`<p class="cookbook-more">${missing} ${missing===1?'receita da Helena ainda não aprendida':'receitas da Helena ainda não aprendidas'} · ela ensina na pousada. Pães e bolos vão ao ${STATION_NAMES.oven}.</p>`:''}
   <p class="cookbook-status${error?' is-error':''}" role="status">${esc(status)}</p>
   ${options.onPickUp?`<button class="button button-light cookbook-pickup" data-cook-pickup>${station==='campfire'?'Apagar e recolher a fogueira':'Guardar o forno na mochila'}</button>`:''}`;
  panel.querySelector('[data-cook-close]')!.addEventListener('click',onClose);
  panel.querySelector('[data-cook-pickup]')?.addEventListener('click',()=>{const r=options.onPickUp!();if(r.ok){onClose();return;}status=r.message;error=true;draw();});
  for(const b of panel.querySelectorAll<HTMLButtonElement>('[data-cook]'))b.addEventListener('click',()=>{const r=onCook(b.dataset.cook!);status=r.message;error=!r.ok;if(r.ok&&station==='oven'){onClose();return;}draw();panel.querySelector<HTMLButtonElement>(`[data-cook="${b.dataset.cook}"]`)?.focus();});
 };
 draw();
}
