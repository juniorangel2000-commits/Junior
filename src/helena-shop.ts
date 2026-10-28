import type Phaser from 'phaser';
import {HELENA_SHOP} from './data/helena-shop';
import {setupFacadeLight} from './shop-facade-light';
export {HELENA_SHOP} from './data/helena-shop';
export function setupHelenaShop(scene:Phaser.Scene):void { setupFacadeLight(scene,HELENA_SHOP); }
