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
const activeForest=():ForestScene|undefined=>scene.scene?.isActive('Floresta')?scene.scene.get('Floresta') as ForestScene:undefined;
const ui = new GameUI({
  onNewGame: profile => scene.startNew(profile),
  onContinue: () => scene.continueGame(),
  onTool: tool => {const forest=activeForest();if(forest)forest.selectTool(tool);else scene.selectTool(tool);},
  onCraft: recipeId => {if(activeForest())ui.toast('Volte à propriedade para fabricar.');else scene.craftRecipe(recipeId);},
  onCancelCraft: () => scene.cancelCrafting(),
  onBlueprint: () => {const forest=activeForest();if(forest)forest.selectTool('blueprint');else scene.selectTool('blueprint');},
  onPause: paused => {const forest=activeForest();if(forest)forest.setPaused(paused);else scene.setPaused(paused);},
  onTitleBackground: mode => scene.setTitleBackground(mode),
  onSave: () => activeForest()?.persist()??scene.persist(),
  onMap: () => activeForest()?.captureMap()??scene.captureMap(),
  onMainMenu: () => {const forest=activeForest();if(forest)forest.mainMenu();else scene.mainMenu();},
  onAdminMenu: () => {if(activeForest())ui.toast('A administração fica disponível na propriedade.');else scene.openAdminMenu();},
  onMapEditor: () => {const forest=activeForest();if(forest)forest.openMapEditor();else scene.openMapEditor();},
  onZoom: direction => {const forest=activeForest();if(forest)forest.changeCameraZoom(direction);else scene.changeCameraZoom(direction);},
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
