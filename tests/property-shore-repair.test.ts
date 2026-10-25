import {describe,it,expect} from 'vitest';
import {PROPERTY_SHORE_CELLS,repairPropertyShore} from '../src/data/property-shore-repair';
import {createNewSave,migrateSave} from '../src/systems/save';
const profile={name:'Margem',characterId:'farmer-female' as const,skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso' as const};
describe('refino da borda do lago da casa',()=>{
 it('retira só as pinturas antigas de grama que cortavam a areia',()=>{
   const save=createNewSave(profile);for(const cell of PROPERTY_SHORE_CELLS)save.mapEdits!.terrain[cell]='grass';
   save.mapEdits!.terrain['33,26']='wood';save.mapEdits!.terrain['10,10']='grass';
   repairPropertyShore(save.mapEdits);for(const cell of PROPERTY_SHORE_CELLS)expect(save.mapEdits!.terrain[cell]).toBeUndefined();
   expect(save.mapEdits!.terrain['33,26']).toBe('wood');expect(save.mapEdits!.terrain['10,10']).toBe('grass');
 });
 it('protege cultivos, solo preparado e construções na correção de partidas antigas',()=>{
   const old=createNewSave(profile);delete old.propertyShoreRevision;
   for(const cell of PROPERTY_SHORE_CELLS)old.mapEdits!.terrain[cell]='grass';
   old.preparedSoil=[{x:32,y:26}];old.crops=[{x:32,y:26,growth:.4,watered:true}];
   old.buildings=[{kind:'fence',x:31,y:26}];
   const result=migrateSave(old)!;expect(result).toBeTruthy();
   expect(result.mapEdits!.terrain['32,26']).toBe('grass');expect(result.mapEdits!.terrain['31,26']).toBe('grass');
   expect(result.crops).toEqual(old.crops);expect(result.buildings).toEqual(old.buildings);
 });
 it('aplica a correção uma vez em partidas antigas, mantendo pontos, recursos e futuras edições',()=>{
   const old=createNewSave(profile);delete old.propertyShoreRevision;old.mapEdits!.terrain['32,26']='grass';old.mapEdits!.terrain['31,26']='wood';old.mapEdits!.points!.exit={x:5,y:50};old.depletedResources=['tree-20-18'];
   const migrated=migrateSave(old)!;expect(migrated.mapEdits!.terrain['32,26']).toBeUndefined();expect(migrated.mapEdits!.terrain['31,26']).toBe('wood');
   expect(old.mapEdits!.terrain['32,26']).toBe('grass');expect(migrated.mapEdits!.points!.exit).toEqual({x:5,y:50});expect(migrated.depletedResources).toEqual(old.depletedResources);
   migrated.mapEdits!.terrain['32,26']='grass';expect(migrateSave(migrated)!.mapEdits!.terrain['32,26']).toBe('grass');
 });
});
