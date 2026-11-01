import {describe,it,expect} from 'vitest';
import {craftInField,consumeInField} from '../src/systems/field-inventory';
import {createNewSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {fishingCastTarget} from '../src/fishing-cast';
import {withPropertyLakePath,propertyLakeApproach} from '../src/data/property-lake-gate';
const stock=()=>createNewSave(createCharacterProfile('Na margem'));
describe('inventory away from the property',()=>{
 it.each(['cityForest','fishingLake'] as const)('saves crafting and healing in %s',area=>{const s=stock();s.activeArea=area;s.inventory.fiber=3;s.inventory.herb=1;s.villageProgress!.vigor=50;const crops=s.crops;expect(craftInField(s,'cord',validateSave).ok).toBe(true);expect(s.inventory.fiber).toBe(0);expect(s.inventory.cord).toBe(1);expect(consumeInField(s,'herb',validateSave).ok).toBe(true);expect(s.inventory.herb).toBe(0);expect(s.villageProgress!.vigor).toBe(60);expect(s.crops).toBe(crops);});
 it('does not spend materials or healing items when persistence fails or throws',()=>{for(const write of[()=>false,()=>{throw Error('storage');}]){const s=stock();s.inventory.fiber=3;s.inventory.herb=1;s.villageProgress!.vigor=50;const before=structuredClone(s);expect(craftInField(s,'cord',write).ok).toBe(false);expect(consumeInField(s,'herb',write).ok).toBe(false);expect(s).toEqual(before);}});
 it('keeps property-only installation and workbench restrictions',()=>{const s=stock();s.inventory.scrap=10;s.inventory.lamp=1;expect(craftInField(s,'blade',validateSave).ok).toBe(false);expect(consumeInField(s,'lamp',validateSave).ok).toBe(false);expect(s.villageInstallations?.length??0).toBe(0);});
});
describe('casting and the grassy lake approach',()=>{
 it('prefers water in front, rejects obstacles, and falls back to nearby water',()=>{const p={x:100,y:100,facing:{x:1,y:0}};expect(fishingCastTarget(p,(x,y)=>x>140&&y===100)).toEqual({x:148,y:100});const t=fishingCastTarget(p,x=>x>140,x=>x>160)!;expect(t.x).toBeGreaterThan(160);expect(fishingCastTarget(p,()=>false)).toBeUndefined();});
 it('does not paint a new dirt path or overwrite authored terrain',()=>{expect(withPropertyLakePath().terrain).toEqual({});const authored=withPropertyLakePath();authored.terrain['75,5']='sand';expect(withPropertyLakePath(authored).terrain).toEqual({'75,5':'sand'});for(let y=0;y<=18;y++)expect(propertyLakeApproach(75,y)).toBe(true);expect(propertyLakeApproach(70,8)).toBe(false);});
});
