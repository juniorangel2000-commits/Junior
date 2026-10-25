import {describe,it,expect} from 'vitest';
import {EditorResourceVisibility,editorResourceTexture} from '../src/editor-resource-visibility';

describe('recursos ocultos no editor',()=>{
 const image=(visible=true)=>({visible,x:4,y:5,setVisible(value:boolean){this.visible=value;}});
 it('oculta e restaura a visibilidade original, sem alterar posições',()=>{
  const a=image(),b=image(false),view=new EditorResourceVisibility<typeof a>();
  view.update([a,b],true);view.update([a,b],true);expect(a.visible).toBe(false);expect(b.visible).toBe(false);
  view.update([a,b],false);expect(a).toMatchObject({visible:true,x:4,y:5});expect(b.visible).toBe(false);
 });
 it('mantém os novos objetos ocultos após reconstruir o cenário',()=>{
  const a=image(),view=new EditorResourceVisibility<typeof a>();view.update([a],true);view.clear();
  const rebuilt=image();view.update([rebuilt],true);expect(rebuilt.visible).toBe(false);
  view.update([rebuilt],false);expect(rebuilt.visible).toBe(true);
 });
 it('inclui recursos, todas as plantas e decoração rasteira, mantendo pisos e casa',()=>{
  const resources=new Set(['asset-scrap','custom-resource']);
  for(const key of ['asset-tree-0','lake-rock-2','forest-detail-fern','forest-detail-log','forest-detail-stump','asset-scrap','custom-resource','editor-property-ground-details','crop-2'])expect(editorResourceTexture(key,resources),key).toBe(true);
  for(const key of ['world-ground-sandy-river-v3','forest-ground-sandy-shore','asset-house','bridge-v2:north:deck','lia'])expect(editorResourceTexture(key,resources),key).toBe(false);
 });
});
