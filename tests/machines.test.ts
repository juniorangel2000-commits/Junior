import {describe,it,expect,vi} from 'vitest';
import {createNewSave,migrateSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {MACHINE_IDS,MACHINES,MACHINE_RECIPES,CRAFTED_MACHINE_IDS} from '../src/data/machines';
import {placeMachine,loadMachine,collectMachine,machineReady,machinePointBlocked,nearMachine,interactMachine,validMachineState,type MachineRuntime,type MachineSpace} from '../src/systems/machines';
import {Inventory,MAX_ITEM_COUNT} from '../src/systems/inventory';
import {craft} from '../src/systems/crafting';
import {performVillageService,listVillageServices} from '../src/systems/village-services';
import {MERCHANTS} from '../src/data/village-commerce';
import {FARM_BUILDINGS} from '../src/data/farm-buildings';
import {bentoSceneWriter} from '../src/systems/bento-commit';
function setup(){let s=createNewSave(createCharacterProfile('Máquinas'));s.time=600;const p={x:176,y:208,facing:{x:0,y:-1}};let space:MachineSpace|undefined='property';
 const write=vi.fn(()=>true),rt:MachineRuntime={read:()=>s,snapshot:()=>structuredClone(s),write,apply:d=>{s=d;},player:()=>p,space:()=>space,bounds:()=>({width:512,height:512}),blocked:(x,y)=>x<32||y<32||x>480||y>480,placement:()=>'',actors:()=>[],enabled:()=>true};
 for(const k of MACHINE_IDS)s.inventory[k]=1;
 return{rt,write,p,get s(){return s;},space:(v:typeof space)=>{space=v;}};
}
function advance(t:ReturnType<typeof setup>,minutes:number){const n=(t.s.day-1)*1440+t.s.time+minutes;t.s.day=Math.floor(n/1440)+1;t.s.time=n%1440;}
const machine=(t:ReturnType<typeof setup>)=>t.s.machines!.items[0];
describe('máquinas: instalação e navegação',()=>{
 it('retira uma máquina da mochila, cria colisão e permite guardar apenas a vazia',()=>{
  const t=setup();expect(placeMachine(t.rt,'cheesePress').ok).toBe(true);expect(t.s.inventory.cheesePress).toBe(0);
  expect(machinePointBlocked(t.s,'property',176,176)).toBe(true);expect(machinePointBlocked(t.s,'farm:1',176,176)).toBe(false);
  expect(nearMachine(t.rt)?.id).toBe(1);expect(collectMachine(t.rt,1).ok).toBe(true);expect(t.s.inventory.cheesePress).toBe(1);expect(t.s.machines!.items).toHaveLength(0);
 });
 it('funciona nas quatro direções e não sobrepõe o jogador nem outra máquina',()=>{
  for(const facing of [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]){const t=setup();t.p.facing=facing;expect(placeMachine(t.rt,'loom').ok).toBe(true);expect(placeMachine(t.rt,'cheesePress').ok).toBe(false);}
 });
 it('não instala em obstáculos, espaços ocupados, passagens estreitas ou cenários não permitidos',()=>{
  const t=setup(),before=structuredClone(t.s);t.rt.placement=()=> 'Cocho';expect(placeMachine(t.rt,'loom').ok).toBe(false);expect(t.s).toEqual(before);
  t.rt.placement=()=>'';t.rt.actors=()=>[{x:176,y:176}];expect(placeMachine(t.rt,'loom').ok).toBe(false);
  t.rt.actors=()=>[];t.rt.blocked=(x,y)=>x<160||x>192||y<32||y>480;expect(placeMachine(t.rt,'cheesePress').message).toContain('passagem');
  t.space(undefined);expect(placeMachine(t.rt,'loom').ok).toBe(false);expect(t.s).toEqual(before);
 });
 it('uma parede impede acessar a máquina e uma moradia não acessa a outra',()=>{
  const t=setup();placeMachine(t.rt,'cheesePress');t.rt.blocked=(_x,y)=>y>195&&y<200;
  expect(nearMachine(t.rt)).toBeUndefined();expect(loadMachine(t.rt,1,'milk').ok).toBe(false);
  t.rt.blocked=()=>false;t.space('farm:1');expect(nearMachine(t.rt)).toBeUndefined();expect(collectMachine(t.rt,1).ok).toBe(false);
 });
 it('falha ao salvar instalação e recolhimento não remove nem duplica a máquina',()=>{
  const t=setup(),before=structuredClone(t.s);t.write.mockReturnValue(false);expect(placeMachine(t.rt,'loom').ok).toBe(false);expect(t.s).toEqual(before);
  t.write.mockReturnValue(true);placeMachine(t.rt,'loom');const placed=structuredClone(t.s);t.write.mockImplementation(()=>{throw Error('disco');});expect(collectMachine(t.rt,1).ok).toBe(false);expect(t.s).toEqual(placed);
 });
});
describe('processamento pelo relógio do jogo',()=>{
 it.each(MACHINE_RECIPES.filter(r=>!r.ingredients))('$id: consome a carga correta e entrega somente depois do prazo',r=>{
  const t=setup();t.s.inventory[r.input]=r.amount;expect(placeMachine(t.rt,r.machine).ok).toBe(true);
  expect(loadMachine(t.rt,1,r.input).ok).toBe(true);expect(t.s.inventory[r.input]).toBe(0);expect(machine(t).job!.readyAt-machine(t).job!.startedAt).toBe(r.minutes);
  expect(loadMachine(t.rt,1,r.input).ok).toBe(false);expect(collectMachine(t.rt,1).ok).toBe(false);
  advance(t,r.minutes-1);expect(machineReady(t.s,machine(t))).toBe(false);advance(t,1);expect(machineReady(t.s,machine(t))).toBe(true);
  expect(collectMachine(t.rt,1).ok).toBe(true);expect(t.s.inventory[r.output]).toBe(r.quantity);expect(machine(t).job).toBeUndefined();expect(validateSave(t.s)).toBe(true);
 });
 it('preserva carga e prazo durante viagens, sono e recarregamento',()=>{
  const t=setup();t.s.inventory.goatMilk=1;placeMachine(t.rt,'cheesePress');loadMachine(t.rt,1,'goatMilk');const job=structuredClone(machine(t).job);
  t.s.activeArea='forest';advance(t,7*1440);const restored=migrateSave(JSON.parse(JSON.stringify(t.s)))!;expect(restored.machines!.items[0].job).toEqual(job);expect(machineReady(restored,restored.machines!.items[0])).toBe(true);
  t.rt.apply(restored);t.s.activeArea='property';expect(collectMachine(t.rt,1).ok).toBe(true);expect(t.s.inventory.goatCheese).toBe(1);expect(t.s.inventory.cheese).toBe(0);
 });
 it('não retira ingredientes errados/insuficientes e E aceita o ingrediente equipado',()=>{
  const t=setup();placeMachine(t.rt,'butterChurn');t.s.inventory.milk=1;t.s.inventory.wool=1;const before=structuredClone(t.s);
  expect(loadMachine(t.rt,1,'wool').ok).toBe(false);expect(interactMachine(t.rt,'milk')?.ok).toBe(false);expect(t.s).toEqual(before);
  t.s.inventory.milk=2;expect(interactMachine(t.rt,'milk')?.ok).toBe(true);expect(t.s.inventory.milk).toBe(0);
 });
 it('falha ao salvar carga/coleta ou estoque cheio preserva ingrediente e produto',()=>{
  const t=setup();placeMachine(t.rt,'spinningWheel');t.s.inventory.wool=1;const before=structuredClone(t.s);t.write.mockReturnValue(false);
  expect(loadMachine(t.rt,1,'wool').ok).toBe(false);expect(t.s).toEqual(before);
  t.write.mockReturnValue(true);loadMachine(t.rt,1,'wool');advance(t,1440);t.s.inventory.yarn=MAX_ITEM_COUNT;const ready=structuredClone(t.s);expect(collectMachine(t.rt,1).ok).toBe(false);expect(t.s).toEqual(ready);
  t.s.inventory.yarn=0;t.write.mockReturnValue(false);const saved=structuredClone(t.s);expect(collectMachine(t.rt,1).ok).toBe(false);expect(t.s).toEqual(saved);
  t.write.mockReturnValue(true);expect(collectMachine(t.rt,1).ok).toBe(true);expect(t.s.inventory.yarn).toBe(1);expect(collectMachine(t.rt,1).ok).toBe(true);expect(t.s.inventory.yarn).toBe(1);
 });
});
describe('projetos e compatibilidade',()=>{
 it.each(CRAFTED_MACHINE_IDS)('%s é aprendida com o morador correto e montada apenas na bancada',kind=>{
  const t=setup(),d=MACHINES[kind];t.s.villageEconomy!.coins=1000;expect(listVillageServices(d.npc).some(s=>s.id==='learn-'+kind)).toBe(true);
  const inventory=new Inventory({...d.cost,hammer:1});expect(craft(kind,inventory,true,t.s.villageProgress).ok).toBe(false);
  expect(performVillageService(t.s,'learn-'+kind).ok).toBe(true);expect(t.s.villageEconomy!.coins).toBe(1000-d.learnFee);expect(performVillageService(t.s,'learn-'+kind).ok).toBe(false);
  expect(craft(kind,inventory,false,t.s.villageProgress).ok).toBe(false);expect(craft(kind,inventory,true,t.s.villageProgress).ok).toBe(true);expect(inventory.data[kind]).toBe(1);expect(validateSave(t.s)).toBe(true);
 });
 it('adiciona itens opcionais a saves anteriores sem instalar máquinas ou mudar o estoque antigo',()=>{
  const old:any=setup().s;delete old.machines;for(const id of [...MACHINE_IDS,'cheese','goatCheese','butter','yarn','flour','cornmeal','oatFlakes'])delete old.inventory[id];
  const restored=migrateSave(old)!;expect(restored.machines).toBeUndefined();expect(restored.inventory).toMatchObject({cheesePress:0,butter:0,yarn:0});
 });
 it('valida IDs, sobreposição, moradias, receitas e prazos sem aceitar produtos inventados',()=>{
  const t=setup();placeMachine(t.rt,'cheesePress');t.s.inventory.milk=1;loadMachine(t.rt,1,'milk');expect(validateSave(t.s)).toBe(true);
  const bad=(f:(s:typeof t.s)=>void)=>{const d=structuredClone(t.s);f(d);return validMachineState(d.machines,d);};
  expect(bad(s=>s.machines!.items.push({...s.machines!.items[0]}))).toBe(false);
  expect(bad(s=>{s.machines!.items[0].job!.readyAt+=1;})).toBe(false);
  expect(bad(s=>{s.machines!.items[0].job!.recipe='cloth';})).toBe(false);
  expect(bad(s=>{s.machines!.items[0].space='farm:99';})).toBe(false);
 });
 it('mantém cargas atuais mesmo quando Bento grava um rascunho antigo',()=>{
  const t=setup(),old=structuredClone(t.s);placeMachine(t.rt,'cheesePress');t.s.inventory.milk=1;loadMachine(t.rt,1,'milk');let written:any;
  bentoSceneWriter(()=>structuredClone(t.s),s=>{written=s;return true;})(old);expect(written.machines).toEqual(t.s.machines);expect(written.inventory.milk).toBe(0);
 });
 it('distingue máquinas da mesma espécie em interiores diferentes e protege portas/fixos no save',()=>{
  const t=setup();t.s.farmConstruction={version:1,nextId:3,sites:[1,2].map(id=>({id,kind:'barn',x:20+id*15,y:30,finished:true,delivered:{...FARM_BUILDINGS.barn.cost},animals:[],hay:0,gateOpen:true}))};
  t.s.machines={version:1,nextId:3,items:[{id:1,kind:'cheesePress',x:5,y:5,space:'farm:1'},{id:2,kind:'cheesePress',x:5,y:5,space:'farm:2'}]};expect(validateSave(t.s)).toBe(true);
  t.s.machines.items[0].y=8;expect(validateSave(t.s)).toBe(false);t.s.machines.items[0].y=1;t.s.machines.items[0].x=2;expect(validateSave(t.s)).toBe(false);
 });
 it('os produtos novos vêm do processamento e são comprados pelos moradores',()=>{
  expect(MERCHANTS.inn.sell).toMatchObject({cheese:40,goatCheese:52,butter:48,flour:24});expect(MERCHANTS.tailor.sell.yarn).toBe(54);
  for(const m of Object.values(MERCHANTS))for(const id of ['cheese','goatCheese','butter','yarn','flour','cornmeal','oatFlakes'] as const)expect(m.buy[id]).toBeUndefined();
 });
});
