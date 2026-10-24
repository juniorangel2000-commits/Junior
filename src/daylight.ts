import type Phaser from 'phaser';
import { daylightAt } from './daylight-model';
import { getVisualSettings } from './visual-settings';

/** Lightweight color grading, shared by Canvas and WebGL, below the HTML HUD. */
export class Daylight {
  readonly shade: Phaser.GameObjects.Rectangle;
  readonly warmth: Phaser.GameObjects.Rectangle;
  constructor(scene: Phaser.Scene, width: number, height: number) {
    this.shade = scene.add.rectangle(0, 0, width, height, 0x182642).setOrigin(0).setDepth(5000).setAlpha(0);
    this.warmth = scene.add.rectangle(0, 0, width, height, 0xf3b56c).setOrigin(0).setDepth(5001).setAlpha(0);
  }
  contains(object: Phaser.GameObjects.GameObject): boolean { return object === this.shade || object === this.warmth; }
  setVisible(visible: boolean): void { this.shade.setVisible(visible); this.warmth.setVisible(visible); }
  update(time: number, indoors = false): void {
    const settings = getVisualSettings();
    const light = daylightAt(time, settings.daylight ? settings.intensity : 0, indoors);
    this.shade.setAlpha(light.shade); this.warmth.setAlpha(light.warmth);
  }
}
