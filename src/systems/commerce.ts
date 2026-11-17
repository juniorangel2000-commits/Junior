import {stockInfo} from './economy';
import {ECONOMY_BALANCE as B,NON_COMMERCIAL} from '../data/economy-balance';
import {ITEM_NAMES} from '../data/items';
import {getMerchant,isMerchantOpen,MAX_COINS,MAX_TRADE_QUANTITY,unitPrice,validateVillageEconomy,type TradeSide,type VillageEconomy} from '../data/village-commerce';
import type {ItemId} from '../types';
import {Inventory} from './inventory';
import {peekBest,takeBest,touchQuality,qualityPrice,QUALITY_NAMES,QUALITY_PLURAL,type QualityHolder} from './item-quality';

export type CommerceFailure='unknown-merchant'|'shop-closed'|'unavailable'|'invalid-quantity'|'invalid-economy'|'not-enough-coins'|'not-enough-items'|'inventory-full'|'wallet-full'|'already-owned';
export type CommerceResult={ok:true;message:string;total:number;quantity:number;unitPrice:number}|{ok:false;message:string;reason:CommerceFailure};
const tools=new Set<ItemId>(['hatchet','pickaxe','hoe','handsaw','hammer','sickle','shovel']);
const fail=(reason:CommerceFailure,message:string):CommerceResult=>({ok:false,reason,message});

/** Inventory and wallet commit together. Refused trades never spend either
 * items or coins, and only the merchant's own published prices are accepted. */
/** `quality`: registro de qualidade do save. Na venda, as melhores unidades saem primeiro e
 * cada uma vale o preço com a qualidade aplicada (item-quality.ts). */
export function trade(merchantId:string,side:TradeSide,item:ItemId,quantity:number,inventory:Inventory,economy:VillageEconomy,day=1,quality?:QualityHolder):CommerceResult {
  if(!getMerchant(merchantId,day))return fail('unknown-merchant','Este comerciante não está disponível.');
  if(!isMerchantOpen(merchantId,day))return fail('shop-closed','Nilo visita a vila a cada 3 dias: volte nos dias 3, 6, 9…');
  if(NON_COMMERCIAL.includes(item))return fail('unavailable','Este recurso é exclusivo de coleta ou fabricação.');
  if(merchantId==='blacksmith'&&side==='buy'&&item in B.stock&&day<31)return fail('unavailable','A venda de minerais será liberada no dia 31.');
  const price=unitPrice(merchantId,side,item,day);
  if(price===undefined)return fail('unavailable','Este item não faz parte do comércio desta loja.');
  if(!Number.isSafeInteger(quantity)||quantity<1||quantity>MAX_TRADE_QUANTITY)return fail('invalid-quantity',`Escolha uma quantidade inteira entre 1 e ${MAX_TRADE_QUANTITY}.`);
  if(!validateVillageEconomy(economy))return fail('invalid-economy','Não foi possível conferir seu saldo. A troca foi cancelada.');
  const qualities=side==='sell'&&quality?peekBest(quality.itemQuality,item,inventory.data[item],quantity):[];
  const total=side==='sell'&&qualities.length===quantity?qualities.reduce<number>((n,q)=>n+qualityPrice(price,q),0):price*quantity;
  if(!Number.isSafeInteger(total)||total<0)return fail('invalid-quantity','Esta quantidade não pode ser negociada.');
  if(side==='buy'){
    const limited=merchantId==='blacksmith'&&item in B.stock;const stock=limited?stockInfo(economy,item,day):undefined;
    if(stock&&stock.remaining<quantity)return fail('unavailable',`Estoque esgotado. Novas unidades no dia ${stock.nextDay}.`);
    if(tools.has(item)&&(inventory.has(item)||quantity!==1))return fail('already-owned',inventory.has(item)?'Você já tem esta ferramenta.':'Compre uma ferramenta de cada vez.');
    if(economy.coins<total)return fail('not-enough-coins','Moedas insuficientes. Venda uma colheita ou recursos para juntar C.');
    if(quality)touchQuality(quality,item,inventory.data[item]);
    if(!inventory.transact({},{[item]:quantity}))return fail('inventory-full','Não há espaço para esta compra no inventário.');
    economy.coins-=total;
    if(stock){economy.stock??={};economy.stock[item]={cycle:stock.cycle,remaining:stock.remaining-quantity,bought:(B.stock[item as keyof typeof B.stock].quantity-stock.remaining)+quantity};}
    // Comprar a primeira foice ou pá com o Bento ensina a receita da bancada de trabalho.
    const learns=merchantId==='blacksmith'&&(item==='sickle'||item==='shovel')&&quality&&'villageProgress' in quality;
    const progress=learns?(quality as {villageProgress?:{recipes:string[]}}).villageProgress:undefined;
    const learned=!!progress&&!progress.recipes.includes(item);if(learned)progress!.recipes.push(item);
    return {ok:true,message:`Compra concluída: ${quantity} × ${ITEM_NAMES[item]} por ${total} C.`+(learned?' Você aprendeu a fazer na bancada de trabalho.':''),quantity,total,unitPrice:price};
  }
  if(!inventory.has(item,quantity))return fail('not-enough-items','Você não tem essa quantidade para vender.');
  if(economy.coins>MAX_COINS-total)return fail('wallet-full','Seu saldo atingiria o limite. A venda foi cancelada.');
  const before=inventory.data[item];
  if(!inventory.transact({[item]:quantity},{}))return fail('not-enough-items','Não foi possível separar os itens desta venda.');
  if(quality)takeBest(quality,item,before,quantity);
  economy.coins+=total;
  const better=([2,1] as const).map(q=>[q,qualities.filter(x=>x===q).length] as const).filter(([,n])=>n>0).map(([q,n])=>`${n} ${n===1?QUALITY_NAMES[q]:QUALITY_PLURAL[q]}`);
  return {ok:true,message:`Venda concluída: ${quantity} × ${ITEM_NAMES[item]} por ${total} C.`+(better.length?` Qualidade: ${better.join(' e ')}.`:''),quantity,total,unitPrice:price};
}
