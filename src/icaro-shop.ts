import type Phaser from 'phaser';
import {ICARO_SHOP} from './data/icaro-shop';
import {setupFacadeLight} from './shop-facade-light';
export {ICARO_SHOP} from './data/icaro-shop';
export function setupIcaroShop(scene:Phaser.Scene):void { setupFacadeLight(scene,ICARO_SHOP); }
