import type Phaser from 'phaser';
import type {CharacterProfile} from '../types';
import {CHARACTER_DIRECTIONS, characterFrame, type CharacterDirection} from '../character-directions';
import {CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT, CHARACTER_TEXTURE_DENSITY, drawStyledCharacter} from '../character-sprites';
import {resolveCharacter} from '../data/characters';
import {HEAD_BOTTOM, SWIMMING_CONFIG} from './config';
import {WaterEffects} from './water-effects';
import {applyBodyFade, createHairShadow} from './underwater-appearance';
import {drawSubmergedBody, prepareSubmergedRig, SwimBodyClock, SWIM_BODY_FRAMES} from './body-animation';

export interface SwimmingAppearance {
  cacheKey: string;
  walkFrames: number;
  width: number; height: number; density: number;
  headBottom: Record<CharacterDirection, number>;
  submergedHair?: boolean;
  drawFrame(context: CanvasRenderingContext2D, direction: CharacterDirection, phase: number): void;
}

/** Bake and upload once per appearance while preparing the scene, never at the shoreline.
 * TextureManager owns the cache, so maps share it and renderer teardown frees it. */
export function prepareSwimmingTextures(scene: Phaser.Scene, profile: CharacterProfile, appearance?: SwimmingAppearance) {
    const character = resolveCharacter(profile);
    const resolved: SwimmingAppearance = appearance ?? {
      cacheKey: character.id, walkFrames: character.walkFrames,
      width: CHARACTER_FRAME_WIDTH, height: CHARACTER_FRAME_HEIGHT, density: CHARACTER_TEXTURE_DENSITY,
      headBottom: HEAD_BOTTOM[character.id], submergedHair: character.id === 'farmer-female', drawFrame: (g, d, p) => {drawStyledCharacter(g, profile, d, p);},
    };
    const a = resolved;
    const surfaceKey = `swim-surface-fade-3-${a.cacheKey}`;
    const bodyKey = `swim-body-fade-3-${a.cacheKey}`;
    const columns = a.walkFrames + 1 + SWIM_BODY_FRAMES;
    const hairKey = `swim-hair-shadow-${a.cacheKey}`;
    if (!scene.textures.exists(surfaceKey) || !scene.textures.exists(bodyKey)) {
      const make = (width: number, height: number) => {
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; return canvas;
      };
      const atlas = make(a.width * columns, a.height * 8), bodyAtlas = make(atlas.width, atlas.height);
      const hairAtlas = a.submergedHair ? make(a.width, a.height * 8) : undefined;
      const paint = atlas.getContext('2d')!, bodyPaint = bodyAtlas.getContext('2d')!;
      paint.imageSmoothingEnabled = bodyPaint.imageSmoothingEnabled = false;
      const water = scene.textures.get('asset-ground-water').getSourceImage() as HTMLCanvasElement;
      const waterTile = make(water.width * a.density, water.height * a.density);
      const tilePaint = waterTile.getContext('2d')!; tilePaint.imageSmoothingEnabled = false;
      tilePaint.drawImage(water, 0, 0, waterTile.width, waterTile.height);
      for (const [row, direction] of CHARACTER_DIRECTIONS.entries()) {
        const neutral = make(a.width, a.height); a.drawFrame(neutral.getContext('2d')!, direction, 0);
        const rig = prepareSubmergedRig(neutral, direction, a.headBottom[direction]);
        if (hairAtlas) hairAtlas.getContext('2d')!.drawImage(createHairShadow(neutral, a.headBottom[direction]), 0, row * a.height);
        for (let phase = 0; phase < columns; phase++) {
          const original = make(a.width, a.height), ink = original.getContext('2d')!;
          ink.imageSmoothingEnabled = false;
          if (phase <= a.walkFrames) a.drawFrame(ink, direction, phase);
          else {
            drawSubmergedBody(ink, rig, (phase - a.walkFrames - 1) / SWIM_BODY_FRAMES, direction);
            // Rotation can antialias edge pixels even with nearest sampling. Bake a crisp mask once.
            const silhouette = ink.getImageData(0, 0, a.width, a.height);
            for (let i = 3; i < silhouette.data.length; i += 4) silhouette.data[i] = silhouette.data[i] >= 128 ? 255 : 0;
            ink.putImageData(silhouette, 0, 0);
          }
          applyBodyFade(ink, rig.waist, rig.feet);
          const mask = make(a.width, a.height), g = mask.getContext('2d')!;
          g.imageSmoothingEnabled = false; g.fillStyle = g.createPattern(waterTile, 'repeat')!;
          g.fillRect(0, 0, a.width, a.height); g.globalCompositeOperation = 'destination-in'; g.drawImage(original, 0, 0);
          paint.drawImage(mask, phase * a.width, row * a.height);
          ink.globalCompositeOperation = 'source-in';
          ink.fillStyle = `#${SWIMMING_CONFIG.bodyTint.toString(16).padStart(6, '0')}`;
          ink.fillRect(0, 0, a.width, a.height); bodyPaint.drawImage(original, phase * a.width, row * a.height);
        }
      }
      for (const [key, canvas] of [[surfaceKey, atlas], [bodyKey, bodyAtlas]] as const) {
        const texture = scene.textures.addCanvas(key, canvas)!;
        for (let row = 0; row < 8; row++) for (let phase = 0; phase < columns; phase++) {
          texture.add(row * columns + phase, 0, phase * a.width, row * a.height, a.width, a.height);
        }
        texture.setFilter(0);
      }
      if (hairAtlas) {
        const texture = scene.textures.addCanvas(hairKey, hairAtlas)!;
        for (let row = 0; row < 8; row++) texture.add(row, 0, 0, row * a.height, a.width, a.height);
        texture.setFilter(0);
      }
    }
    return {appearance: resolved, surfaceKey, bodyKey, hairKey};
}

/** Original head and shallow poses, plus a separate sculling atlas for the submerged body. */
export class SwimmingVisual {
  readonly body: Phaser.GameObjects.Sprite;
  readonly surface: Phaser.GameObjects.Sprite;
  readonly hairShadow?: Phaser.GameObjects.Sprite;
  readonly effects: WaterEffects;
  readonly appearance: SwimmingAppearance;
  private readonly surfaceKey: string;
  private readonly bodyKey: string;
  private readonly clock = new SwimBodyClock();
  private bound = false;
  private baseTexture = '';

  constructor(scene: Phaser.Scene, profile: CharacterProfile, appearance?: SwimmingAppearance) {
    const prepared = prepareSwimmingTextures(scene, profile, appearance);
    this.appearance = prepared.appearance;
    this.surfaceKey = prepared.surfaceKey;
    this.bodyKey = prepared.bodyKey;
    const a = this.appearance, hairKey = prepared.hairKey;
    if (a.submergedHair) this.hairShadow = scene.add.sprite(0, 0, hairKey).setVisible(false);
    this.body = scene.add.sprite(0, 0, this.bodyKey).setVisible(false).setAlpha(SWIMMING_CONFIG.bodyOpacity);
    this.surface = scene.add.sprite(0, 0, this.surfaceKey).setVisible(false).setAlpha(SWIMMING_CONFIG.surfaceOpacity);
    this.effects = new WaterEffects(scene);
  }

  update(sprite: Phaser.GameObjects.Sprite, x: number, y: number, direction: CharacterDirection, moving: boolean,
    delta: number, depth = 1, walkingFrame?: number, speedRatio: number = SWIMMING_CONFIG.speedFactor): void {
    if (!this.bound) {this.baseTexture = sprite.texture.key; sprite.once('destroy', () => this.destroy()); this.bound = true;}
    const a = this.appearance, deep = depth >= SWIMMING_CONFIG.deepThreshold;
    const cycle = this.clock.advance(delta, moving, speedRatio), row = CHARACTER_DIRECTIONS.indexOf(direction);
    const headFrame = deep ? characterFrame(direction, 0, a.walkFrames) : walkingFrame ?? characterFrame(direction, 0, a.walkFrames);
    // Keep the original gait while wading. Switch only after the torso is submerged.
    const phase = deep ? a.walkFrames + 1 + Math.floor(cycle * SWIM_BODY_FRAMES)
      : (walkingFrame ?? characterFrame(direction, 0, a.walkFrames)) % (a.walkFrames + 1);
    const frame = row * (a.walkFrames + 1 + SWIM_BODY_FRAMES) + phase;
    const bottom = Math.round(a.height + (a.headBottom[direction] - a.height) * depth);
    const bob = this.effects.update(x, y, depth, moving, direction, speedRatio, delta);
    sprite.setTexture(this.baseTexture, headFrame).setCrop(0, 0, a.width, bottom).setOrigin(.5, bottom / a.height).setPosition(x, y + bob).setDepth(y);
    this.hairShadow?.setFrame(row).setScale(sprite.scaleX, sprite.scaleY).setCrop(0, bottom, a.width, a.height - bottom)
      .setOrigin(.5, bottom / a.height).setPosition(x, y + bob).setDepth(y - .25)
      .setAlpha(SWIMMING_CONFIG.hairShadowOpacity * depth * depth).setVisible(true);
    this.body.setFrame(frame).setScale(sprite.scaleX, sprite.scaleY).setCrop(0, bottom, a.width, a.height - bottom)
      .setOrigin(.5, bottom / a.height).setPosition(x, y + bob).setDepth(y - .2).setAlpha(SWIMMING_CONFIG.bodyOpacity * (.8 + .2 * depth)).setVisible(true);
    this.surface.setFrame(frame).setScale(sprite.scaleX, sprite.scaleY).setCrop(0, bottom, a.width, a.height - bottom)
      .setOrigin(.5, bottom / a.height).setPosition(x, y + bob).setDepth(y - .1).setVisible(true);
  }

  setVisible(visible: boolean): void {this.body.setVisible(visible); this.surface.setVisible(visible); this.hairShadow?.setVisible(visible); if (!visible) this.effects.hide();}
  destroy(): void {this.body.destroy(); this.surface.destroy(); this.hairShadow?.destroy(); this.effects.destroy();}
}
