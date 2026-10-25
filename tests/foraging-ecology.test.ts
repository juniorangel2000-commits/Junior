import {describe,it,expect} from 'vitest';
import {TreeAvoidanceField,naturalPlantGround} from '../src/systems/tree-avoidance';
import {AnimalBrain} from '../src/systems/animals';
import {newResourceField,replenishResources,validateResourceField,RESOURCE_LIMITS,HAND_GATHERING_KINDS} from '../src/systems/resource-spawns';
import {ResourceLifecycle} from '../src/resource-lifecycle';
import {createNewSave} from '../src/systems/save';
import type {ResourceNode} from '../src/types';

describe('coleta manual nos pisos naturais e distribuição',()=>{
 it.each(['property','forest'] as const)('faz nascer plantas no prado pintado em %s sem ocupar pisos construídos',area=>{
  const save=createNewSave({name:'Prado',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso'});
  const map=area==='forest'?save.forestMapEdits!:save.mapEdits!;
  for(let y=15;y<=35;y++)for(let x=12;x<=32;x++)map.terrain[`${x},${y}`]='meadow';
  for(let y=15;y<=35;y++)map.terrain[`20,${y}`]='wood';
  const world={resources:[] as ResourceNode[],isWater:()=>false,setNaturalResources(nodes:readonly ResourceNode[]){this.resources=nodes.map(n=>({...n}));}};
  new ResourceLifecycle(save,area,world,(x,y)=>x>=12&&x<=32&&y>=15&&y<=35&&x!==20);
  const manual=world.resources.filter(n=>HAND_GATHERING_KINDS.some(kind=>kind===n.kind));
  expect(world.resources.length).toBeLessThanOrEqual(RESOURCE_LIMITS[area]);expect(manual.length).toBeGreaterThan(RESOURCE_LIMITS[area]*.6);
  expect(world.resources.filter(n=>n.kind==='fiber'||n.kind==='seeds').length).toBeGreaterThan(10);
  expect(world.resources.every(n=>n.x!==20&&map.terrain[`${n.x},${n.y}`]==='meadow')).toBe(true);
  for(const material of ['wood','paving','soil','path','water'])expect(naturalPlantGround(material)).toBe(false);
 });
 it('espalha os recursos por setores e mantém posições distintas',()=>{
  const field=newResourceField(987);replenishResources(field,'forest',0,()=>true);
  const sectors=new Set(field.nodes.map(n=>`${Math.floor(n.x/16)},${Math.floor(n.y/18)}`));
  expect(sectors.size).toBe(24);expect(new Set(field.nodes.map(n=>`${n.x},${n.y}`)).size).toBe(field.nodes.length);
  expect(field.nodes.filter(n=>n.kind==='seeds').length).toBeGreaterThanOrEqual(4);
  expect(field.nodes.filter(n=>n.kind==='scrap').length).toBeGreaterThanOrEqual(4);
 });
 it('amplia uma partida antiga sem apagar IDs ou antecipar os tempos de recursos coletados',()=>{
  const field=newResourceField(15);delete field.gatheringRevision;field.initialized=true;field.sequence=2;
  field.nodes=[{id:'spawn-p-stone-1',kind:'stone',x:10,y:10},{id:'spawn-p-tree-2',kind:'tree',x:11,y:11}];
  field.waiting=[{kind:'fiber',at:4700,plant:'whiteFlowers'}];
  replenishResources(field,'property',300,()=>true,8);
  expect(field.nodes).toHaveLength(8);expect(field.nodes.some(n=>n.id==='spawn-p-stone-1')).toBe(true);
  expect(field.waiting).toEqual([{kind:'fiber',at:4700,plant:'whiteFlowers'}]);expect(validateResourceField(field,'property')).toBe(true);
  const snapshot=JSON.stringify(field);replenishResources(field,'property',300,()=>true,8);expect(JSON.stringify(field)).toBe(snapshot);
 });
});

describe('preferência dos animais por espaços abertos',()=>{
 const bounds=(x:number,y:number)=>x<1||y<1||x>=95||y>=71;
 it('acompanha copa, raízes e corte sem criar colisões novas',()=>{
  const cover=new TreeAvoidanceField();cover.refresh([{x:20,y:20}]);
  expect(cover.cost(20,20)).toBeGreaterThan(2);expect(cover.cost(20,18)).toBeGreaterThan(0);expect(cover.cost(25,20)).toBe(0);
  cover.refresh([]);expect(cover.cost(20,20)).toBe(0);
 });
 it('escolhe um contorno aberto ao conduzir, em vez de atalhar pela copa',()=>{
  const cost=(x:number,y:number)=>x>=12&&x<=14&&y>=11&&y<=13?4:0;
  const a=new AnimalBrain('open-lead','goat',10.5*32,12.5*32,true,bounds,84,cost),old=new AnimalBrain('open-lead','goat',10.5*32,12.5*32,true,bounds,84),player={x:16.5*32,y:12.5*32};
  let canopy=0,oldCanopy=0,detour=false;
  for(let i=0;i<400;i++){a.update(1/60,player,[a],true);old.update(1/60,player,[old],true);if(cost(Math.floor(a.x/32),Math.floor(a.y/32))>0)canopy++;if(cost(Math.floor(old.x/32),Math.floor(old.y/32))>0)oldCanopy++;if(Math.abs(a.y-player.y)>32)detour=true;}
  expect(detour).toBe(true);expect(canopy).toBeLessThan(oldCanopy/4);expect(Math.hypot(a.x-player.x,a.y-player.y)).toBeLessThan(42);
 });
 it('continua atravessando um corredor estreito com árvores se for o único acesso',()=>{
  const blocked=(x:number,y:number)=>bounds(x,y)||y!==12;
  const a=new AnimalBrain('narrow-lead','cow',10.5*32,12.5*32,true,blocked,84,()=>4),player={x:13*32,y:12.5*32};
  for(let i=0;i<160;i++)a.update(1/60,player,[a],true);
  expect(Math.hypot(a.x-player.x,a.y-player.y)).toBeLessThanOrEqual(40);expect(a.canStand(a.x,a.y)).toBe(true);
 });
 it('foge por espaços abertos em vez de avançar para dentro de uma área de copas',()=>{
  const cost=(x:number,y:number)=>x>=12&&x<=20&&y>=8&&y<=16?4:0;
  const old=new AnimalBrain('flee-cover','deer',10.5*32,12.5*32,true,bounds),aware=new AnimalBrain('flee-cover','deer',10.5*32,12.5*32,true,bounds,84,cost),player={x:9.5*32,y:12.5*32};
  let oldCover=0,newCover=0;
  for(let i=0;i<180;i++){
   old.update(1/60,player,[old]);aware.update(1/60,player,[aware]);
   oldCover+=cost(Math.floor(old.x/32),Math.floor(old.y/32));newCover+=cost(Math.floor(aware.x/32),Math.floor(aware.y/32));
  }
  expect(newCover).toBeLessThan(oldCover);expect(aware.distanceMoved).toBeGreaterThan(150);
 });
});
