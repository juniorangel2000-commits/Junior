import Phaser from 'phaser';
import { gameAudio } from './audio';
import { installFullscreenShortcut } from './fullscreen';
import { ForestScene } from './scenes/ForestScene';
import { ValleyScene } from './scenes/ValleyScene';
import { GameUI } from './ui';
import './style.css';
import './garden-hud.css';
import './cozy-hud.css';
import './character-studio.css';

gameAudio.init();
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
  onMap: () => scene.captureMap(),
  onMainMenu: () => scene.mainMenu(),
  onAdminMenu: () => scene.openAdminMenu(),
  onMapEditor: () => scene.openMapEditor(),
  onZoom: direction => scene.changeCameraZoom(direction),
});
scene.ui = ui;
installFullscreenShortcut(() => ui.toast('Não foi possível ativar tela cheia neste navegador.'));

export const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#6b8053',
  pixelArt: true,
  roundPixels: true,
  render: { antialias: false, powerPreference: 'high-performance' },
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  scene: [scene, new ForestScene()],
  audio: { noAudio: true },
  banner: false,
});

export { gameAudio };
