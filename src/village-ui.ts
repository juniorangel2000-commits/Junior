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

export interface VillageInteractionCallbacks {
  canTrade?(npcId:VillageNPC['id']):boolean;
  onGuide?(npcId:VillageNPC['id']):void;
  getPortrait?(npcId:string):string;
  onBlacksmith?():void;
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
const toolItems = new Set<ItemId>(['hatchet', 'pickaxe', 'hoe', 'handsaw', 'hammer']);
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
  private selected?: ItemId;
  private quantity = 1;
  private previousFocus?: HTMLElement;
  private disposed = false;

  constructor(private readonly callbacks: VillageInteractionCallbacks) {
    this.layer.className = 'village-layer';
    this.layer.hidden = true;
    this.layer.dataset.villageModal = '';
    this.layer.innerHTML = `<section class="village-panel" role="dialog" aria-modal="true" aria-labelledby="village-npc-name" tabindex="-1"><header class="village-panel-heading"><div><span class="village-eyebrow">VILA DO RECOMEÇO</span><h2 id="village-npc-name"></h2><p class="village-npc-role"></p></div><div class="village-heading-actions"><span class="village-wallet" aria-label="Seu saldo"><span class="village-coin" aria-hidden="true"></span><strong data-village-balance></strong><small>Coroas</small></span><button class="village-close" type="button" data-village-close aria-label="Fechar conversa" title="Fechar · Esc">×</button></div></header><nav class="village-tabs" aria-label="Conversa e comércio"></nav><div class="village-panel-body"></div><p class="village-feedback" role="status" aria-live="polite"></p><footer class="village-panel-footer"><span>Converse com os moradores e negocie seus produtos.</span><span><kbd>Esc</kbd> voltar à vila</span></footer></section>`;
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
    this.npc = npc;
    this.tab = 'talk'; this.dialogueIndex = 0; this.selected = undefined; this.quantity = 1;
    this.layer.dataset.npc = npc.id;
    this.layer.hidden = false;
    this.report('');
    this.render();
    this.layer.querySelector<HTMLButtonElement>('[data-village-close]')!.focus();
  }

  close(): void {
    if (!this.isOpen) return;
    this.npc = undefined;
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
    this.panel.querySelector('[data-npc-portrait]')?.remove();const portrait=this.callbacks.getPortrait?.(this.npc.id);if(portrait){const img=document.createElement('img');img.dataset.npcPortrait='';img.src=portrait;img.alt=this.npc.name;img.style.cssText='width:48px;height:64px;object-fit:contain;image-rendering:pixelated;float:left;margin-right:14px';this.title.parentElement!.prepend(img);}
    this.subtitle.textContent = merchant?.shop ?? this.npc.role;
    this.balance.textContent = count(this.callbacks.getEconomy().coins);
    this.tabs.replaceChildren();
    const options: Array<[Tab, string]> = [['talk', 'Conversar']];
    if(this.npc.id==='bento'){const b=document.createElement('button');b.className='village-primary';b.textContent='Fundição, ferramentas e encomendas';b.dataset.openBlacksmith='';b.onclick=()=>this.callbacks.onBlacksmith?.();this.tabs.append(b);}
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

  private renderServices():void {
    this.body.replaceChildren();this.body.className='village-panel-body';
    for(const service of this.callbacks.getServices?.(this.npc!.id)??[]){
      const row=document.createElement('article');row.className='village-service';row.style.cssText='padding:14px;border-bottom:1px solid #b39a6d';
      const title=document.createElement('h3');title.textContent=service.label;const text=document.createElement('p');text.textContent=service.description;
      const button=document.createElement('button');button.className='village-primary';button.textContent='Solicitar';button.dataset.villageService=service.id;
      button.onclick=()=>{const result=this.callbacks.onService?.(service.id);this.balance.textContent=count(this.callbacks.getEconomy().coins);if(result)this.report(result.message,result.ok);};
      row.append(title,text,button);this.body.append(row);
    }
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
    this.body.replaceChildren(); this.body.className = 'village-panel-body village-dialogue';
    const available = npc.merchantId && isMerchantOpen(npc.merchantId, this.day);
    const inside=this.callbacks.canTrade?.(npc.id)??true;
    const emblem = this.emblem(npc.merchantId ? merchantEmblems[npc.merchantId] : 'fiber');
    emblem.classList.add('village-dialogue-emblem');
    const copy = document.createElement('div'); copy.className = 'village-dialogue-copy';
    const quote = document.createElement('p'); quote.className = 'village-dialogue-text';
    quote.textContent = npc.dialogue[this.dialogueIndex] ?? 'É bom ver a vila recebendo novos vizinhos.';
    const actions = document.createElement('div'); actions.className = 'village-dialogue-actions';
    const progress = document.createElement('span'); progress.className = 'village-dialogue-count';
    progress.textContent = `${Math.min(this.dialogueIndex + 1, npc.dialogue.length)} de ${npc.dialogue.length}`;
    const next = document.createElement('button'); next.type = 'button'; next.className = 'village-primary'; next.dataset.villageDialogueNext = '';
    const remaining = this.dialogueIndex < npc.dialogue.length - 1;
    next.textContent = remaining ? 'Continuar conversa →' : available&&inside ? 'Ver a loja →' : 'Até mais';
    next.addEventListener('click', () => {
      if (remaining) { this.dialogueIndex++; this.renderDialogue(); this.body.querySelector<HTMLButtonElement>('[data-village-dialogue-next]')?.focus(); }
      else if (available&&inside) this.selectTab('buy');
      else this.close();
    });
    actions.append(progress, next);
    if(available&&!inside&&this.callbacks.onGuide){const guide=document.createElement('button');guide.type='button';guide.className='village-primary';guide.dataset.guideToShop='';guide.textContent='Leve-me até sua loja';guide.onclick=()=>{this.close();this.callbacks.onGuide?.(npc.id);};actions.append(guide);const note=document.createElement('p');note.textContent='Compra e venda acontecem dentro da loja. Conversas e serviços continuam disponíveis aqui.';copy.append(note);}
    copy.prepend(quote);copy.append(actions); this.body.append(emblem, copy);
  }

  private renderTrade(merchantId: MerchantId, side: TradeSide): void {
    if(this.npc&&this.callbacks.canTrade?.(this.npc.id)===false){this.tab='talk';this.render();return;}
    const merchant = getMerchant(merchantId, this.day);
    if (!merchant || !isMerchantOpen(merchantId, this.day)) {
      this.tab = 'talk'; this.render(); this.report(merchantSchedule(merchantId), false); return;
    }
    const inventory = this.callbacks.getInventory();
    if(merchantId==='blacksmith'&&side==='buy'&&this.day<31){this.body.replaceChildren();const message=document.createElement('p');message.textContent='A venda de minerais será liberada no dia 31. Fundição e encomendas já estão disponíveis.';this.body.append(message);return;}
    const items = Object.keys(merchant[side]) as ItemId[];
    if (!this.selected || !items.includes(this.selected)) this.selected = side === 'sell' ? items.find(item => inventory[item] > 0) ?? items[0] : items[0];
    this.body.replaceChildren(); this.body.className = 'village-panel-body village-trade';
    const catalog = document.createElement('div'); catalog.className = 'village-catalog';
    const note = document.createElement('p'); note.className = 'village-shop-note';
    note.textContent = side === 'buy'
      ? `${merchant.description}${merchantId === 'general' || merchantId === 'traveler' ? ` Seleção do dia ${count(this.day)}.` : ''}`
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
    label.append(input);
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
      this.balance.textContent = count(this.callbacks.getEconomy().coins);
      this.renderTrade(merchantId, side);
      this.report(result.message, result.ok);
      this.body.querySelector<HTMLButtonElement>(`[data-trade-item="${item}"]`)?.focus();
    });
    detail.append(icon, heading, description, stock, label, total, action, reason);
  }
}
