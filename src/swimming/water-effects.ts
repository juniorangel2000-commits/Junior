import type Phaser from 'phaser';
import {directionVector, type CharacterDirection} from '../character-directions';
import {SWIMMING_CONFIG} from './config';

/** Reused rear/front arcs wrap the waterline without cutting a square hole in the ripple. */
export class WaterEffects {
  readonly graphics: Phaser.GameObjects.Graphics;
  readonly frontGraphics: Phaser.GameObjects.Graphics;
  private phase = 0;
  private entryAge = 1;
  private previousDepth = 0;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setVisible(false);
    this.frontGraphics = scene.add.graphics().setVisible(false);
  }

  private arc(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number,
    front: boolean, color: number, alpha: number): void {
    g.lineStyle(.6, color, alpha).beginPath();
    const start = front ? 0 : Math.PI;
    for (let i = 0; i <= 48; i++) {
      const angle = start + i / 48 * Math.PI;
      // Small, periodic irregularities keep the expanding ellipse from looking like a rigid collar.
      const radius = width / 2 + Math.sin(angle * 3 + this.phase * 2) * .25;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * (height / 2 + Math.cos(angle * 2 + this.phase) * .15);
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.strokePath();
  }

  private ring(x: number, y: number, width: number, height: number, alpha: number): void {
    this.arc(this.graphics, x, y, width, height, false, 0xb5ded5, alpha * .6);
    this.arc(this.frontGraphics, x, y, width, height, true, 0xb5ded5, alpha);
  }

  update(x: number, y: number, depth: number, moving: boolean, direction: CharacterDirection,
    speedRatio: number, delta: number): number {
    if (this.previousDepth === 0 && depth > 0 && delta > 0) this.entryAge = 0;
    this.previousDepth = depth; this.entryAge += delta;
    this.phase += delta * (moving ? SWIMMING_CONFIG.movingRippleHz * Math.max(.25, speedRatio) : SWIMMING_CONFIG.idleRippleHz);
    const wave = (Math.sin(this.phase * Math.PI * 2) + 1) * .5;
    const bob = Math.sin(this.phase * Math.PI * 2) * SWIMMING_CONFIG.bobAmplitude * depth;
    this.graphics.setVisible(depth > .005).setDepth(y - .3).clear();
    // In front of the submerged body and water, but always below the original face/hair.
    this.frontGraphics.setVisible(depth > .005).setDepth(y - .05).clear();
    if (depth <= .005) return bob;

    this.ring(x, y + bob + .75, 20 + wave * 4, 5.8 + wave * 1.6, (.47 - wave * .08) * depth);
    if (moving) {
      const d = directionVector(direction), wakeX = x - d.x * 13, wakeY = y - d.y * 9 + 3;
      // The wake stays on the water behind the body, rather than drawing another collar across it.
      this.arc(this.graphics, wakeX, wakeY, 24 + wave * 8, 8 + wave * 3, false, 0xb5ded5, .14 * depth);
      this.arc(this.graphics, wakeX, wakeY, 24 + wave * 8, 8 + wave * 3, true, 0xb5ded5, .14 * depth);
      this.graphics.fillStyle(0xc7e9dd, .35 * depth)
        .fillCircle(x - 11 - wave * 3, y - wave * 3, .3)
        .fillCircle(x + 10 + wave * 2, y - 1, .3);
    }
    if (this.entryAge < .4) {
      const t = this.entryAge / .4;
      this.ring(x, y + 1, 10 + t * 26, 4 + t * 9, (1 - t) * .48);
      this.graphics.fillStyle(0xc7e9dd, (1 - t) * .4)
        .fillCircle(x - 7 - t * 6, y - 3 - t * 5, .4)
        .fillCircle(x + 8 + t * 4, y - 2 - t * 6, .3);
    }
    return bob;
  }

  hide(): void {this.graphics.setVisible(false); this.frontGraphics.setVisible(false); this.previousDepth = 0;}
  destroy(): void {this.graphics.destroy(); this.frontGraphics.destroy();}
}
