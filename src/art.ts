import Phaser from 'phaser';
import type { CharacterProfile } from './types';

export const CHARACTER_WIDTH = 24;
export const CHARACTER_HEIGHT = 32;

export function shade(hex: string, amount: number): string {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return `#${[16, 8, 0].map((shift) => Math.min(255, Math.max(0, ((value >> shift) & 255) + amount)).toString(16).padStart(2, '0')).join('')}`;
}

/** Original human pixel sprite, drawn at 24 × 32 pixels, with feet at the bottom. */
export function drawCharacter(canvas: HTMLCanvasElement, profile: CharacterProfile): void {
  canvas.width = CHARACTER_WIDTH;
  canvas.height = CHARACTER_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const rect = (color: string, x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  const skinDark = shade(profile.skin, -34);
  const hairDark = shade(profile.hairColor, -27);
  if (profile.hairStyle === 'longo') {
    rect(hairDark, 5, 6, 14, 16);
    rect(profile.hairColor, 4, 9, 3, 12);
    rect(profile.hairColor, 17, 9, 3, 12);
  }
  if (profile.hairStyle === 'preso') {
    rect(hairDark, 16, 2, 6, 7);
    rect(profile.hairColor, 17, 1, 4, 5);
    rect('#caae75', 16, 7, 3, 2);
  }
  rect('#36433e', 6, 25, 5, 5);
  rect('#36433e', 13, 25, 5, 5);
  rect('#423b32', 5, 29, 6, 3);
  rect('#423b32', 13, 29, 6, 3);
  rect(shade(profile.outfit, -24), 5, 17, 14, 10);
  rect(profile.outfit, 6, 16, 12, 9);
  rect(shade(profile.outfit, 25), 7, 17, 3, 7);
  rect('#b89e73', 8, 25, 9, 2);
  rect('#e1d2a3', 11, 25, 2, 2);
  rect(profile.outfit, 3, 17, 3, 6);
  rect(shade(profile.outfit, -12), 18, 17, 3, 6);
  rect(profile.skin, 3, 23, 3, 3);
  rect(skinDark, 18, 23, 3, 3);
  rect(skinDark, 9, 13, 6, 4);
  rect(profile.skin, 7, 6, 10, 9);
  rect(profile.skin, 6, 9, 2, 4);
  rect(skinDark, 16, 9, 2, 4);
  rect(shade(profile.skin, 16), 8, 8, 3, 4);
  rect(skinDark, 8, 14, 7, 2);
  rect('#3d3c33', 9, 10, 1, 2);
  rect('#3d3c33', 14, 10, 1, 2);
  rect(shade(profile.skin, -15), 12, 12, 2, 1);
  rect(hairDark, 6, 3, 12, 5);
  rect(profile.hairColor, 7, 2, 10, 5);
  rect(shade(profile.hairColor, 18), 8, 2, 5, 2);
  rect(profile.hairColor, 6, 6, 4, 3);
  rect(hairDark, 16, 5, 2, 4);
  if (profile.hairStyle === 'curto') rect(profile.hairColor, 11, 6, 3, 2);
  if (profile.hairStyle === 'longo') rect(profile.hairColor, 5, 5, 2, 12);
}

export function createCharacterTexture(scene: Phaser.Scene, profile: CharacterProfile, key: string): string {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const canvas = document.createElement('canvas');
  drawCharacter(canvas, profile);
  scene.textures.addCanvas(key, canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
  return key;
}

export function createArt(scene: Phaser.Scene): void {
  const add = (key: string, width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void) => {
    if (scene.textures.exists(key)) return;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    paint(ctx);
    scene.textures.addCanvas(key, canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
  };
  add('shadow', 24, 10, (c) => {
    c.fillStyle = '#203e3444';
    c.fillRect(3, 3, 18, 5);
    c.fillRect(0, 5, 24, 2);
  });
  add('fence', 32, 32, (c) => {
    c.fillStyle = '#3d4c3644'; c.fillRect(1, 26, 30, 5);
    c.fillStyle = '#705943'; c.fillRect(0, 11, 32, 4); c.fillRect(0, 21, 32, 4);
    c.fillStyle = '#b69768'; c.fillRect(0, 9, 32, 4); c.fillRect(0, 19, 32, 4);
    for (const x of [3, 24]) {
      c.fillStyle = '#70533b'; c.fillRect(x, 4, 5, 25);
      c.fillStyle = '#c2a375'; c.fillRect(x, 4, 3, 22);
      c.fillStyle = '#e1c391'; c.fillRect(x, 3, 5, 3);
      c.fillStyle = '#544b37'; c.fillRect(x + 2, 11, 1, 1); c.fillRect(x + 2, 21, 1, 1);
    }
  });
  add('bench', 32, 32, (c) => {
    c.fillStyle = '#304b3444'; c.fillRect(1, 25, 30, 5);
    c.fillStyle = '#6b5039'; c.fillRect(4, 10, 3, 18); c.fillRect(25, 10, 3, 18);
    c.fillStyle = '#c0a073'; c.fillRect(2, 8, 28, 5); c.fillRect(2, 15, 28, 5);
    c.fillStyle = '#806347'; c.fillRect(2, 12, 28, 2); c.fillRect(2, 19, 28, 3);
    c.fillStyle = '#d4b786'; c.fillRect(2, 8, 28, 1); c.fillRect(2, 15, 28, 1);
    c.fillStyle = '#584b37'; c.fillRect(5, 25, 3, 4); c.fillRect(24, 25, 3, 4);
  });
  for (let stage = 0; stage < 3; stage++) {
    add(`crop-${stage}`, 32, 32, (c) => {
      c.fillStyle = '#50433355'; c.fillRect(8, 24, 17, 4);
      const level = stage * 4;
      c.fillStyle = '#43663e'; c.fillRect(15, 20 - level, 3, 8);
      c.fillStyle = '#88a34d'; c.fillRect(9 - stage, 18 - level, 7, 4); c.fillRect(7 - stage, 16 - level, 5, 4);
      c.fillStyle = '#a8b863'; c.fillRect(17, 15 - level, 7 + stage, 4); c.fillRect(21, 13 - level, 5, 4);
      c.fillStyle = '#6e943f'; c.fillRect(12, 16 - level, 5, 4);
      if (stage === 2) {
        c.fillStyle = '#b38b8d'; c.fillRect(12, 20, 10, 6);
        c.fillStyle = '#eddbc1'; c.fillRect(11, 21, 11, 4); c.fillRect(13, 25, 7, 3);
        c.fillStyle = '#f6eace'; c.fillRect(12, 21, 5, 2);
      }
    });
  }
  createCharacterTexture(scene, {name: 'Lia', skin: '#b87952', hairStyle: 'preso', hairColor: '#3b3029', outfit: '#b46e4e'}, 'lia');
}
