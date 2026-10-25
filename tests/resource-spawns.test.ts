import {describe,it,expect} from 'vitest';
import {newResourceField,replenishResources,harvestSpawn,RESOURCE_RESPAWN_MINUTES,validateResourceField,RESOURCE_LIMITS} from '../src/systems/resource-spawns';
describe('bounded renewable resource fields',()=>{
 const allowed=(x:number,y:number)=>x>10&&x<80&&y>10&&y<60&&(x+y)%3!==0;
 it.each(['property','forest'] as const)('fills valid unique positions up to the %s cap',area=>{
  const field=newResourceField(7251);replenishResources(field,area,0,allowed);
  expect(field.nodes.length).toBe(RESOURCE_LIMITS[area]);expect(new Set(field.nodes.map(n=>`${n.x},${n.y}`)).size).toBe(field.nodes.length);expect(field.nodes.every(n=>allowed(n.x,n.y))).toBe(true);expect(validateResourceField(field,area)).toBe(true);
  replenishResources(field,area,9999,allowed);expect(field.nodes.length).toBe(RESOURCE_LIMITS[area]);
 });
 it('does not reappear before cooldown, and persists the timer without duplicate drops',()=>{
  const field=newResourceField(81);replenishResources(field,'property',0,allowed);const id=field.nodes[0].id;
  expect(harvestSpawn(field,id,10)).toBe(true);expect(harvestSpawn(field,id,10)).toBe(false);
  const loaded=JSON.parse(JSON.stringify(field));replenishResources(loaded,'property',10+RESOURCE_RESPAWN_MINUTES-1,allowed);expect(loaded.nodes.length).toBe(RESOURCE_LIMITS.property-1);
  replenishResources(loaded,'property',10+RESOURCE_RESPAWN_MINUTES,allowed);expect(loaded.nodes.length).toBe(RESOURCE_LIMITS.property);expect(loaded.nodes.some((n:{id:string})=>n.id===id)).toBe(false);expect(new Set(loaded.nodes.map((n:{id:string})=>n.id)).size).toBe(RESOURCE_LIMITS.property);
 });
 it('uses a saved seed and never multiplies resources when reloaded',()=>{
  const a=newResourceField(24),b=newResourceField(24);replenishResources(a,'forest',0,allowed);replenishResources(b,'forest',0,allowed);expect(a).toEqual(b);
  const loaded=JSON.parse(JSON.stringify(a));replenishResources(loaded,'forest',300,allowed);expect(loaded).toEqual(a);
 });
 it('handles blocked maps and lower budgets without hanging or exceeding the cap',()=>{
  const blocked=newResourceField(2);replenishResources(blocked,'forest',0,()=>false);expect(blocked.nodes).toHaveLength(0);
  const limited=newResourceField(3);replenishResources(limited,'property',0,allowed,7);expect(limited.nodes).toHaveLength(7);
 });
 it('rejects malformed saved resource fields',()=>{
  const field=newResourceField(3);replenishResources(field,'forest',0,allowed);field.nodes.push({...field.nodes[0]});expect(validateResourceField(field,'forest')).toBe(false);
  expect(validateResourceField({version:1,seed:0,sequence:1,nodes:[null],waiting:[],initialized:true},'property')).toBe(false);
 });
});
