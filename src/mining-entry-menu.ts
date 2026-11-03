import type {GameUI} from './ui';
import type {SaveData} from './types';
import {toolCondition} from './systems/economy';
/** The approved central doorway opens this menu; entry is always an explicit choice. */
export function showMiningEntry(ui:GameUI,save:SaveData,enter:()=>void):void{
 ui.showSceneEditor(host=>{
  const condition=toolCondition(save,'pickaxe');
  host.innerHTML=`<section class="panel pet-menu mining-entry-menu" role="dialog" aria-modal="true" aria-label="Entrar na mineração">
   <header class="modal-heading"><div><span class="eyebrow">MINA ANTIGA</span><h2>Galerias da Mina</h2></div><button class="icon-button" data-close aria-label="Fechar">×</button></header>
   <p>Além desta passagem ficam as galerias de mineração. Explore os túneis e use sua picareta para extrair os minérios presos à rocha.</p>
   <div class="mining-entry-summary"><strong>Prepare sua mochila</strong><p>${save.inventory.pickaxe>0?condition.durability>0?'Picareta disponível.':'Sua picareta precisa de reparos.':'Traga uma picareta para escavar.'} ${save.inventory.lantern>0?'Você está levando uma lanterna.':'Uma lanterna ajuda nas galerias mais escuras.'}</p><small>Quanto mais fundo, maiores os perigos. Você pode voltar por esta mesma passagem.</small></div>
   <footer class="mining-entry-actions"><button class="button" data-back>Voltar</button><button class="button button-light" data-enter>Entrar na mina</button></footer>
  </section>`;
  const close=()=>ui.closeModal();host.querySelector<HTMLButtonElement>('[data-close]')!.onclick=close;host.querySelector<HTMLButtonElement>('[data-back]')!.onclick=close;
  host.querySelector<HTMLButtonElement>('[data-enter]')!.onclick=()=>{close();enter();};host.querySelector<HTMLButtonElement>('[data-enter]')!.focus();
  return()=>host.replaceChildren();
 });
}
