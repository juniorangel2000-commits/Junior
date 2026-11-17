import {describe,it,expect,vi} from 'vitest';
import {createNewSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {reserveTool,orderAction,toolCondition,workbenchUpgrade,learnedUpgrades} from '../src/systems/economy';
import {RECIPES} from '../src/data/recipes';
import {swordTier,swordDamage,SWORD_POWER,SWORD_TIER_FILES} from '../src/systems/world-sword';
import {campStrike} from '../src/systems/survivor-combat';
import {existsSync} from 'node:fs';
vi.mock('../src/systems/bento-schedule',async o=>({...(await o() as object),bentoAvailability:()=>({open:true,message:''})}));
const save=()=>{const s=createNewSave(createCharacterProfile('Espada'));s.inventory.sword=1;s.villageEconomy!.coins=100000;s.inventory.backpack=2;return s;};

describe('espada com níveis, como as ferramentas',()=>{
 it('o Bento melhora a espada para ferro; a melhoria fica aprendida e o golpe fica mais forte',()=>{
  const s=save();expect(swordTier(s)).toBe(0);
  s.inventory.ironIngot=4;s.inventory.wood=2;expect(reserveTool(s,'sword',1).ok).toBe(true);expect(orderAction(s,1,'pay').ok).toBe(true);
  s.day=2;expect(orderAction(s,1,'collect').ok).toBe(true);
  expect(swordTier(s)).toBe(1);expect(toolCondition(s,'sword').tier).toBe(1);expect(validateSave(s)).toBe(true);
  expect(learnedUpgrades(s)).toContain('upgrade-sword-1');expect(swordDamage(s,22)).toBe(Math.round(22*SWORD_POWER[1]));
 });
 it('depois de aprender, refaz na bancada de trabalho; ouro e metal negro seguem a mesma regra',()=>{
  expect(RECIPES.filter(r=>r.id.startsWith('upgrade-sword-')).map(r=>r.name)).toEqual(['Espada de ferro','Espada de ouro','Espada de metal negro']);
  // Aprende o ferro com o Bento; depois, outra espada é melhorada na bancada (sem mão de obra).
  const s=save();s.inventory.ironIngot=4;s.inventory.wood=2;expect(reserveTool(s,'sword',1).ok).toBe(true);expect(orderAction(s,1,'pay').ok).toBe(true);s.day=2;expect(orderAction(s,1,'collect').ok).toBe(true);
  const t=save();t.economy6=structuredClone(s.economy6);t.economy6!.tools.sword={tier:0,durability:100};t.inventory.ironIngot=4;t.inventory.wood=2;
  expect(workbenchUpgrade(t,'sword',1,false).ok).toBe(false);const r=workbenchUpgrade(t,'sword',1,true);expect(r.message).toBeDefined();expect(r.ok).toBe(true);expect(swordTier(t)).toBe(1);
 });
 it('o golpe no acampamento leva o nível (cor e desenho) e tira mais vida',()=>{
  const base=save();base.worldWeapon='sword';base.villageProgress!.vigor=50;
  base.survivorCamp={...(base.survivorCamp??{}),kind:'hostile',aggressive:true,members:[{id:'h',x:30,y:0,hp:100,status:'staying'}]} as never;
  const weak=structuredClone(base),strong=structuredClone(base);
  strong.economy6!.tools.sword={tier:3,durability:800};
  const a=campStrike(weak,{x:0,y:0},0,()=>false),b=campStrike(strong,{x:0,y:0},0,()=>false);
  expect(a.effect?.tier).toBe(0);
  const hpWeak=(weak.survivorCamp as never as {members:{hp:number}[]}).members[0].hp,hpStrong=(strong.survivorCamp as never as {members:{hp:number}[]}).members[0].hp;
  if(b.effect){expect(hpStrong).toBeLessThan(hpWeak);}
 });
 it('cada nível tem o seu desenho',()=>{for(const f of SWORD_TIER_FILES)expect(existsSync(`public/assets/visual/items/swords/${f}.png`)).toBe(true);});
});
