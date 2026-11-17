import type {SocialContext} from './systems/npc-social';
import {stockInfo} from './systems/economy';
import {ECONOMY_BALANCE as BALANCE} from './data/economy-balance';
import type {VillageServiceOffer} from './systems/village-services';
import type { InventoryData, ItemId } from './types';
import type { VillageNPC } from './data/village';
import { ITEMS } from './data/items';
import { getMerchant, isMerchantOpen, merchantSchedule, MAX_TRADE_QUANTITY, unitPrice } from './data/village-commerce';
import type { MerchantId, TradeSide, VillageEconomy } from './data/village-commerce';
import type { CommerceResult } from './systems/commerce';
import { itemIconUrl } from './visual-assets';
import './village-ui.css';
import './village-ui-cards.css';
import {gameAudio} from './audio';
import {pickConversation} from './data/npc-conversations';
/** Moradores já ouvidos nesta sessão e a última conversa de cada um (para não repetir). */
const heard=new Set<string>(),lastConversation=new Map<string,number>();

export interface VillageInteractionCallbacks {
  onSocialOpen?(id:VillageNPC['id']):SocialContext;
  onSocialResponse?(id:VillageNPC['id'],tone:'warm'|'distant'):{ok:boolean;message:string;context?:SocialContext};
  locationLabel?:string;
  getDialogueAction?(npcId:string):{label:string;complete:()=>{ok:boolean;message:string}}|undefined;
  returnLabel?:string;
  canTrade?(npcId:VillageNPC['id']):boolean;
  isInside?(npcId:VillageNPC['id']):boolean;
  getAvailability?(npcId:VillageNPC['id']):{message:string;canGuide:boolean}|undefined;
  onGuide?(npcId:VillageNPC['id']):void;
  getPortrait?(npcId:string):string;
  onBlacksmith?():void;
  onBentoExpedition?():void;
  onMineRequests?():void;
  getServices?(npcId:string):VillageServiceOffer[];
  onService?(id:string):{ok:boolean;message:string};
  getInventory(): InventoryData;
  getEconomy(): VillageEconomy;
  getDay?(): number;
  onTrade(merchantId: MerchantId, side: TradeSide, item: ItemId, quantity: number): CommerceResult;
  onClose(): void;
}

type Tab = 'talk' | 'services' | TradeSide;
const count = (value: number): string => value.toLocaleString('pt-BR');
const toolItems = new Set<ItemId>(['hatchet', 'pickaxe', 'hoe', 'handsaw', 'hammer', 'sickle', 'shovel']);
const merchantEmblems: Record<MerchantId, string> = {
  general: 'wood', blacksmith: 'pickaxe', herbalist: 'fiber', carpenter: 'plank', seeds: 'seeds',
  traveler: 'board', tailor: 'cord', fisher: 'branch', inn: 'turnip', mechanic: 'scrap',
};

/** The scene owns the simulation and transaction. This panel only presents the
 * published catalogue and reports the result; it never writes inventory/save. */
export class VillageInteractionUI {
  private readonly layer = document.createElement('div');
  private readonly panel: HTMLElement;
  private readonly title: HTMLElement;
  private readonly subtitle: HTMLElement;
  private readonly balance: HTMLElement;
  private readonly tabs: HTMLElement;
  private readonly body: HTMLElement;
  private readonly feedback: HTMLElement;
  private npc?: VillageNPC;
  private tab: Tab = 'talk';
  private dialogueIndex = 0;
  private lines:readonly string[]=[];
  private socialContext?:SocialContext;
  private selected?: ItemId;
  private quantity = 1;
  private previousFocus?: HTMLElement;
  private disposed = false;

  constructor(private readonly callbacks: VillageInteractionCallbacks) {
    this.layer.className = 'village-layer';
    this.layer.hidden = true;
    this.layer.dataset.villageModal = '';
    this.layer.innerHTML = `<section class="village-panel" role="dialog" aria-modal="true" aria-labelledby="village-npc-name" tabindex="-1"><header class="village-panel-heading"><div><span class="village-eyebrow">VILA</span><h2 id="village-npc-name"></h2><p class="village-npc-role"></p></div><div class="village-heading-actions"><span class="village-wallet" aria-label="Seu saldo"><span class="village-coin" aria-hidden="true"></span><strong data-village-balance></strong><small>Coroas</small></span><button class="village-close" type="button" data-village-close aria-label="Fechar conversa" title="Fechar · Esc">×</button></div></header><nav class="village-tabs" aria-label="Conversa e comércio"></nav><div class="village-panel-body"></div><p class="village-feedback" role="status" aria-live="polite"></p><footer class="village-panel-footer"><span>Converse com os moradores e negocie seus produtos.</span><span><kbd>Esc</kbd> voltar à vila</span></footer></section>`;
    if(callbacks.locationLabel)this.layer.querySelector<HTMLElement>('.village-eyebrow')!.textContent=callbacks.locationLabel;
    if(callbacks.returnLabel)this.layer.querySelector('.village-panel-footer span:last-child')!.replaceChildren(Object.assign(document.createElement('kbd'),{textContent:'Esc'}),document.createTextNode(' '+callbacks.returnLabel));
    this.panel = this.layer.querySelector<HTMLElement>('.village-panel')!;
    this.title = this.layer.querySelector<HTMLElement>('#village-npc-name')!;
    this.subtitle = this.layer.querySelector<HTMLElement>('.village-npc-role')!;
    this.balance = this.layer.querySelector<HTMLElement>('[data-village-balance]')!;
    this.tabs = this.layer.querySelector<HTMLElement>('.village-tabs')!;
    this.body = this.layer.querySelector<HTMLElement>('.village-panel-body')!;
    this.feedback = this.layer.querySelector<HTMLElement>('.village-feedback')!;
    this.layer.querySelector<HTMLButtonElement>('[data-village-close]')!.addEventListener('click', () => this.close());
    this.layer.addEventListener('pointerdown', event => event.stopPropagation());
    this.layer.addEventListener('pointerup', event => event.stopPropagation());
    this.layer.addEventListener('contextmenu', event => { event.preventDefault(); event.stopPropagation(); });
    (document.querySelector('#ui') ?? document.body).append(this.layer);
    window.addEventListener('keydown', this.keyDown, true);
    window.addEventListener('keyup', this.keyUp, true);
  }

  get isOpen(): boolean { return !!this.npc && !this.disposed; }

  private get day(): number {
    const value = this.callbacks.getDay?.() ?? 1;
    return Number.isSafeInteger(value) && value >= 1 ? value : 1;
  }

  open(npc: VillageNPC): void {
    if (this.disposed) return;
    if (!this.isOpen) this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    this.npc = npc;this.socialContext=this.callbacks.onSocialOpen?.(npc.id);
    this.tab = 'talk'; this.dialogueIndex = 0; this.selected = undefined; this.quantity = 1;
    // A primeira conversa é a apresentação; depois, uma conversa diferente a cada visita.
    const firstTime=!heard.has(npc.id)&&(this.socialContext?.affinity??0)<1;
    const picked=firstTime||this.callbacks.getDialogueAction?.(npc.id)?undefined:pickConversation(npc.id,lastConversation.get(npc.id));
    if(picked)lastConversation.set(npc.id,picked.index);heard.add(npc.id);this.lines=picked?.lines??npc.dialogue;
    this.layer.dataset.npc = npc.id;
    this.layer.hidden = false;
    this.report('');
    this.render();
    this.layer.querySelector<HTMLButtonElement>('[data-village-close]')!.focus();
  }

  close(): void {
    if (!this.isOpen) return;
    this.npc = undefined;this.socialContext=undefined;
    this.layer.hidden = true;
    this.body.replaceChildren();
    this.callbacks.onClose();
    if (this.previousFocus?.isConnected) this.previousFocus.focus();
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true; this.npc = undefined;
    window.removeEventListener('keydown', this.keyDown, true);
    window.removeEventListener('keyup', this.keyUp, true);
    this.layer.remove();
  }

  private readonly keyDown = (event: KeyboardEvent): void => {
    if (!this.isOpen) return;
    // Stop the scene's hotkeys, while retaining native Enter/Space activation,
    // number-input editing and regular Tab navigation inside the modal.
    event.stopImmediatePropagation();
    if (event.key === 'Escape') { event.preventDefault(); this.close(); return; }
    if (event.key !== 'Tab') return;
    const controls = [...this.panel.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]')]
      .filter(control => control.getClientRects().length > 0);
    const first = controls[0], last = controls.at(-1);
    if (!first) { event.preventDefault(); this.panel.focus(); return; }
    if (event.shiftKey && (document.activeElement === first || !this.panel.contains(document.activeElement))) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !this.panel.contains(document.activeElement))) {
      event.preventDefault(); first.focus();
    }
  };

  private readonly keyUp = (event: KeyboardEvent): void => {
    if (this.isOpen) event.stopImmediatePropagation();
  };

  private report(message: string, ok = true): void {
    this.feedback.textContent = message;
    this.feedback.classList.toggle('is-error', !ok);
  }

  private selectTab(tab: Tab): void {
    this.tab = tab; this.quantity = 1; this.selected = undefined;
    this.report(''); this.render();
    this.tabs.querySelector<HTMLButtonElement>(`[data-village-tab="${tab}"]`)?.focus();
  }

  private render(): void {
    if (!this.npc) return;
    const merchant = this.npc.merchantId ? getMerchant(this.npc.merchantId, this.day) : undefined;
    const available = merchant && isMerchantOpen(merchant.id, this.day);
    if (merchant && !available) this.report(merchantSchedule(merchant.id), false);
    if (!available) this.tab = 'talk';
    this.title.textContent = this.npc.name;
    this.panel.querySelector('[data-npc-portrait]')?.remove();const portrait=this.callbacks.getPortrait?.(this.npc.id);if(portrait){const img=document.createElement('img');img.dataset.npcPortrait='';img.src=portrait;img.alt=this.npc.name;this.title.parentElement!.prepend(img);}
    this.title.parentElement!.classList.toggle('village-heading-with-portrait',!!portrait);
    const schedule=this.callbacks.getAvailability?.(this.npc.id);
    this.subtitle.textContent = (merchant?.shop ?? this.npc.role)+(schedule?' · '+schedule.message:'');
    this.setBalance(this.callbacks.getEconomy().coins,false);
    this.renderFriendship();
    this.tabs.replaceChildren();
    const options: Array<[Tab, string]> = [['talk', 'Conversar']];
    if(this.npc.id==='bento'){const b=document.createElement('button');b.className='village-primary';b.textContent='Fundição, ferramentas e encomendas';b.dataset.openBlacksmith='';b.onclick=()=>this.callbacks.onBlacksmith?.();this.tabs.append(b);}
    if(this.npc.id==='bento'&&this.callbacks.onBentoExpedition){const b=document.createElement('button');b.className='village-primary';b.textContent='Expedição à mina';b.dataset.bentoExpedition='';b.onclick=()=>this.callbacks.onBentoExpedition?.();this.tabs.append(b);}
    if(this.npc.id==='bento'&&this.callbacks.onMineRequests){const b=document.createElement('button');b.className='village-primary';b.textContent='Pedidos da mina';b.dataset.mineRequests='';b.onclick=()=>this.callbacks.onMineRequests?.();this.tabs.append(b);}
    if(this.callbacks.getServices?.(this.npc.id).length)options.push(['services','Serviços']);
    if (available&&(this.callbacks.canTrade?.(this.npc.id)??true)) options.push(['buy', this.npc.id==='bento'?'Comprar materiais':'Comprar'], ['sell', 'Vender']);
    for (const [tab, label] of options) {
      const button = document.createElement('button');
      button.type = 'button'; button.dataset.villageTab = tab; button.textContent = label;
      button.className = 'village-tab'; button.setAttribute('aria-pressed', String(this.tab === tab));
      button.addEventListener('click', () => this.selectTab(tab));
      this.tabs.append(button);
    }
    if(this.tab==='services'){this.renderServices();return;}
    if (this.tab === 'talk' || !merchant) this.renderDialogue();
    else this.renderTrade(merchant.id, this.tab);
  }

  /** Amizade no cabeçalho: barra com marcas em "À vontade" (3) e "Amizade" (8). */
  private renderFriendship():void{
    this.panel.querySelector('.village-friendship')?.remove();const ctx=this.socialContext;if(!ctx||ctx.affinity===undefined)return;
    const box=document.createElement('div');box.className='village-friendship';const pct=Math.max(0,Math.min(100,(ctx.affinity+4)/14*100));
    box.innerHTML=`<span>♥ ${ctx.label}</span><div class="village-friendship-bar"><i style="width:${pct}%"></i><b style="left:${7/14*100}%"></b><b style="left:${12/14*100}%"></b></div>`;
    this.subtitle.after(box);
  }
  /** Saldo com animação: os números correm até o valor novo e aparece "+X" ou "−X". */
  private shownCoins?:number;
  private setBalance(coins:number,animate=true):void{
    const from=this.shownCoins??coins;this.shownCoins=coins;
    if(!animate||from===coins){this.balance.textContent=count(coins);return;}
    const wallet=this.balance.closest<HTMLElement>('.village-wallet');const diff=coins-from;
    if(wallet){const f=document.createElement('span');f.className=`village-coin-float ${diff>0?'is-gain':'is-spend'}`;f.textContent=`${diff>0?'+':'−'}${count(Math.abs(diff))}`;wallet.append(f);setTimeout(()=>f.remove(),1300);wallet.classList.remove('is-bump');void wallet.offsetWidth;wallet.classList.add('is-bump');}
    gameAudio.play(diff>0?'pickup':'ui');
    const start=performance.now(),run=(now:number)=>{const t=Math.min(1,(now-start)/450);this.balance.textContent=count(Math.round(from+(coins-from)*(1-(1-t)**3)));if(t<1)requestAnimationFrame(run);};requestAnimationFrame(run);
  }
  /** Chip de custo: verde quando você tem o suficiente, vermelho quando falta. */
  private costChip(label:string,have:number,need:number,item?:string):HTMLElement{
    const chip=document.createElement('span');chip.className=`village-chip ${have>=need?'is-ok':'is-missing'}`;
    if(item)chip.append(this.emblem(item));const text=document.createElement('span');text.textContent=item?`${count(Math.min(have,99999))}/${count(need)}`:label;chip.append(text);
    chip.title=item?`${ITEMS[item as ItemId]?.name??item}: você tem ${count(have)}, precisa de ${count(need)}`:label;return chip;
  }
  private renderServices():void {
    this.body.replaceChildren();this.body.className='village-panel-body village-services';
    const inventory=this.callbacks.getInventory(),coins=this.callbacks.getEconomy().coins;
    const grid=document.createElement('div');grid.className='village-service-grid';
    for(const service of this.callbacks.getServices?.(this.npc!.id)??[]){
      const card=document.createElement('article');card.className='village-service';card.dataset.serviceCard=service.id;
      const head=document.createElement('header');const icon=service.item??Object.keys(service.cost?.items??{})[0];
      if(icon)head.append(this.emblem(icon));const title=document.createElement('h3');title.textContent=service.label;head.append(title);
      const lackCoins=(service.cost?.coins??0)>coins,lackItems=Object.entries(service.cost?.items??{}).some(([it,n])=>(inventory[it as ItemId]??0)<n!),missing=lackCoins||lackItems;
      const status=document.createElement('span');status.className='village-service-status';
      const learned=service.actionLabel==='Já aprendido';
      status.textContent=learned?'Já aprendido':service.disabled?(service.actionLabel??'Indisponível'):lackItems?'Faltam materiais':lackCoins?'Faltam Coroas':'Disponível';
      status.dataset.state=learned?'done':service.disabled?'waiting':missing?'missing':'ok';head.append(status);
      const text=document.createElement('p');text.textContent=service.description;
      card.append(head,text);
      if(service.cost&&!learned){const chips=document.createElement('div');chips.className='village-chips';
        if(service.cost.coins)chips.append(this.costChip(`${count(service.cost.coins)} C`,coins,service.cost.coins));
        for(const [it,n] of Object.entries(service.cost.items??{}))chips.append(this.costChip('',inventory[it as ItemId]??0,n!,it));
        card.append(chips);}
      const button=document.createElement('button');button.className='village-primary';button.textContent=service.actionLabel??'Solicitar';button.disabled=!!service.disabled;button.dataset.villageService=service.id;
      button.onclick=()=>{const result=this.callbacks.onService?.(service.id);this.setBalance(this.callbacks.getEconomy().coins);if(result){this.report(result.message,result.ok);if(result.ok){gameAudio.play('craft');this.renderServices();
        const again=this.body.querySelector<HTMLElement>(`[data-service-card="${service.id}"]`);if(again){again.classList.add('is-done-flash');const f=document.createElement('span');f.className='village-card-float';f.textContent='✓ Feito';again.append(f);}
        this.body.querySelector<HTMLButtonElement>(`[data-village-service="${service.id}"]`)?.focus();}}};
      card.append(button);grid.append(card);
    }
    this.body.append(grid);
  }

  private emblem(item: string): HTMLElement {
    const holder = document.createElement('span'); holder.className = 'village-item-icon'; holder.setAttribute('aria-hidden', 'true');
    const url = itemIconUrl(item);
    if (url) { const image = document.createElement('img'); image.src = url; image.alt = ''; holder.append(image); }
    else {
      // Match the existing inventory's vector fallback for items without a PNG.
      const paths: Record<string, string> = {
        turnip: 'M7 11c-4 6 4 9 5 11 1-2 9-5 5-11ZM12 11C5 10 7 3 7 3s6 1 5 8Zm0 0c-1-7 6-8 6-8s2 7-6 8',
        peg: 'm5 3 3-1 2 18-2 2-2-2Zm9 0 3-1 2 18-2 2-2-2Z',
      };
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '1.6'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', paths[item] ?? 'M12 21V10m0 5C5 15 4 7 4 7s8-1 8 8Zm0-5c0-6 7-7 7-7s1 8-7 8');
      svg.append(path); holder.append(svg);
    }
    return holder;
  }

  private renderDialogue(): void {
    if (!this.npc) return;
    const npc = this.npc;
    this.body.replaceChildren(); this.body.className = 'village-panel-body village-dialogue vd';
    const available = npc.merchantId && isMerchantOpen(npc.merchantId, this.day);
    const inside=this.callbacks.isInside?.(npc.id)??this.callbacks.canTrade?.(npc.id)??true;
    const trading=inside&&(this.callbacks.canTrade?.(npc.id)??true);
    const completion=this.callbacks.getDialogueAction?.(npc.id);
    const remaining = this.dialogueIndex < this.lines.length - 1;
    // Palco: o morador em pé, grande, sobre um chão.
    const stage=document.createElement('div');stage.className='vd-stage';
    const portrait=this.callbacks.getPortrait?.(npc.id);
    if(portrait)stage.append(Object.assign(document.createElement('img'),{src:portrait,alt:npc.name,className:'vd-portrait'}));
    else{const e=this.emblem(npc.merchantId?merchantEmblems[npc.merchantId]:'fiber');e.classList.add('vd-emblem');stage.append(e);}
    // Balão: plaquinha com o nome, a fala aparecendo palavra por palavra e o andamento da conversa.
    const box=document.createElement('div');box.className='vd-box';
    const plate=document.createElement('div');plate.className='vd-plate';
    const name=document.createElement('strong');name.textContent=npc.name;const role=document.createElement('span');role.textContent=npc.role;plate.append(name,role);
    if(this.socialContext){const mood=document.createElement('em');mood.className='vd-mood';mood.textContent='♥ '+this.socialContext.label;plate.append(mood);}
    const quote=document.createElement('p');quote.className='village-dialogue-text vd-text';
    const line=this.lines[this.dialogueIndex]??'É bom ver a vila recebendo novos vizinhos.';
    line.split(/(\s+)/).forEach((w,k)=>{const span=document.createElement('span');span.textContent=w;span.style.animationDelay=`${Math.min(k,80)*28}ms`;quote.append(span);});
    quote.onclick=()=>quote.classList.add('is-shown');
    box.append(plate);
    if(this.socialContext){
      const context=this.socialContext,note=document.createElement('aside');note.className='village-social-note vd-greeting';note.dataset.socialNpc=npc.id;
      const greeting=document.createElement('p');greeting.textContent='“'+context.greeting+'”';note.append(greeting);
      if(context.memory){const memory=document.createElement('p');memory.dataset.socialMemory='';memory.className='vd-memory';memory.textContent=context.memory;note.append(memory);}
      box.append(note);
    }
    box.append(quote);
    const foot=document.createElement('div');foot.className='village-dialogue-actions vd-foot';
    const dots=document.createElement('span');dots.className='village-dialogue-count vd-dots';dots.setAttribute('aria-label',`${Math.min(this.dialogueIndex+1,this.lines.length)} de ${this.lines.length}`);
    for(let k=0;k<this.lines.length;k++){const d=document.createElement('i');if(k<=this.dialogueIndex)d.className='is-on';dots.append(d);}
    const next = document.createElement('button'); next.type = 'button'; next.className = 'village-primary vd-next'; next.dataset.villageDialogueNext = '';
    next.textContent = remaining ? 'Continuar ▸' : completion?completion.label:available&&trading ? 'Ver a loja ▸' : 'Até mais';
    next.addEventListener('click', () => {
      gameAudio.play('ui');
      if (remaining) { this.dialogueIndex++; this.renderDialogue(); this.body.querySelector<HTMLButtonElement>('[data-village-dialogue-next]')?.focus(); }
      else if(completion){const result=completion.complete();if(result.ok)this.render();this.report(result.message,result.ok);}
      else if (available&&trading) this.selectTab('buy');
      else this.close();
    });
    foot.append(dots,next);box.append(foot);
    // Respostas e atalhos, abaixo do balão.
    const choices=document.createElement('div');choices.className='village-social-choices vd-choices';
    if(this.socialContext&&!completion&&this.callbacks.onSocialResponse){
      const context=this.socialContext;
      for(const[tone,text,icon]of[['warm','É bom conversar com você.','😊'],['distant','Prefiro não conversar agora.','🤚']]as const){const button=document.createElement('button');button.type='button';button.className='vd-choice';button.dataset.socialResponse=tone;
        button.innerHTML=`<span aria-hidden="true">${icon}</span>`;button.append(document.createTextNode(text));button.disabled=!context.canRespond;
        button.onclick=()=>{const result=this.callbacks.onSocialResponse!(npc.id,tone);if(result.ok){gameAudio.play('pickup');this.socialContext={...context,...result.context};this.renderFriendship();this.renderDialogue();}this.report(result.message,result.ok);};choices.append(button);}
      if(!context.canRespond){const done=document.createElement('small');done.className='vd-answered';done.textContent='Vocês já conversaram hoje.';choices.append(done);}
    }
    if(available&&!inside&&this.callbacks.onGuide){const guide=document.createElement('button');guide.type='button';guide.className='vd-choice vd-guide';guide.dataset.guideToShop='';guide.innerHTML='<span aria-hidden="true">🧭</span>';guide.append(document.createTextNode('Leve-me até sua loja'));guide.disabled=this.callbacks.getAvailability?.(npc.id)?.canGuide===false;guide.onclick=()=>{this.close();this.callbacks.onGuide?.(npc.id);};choices.append(guide);
      const note=document.createElement('p');note.className='vd-note';note.textContent='Compra e venda acontecem dentro da loja. Conversas e serviços continuam aqui.';choices.append(note);}
    const side=document.createElement('div');side.className='vd-side';side.append(box,choices);
    this.body.append(stage, side);
  }

  private renderTrade(merchantId: MerchantId, side: TradeSide): void {
    if(this.npc&&this.callbacks.canTrade?.(this.npc.id)===false){this.tab='talk';this.render();return;}
    const merchant = getMerchant(merchantId, this.day);
    if (!merchant || !isMerchantOpen(merchantId, this.day)) {
      this.tab = 'talk'; this.render(); this.report(merchantSchedule(merchantId), false); return;
    }
    const inventory = this.callbacks.getInventory();
    const items = Object.keys(merchant[side]) as ItemId[];
    if (!this.selected || !items.includes(this.selected)) this.selected = side === 'sell' ? items.find(item => inventory[item] > 0) ?? items[0] : items[0];
    this.body.replaceChildren(); this.body.className = 'village-panel-body village-trade';
    const catalog = document.createElement('div'); catalog.className = 'village-catalog';
    const note = document.createElement('p'); note.className = 'village-shop-note';
    note.textContent = side === 'buy'
      ? `${merchant.description}${merchantId === 'general' || merchantId === 'traveler' ? ` Seleção do dia ${count(this.day)}.` : ''}${merchantId==='blacksmith'&&this.day<31?' Foice e pá de ferro à venda; os minerais a partir do dia 31.':''}`
      : 'Escolha os produtos que quer vender. O valor mostrado é por unidade.';
    const list = document.createElement('div'); list.className = 'village-item-list'; list.setAttribute('role', 'group'); list.setAttribute('aria-label', side === 'buy' ? 'Itens à venda na loja' : 'Itens aceitos pelo comerciante');
    for (const item of items) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'village-item'; button.dataset.tradeItem = item;
      button.setAttribute('aria-pressed', String(item === this.selected));
      const info = document.createElement('span'); info.className = 'village-item-copy';
      const name = document.createElement('strong'); name.textContent = ITEMS[item].name;
      const stock = document.createElement('small');const limit=merchantId==='blacksmith'&&item in BALANCE.stock?stockInfo(this.callbacks.getEconomy(),item,this.day):undefined;stock.textContent = `Na mochila: ${count(inventory[item])}`+(limit?` · Loja: ${limit.remaining} · repõe dia ${limit.nextDay} (em ${limit.nextDay-this.day} dias)`:' · Estoque regular');
      info.append(name, stock);
      const price = document.createElement('span'); price.className = 'village-item-price'; price.textContent = `${count(unitPrice(merchantId, side, item, this.day)!)} Coroas`;
      button.append(this.emblem(item), info, price);
      button.addEventListener('click', () => { this.selected = item; this.quantity = 1; this.report(''); this.renderTrade(merchantId, side); this.body.querySelector<HTMLElement>(`[data-trade-item="${item}"]`)?.focus(); });
      list.append(button);
    }
    catalog.append(note, list);
    const detail = document.createElement('section'); detail.className = 'village-trade-detail'; detail.setAttribute('aria-label', 'Detalhes da negociação');
    this.body.append(catalog, detail);
    this.renderTradeDetail(detail, merchantId, side);
  }

  private renderTradeDetail(detail: HTMLElement, merchantId: MerchantId, side: TradeSide): void {
    const item = this.selected; if (!item) return;
    const inventory = this.callbacks.getInventory(), economy = this.callbacks.getEconomy();
    const price = unitPrice(merchantId, side, item, this.day)!;
    const max = side === 'buy' && toolItems.has(item) ? 1 : side === 'sell' ? Math.max(1, Math.min(MAX_TRADE_QUANTITY, inventory[item])) : MAX_TRADE_QUANTITY;
    this.quantity = Math.max(1, Math.min(max, this.quantity));
    detail.replaceChildren();
    const icon = this.emblem(item); icon.classList.add('village-selected-icon');
    const heading = document.createElement('h3'); heading.textContent = ITEMS[item].name;
    const description = document.createElement('p'); description.className = 'village-selected-description'; description.textContent = ITEMS[item].description;
    const stock = document.createElement('p'); stock.className = 'village-owned'; stock.textContent = `Você tem ${count(inventory[item])} na mochila.`;
    const label = document.createElement('label'); label.className = 'village-quantity'; label.textContent = 'Quantidade';
    const input = document.createElement('input'); input.type = 'number'; input.min = '1'; input.max = String(max); input.step = '1'; input.value = String(this.quantity); input.inputMode = 'numeric'; input.dataset.tradeQuantity = ''; input.setAttribute('aria-label', 'Quantidade para negociar');
    // Botões de − e + e "máximo" ao redor da quantidade.
    const stepper=document.createElement('div');stepper.className='village-stepper';
    const step=(d:number|'max')=>{const v=d==='max'?(side==='buy'?Math.max(1,Math.min(max,Math.floor(economy.coins/Math.max(1,price)))):max):Math.max(1,Math.min(max,(Number(input.value)||1)+d));input.value=String(v);input.dispatchEvent(new Event('input'));gameAudio.play('ui');};
    for(const [txt,d,name] of [['−',-1,'Diminuir'],['+',1,'Aumentar']] as const){const b=document.createElement('button');b.type='button';b.textContent=txt;b.className='village-step';b.setAttribute('aria-label',name);b.onclick=()=>step(d);stepper.append(b);}
    const maxButton=document.createElement('button');maxButton.type='button';maxButton.className='village-step village-step-max';maxButton.textContent='Máx';maxButton.onclick=()=>step('max');
    label.append(input);stepper.insertBefore(label,stepper.lastChild);stepper.append(maxButton);
    const total = document.createElement('div'); total.className = 'village-total';
    const totalLabel = document.createElement('span'); totalLabel.textContent = side === 'buy' ? 'Você paga' : 'Você recebe';
    const amount = document.createElement('strong'); amount.dataset.tradeTotal = ''; total.append(totalLabel, amount);
    const reason = document.createElement('p'); reason.className = 'village-trade-hint';
    const action = document.createElement('button'); action.type = 'button'; action.className = 'village-primary village-trade-confirm'; action.dataset.tradeAction = side;
    const update = (): void => {
      const value = Number(input.value), valid = Number.isSafeInteger(value) && value >= 1 && value <= max;
      this.quantity = valid ? value : 0;
      amount.textContent = valid ? `${count(value * price)} Coroas` : '—';
      const ownedTool = side === 'buy' && toolItems.has(item) && inventory[item] > 0;
      const insufficient = side === 'buy' && valid && economy.coins < value * price;
      const noStock = side === 'sell' && inventory[item] === 0;
      const stock=merchantId==='blacksmith'&&side==='buy'&&item in BALANCE.stock?stockInfo(economy,item,this.day):undefined;
      action.disabled = !!stock&&stock.remaining<this.quantity || !valid || ownedTool || insufficient || noStock;
      action.textContent = side === 'buy' ? 'Comprar' : 'Vender';
      reason.textContent = !valid ? `Escolha de 1 a ${max} unidades.` : ownedTool ? 'Você já possui esta ferramenta.' : noStock ? 'Você não tem este item para vender.' : insufficient ? 'Coroas insuficientes. Venda colheitas ou recursos para juntar Coroas.' : side === 'buy' ? 'A compra será colocada na sua mochila.' : 'Os itens vendidos saem da sua mochila.';
    };
    input.addEventListener('input', update); update();
    action.addEventListener('click', () => {
      if (!this.npc || !Number.isSafeInteger(this.quantity) || this.quantity < 1) return;
      if (!isMerchantOpen(merchantId, this.day)) {
        this.tab = 'talk'; this.render(); this.report(merchantSchedule(merchantId), false); return;
      }
      if (unitPrice(merchantId, side, item, this.day) === undefined) {
        this.selected = undefined; this.renderTrade(merchantId, side); this.report('A seleção da loja mudou. Escolha um dos produtos disponíveis hoje.', false); return;
      }
      const result = this.callbacks.onTrade(merchantId, side, item, this.quantity);
      this.setBalance(this.callbacks.getEconomy().coins);
      this.renderTrade(merchantId, side);
      this.report(result.message, result.ok);
      this.body.querySelector<HTMLButtonElement>(`[data-trade-item="${item}"]`)?.focus();
    });
    detail.append(icon, heading, description, stock, stepper, total, action, reason);
  }
}
