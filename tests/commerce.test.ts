import {describe,expect,it,vi} from 'vitest';
import {MERCHANTS,MAX_COINS,MAX_TRADE_QUANTITY,VILLAGE_NPC_IDS,createVillageEconomy,getMerchant,isMerchantOpen,meetVillager,unitPrice,validateVillageEconomy} from '../src/data/village-commerce';
import {trade} from '../src/systems/commerce';
import {Inventory,MAX_ITEM_COUNT} from '../src/systems/inventory';
import type {ItemId} from '../src/types';

describe('village commerce',()=>{
  it('has ten distinct merchants linked to the ten named villagers, selling only real inventory items',()=>{
    expect(Object.keys(MERCHANTS)).toHaveLength(10);
    expect(Object.values(MERCHANTS).map(merchant=>merchant.npcId).sort()).toEqual([...VILLAGE_NPC_IDS].sort());
    const inventory=new Inventory();
    for(const merchant of Object.values(MERCHANTS))for(const offers of [merchant.buy,merchant.sell])for(const [item,price] of Object.entries(offers)){
      expect(Object.hasOwn(inventory.data,item)).toBe(true);expect(price).toBeGreaterThan(0);expect(Number.isInteger(price)).toBe(true);
    }
  });
  it('lets a legacy player begin with a gathered resource sale, then buy seeds with the exact proceeds',()=>{
    const inventory=new Inventory({turnip:2});const economy=createVillageEconomy();
    expect(economy).toEqual({coins:100,met:[]});
    expect(trade('seeds','sell','turnip',2,inventory,economy)).toMatchObject({ok:true,total:16});
    expect(inventory.data.turnip).toBe(0);expect(economy.coins).toBe(116);
    expect(trade('seeds','buy','seeds',3,inventory,economy)).toMatchObject({ok:true,total:24,unitPrice:8});
    expect(inventory.data.seeds).toBe(3);expect(economy.coins).toBe(92);
  });

  it('preserves items and coins when money or sale stock is insufficient',()=>{
    const inventory=new Inventory({turnip:1});const economy={coins:7,met:[]};
    const before={inventory:{...inventory.data},economy:structuredClone(economy)};
    expect(trade('seeds','buy','seeds',1,inventory,economy)).toMatchObject({ok:false,reason:'not-enough-coins'});
    expect(trade('seeds','sell','turnip',2,inventory,economy)).toMatchObject({ok:false,reason:'not-enough-items'});
    expect(inventory.data).toEqual(before.inventory);expect(economy).toEqual(before.economy);
  });

  it('does not spend coins when the inventory rejects a gain, including its stack and capacity checks',()=>{
    const inventory=new Inventory({seeds:MAX_ITEM_COUNT});const economy={coins:100,met:[]};
    const before={...inventory.data};
    expect(trade('seeds','buy','seeds',1,inventory,economy)).toMatchObject({ok:false,reason:'inventory-full'});
    expect(economy.coins).toBe(100);expect(inventory.data).toEqual(before);
    // Inventory owns slot-capacity decisions; commerce must honor refusal as
    // more distinct items are added to the game's currently smaller catalogue.
    const ordinary=new Inventory();const rejection=vi.spyOn(ordinary,'transact').mockReturnValue(false);
    expect(trade('seeds','buy','seeds',1,ordinary,economy).ok).toBe(false);
    expect(economy.coins).toBe(100);expect(ordinary.data.seeds).toBe(0);rejection.mockRestore();
  });

  it('does not take sale stock when the wallet would overflow, and accepts the exact limit',()=>{
    const inventory=new Inventory({turnip:2});const economy={coins:MAX_COINS-7,met:[]};
    expect(trade('seeds','sell','turnip',1,inventory,economy)).toMatchObject({ok:false,reason:'wallet-full'});
    expect(inventory.data.turnip).toBe(2);expect(economy.coins).toBe(MAX_COINS-7);
    economy.coins=MAX_COINS-8;
    expect(trade('seeds','sell','turnip',1,inventory,economy).ok).toBe(true);
    expect(economy.coins).toBe(MAX_COINS);expect(inventory.data.turnip).toBe(1);
  });

  it.each([0,-1,1.5,NaN,Infinity,MAX_TRADE_QUANTITY+1])('rejects invalid quantity %s without changing stock or wallet',quantity=>{
    const inventory=new Inventory({seeds:2});const economy={coins:100,met:[]};
    const before={...inventory.data};
    expect(trade('seeds','buy','seeds',quantity,inventory,economy)).toMatchObject({ok:false,reason:'invalid-quantity'});
    expect(inventory.data).toEqual(before);expect(economy.coins).toBe(100);
  });

  it('rejects unknown merchants, unavailable items and the opposite shop without mutating stock',()=>{
    const inventory=new Inventory({turnip:2});const economy={coins:100,met:[]};
    expect(getMerchant('__proto__')).toBeUndefined();expect(unitPrice('seeds','buy','hatchet')).toBeUndefined();
    expect(trade('unknown','sell','turnip',1,inventory,economy)).toMatchObject({ok:false,reason:'unknown-merchant'});
    expect(trade('blacksmith','sell','turnip',1,inventory,economy)).toMatchObject({ok:false,reason:'unavailable'});
    expect(trade('seeds','buy','invented' as ItemId,1,inventory,economy)).toMatchObject({ok:false,reason:'unavailable'});
    expect(inventory.data.turnip).toBe(2);expect(economy.coins).toBe(100);
  });

  it('recusa venda de ferramentas iniciais e aprimoradas prontas',()=>{const i=new Inventory();const e=createVillageEconomy();for(const id of ['pickaxe','hatchet','hoe'] as const)expect(trade('blacksmith','buy',id,1,i,e,31).ok).toBe(false);expect(e.coins).toBe(100);});

  it('validates legacy/default balances, known introductions, and invalid recovered balances',()=>{
    expect(validateVillageEconomy(createVillageEconomy())).toBe(true);
    expect(validateVillageEconomy({coins:MAX_COINS,met:['augusto','bento','amelia','tobias','rosa','nilo','celina','damiao','helena','icaro']})).toBe(true);
    for(const coins of [-1,.5,NaN,Infinity,MAX_COINS+1])expect(validateVillageEconomy({coins,met:[]})).toBe(false);
    for(const met of [['unknown'],['rosa','rosa'],'rosa',null])expect(validateVillageEconomy({coins:0,met})).toBe(false);
    const inventory=new Inventory({turnip:1});const economy={coins:-1,met:[]};
    expect(trade('seeds','sell','turnip',1,inventory,economy)).toMatchObject({ok:false,reason:'invalid-economy'});
    expect(inventory.data.turnip).toBe(1);expect(economy.coins).toBe(-1);
  });

  it('retains balances and introductions across JSON reloads without repeating a reward',()=>{
    const inventory=new Inventory({turnip:1});const economy=createVillageEconomy();
    expect(meetVillager(economy,'rosa')).toBe(true);expect(meetVillager(economy,'rosa')).toBe(false);
    expect(meetVillager(economy,'unknown')).toBe(false);expect(economy.coins).toBe(100);
    expect(trade('seeds','sell','turnip',1,inventory,economy).ok).toBe(true);
    const restored=JSON.parse(JSON.stringify({inventory:inventory.data,economy}));
    expect(validateVillageEconomy(restored.economy)).toBe(true);
    expect(meetVillager(restored.economy,'rosa')).toBe(false);
    expect(trade('seeds','buy','seeds',2,new Inventory(restored.inventory),restored.economy).ok).toBe(true);
    expect(restored.economy).toEqual({coins:92,met:['rosa']});
  });

  it('never offers a profit from buying and immediately reselling in any merchant',()=>{
    for(const source of Object.values(MERCHANTS))for(const [item,buyPrice] of Object.entries(source.buy)){
      for(const destination of Object.values(MERCHANTS)){
        const sellPrice=destination.sell[item as ItemId];
        if(sellPrice!==undefined)expect(sellPrice).toBeLessThan(buyPrice!);
      }
    }
  });

  it('rotates Augusto stock by game day and never rerolls it on reopening or reload',()=>{
    const first=getMerchant('general',1)!,again=getMerchant('general',1)!;
    expect(first.buy).toEqual(again.buy);expect(Object.keys(first.buy)).toHaveLength(4);
    expect(first.buy).not.toEqual(MERCHANTS.general.buy);
    const variations=new Set(Array.from({length:10},(_,i)=>Object.keys(getMerchant('general',i+1)!.buy).sort().join(',')));
    expect(variations.size).toBeGreaterThan(1);
    const unlisted=Object.keys(MERCHANTS.general.buy).find(item=>!Object.hasOwn(first.buy,item))! as ItemId;
    const economy={coins:1000,met:[]},inventory=new Inventory();
    expect(trade('general','buy',unlisted,1,inventory,economy,1)).toMatchObject({ok:false,reason:'unavailable'});
    expect(economy.coins).toBe(1000);
    const listed=Object.keys(first.buy)[0] as ItemId;
    expect(trade('general','buy',listed,1,inventory,economy,1).ok).toBe(true);
    expect(inventory.data[listed]).toBe(1);
  });

  it('mantém Nilo como antiquário local sem caravana nem restrição de visita',()=>{for(const day of [1,2,3,31]){expect(isMerchantOpen('traveler',day)).toBe(true);expect(getMerchant('traveler',day)!.buy).toEqual({oldMap:80});}expect(getMerchant('general',NaN)).toBeUndefined();expect(isMerchantOpen('traveler',0)).toBe(false);});
});
