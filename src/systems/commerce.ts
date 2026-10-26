import {stockInfo} from './economy';
import {ECONOMY_BALANCE as B,NON_COMMERCIAL} from '../data/economy-balance';
import {ITEM_NAMES} from '../data/items';
import {getMerchant,isMerchantOpen,MAX_COINS,MAX_TRADE_QUANTITY,unitPrice,validateVillageEconomy,type TradeSide,type VillageEconomy} from '../data/village-commerce';
import type {ItemId} from '../types';
import {Inventory} from './inventory';

export type CommerceFailure='unknown-merchant'|'shop-closed'|'unavailable'|'invalid-quantity'|'invalid-economy'|'not-enough-coins'|'not-enough-items'|'inventory-full'|'wallet-full'|'already-owned';
export type CommerceResult={ok:true;message:string;total:number;quantity:number;unitPrice:number}|{ok:false;message:string;reason:CommerceFailure};
const tools=new Set<ItemId>(['hatchet','pickaxe','hoe','handsaw','hammer']);
const fail=(reason:CommerceFailure,message:string):CommerceResult=>({ok:false,reason,message});

/** Inventory and wallet commit together. Refused trades never spend either
 * items or coins, and only the merchant's own published prices are accepted. */
export function trade(merchantId:string,side:TradeSide,item:ItemId,quantity:number,inventory:Inventory,economy:VillageEconomy,day=1):CommerceResult {
  if(!getMerchant(merchantId,day))return fail('unknown-merchant','Este comerciante não está disponível.');
  if(!isMerchantOpen(merchantId,day))return fail('shop-closed','Nilo visita a vila a cada 3 dias: volte nos dias 3, 6, 9…');
  if(NON_COMMERCIAL.includes(item))return fail('unavailable','Este recurso é exclusivo de coleta ou fabricação.');
  if(merchantId==='blacksmith'&&side==='buy'&&item in B.stock&&day<31)return fail('unavailable','A venda de minerais será liberada no dia 31.');
  const price=unitPrice(merchantId,side,item,day);
  if(price===undefined)return fail('unavailable','Este item não faz parte do comércio desta loja.');
  if(!Number.isSafeInteger(quantity)||quantity<1||quantity>MAX_TRADE_QUANTITY)return fail('invalid-quantity',`Escolha uma quantidade inteira entre 1 e ${MAX_TRADE_QUANTITY}.`);
  if(!validateVillageEconomy(economy))return fail('invalid-economy','Não foi possível conferir seu saldo. A troca foi cancelada.');
  const total=price*quantity;
  if(!Number.isSafeInteger(total)||total<0)return fail('invalid-quantity','Esta quantidade não pode ser negociada.');
  if(side==='buy'){
    const limited=merchantId==='blacksmith'&&item in B.stock;const stock=limited?stockInfo(economy,item,day):undefined;
    if(stock&&stock.remaining<quantity)return fail('unavailable',`Estoque esgotado. Novas unidades no dia ${stock.nextDay}.`);
    if(tools.has(item)&&(inventory.has(item)||quantity!==1))return fail('already-owned',inventory.has(item)?'Você já tem esta ferramenta.':'Compre uma ferramenta de cada vez.');
    if(economy.coins<total)return fail('not-enough-coins','Moedas insuficientes. Venda uma colheita ou recursos para juntar C.');
    if(!inventory.transact({},{[item]:quantity}))return fail('inventory-full','Não há espaço para esta compra no inventário.');
    economy.coins-=total;
    if(stock){economy.stock??={};economy.stock[item]={cycle:stock.cycle,remaining:stock.remaining-quantity,bought:(B.stock[item as keyof typeof B.stock].quantity-stock.remaining)+quantity};}
    return {ok:true,message:`Compra concluída: ${quantity} × ${ITEM_NAMES[item]} por ${total} C.`,quantity,total,unitPrice:price};
  }
  if(!inventory.has(item,quantity))return fail('not-enough-items','Você não tem essa quantidade para vender.');
  if(economy.coins>MAX_COINS-total)return fail('wallet-full','Seu saldo atingiria o limite. A venda foi cancelada.');
  if(!inventory.transact({[item]:quantity},{}))return fail('not-enough-items','Não foi possível separar os itens desta venda.');
  economy.coins+=total;
  return {ok:true,message:`Venda concluída: ${quantity} × ${ITEM_NAMES[item]} por ${total} C.`,quantity,total,unitPrice:price};
}
