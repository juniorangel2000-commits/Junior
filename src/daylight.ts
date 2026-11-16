import Phaser from 'phaser';
import {WorldRain} from './world-rain';
import { daylightAt } from './daylight-model';
import { getVisualSettings } from './visual-settings';
import { SolarShadows } from './solar-shadows';
import { WINDOW_LIGHT_FRAGMENT } from './window-light-shader';
import { windowLight } from './solar-light';
import { drawHouseWindowGlow, HOUSE_WINDOW_LIGHTS } from './house-sprites';
import {FixtureLighting,type FixtureSource} from './fixture-lighting';
import {lightingAt,NEUTRAL_LIGHTING} from './lighting-model';
import {LightingPipeline,registerLightingPipeline,MAX_LIGHTS,type ScreenLight} from './lighting-pipeline';
import {AmbientParticles} from './ambient-particles';
import {fixtureStrength} from './fixture-light-model';
import {weatherForDay} from './weather-model';

/** Luz do dia. No WebGL, um passe único na câmera (`LightingPipeline`) faz a cor de cada
 * hora, as luzes que recortam a noite, as nuvens e a vinheta, e há vaga-lumes e pólen
 * (docs/construcoes/ILUMINACAO.md). Sem WebGL fica a película de cor antiga. */
export class Daylight {
  readonly shade: Phaser.GameObjects.Rectangle;
  readonly warmth: Phaser.GameObjects.Rectangle;
  readonly shader?: Phaser.GameObjects.Shader;
  private readonly shadows: SolarShadows;
  private readonly fixtures:FixtureLighting;
  private readonly panes: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
  private shown = true;
  private rain:WorldRain;
  private windows: Array<{ x: number; y: number }> = [];
  private pipeline?: LightingPipeline;
  private readonly particles?: AmbientParticles;
  private emitters: Phaser.GameObjects.GameObject[] = [];
  private nextEmitterScan = 0;
  private lastSeconds = 0;
  private readonly scene: Phaser.Scene;
  constructor(scene: Phaser.Scene, width: number, height: number) {
    this.scene = scene;
    this.rain=new WorldRain(scene);
    this.shade = scene.add.rectangle(0, 0, width, height, 0x182642).setOrigin(0).setDepth(5000).setAlpha(0);
    this.warmth = scene.add.rectangle(0, 0, width, height, 0xf3b56c).setOrigin(0).setDepth(5001).setAlpha(0);
    this.shadows = new SolarShadows(scene);
    this.fixtures=new FixtureLighting(scene);
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
    if (registerLightingPipeline(scene.game)) {
      const camera = scene.cameras.main;
      // Um passe por câmera: o de uma luz anterior deste cenário sai antes.
      for (const old of [...camera.postPipelines]) if (old instanceof LightingPipeline) camera.removePostPipeline(old);
      camera.setPostPipeline(LightingPipeline);
      const pipeline = camera.getPostPipeline(LightingPipeline);
      this.pipeline = (Array.isArray(pipeline) ? pipeline[0] : pipeline) as LightingPipeline | undefined;
      if (this.pipeline) { this.particles = new AmbientParticles(scene); this.shade.setVisible(false); this.warmth.setVisible(false); return; }
    }
    // O shader só faz diferença nas janelas da casa. Nos outros mapas,
    // duas camadas de cor produzem o mesmo resultado sem processar o mapa inteiro.
    if (this.windows.length && scene.game.renderer.type === Phaser.WEBGL) {
      const shader = new Phaser.Display.BaseShader('after-rain-window-light', WINDOW_LIGHT_FRAGMENT, undefined, {
        darkness: { type: '1f', value: 0 }, golden: { type: '1f', value: 0 }, lamp: { type: '1f', value: 0 },
        windowA: { type: '2f', value: this.windows[0] ?? {x:-1000,y:-1000} },
        windowB: { type: '2f', value: this.windows[1] ?? {x:-1000,y:-1000} },
      });
      this.shader = scene.add.shader(shader,width/2,height/2,width,height).setDepth(5002).setVisible(false);
    }
  }
  contains(object: Phaser.GameObjects.GameObject): boolean {
    return !!this.particles?.contains(object) || object===this.rain.graphics || object === this.shade || object === this.warmth || object === this.shader || object === this.panes || !!object.getData('solar-shadow')||this.fixtures.contains(object);
  }
  setVisible(visible: boolean): void {
    this.rain.setVisible(visible);
    this.shown=visible;this.shade.setVisible(visible&&!this.pipeline);this.warmth.setVisible(visible&&!this.pipeline);
    if(!visible){this.shader?.setVisible(false);this.panes.setVisible(false);this.shadows.setVisible(false);}
  }
  destroy(): void {
    if (this.pipeline) this.scene.cameras.main?.removePostPipeline(this.pipeline);
    this.particles?.destroy();
    this.rain.destroy();this.shadows.destroy();this.fixtures.destroy();this.shader?.destroy();
    this.shade.destroy();this.warmth.destroy();this.panes.destroy();
  }
  update(time: number, indoors = false, day = 1): void {
    this.rain.update(day,indoors);
    if (this.pipeline) { this.updatePipeline(time, indoors, day); return; }
    this.fixtures.update(time);
    const settings = getVisualSettings();
    const light = daylightAt(time, settings.daylight ? settings.intensity : 0, indoors);
    this.shade.setAlpha(light.shade); this.warmth.setAlpha(light.warmth);
    const dynamic=this.shown&&settings.daylight&&settings.dynamicLighting&&!indoors;
    const lamp=this.windows.length&&dynamic?windowLight(time)*settings.intensity:0;
    const useShader=dynamic&&!!this.shader&&lamp>0;
    this.shade.setVisible(this.shown&&!useShader);this.warmth.setVisible(this.shown&&!useShader);
    this.panes.setVisible(lamp>0).setAlpha(lamp*.88);
    this.shader?.setVisible(useShader).setUniform('darkness.value',light.shade)
      .setUniform('golden.value',light.warmth).setUniform('lamp.value',lamp);
    this.shadows.update(time,dynamic,settings.intensity);
  }
  /** Passe de luz: estado da hora, câmera e lista de luzes em pixels da tela. */
  private updatePipeline(time: number, indoors: boolean, day: number): void {
    const scene = this.scene, camera = scene.cameras.main, view = camera.worldView, zoom = camera.zoom;
    // Usa sempre o passe que está de fato na câmera (troca de cenário pode recriá-lo).
    let attached = camera.getPostPipeline(LightingPipeline) as LightingPipeline | LightingPipeline[] | undefined;
    if (Array.isArray(attached)) attached = attached[0];
    if (!attached) { camera.setPostPipeline(LightingPipeline); const again = camera.getPostPipeline(LightingPipeline); attached = (Array.isArray(again) ? again[0] : again) as LightingPipeline | undefined; }
    if (attached) this.pipeline = attached;
    const p = this.pipeline!;
    const settings = getVisualSettings(), seconds = scene.time.now / 1000, dt = Math.min(.1, Math.max(0, seconds - this.lastSeconds));this.lastSeconds = seconds;
    const state = this.shown && settings.daylight ? lightingAt(time, settings.intensity, indoors, weatherForDay(day) === 'rain') : { ...NEUTRAL_LIGHTING };
    if (!settings.dynamicLighting) { state.clouds = 0; state.pollen = 0; state.fireflies = 0; }
    p.state = state; p.scroll = { x: view.x, y: view.y }; p.zoom = zoom; p.seconds = seconds;
    const lamp = this.windows.length && this.shown && settings.daylight ? windowLight(time) * settings.intensity : 0;
    this.panes.setVisible(lamp > 0).setAlpha(lamp * .88);
    this.shadows.update(time, this.shown && settings.daylight && settings.dynamicLighting && !indoors, settings.intensity);
    this.particles!.update(seconds, dt, state.fireflies, state.pollen, this.shown);
    // Luzes: janelas da casa, lampiões e fogueiras marcados com 'fixture-light', o halo do
    // personagem e os vaga-lumes. Só entram as que alcançam a tela.
    const lights: ScreenLight[] = [], screen = (x: number, y: number) => ({ x: (x - view.x) * zoom, y: (y - view.y) * zoom });
    const add = (x: number, y: number, radius: number, intensity: number, color: [number, number, number]) => {
      if (intensity <= .01) return; const s = screen(x, y), r = radius * zoom;
      if (s.x < -r || s.y < -r || s.x > camera.width + r || s.y > camera.height + r) return;
      lights.push({ x: s.x, y: s.y, radius: r, intensity, color });
    };
    if (state.lamps > .01) {
      // Janela acesa: brilho forte no vidro e uma poça de luz quente no chão em frente.
      for (const w of this.windows) { const on = windowLight(time); add(w.x, w.y, 34, 1.6 * on, [1, .78, .45]); add(w.x, w.y + 70, 120, .75 * on, [1, .72, .42]); }
      if (scene.time.now >= this.nextEmitterScan) { this.nextEmitterScan = scene.time.now + 500; this.emitters = scene.children.list.filter(o => !!o.getData('fixture-light')); }
      // Postes, lampiões e fogueiras: alcance largo, para iluminar bem a rua em volta.
      for (const o of this.emitters) {
        const e = o as Phaser.GameObjects.Image, src = o.getData('fixture-light') as FixtureSource | undefined;
        if (!src || !e.active || !e.visible) continue;
        add(e.x + (src.offsetX ?? 0), e.y + (src.offsetY ?? 0), src.radius * 3, fixtureStrength(time, scene.time.now, !!src.always, 1) * (src.strength ?? 1) * 1.2, [1, .66, .34]);
      }
      const player = (scene as unknown as { player?: { x: number; y: number } }).player;
      if (player && Number.isFinite(player.x)) add(player.x, player.y - 14, indoors ? 110 : 150, .5, [1, .88, .7]);
    }
    if (this.particles) lights.push(...this.particles.lights(screen, zoom));
    if (lights.length > MAX_LIGHTS) { const cx = camera.width / 2, cy = camera.height / 2; lights.sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy)); lights.length = MAX_LIGHTS; }
    p.lights = lights;
  }
}
