import type Phaser from 'phaser';
import {ROSA_SHOP} from './data/rosa-shop';
import {setupFacadeLight} from './shop-facade-light';
export {ROSA_SHOP} from './data/rosa-shop';
export function setupRosaShop(scene:Phaser.Scene):void { setupFacadeLight(scene,ROSA_SHOP); }
