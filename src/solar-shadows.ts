import Phaser from 'phaser';
import { solarLight } from './solar-light';
import { ProjectedShadow } from './projected-shadow';
import { HOUSE_SHADOW_FOOT } from './house-sprites';
import { WELL_SHADOW_FOOT } from './data/property-well';

type Caster = Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
const CASTER = /^(asset-(tree|pine)(-[012])?|lake-rock-[0-5]|asset-house|property-well-(idle|use)|cabin|player|forest-player|village-player|village-npc-[a-z]+|village-lantern|village-augusto-shop|village-blacksmith-house(-front)?|lia)$/;

/** Reuses sprite alpha, including animated character frames. No source art is modified. */
export class SolarShadows {
  private pairs = new Map<Caster, ProjectedShadow>();
  private textures = new Set<string>();
  private footPivots = new Map<string,number>();
  private nextScan = 0;
  constructor(private readonly scene: Phaser.Scene) {}
  setVisible(visible: boolean): void { if (!visible) this.pairs.forEach(s => s.setVisible(false)); }
  destroy(): void {
    this.pairs.forEach(s=>s.destroy());this.pairs.clear();
    this.textures.forEach(key=>this.scene.textures.remove(key));this.textures.clear();
    this.footPivots.clear();
  }
  update(time: number, enabled: boolean, strength: number): void {
    const sun = solarLight(time);
    if (!enabled || sun.opacity === 0) { this.setVisible(false); return; }
    if (this.scene.time.now >= this.nextScan) {
      this.nextScan = this.scene.time.now + 500;
      for (const object of [...this.scene.children.list]) {
        const source = object as Caster;
        if (source.texture && CASTER.test(source.texture.key) && !this.pairs.has(source)) {
          const shadow = new ProjectedShadow(this.scene,source.x,source.y,'__WHITE');
          this.scene.add.existing(shadow);
          this.pairs.set(source,shadow.setDepth(-5).setVisible(false).setData('solar-shadow',true));
        }
      }
    }
    const view = this.scene.cameras.main.worldView;
    for (const [source, shadow] of this.pairs) {
      if (!source.active) { shadow.destroy(); this.pairs.delete(source); continue; }
      const onScreen = source.x >= view.x - 300 && source.x <= view.right + 300 && source.y >= view.y - 300 && source.y <= view.bottom + 300;
      if (!source.visible || source.isCropped || !onScreen) { shadow.setVisible(false); continue; }
      const texture = this.texture(source);
      // Authored transparent ground margins stay below their measured foot,
      // keeping the projection attached to the same visible grass contact.
      const authoredFoot = typeof source.getData('shadow-foot')==='number'?source.getData('shadow-foot') as number : source.texture.key === 'asset-house' ? HOUSE_SHADOW_FOOT
        : /^property-well-(idle|use)$/.test(source.texture.key) ? WELL_SHADOW_FOOT : source.originY;
      const foot = this.footPivots.get(texture) ?? authoredFoot;
      shadow.setTexture(texture).setOrigin(source.originX, 1 - foot)
        .setPosition(source.x, source.y + (foot-source.originY)*source.displayHeight + .25).setRotation(0)
        .setScale(source.scaleX, source.scaleY * sun.projectionY)
        .setFlipX(source.flipX).setAlpha(sun.opacity * strength).setVisible(true);
      shadow.shear = sun.projectionX / sun.projectionY;
    }
  }
  private texture(source: Caster): string {
    const override=source.getData('shadow-source') as string|undefined;
    const frame = override&&this.scene.textures.exists(override)?this.scene.textures.get(override).get():source.frame;
    const key = `solar-silhouette:${this.scene.sys.settings.key}:${source.texture.key}:${frame.name}`;
    if (this.scene.textures.exists(key)) return key;
    const canvas = document.createElement('canvas');
    canvas.width = frame.realWidth; canvas.height = frame.realHeight;
    const c = canvas.getContext('2d')!;
    // Mirror about the feet onto the ground, retaining the frame's transparent margins.
    c.translate(0, canvas.height); c.scale(1, -1);c.filter='blur(1px)';
    c.drawImage(frame.source.image as HTMLImageElement, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight,
      frame.x, frame.y, frame.cutWidth, frame.cutHeight);
    if(['player','forest-player','village-player','lia'].includes(source.texture.key)||source.texture.key.startsWith('village-npc-')){
      const alpha=c.getImageData(0,0,canvas.width,canvas.height).data;
      let first=canvas.height;
      for(let y=0;y<canvas.height&&first===canvas.height;y++)for(let x=0;x<canvas.width;x++)if(alpha[(y*canvas.width+x)*4+3]>=200){first=y;break;}
      if(first<canvas.height)this.footPivots.set(key,1-first/canvas.height);
    }
    c.setTransform(1,0,0,1,0,0); c.filter='none';c.globalCompositeOperation = 'source-in';
    c.fillStyle = '#182c28'; c.fillRect(0,0,canvas.width,canvas.height);
    c.globalCompositeOperation = 'destination-in';
    const fade = c.createLinearGradient(0,0,0,canvas.height); fade.addColorStop(0,'#000');fade.addColorStop(1,'#000a');
    c.fillStyle = fade;c.fillRect(0,0,canvas.width,canvas.height);
    this.scene.textures.addCanvas(key,canvas)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
    this.textures.add(key);
    return key;
  }
}
