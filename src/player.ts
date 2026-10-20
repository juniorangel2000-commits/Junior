import Phaser from 'phaser';
import type { CharacterProfile } from './types';
import { createCharacterTexture } from './art';
import { TILE } from './world';

type MovementKeys = Record<string, Phaser.Input.Keyboard.Key>;

export class Player {
  readonly sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  facing = { x: 0, y: 1 };
  private step = 0;
  private readonly keys: MovementKeys;

  constructor(scene: Phaser.Scene, profile: CharacterProfile, x: number, y: number) {
    this.x = x;
    this.y = y;
    const texture = createCharacterTexture(scene, profile, `player-${Date.now()}`);
    this.sprite = scene.add.sprite(x, y, texture).setOrigin(0.5, 1);
    this.keys = scene.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT', false) as MovementKeys;
  }

  update(delta: number, isBlocked: (x: number, y: number) => boolean): void {
    let dx = Number(this.keys.D.isDown || this.keys.RIGHT.isDown) - Number(this.keys.A.isDown || this.keys.LEFT.isDown);
    let dy = Number(this.keys.S.isDown || this.keys.DOWN.isDown) - Number(this.keys.W.isDown || this.keys.UP.isDown);
    const moving = dx !== 0 || dy !== 0;
    if (moving) {
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;
      this.facing = Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
      const speed = 112;
      const canStand = (x: number, y: number) =>
        [[-7, -5], [7, -5], [-7, 3], [7, 3]].every(([ox, oy]) =>
          !isBlocked(Math.floor((x + ox) / TILE), Math.floor((y + oy) / TILE)));
      // Pequenos passos evitam atravessar colisões mesmo após uma queda de FPS.
      const steps = Math.max(1, Math.ceil(speed * delta / 6));
      for (let i = 0; i < steps; i++) {
        const nx = this.x + dx * speed * delta / steps;
        if (canStand(nx, this.y)) this.x = nx;
        const ny = this.y + dy * speed * delta / steps;
        if (canStand(this.x, ny)) this.y = ny;
      }
      this.step += delta * 13;
      if (dx !== 0) this.sprite.setFlipX(dx < 0);
    }
    this.sprite.setPosition(this.x, this.y + (moving ? Math.sin(this.step) : 0)).setDepth(this.y);
  }
}
