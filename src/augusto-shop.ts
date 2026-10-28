import type Phaser from 'phaser';
import {AUGUSTO_SHOP} from './data/augusto-shop';
import {setupFacadeLight} from './shop-facade-light';
export {AUGUSTO_SHOP} from './data/augusto-shop';
export function setupAugustoShop(scene:Phaser.Scene):void { setupFacadeLight(scene,AUGUSTO_SHOP); }
