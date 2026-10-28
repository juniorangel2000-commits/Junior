import type Phaser from 'phaser';
import {CELINA_SHOP} from './data/celina-shop';
import {setupFacadeLight} from './shop-facade-light';
export {CELINA_SHOP} from './data/celina-shop';
export function setupCelinaShop(scene:Phaser.Scene):void { setupFacadeLight(scene,CELINA_SHOP); }
