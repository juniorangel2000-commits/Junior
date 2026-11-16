import Phaser from 'phaser';
import { solarLight } from './solar-light';
import { ProjectedShadow } from './projected-shadow';
import { HOUSE_SHADOW_FOOT } from './house-sprites';
import { WELL_SHADOW_FOOT } from './data/property-well';

type Caster = Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
const CASTER = /^(asset-(tree|pine)(-[012])?|lake-rock-[0-5]|asset-house|property-well-(idle|use)|cabin|player|forest-player|city-forest-player|village-player|village-npc-[a-z]+|village-lantern|village-(augusto|rosa|amelia|nilo|celina|damiao|helena|icaro)-shop|village-tobias-shop-front|detailed-ore-atlas|village-blacksmith-house(-front)?)$/;

/** Chão, plantinhas rasteiras, camadas de janela/fogo das casas e efeitos não projetam sombra. */
const NO_SHADOW = /^(__|solar-|tool:|animal-)|-windows$|window-glow|-back$|-roof$|-floor$|blacksmith-(fire|anvil)|^bridge-|village-pier|ambient-wild-birds|forest-detail-(fern|flowers|mushrooms|reeds)|village-greenery|ecology-herbs|fields-meadow-grass|asset-small-stones|prepared-soil|exit-sign|fields-floor|ground|map-seam|cliff|harvest-basket|machine-product|item-/;
/** Tudo o que fica em pé no mundo projeta sombra: árvores, pedras, casas, cercas, bancos,
 * canteiros, fonte, barris, máquinas, construções e pessoas. Os animais já têm a sombra
 * oval embaixo deles; a projetada, feita quadro a quadro na corrida, travava o jogo. Os objetos em pé são os
 * ordenados pela altura no mapa (profundidade = y); o chão fica abaixo de zero e as camadas de
 * luz e interface acima de 4000. `setData('no-shadow', true)` tira um objeto da regra. */
export function castsShadow(o: Phaser.GameObjects.GameObject): boolean {
  if (o.type !== 'Image' && o.type !== 'Sprite') return false;
  const g = o as Caster, key = g.texture?.key ?? '';
  if (CASTER.test(key)) return true;
  if (o.getData('no-shadow') || o.getData('solar-shadow') || g.depth < 0 || g.depth >= 4000 || NO_SHADOW.test(key)) return false;
  return g.displayHeight >= 26 && g.displayWidth <= 520 && g.displayHeight <= 520;
}
/** Sombras de personagens e moradores mudam de quadro: são feitas sob demanda. */
const STATIC_LAZY=/player|village-npc-/;
/** Reuses sprite alpha, including animated character frames. No source art is modified. */
export class SolarShadows {
  private pairs = new Map<Caster, ProjectedShadow>();
  private textures = new Set<string>();
  private footPivots = new Map<string,number>();
  private nextScan = 0;
  private warmed = false;
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
        if (source.texture && !this.pairs.has(source) && castsShadow(source)) {
          const shadow = new ProjectedShadow(this.scene,source.x,source.y,'__WHITE');
          this.scene.add.existing(shadow);
          this.pairs.set(source,shadow.setDepth(-5).setVisible(false).setData('solar-shadow',true));
          // Árvores, pedras e casas: a silhueta é feita já na primeira varredura (ao entrar no
          // cenário), e não no meio da caminhada, quando aparecem na tela. Personagens animados
          // continuam sob demanda, quadro a quadro.
          if(!this.warmed&&!STATIC_LAZY.test(source.texture.key))this.texture(source);
        }
      }
      this.warmed=true;
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
      // A sombra nasce no pé e deita no chão para trás do objeto, achatada e inclinada para
      // o lado oposto ao sol: fica sempre colada à base. De manhã e à tarde ela é mais comprida.
      const squash = .2 + .5 * sun.length;
      shadow.setTexture(texture).setOrigin(source.originX, foot)
        .setPosition(source.x, source.y + (foot-source.originY)*source.displayHeight).setRotation(0)
        .setScale(source.scaleX, source.scaleY * squash)
        .setFlipX(source.flipX).setAlpha(sun.opacity * strength).setVisible(true);
      shadow.shear = -sun.x * .85 / squash;
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
    // Silhueta na mesma posição do quadro (sem espelhar), com as margens transparentes.
    c.filter='blur(1px)';
    c.drawImage(frame.source.image as HTMLImageElement, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight,
      frame.x, frame.y, frame.cutWidth, frame.cutHeight);
    // A sombra parte do pé desenhado (última linha opaca), não da borda da imagem. Casa,
    // poço e prédios da vila (com 'shadow-foot' medido à mão) mantêm o pé deles.
    // 'shadow-foot' igual a 1 (borda de baixo) também é medido: essas artes têm margem transparente.
    const authored=source.getData('shadow-foot');
    if(!/^(asset-house|property-well-(idle|use))$/.test(source.texture.key)&&(typeof authored!=='number'||authored>=1)){
      const alpha=c.getImageData(0,0,canvas.width,canvas.height).data;
      // Pé: a última linha bem opaca, de baixo para cima.
      let bottom=-1;
      for(let y=canvas.height-1;y>=0&&bottom<0;y--)for(let x=0;x<canvas.width;x++)if(alpha[(y*canvas.width+x)*4+3]>=160){bottom=y;break;}
      if(bottom>=0)this.footPivots.set(key,(bottom+1)/canvas.height);
    }
    c.setTransform(1,0,0,1,0,0); c.filter='none';c.globalCompositeOperation = 'source-in';
    c.fillStyle = '#182c28'; c.fillRect(0,0,canvas.width,canvas.height);
    c.globalCompositeOperation = 'destination-in';
    // Mais escura junto ao pé, mais clara na ponta.
    const fade = c.createLinearGradient(0,0,0,canvas.height); fade.addColorStop(0,'#0007');fade.addColorStop(1,'#000');
    c.fillStyle = fade;c.fillRect(0,0,canvas.width,canvas.height);
    this.scene.textures.addCanvas(key,canvas)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
    this.textures.add(key);
    return key;
  }
}
