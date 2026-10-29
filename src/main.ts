import {getWorldPetController} from "./dungeons/world-pet-controller";
import {DungeonScene} from './scenes/DungeonScene';
import {CityForestScene} from './scenes/CityForestScene';
import {MapEditorScene} from './scenes/MapEditorScene';
import Phaser from 'phaser';
import { gameAudio } from './audio';
import { installFullscreenShortcut } from './fullscreen';
import { ForestScene } from './scenes/ForestScene';
import { VillageScene } from './scenes/VillageScene';
import { ValleyScene } from './scenes/ValleyScene';
import { GameUI } from './ui';
import './style.css';
import './garden-hud.css';
import './cozy-hud.css';
import './character-studio.css';

gameAudio.init();
const scene = new ValleyScene();
const activeForest=():ForestScene|VillageScene|CityForestScene|DungeonScene|undefined=>scene.scene?.isActive('Dungeons')?scene.scene.get('Dungeons') as DungeonScene:scene.scene?.isActive('AcessoCidade')?scene.scene.get('AcessoCidade') as CityForestScene:scene.scene?.isActive('Vila')?scene.scene.get('Vila') as VillageScene:scene.scene?.isActive('Floresta')?scene.scene.get('Floresta') as ForestScene:undefined;
const ui = new GameUI({
  onUseItem: item => {void (activeForest()??scene).useVillageItem(item);},
  onNewGame: profile => scene.startNew(profile),
  onContinue: () => scene.continueGame(),
  onTool: tool => {const forest=activeForest();if(forest)forest.selectTool(tool);else scene.selectTool(tool);},
  onCraft: recipeId => {const forest=activeForest();if(forest)forest.craftRecipe(recipeId);else scene.craftRecipe(recipeId);},
  onCancelCraft: () => scene.cancelCrafting(),
  onBlueprint: () => {const forest=activeForest();if(forest)forest.selectTool('blueprint');else scene.selectTool('blueprint');},
  onPause: paused => {const forest=activeForest();if(forest)forest.setPaused(paused);else scene.setPaused(paused);},
  onTitleBackground: mode => scene.setTitleBackground(mode),
  onSave: () => activeForest()?.persist()??scene.persist(),
  onMap: () => activeForest()?.captureMap()??scene.captureMap(),
  onMainMenu: () => {const forest=activeForest();if(forest)forest.mainMenu();else scene.mainMenu();},
  onAdminMenu: () => {if(activeForest())ui.toast('A administração fica disponível na propriedade.');else scene.openAdminMenu();},
  onMapEditor: () => {const forest=activeForest();if(forest)forest.openMapEditor();else scene.openMapEditor();},
  onCompanions: () => { const current=activeForest()??scene;getWorldPetController(current)?.openMenu(); },
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
  scene: [scene, new ForestScene(),new VillageScene(),new CityForestScene(),new DungeonScene(),new MapEditorScene()],
  audio: { noAudio: true },
  banner: false,
});

export { gameAudio };
