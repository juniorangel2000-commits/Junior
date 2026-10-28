import type Phaser from 'phaser';
import {NILO_SHOP} from './data/nilo-shop';
import {setupFacadeLight} from './shop-facade-light';
export {NILO_SHOP} from './data/nilo-shop';
export function setupNiloShop(scene:Phaser.Scene):void { setupFacadeLight(scene,NILO_SHOP); }
