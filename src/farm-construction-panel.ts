import type {FarmRuntime} from './systems/farm-construction';
import {productionSummary,pettedToday,fedToday} from './systems/animal-production';
import {MAX_BOND,bondQuality,QUALITY_NAMES,QUALITY_BOND} from './systems/item-quality';
import type {SaveData} from './types';
/** Cartão de um morador: nome, estrela da qualidade, barra de amizade e selos do dia. */
function residentCard(save:SaveData,id:string,name:string,release:HTMLButtonElement,picture?:string):HTMLElement{
 const card=document.createElement('article');card.className='farm-resident';
 const head=document.createElement('header'),title=document.createElement('strong');title.textContent=name;
 if(picture){const img=document.createElement('img');img.className='farm-resident-portrait';img.src=picture;img.alt='';head.append(img);}
 head.append(title);
 if(id!==HORSE_ID){
  const bond=save.animalCare?.animals[id]?.bond??0,q=bondQuality(bond);
  const badge=document.createElement('span');badge.className=`farm-resident-quality q${q}`;badge.textContent=`${q?'★ ':''}${QUALITY_NAMES[q]}`;badge.title=`Produz ${QUALITY_NAMES[q]}`;head.append(badge);card.append(head);
  const meter=document.createElement('div');meter.className='farm-resident-meter';
  const bar=document.createElement('span');bar.className='farm-friendship-bar';bar.setAttribute('role','meter');bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax',String(MAX_BOND));bar.setAttribute('aria-valuenow',String(bond));bar.setAttribute('aria-label','Amizade');
  for(const mark of [QUALITY_BOND[1],QUALITY_BOND[2]]){const m=document.createElement('b');m.style.left=`${mark/MAX_BOND*100}%`;bar.append(m);}
  const fill=document.createElement('i');fill.style.width=`${Math.round(bond/MAX_BOND*100)}%`;fill.className=`q${q}`;bar.prepend(fill);
  const label=document.createElement('small');label.textContent=`Amizade ${bond}/${MAX_BOND}`+(q<2?` · faltam ${QUALITY_BOND[q+1]-bond} para ${QUALITY_NAMES[q+1]}`:' · máxima qualidade');
  meter.append(bar,label);card.append(meter);
  const chips=document.createElement('div');chips.className='farm-resident-chips';
  const chip=(ok:boolean,yes:string,no:string)=>{const c=document.createElement('span');c.className=`farm-chip ${ok?'done':'todo'}`;c.textContent=(ok?'✓ ':'• ')+(ok?yes:no);chips.append(c);};
  chip(fedToday(save,id),'Comeu hoje','Sem comer hoje');chip(pettedToday(save,id),'Carinho feito','Falta carinho');
  card.append(chips);
 }else card.append(head);
 release.className='farm-resident-release';card.append(release);return card;
}
import {farmSites,siloStock,farmReady,deliverFarmMaterials,finishFarmConstruction,cancelFarmConstruction,toggleFarmGate,assignFarmAnimal,unassignFarmAnimal,farmHay,setFarmAnimalsInside} from './systems/farm-construction';
import {hasInterior} from './data/farm-interiors';
import {animalsInside} from './systems/farm-interior';
import {FARM_BUILDINGS,farmAcceptsAnimal} from './data/farm-buildings';
import {ITEM_NAMES} from './data/items';
import {ANIMAL_NAMES} from './data/ancient-forest';
import {DOMESTIC_ANIMALS} from './data/domestic-animals';
import {HORSE_ID} from './systems/horse-taming';
import {itemIconUrl} from './visual-assets';
import type {GameUI} from './ui';
import type {ItemId} from './types';
import './farm-construction.css';
/** `portrait`: retrato de lado do animal (imagem em base64), vindo da arte do cenário. */
export function showFarmConstruction(ui:GameUI,runtime:FarmRuntime,id:number,onEnter?:(id:number)=>void,portrait?:(animalId:string)=>string|undefined):void{
 ui.showSceneEditor(host=>{const panel=document.createElement('section');panel.className='panel farm-site-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Obra da fazenda');let message='';
 const draw=()=>{const save=runtime.snapshot(),site=farmSites(save).find(s=>s.id===id);panel.replaceChildren();if(!site){ui.closeModal();return;}const def=FARM_BUILDINGS[site.kind],head=document.createElement('div');head.className='modal-heading';const title=document.createElement('h2');title.textContent=def.name;const close=document.createElement('button');close.className='icon-button';close.textContent='×';close.setAttribute('aria-label','Fechar obra');close.onclick=()=>ui.closeModal();head.append(title,close);panel.append(head);const note=document.createElement('p');note.textContent=site.finished?def.description:'Entregue os materiais aqui, aos poucos. Quando estiver tudo pronto, conclua a obra com seu martelo.';panel.append(note);
 const buttons=document.createElement('div');buttons.className='farm-site-actions';const button=(text:string,action:()=>{ok:boolean;message:string},disabled=false)=>{const b=document.createElement('button');b.className='button button-primary';b.textContent=text;b.disabled=disabled;b.onclick=()=>{const result=action();message=result.message;draw();};buttons.append(b);};
 if(!site.finished){const list=document.createElement('ul');list.className='farm-site-materials';for(const[key,quantity]of Object.entries(def.cost)){const k=key as ItemId,li=document.createElement('li'),icon=document.createElement('img');icon.src=itemIconUrl(k)??'';icon.alt='';const text=document.createElement('span');text.textContent=`${ITEM_NAMES[k]}: ${site.delivered[k]??0}/${quantity} · mochila: ${save.inventory[k]}`;li.append(icon,text);list.append(li);}panel.append(list);button('Entregar materiais disponíveis',()=>deliverFarmMaterials(runtime,id),farmReady(site));button('Concluir obra com martelo',()=>finishFarmConstruction(runtime,id),!farmReady(site));button('Cancelar obra e recuperar materiais',()=>cancelFarmConstruction(runtime,id));}
 else if(site.kind==='silo'){const count=document.createElement('p'),stock=siloStock(site,save);count.className='farm-storage-count';count.textContent=`Palha pronta: ${stock.hay} · capim secando: ${stock.pending} · capacidade: ${def.capacity}. 1 capim → 1 palha após um dia; 3 fibras → 1 palha.`;panel.append(count);button('Guardar até 10 capins para secar',()=>farmHay(runtime,id,'dry'));button('Guardar até 10 palhas',()=>farmHay(runtime,id,'deposit'));button('Retirar até 10 palhas',()=>farmHay(runtime,id,'withdraw'));button('Preparar até 10 palhas com fibras',()=>farmHay(runtime,id,'prepare'));}
 else{const count=document.createElement('p');count.textContent=`Moradores: ${site.animals.length}/${def.capacity}`;panel.append(count);if(hasInterior(site.kind)){const inside=animalsInside(site,save);const where=document.createElement('p');where.className='farm-site-where';where.textContent=site.animals.length?(inside?'Os animais estão dentro.':'Os animais estão no cercado.')+' De dia ficam no cercado; à noite, dentro.':'';panel.append(where);if(site.animals.length){const sum=productionSummary(save,site),prod=document.createElement('p');prod.className='farm-site-production';prod.textContent=`Cocho: ${sum.trough}/${sum.capacity} ${site.kind==='pigsty'?'sobras':'palhas'} · ${sum.fed}/${sum.animals} ${sum.fed===1?'alimentado':'alimentados'} hoje · `+(site.kind==='pigsty'?`${sum.manure} de esterco no chão`:site.kind==='coop'?`${sum.eggs} ${sum.eggs===1?'ovo':'ovos'} nos ninhos`:`${sum.milk} para ordenhar${site.kind==='aprisco'?` · ${sum.wool} para tosquiar`:''}`)+(site.kind==='pigsty'?'. Coloque sobras da horta no cocho lá dentro: cada porco come 1 às 06:00.':'. Abasteça o cocho lá dentro: cada animal come 1 palha às 06:00.');panel.append(prod);}if(onEnter){const b=document.createElement('button');b.className='button button-primary';b.textContent=`Entrar no ${def.name.toLowerCase()}`;b.onclick=()=>{ui.closeModal();onEnter(id);};buttons.append(b);}button(inside?'Soltar no cercado':'Recolher os animais',()=>setFarmAnimalsInside(runtime,id,!inside),!site.animals.length);}if(!def.openYard)button(site.gateOpen?'Fechar porteira':'Abrir porteira',()=>toggleFarmGate(runtime,id));const residents=document.createElement('div');residents.className='farm-site-residents';for(const animalId of site.animals){const name=animalId===HORSE_ID?(save.horseTaming?.name??'Cavalo'):ANIMAL_NAMES[DOMESTIC_ANIMALS.find(a=>a.id===animalId)!.kind]+' '+animalId.split('-').at(-1);const b=document.createElement('button');b.textContent='Liberar moradia';b.onclick=()=>{message=unassignFarmAnimal(runtime,id,animalId).message;draw();};residents.append(residentCard(save,animalId,name,b,portrait?.(animalId)));}panel.append(residents);const candidates=DOMESTIC_ANIMALS.filter(a=>farmAcceptsAnimal(site.kind,a.kind)&&save.recruitedAnimals?.includes(a.id)&&!farmSites(save).some(s=>s.animals.includes(a.id)));for(const a of candidates)button(a.id===HORSE_ID?`Alojar ${save.horseTaming?.name??'cavalo'}`:'Alojar '+ANIMAL_NAMES[a.kind].toLowerCase()+' · '+a.id.split('-').at(-1),()=>assignFarmAnimal(runtime,id,a.id));const help=document.createElement('p');help.textContent=def.openYard?'Conduza seu cavalo até a entrada e escolha Alojar. O abrigo é aberto: ele passeia por perto e volta caminhando.':'Conduza seus animais com a corda até a entrada e atribua a moradia. Eles caminham até o cercado. Para retirá-los, abra a porteira e conduza-os novamente.';panel.append(help);}
 panel.append(buttons);const status=document.createElement('p');status.className='farm-site-message';status.setAttribute('aria-live','polite');status.textContent=message;panel.append(status);};draw();host.append(panel);panel.querySelector('button')?.focus();return()=>panel.remove();});
}
