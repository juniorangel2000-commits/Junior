import type Phaser from 'phaser';
import {AMELIA_SHOP} from './data/amelia-shop';
import {setupFacadeLight} from './shop-facade-light';
export {AMELIA_SHOP} from './data/amelia-shop';
export function setupAmeliaShop(scene:Phaser.Scene):void { setupFacadeLight(scene,AMELIA_SHOP); }
