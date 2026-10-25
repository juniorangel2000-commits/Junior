import { NATURE_ART } from './data/nature-catalog';

const NATURE_TEXTURES = new Set(Object.values(NATURE_ART).map(a=>a.texture));
export function editorResourceTexture(texture: string, resourceTextures: ReadonlySet<string>): boolean {
  return resourceTextures.has(texture) || NATURE_TEXTURES.has(texture) || texture === 'tree-stump'
    || texture.endsWith('-ground-details') || /^crop-\d+$/.test(texture);
}

interface VisibleObject { visible: boolean; setVisible(value: boolean): unknown }
/** Visibility is editor-only: positions, collision and saved map data are untouched. */
export class EditorResourceVisibility<T extends VisibleObject> {
  private originals = new Map<T,boolean>();
  update(objects: readonly T[], hidden: boolean): void {
    if(hidden)for(const object of objects){if(!this.originals.has(object))this.originals.set(object,object.visible);object.setVisible(false);}
    else {for(const [object,visible] of this.originals)object.setVisible(visible);this.originals.clear();}
  }
  clear(): void { this.originals.clear(); }
}
