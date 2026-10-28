import type Phaser from 'phaser';
import {MERCHANT_ROOM_ASSETS,merchantPieceVisible} from './data/merchant-rooms';
import type {SmithLayout} from './systems/smith-layout';
import {animateInteriorProps,type InteriorEffectProfile} from './interior-effects';

const profiles:Readonly<Record<string,InteriorEffectProfile>>={
 lamparina_parede:{kind:'lamp',center:[.5,.65],radius:60},
 'rosa-lantern':{kind:'lamp',center:[.52,.68],radius:60},
 'tobias-lantern':{kind:'lamp',center:[.55,.69],radius:60},
 'nilo-lantern':{kind:'lamp',center:[.58,.62],radius:60},
 'amelia-lantern':{kind:'lamp',center:[.68,.65],radius:60},
 'amelia-water-basin':{kind:'water',center:[.5,.285]},
 'amelia-tea':{kind:'steam',center:[.23,.63]},
};
export function animateMerchantProps(scene:Phaser.Scene,data:SmithLayout,sprites:Map<string,Phaser.GameObjects.Image|Phaser.GameObjects.TileSprite>):()=>void {
 return animateInteriorProps(scene,data,sprites,{asset:id=>MERCHANT_ROOM_ASSETS.find(a=>a.id===id),visible:p=>merchantPieceVisible(data,p.id),profiles});
}
