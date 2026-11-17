import {describe,it,expect,vi} from 'vitest';
vi.mock('../src/visual-assets',()=>({itemIconUrl:()=>undefined}));
vi.mock('../src/audio',()=>({gameAudio:{play:()=>{}}}));
vi.mock('../src/request-board.css',()=>({}));
import {createNewSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {boardRequests,boardHasReady,BOARD_SERVICE_IDS} from '../src/request-board';
import {performVillageService,listVillageServices} from '../src/systems/village-services';
import {createVillageEconomy} from '../src/data/village-commerce';
import {createVillageProgress} from '../src/data/village-progress';

const save=()=>{const s=createNewSave(createCharacterProfile('Quadro'));s.day=2;s.villageEconomy=createVillageEconomy();s.villageProgress=createVillageProgress();return s;};
describe('quadro de pedidos',()=>{
 it('reúne os pedidos de Rosa, Tobias, Helena, Amélia, Bento e Damião',()=>{
  const cards=boardRequests(save());
  expect(new Set(cards.map(c=>c.npc))).toEqual(new Set(['rosa','tobias','helena','amelia','bento','damiao']));
  expect(cards.every(c=>!c.done)).toBe(true);
  for(const c of cards)for(const a of c.actions)expect(BOARD_SERVICE_IDS).toContain(a.service);
 });
 it('aceitar e entregar o contrato da Rosa pelo quadro; concluído vai para a aba de concluídos',()=>{
  const s=save();s.inventory.turnip=12;
  expect(performVillageService(s,'contract-accept').ok).toBe(true);
  let rosa=boardRequests(s).find(c=>c.id==='rosa-contract')!;expect(rosa.actions[0].service).toBe('contract-deliver');expect(boardHasReady(s)).toBe(true);
  const coins=s.villageEconomy!.coins;expect(performVillageService(s,'contract-deliver').ok).toBe(true);
  rosa=boardRequests(s).find(c=>c.id==='rosa-contract')!;expect(rosa.done).toBe(true);expect(s.villageEconomy!.coins).toBe(coins+220);
 });
 it('pedido que se renova: madeira para o Tobias',()=>{
  const s=save();s.inventory.wood=20;
  const card=()=>boardRequests(s).find(c=>c.id==='request-tobias')!;
  expect(card().actions[0].disabled).toBe(false);expect(performVillageService(s,'request-tobias').ok).toBe(true);
  expect(card().done).toBe(true);expect(card().due).toContain('Novo pedido em');
 });
});
describe('Ícaro: luminárias e bomba separadas',()=>{
 it('cada projeto libera só a sua receita',()=>{
  const s=save();s.villageEconomy!.coins=500;s.inventory.scrap=10;s.inventory.electronicPart=5;
  expect(performVillageService(s,'learn-lamps').ok).toBe(true);
  expect(s.villageProgress!.recipes).toContain('lamp');expect(s.villageProgress!.recipes).not.toContain('waterPump');
  const offers=listVillageServices('icaro',s);
  expect(offers.find(o=>o.id==='learn-lamps')!.actionLabel).toBe('Já aprendido');expect(offers.find(o=>o.id==='learn-pump')!.disabled).toBeFalsy();
  expect(performVillageService(s,'learn-pump').ok).toBe(true);expect(s.villageProgress!.recipes).toContain('waterPump');
  expect(offers.find(o=>o.id==='learn-pump')!.item).toBe('waterPump');
 });
});
