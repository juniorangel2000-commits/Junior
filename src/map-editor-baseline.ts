import {hasMapSeam,seamBand,seamPassage} from './data/map-seam';
import {isPropertyVillagePassage,isPropertyVillageCanopyClearance} from './data/property-village-gate';
import {isTreeKind} from './systems/tree-ground';
import type {MapEditData} from './systems/map-editor';
import type {WorldEditorObject} from './world';

/** Keep the import validator's implicit objects in the same order as world
 * generation. The full original map is still used separately to validate IDs. */
export function editorBaselineObjects(original:readonly WorldEditorObject[],data:MapEditData):WorldEditorObject[] {
  const continuation=hasMapSeam(data),area=data.area??'property';
  const explicitCells=new Set(Object.entries(data.objects)
    .filter(([id,edit])=>id.startsWith('editor-')&&!edit.removed)
    .map(([,edit])=>`${edit.x},${edit.y}`));
  return original.filter(object=>{
    if(object.depleted&&object.kind!=='standingTree'&&object.kind!=='pine')return false;
    if(!continuation||data.objects[object.id])return true;
    if(area==='property'&&(isPropertyVillagePassage(object.x,object.y)||isTreeKind(object.kind)&&isPropertyVillageCanopyClearance(object.x,object.y)))return false;
    if(seamPassage(object.x,object.y,area))return false;
    if(!seamBand(object.x,object.y,area))return true;
    if(isTreeKind(object.kind))return false;
    // ForestWorld adds authored editor objects before its woodland details.
    // These details lose their cell to the authored object; native lake rocks
    // are created earlier and must retain collision validation priority.
    return area!=='forest'||/^lakeRock[A-F]-/.test(object.id)
      ||!explicitCells.has(`${object.x},${object.y}`);
  });
}
