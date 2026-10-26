import type {SaveData} from './types';
import {Inventory} from './systems/inventory';
import {createVillageProgress} from './data/village-progress';
/** A cast spends bait before the timed catch, including when cancelled/reloaded. */
export async function fishAtBank(save:SaveData,net:boolean,commit:()=>void):Promise<string>{
 const p=save.villageProgress??=createVillageProgress(),inventory=new Inventory(save.inventory);
 if(!p.fishingSkill)return 'Aprenda a pescar com Damião na vila.';
 if(!inventory.has(net?'net':'fishingRod')||!inventory.spend({bait:1}))return 'Você precisa do equipamento e de uma isca.';
 save.inventory={...inventory.data};p.vigor=Math.max(0,p.vigor-3);commit();
 return new Promise(resolve=>{
  const layer=document.createElement('div');layer.className='village-layer';layer.innerHTML='<section class="village-panel" role="dialog" aria-label="Pesca"><h2>Pescar</h2><p data-fishing-prompt>Aguarde o peixe morder…</p><button class="village-primary" data-fishing-reel disabled>Recolher</button><button class="village-close" aria-label="Cancelar pesca">×</button></section>';
  document.querySelector('#ui')!.append(layer);let ready=false,ended=false;let timeout:ReturnType<typeof setTimeout>;
  const finish=(text:string)=>{if(ended)return;ended=true;clearTimeout(wait);clearTimeout(timeout);layer.remove();window.removeEventListener('keydown',key,true);resolve(text);};
  const reel=()=>{if(!ready||ended)return;const random=new Uint32Array(1);crypto.getRandomValues(random);const rare=random[0]/4294967296<.04+p.fishingSkill*.04+(inventory.has('accessory')?.03:0);const fresh=new Inventory(save.inventory);if(!fresh.transact({},{[rare?'rareFish':'fish']:net?2:1})){finish('Sem espaço na mochila.');return;}save.inventory={...fresh.data};commit();finish(rare?'Você pescou uma espécie rara!':'Peixe capturado!');};
  const key=(e:KeyboardEvent)=>{e.stopImmediatePropagation();if(e.key==='Escape')finish('Pesca cancelada. A isca foi utilizada.');if(e.key.toLowerCase()==='e')reel();};window.addEventListener('keydown',key,true);
  layer.querySelector('[data-fishing-reel]')!.addEventListener('click',reel);layer.querySelector('.village-close')!.addEventListener('click',()=>finish('Pesca cancelada.'));
  const wait=setTimeout(()=>{ready=true;layer.querySelector('[data-fishing-prompt]')!.textContent='Mordeu! Aperte E ou recolha agora!';(layer.querySelector('[data-fishing-reel]') as HTMLButtonElement).disabled=false;timeout=setTimeout(()=>finish('O peixe escapou.'),net?3000:1800);},2200);
 });
}
