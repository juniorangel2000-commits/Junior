import type Phaser from 'phaser';
import { HOUSE_CHIMNEY } from './house-sprites';

/** A small, reusable plume below the global daylight layers. No particle
 * textures, background rectangle or per-frame game objects are allocated. */
export function drawHouseSmoke(scene: Phaser.Scene, house: Phaser.GameObjects.Image, chimney: {x:number;y:number}=HOUSE_CHIMNEY, plumeSize=1): { destroy(): void } {
  const smoke = scene.add.graphics().setDepth(house.depth + .2).setData('houseSmoke', true);
  const duration = 3600, puffs = 6;
  let elapsed = 0, destroyed = false;

  const destroy = (): void => {
    if (destroyed) return;
    destroyed = true;
    scene.events.off('update', update);
    scene.events.off('shutdown', destroy);
    scene.events.off('destroy', destroy);
    smoke.destroy();
  };
  const update = (_time: number, delta: number): void => {
    if (!house.active) { destroy(); return; }
    const visible = house.visible && scene.sys.isActive();
    smoke.setVisible(visible);
    if (!visible) return;
    if (Number.isFinite(delta)) elapsed += Math.max(0, Math.min(delta, 100));
    const localX = house.flipX ? house.width - chimney.x : chimney.x;
    const x = house.x + (localX - house.width * house.originX) * house.scaleX;
    const y = house.y + (chimney.y - house.height * house.originY) * house.scaleY;
    const scale = Math.abs(house.scaleX)*plumeSize;
    smoke.setDepth(house.depth + .2).clear();
    for (let i = 0; i < puffs; i++) {
      const life = ((elapsed / duration + i / puffs) % 1 + 1) % 1;
      const radius = (1.8 + life * 4) * scale;
      const drift = (life * 10 + Math.sin(life * 5 + i * 1.7) * life * 2) * scale;
      const px = x + drift, py = y - life * 52 * Math.abs(house.scaleY)*plumeSize;
      const alpha = Math.sin(Math.PI * life) * .19;
      smoke.fillStyle(0xc4c3b3, alpha * .3).fillCircle(px, py, radius * 1.3);
      smoke.fillStyle(0xb2b5a8, alpha).fillCircle(px - radius * .25, py, radius * .8);
      smoke.fillStyle(0xd4d1c0, alpha * .65).fillCircle(px + radius * .35, py - radius * .2, radius * .65);
    }
  };
  scene.events.on('update', update);
  scene.events.once('shutdown', destroy);
  scene.events.once('destroy', destroy);
  update(0, 0);
  return { destroy };
}
