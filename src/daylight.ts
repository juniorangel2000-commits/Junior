import Phaser from 'phaser';
import { daylightAt } from './daylight-model';
import { getVisualSettings } from './visual-settings';
import { SolarShadows } from './solar-shadows';
import { WINDOW_LIGHT_FRAGMENT } from './window-light-shader';
import { windowLight } from './solar-light';
import { drawHouseWindowGlow, HOUSE_WINDOW_LIGHTS } from './house-sprites';

/** Lightweight color grading, shared by Canvas and WebGL, below the HTML HUD. */
export class Daylight {
  readonly shade: Phaser.GameObjects.Rectangle;
  readonly warmth: Phaser.GameObjects.Rectangle;
  readonly shader?: Phaser.GameObjects.Shader;
  private readonly shadows: SolarShadows;
  private readonly panes: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
  private shown = true;
  private windows: Array<{ x: number; y: number }> = [];
  constructor(scene: Phaser.Scene, width: number, height: number) {
    this.shade = scene.add.rectangle(0, 0, width, height, 0x182642).setOrigin(0).setDepth(5000).setAlpha(0);
    this.warmth = scene.add.rectangle(0, 0, width, height, 0xf3b56c).setOrigin(0).setDepth(5001).setAlpha(0);
    this.shadows = new SolarShadows(scene);
    const house = scene.children.list.find(o => (o as Phaser.GameObjects.Image).texture?.key === 'asset-house') as Phaser.GameObjects.Image | undefined;
    this.panes = house ? drawHouseWindowGlow(scene, house) ?? scene.add.graphics().setVisible(false)
      : scene.add.graphics().setVisible(false);
    if (house) {
      const left = house.x - house.displayWidth * house.originX, top = house.y - house.displayHeight * house.originY;
      for (const pane of HOUSE_WINDOW_LIGHTS) {
        const x = left + pane.x * house.scaleX, y = top + pane.y * house.scaleY;
        this.windows.push({ x: x + pane.width * house.scaleX / 2, y: y + pane.height * house.scaleY / 2 });
      }
    }
    if (scene.game.renderer.type === Phaser.WEBGL) {
      const shader = new Phaser.Display.BaseShader('after-rain-window-light', WINDOW_LIGHT_FRAGMENT, undefined, {
        darkness: { type: '1f', value: 0 }, golden: { type: '1f', value: 0 }, lamp: { type: '1f', value: 0 },
        windowA: { type: '2f', value: this.windows[0] ?? {x:-1000,y:-1000} },
        windowB: { type: '2f', value: this.windows[1] ?? {x:-1000,y:-1000} },
      });
      this.shader = scene.add.shader(shader,width/2,height/2,width,height).setDepth(5002).setVisible(false);
    }
  }
  contains(object: Phaser.GameObjects.GameObject): boolean {
    return object === this.shade || object === this.warmth || object === this.shader || object === this.panes || !!object.getData('solar-shadow');
  }
  setVisible(visible: boolean): void {
    this.shown=visible;this.shade.setVisible(visible);this.warmth.setVisible(visible);
    if(!visible){this.shader?.setVisible(false);this.panes.setVisible(false);this.shadows.setVisible(false);}
  }
  destroy(): void {
    this.shadows.destroy();this.shader?.destroy();
    this.shade.destroy();this.warmth.destroy();this.panes.destroy();
  }
  update(time: number, indoors = false): void {
    const settings = getVisualSettings();
    const light = daylightAt(time, settings.daylight ? settings.intensity : 0, indoors);
    this.shade.setAlpha(light.shade); this.warmth.setAlpha(light.warmth);
    const dynamic=this.shown&&settings.daylight&&settings.dynamicLighting&&!indoors;
    const useShader=dynamic&&!!this.shader;
    this.shade.setVisible(this.shown&&!useShader);this.warmth.setVisible(this.shown&&!useShader);
    const lamp=this.windows.length&&dynamic?windowLight(time)*settings.intensity:0;
    this.panes.setVisible(lamp>0).setAlpha(lamp*.88);
    this.shader?.setVisible(useShader).setUniform('darkness.value',light.shade)
      .setUniform('golden.value',light.warmth).setUniform('lamp.value',lamp);
    this.shadows.update(time,dynamic,settings.intensity);
  }
}
