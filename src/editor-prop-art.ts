import {highlandTemplate} from './highland-world';
import {CAMP_OBJECTS} from './data/survivor-camp';
import type Phaser from 'phaser';
import {natureArt} from './data/nature-catalog';
import {URBAN_PROP_SIZES,type ExtraPropKind} from './data/editor-props';
import {urbanFrame,urbanTexture,urbanOriginX,type DungeonObstacle} from './dungeons/maps';
import type {EditorObjectKind} from './systems/map-editor';
export function drawEditorProp(scene:Phaser.Scene,kind:EditorObjectKind,x:number,y:number):Phaser.GameObjects.Image|undefined {
 if(kind.startsWith('highland-')){const o=highlandTemplate(kind);return o&&scene.textures.exists(o.texture)?scene.add.image(x,y,o.texture).setOrigin(.5,.5).setDisplaySize(o.width,o.height).setRotation(o.rotation).setDepth(y):undefined;}
 if(kind.startsWith('camp-')){const o=CAMP_OBJECTS.find(o=>o.kind===kind);return o&&scene.textures.exists(o.texture)?scene.add.image(x,y,o.texture,o.frame).setOrigin(.5,o.pivot).setDisplaySize(o.width,o.height).setDepth(y):undefined;}
 if(kind.startsWith('urban-')){
  const urban=kind.slice(6) as DungeonObstacle['kind'],[w,h]=URBAN_PROP_SIZES[kind as keyof typeof URBAN_PROP_SIZES],r=urbanFrame(urban);
  return scene.add.image(x,y,urbanTexture(urban),urban).setOrigin(urbanOriginX(urban),1).setScale(Math.min(w/r.width,h/r.height)).setDepth(y);
 }
 const art=natureArt(kind);
 if(art)return scene.add.image(x,y,art.texture).setOrigin(.5,art.pivot).setDisplaySize(art.width,art.height).setDepth(y);
 const texture=kind==='standingTree'?'asset-tree-0':kind==='pine'?'asset-pine-0':({stone:'asset-small-stones',vein:'lake-rock-0',tree:'asset-new-branches',fiber:'forest-detail-fern',seeds:'asset-berry-bush',scrap:'asset-scrap'} as const)[kind as 'stone'];
 if(!texture||!scene.textures.exists(texture))return undefined;
 const tree=kind==='standingTree'||kind==='pine';
 return scene.add.image(x,y,texture).setOrigin(.5,tree?256/264:1).setDisplaySize(tree?166:32,tree?211:32).setDepth(y);
}
export function editorPropThumbnail(scene:Phaser.Scene,kind:ExtraPropKind):string|undefined {
 if(kind.startsWith('highland-')){const o=highlandTemplate(kind);return o&&scene.textures.exists(o.texture)?scene.textures.getBase64(o.texture):undefined;}
 if(kind.startsWith('camp-')){const o=CAMP_OBJECTS.find(o=>o.kind===kind);return o&&scene.textures.exists(o.texture)?scene.textures.getBase64(o.texture,o.frame):undefined;}
 if(kind.startsWith('urban-')){const urban=kind.slice(6) as DungeonObstacle['kind'];return scene.textures.getBase64(urbanTexture(urban),urban);}
 return undefined;
}
