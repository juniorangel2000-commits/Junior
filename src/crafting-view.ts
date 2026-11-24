import type {ItemId,InventoryData} from './types';
import type {CraftingRecipe} from './data/recipes';
import {itemAmount,itemForm} from './data/item-forms';
import {CATEGORY_NAMES,STATION_NAMES,recipeCategory,recipeStation} from './data/recipe-groups';

/** Telas de fabricar (preview.49): lista à esquerda, detalhe à direita. Só monta o HTML; a lógica
 * de quem pode fabricar o quê continua na interface (ui.ts). */
export interface CraftRow{r:CraftingRecipe;learned:boolean;ready:boolean;status:string;max:number}
const esc=(t:string)=>t.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]!));
const norm=(t:string)=>t.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
export const recipeMatches=(r:CraftingRecipe,query:string)=>!query.trim()||norm(`${r.name} ${r.description}`).includes(norm(query.trim()));

/** Quantas vezes dá para fabricar agora com o que há na mochila (ferramentas únicas e melhorias: 1). */
export function maxCraftable(r:CraftingRecipe,inventory:InventoryData,single:boolean):number{
 const by=(Object.entries(r.cost) as [ItemId,number][]).map(([i,q])=>Math.floor((inventory[i]??0)/q));
 const n=by.length?Math.min(...by):0;return single||r.upgrade?Math.min(1,n):n;
}
export function craftListHtml(rows:CraftRow[],selected:string|undefined,icon:(id:string)=>string):string{
 if(!rows.length)return '<li class="craft-empty">Nenhuma receita encontrada.</li>';
 return rows.map(({r,ready,learned,max})=>{const out=(Object.keys(r.output) as ItemId[])[0];
  const badge=!learned?'<span class="craft-badge learn" title="Ainda não aprendida">Aprender</span>':ready?`<span class="craft-badge ready" title="Dá para fazer agora">${max>1?'×'+max:'✓'}</span>`:'<span class="craft-badge missing" title="Falta material ou requisito">—</span>';
  return `<li><button type="button" class="craft-row${ready?' ready':''}${learned?'':' unlearned'}${r.id===selected?' selected':''}" data-select="${r.id}" aria-pressed="${r.id===selected}">${icon(r.upgrade?.tool??out??'workbench')}<span class="craft-row-name">${esc(r.name)}</span>${badge}</button></li>`;}).join('');
}
export function craftDetailHtml(row:CraftRow|undefined,inventory:InventoryData,icon:(id:string)=>string,busy:boolean):string{
 if(!row)return '<p class="craft-detail-empty">Escolha uma receita na lista.</p>';
 const {r,ready,learned,status,max}=row,outs=Object.entries(r.output) as [ItemId,number][];
 const mats=(Object.entries(r.cost) as [ItemId,number][]).map(([i,q])=>{const have=inventory[i]??0,ok=have>=q;
  return `<li class="${ok?'ok':'short'}">${icon(i)}<span class="craft-mat-name">${esc(itemForm(i,q))}</span><span class="craft-mat-count" title="Na mochila / necessário"><b>${have}</b> / ${q}</span></li>`;}).join('');
 const req=[r.requiresTool?`Precisa de: ${esc(itemForm(r.requiresTool,1).toLocaleLowerCase('pt-BR'))}`:'',`Onde: ${esc(STATION_NAMES[recipeStation(r)])}`,r.durationSeconds?`Tempo: ${r.durationSeconds} s cada`:''].filter(Boolean);
 const btn=(n:number|'max',label:string,on:boolean)=>`<button type="button" class="button ${n===1?'button-primary':'button-light'} craft-go" data-craft-count="${n}" ${on?'':'disabled'}>${label}</button>`;
 const actions=learned?`<div class="craft-actions">${btn(1,'Fabricar',ready)}${btn(5,'×5',ready&&max>=5&&!busy)}${btn('max',`Máximo${max>1?` (${max})`:''}`,ready&&max>=2&&!busy)}</div>`:'';
 return `<div class="craft-detail-head">${icon(r.upgrade?.tool??outs[0]?.[0]??'workbench')}<div><span class="eyebrow">${esc(CATEGORY_NAMES[recipeCategory(r)])}</span><h3>${esc(r.name)}</h3></div></div>
<p class="craft-desc">${esc(r.description)}</p>
<h4>Materiais</h4><ul class="craft-mats">${mats||'<li class="ok">Nenhum material.</li>'}</ul>
<p class="craft-result">Resultado: <b>${outs.map(([i,n])=>esc(itemAmount(i,n))).join(', ')||esc(r.name)}</b></p>
<p class="craft-req">${req.join(' · ')}</p>
<p class="craft-status${ready?' ok':''}">${esc(ready?'Tudo pronto para fabricar.':status)}</p>${actions}`;
}
