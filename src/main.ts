import Phaser from 'phaser';
import { ValleyScene } from './scenes/ValleyScene';
import { GameUI } from './ui';
import './style.css';

const scene = new ValleyScene();
const ui = new GameUI({
  onNewGame: profile => scene.startNew(profile),
  onContinue: () => scene.continueGame(),
  onTool: tool => scene.selectTool(tool),
  onCraft: recipeId => scene.craftRecipe(recipeId),
  onCancelCraft: () => scene.cancelCrafting(),
  onBlueprint: () => scene.selectTool('blueprint'),
  onPause: paused => scene.setPaused(paused),
  onTitleBackground: mode => scene.setTitleBackground(mode),
  onSave: () => scene.persist(),
  onMainMenu: () => scene.mainMenu(),
});
scene.ui = ui;

export const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#6b8053',
  pixelArt: true,
  roundPixels: true,
  render: { antialias: false, powerPreference: 'high-performance' },
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  scene: [scene],
  audio: { noAudio: true },
  banner: false,
});
