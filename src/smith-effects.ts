import type Phaser from 'phaser';
import {smithAsset,smithPieceVisible,type SmithLayout} from './systems/smith-layout';
import {animateInteriorProps,type InteriorEffectProfile} from './interior-effects';

const profiles:Readonly<Record<string,InteriorEffectProfile>>={
 fornalha_completa:{kind:'hearth'},
 tanque_resfriamento:{kind:'water'},
 lamparina:{kind:'lamp'},
 lamparina_loja:{kind:'lamp'},
 lampiao_balcao:{kind:'lamp',center:[.5,.56]},
};
/** Smith and other shops share the same clipped, bounded animation loop. */
export function animateSmithProps(scene:Phaser.Scene,data:SmithLayout,sprites:Map<string,Phaser.GameObjects.Image|Phaser.GameObjects.TileSprite>):()=>void{
 return animateInteriorProps(scene,data,sprites,{asset:smithAsset,visible:p=>smithPieceVisible(data,p),profiles});
}
