import type Phaser from 'phaser';
import {DAMIAO_SHOP} from './data/damiao-shop';
import {setupFacadeLight} from './shop-facade-light';
export {DAMIAO_SHOP} from './data/damiao-shop';
export function setupDamiaoShop(scene:Phaser.Scene):void { setupFacadeLight(scene,DAMIAO_SHOP); }
