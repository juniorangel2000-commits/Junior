import Phaser from 'phaser';
import { CHARACTER_DIRECTIONS, directionVector, type CharacterDirection } from './character-directions';
import { toolIdleArt, toolUseArt, toolSwingAngle, TOOL_USE_FRAMES, TOOL_FRAME_SIZE, type AnimatedTool } from './data/tool-art';
import type { CharacterProfile } from './types';
import type { ToolUse } from './systems/tool-use';
import { resolveCharacter } from './data/characters';
import anchors from './data/tool-art-anchors.json';
import {TOOL_MATERIALS} from './data/economy-art';
import type {EconomicTool} from './data/economy-balance';
import {hoeSwingAngle} from './data/tool-art';

/** Palm centers in the original character PNGs, before any display scaling. */
const HANDS: Record<'farmer-female' | 'farmer-male', Record<CharacterDirection, readonly [number, number]>> = {
  'farmer-female': {
    down: [156,167], up: [93,166], right: [121,172], left: [130,172],
    'down-right': [103,166], 'down-left': [149,165], 'up-right': [155,164], 'up-left': [99,165],
  },
  'farmer-male': {
    down: [164,160], up: [91,159], right: [112,168], left: [140,168],
    'down-right': [97,164], 'down-left': [158,163], 'up-right': [153,165], 'up-left': [102,165],
  },
};

export function preloadToolArt(scene: Phaser.Scene): void {
  const sources = new Map<string, string>();
  for (const tool of ['hatchet', 'pickaxe', 'water', 'hoe'] as const) for (const direction of CHARACTER_DIRECTIONS) {
    const idle = toolIdleArt(tool, direction); sources.set(idle.key, idle.path);
    for (let frame = 0; frame < TOOL_USE_FRAMES; frame++) {
      const art = toolUseArt(tool, direction, frame); sources.set(art.key, art.path);
    }
  }
  for (const [key, path] of sources) scene.load.image(key, path);
}

/** Original 97×97 textures remain intact; only their on-screen scale changes. */
export class ToolVisual {
  readonly sprite: Phaser.GameObjects.Image;
  private gatherTween?:Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, private readonly profile: CharacterProfile) {
    this.sprite = scene.add.image(0, 0, toolIdleArt('hatchet', 'down').key).setVisible(false);
  }

  hide(): void { this.gatherTween?.stop();this.gatherTween=undefined;this.sprite.setData('gathering',false).setVisible(false); }

  show(tool: AnimatedTool | 'sickle' | 'shovel', direction: CharacterDirection, x: number, y: number, use: Pick<ToolUse,'active'|'frame'>, tier=0): void {
    if (!use.active) { this.hide(); return; }
    direction = direction.includes('left') ? 'left' : 'right';
    if(tool!=='water'&&(tier>0||tool==='sickle'||tool==='shovel')){
      const material=TOOL_MATERIALS[Math.max(0,Math.min(3,Math.floor(tier)))];
      const character=resolveCharacter(this.profile),hand=HANDS[character.id][direction];
      this.sprite.setTexture(`economy-tool-${material}-${tool}`).setFlipX(direction==='left').clearTint();
      this.sprite.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      const grip=anchors[`${material}-${tool}` as keyof typeof anchors];
      this.sprite.setOrigin((direction==='left'?128-grip.x:grip.x)/128,grip.y/128).setScale(.32).setAngle(hoeSwingAngle(use.frame,direction==='left'))
        .setPosition(x+(hand[0]-character.originX)/4+(direction==='left'?-7:7),y+(hand[1]-character.originY)/4-3).setDepth(y+1).setVisible(true);
      return;
    }
    const art = use.active ? toolUseArt(tool, direction, use.frame) : toolIdleArt(tool, direction);
    this.sprite.setTexture(art.key);
    this.sprite.setFlipX(art.flipX);
    this.sprite.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    const size = tool === 'hoe' ? 320 : tool === 'water' ? 256 : TOOL_FRAME_SIZE;
    const gripX = art.flipX ? size - art.grip[0] : art.grip[0];
    this.sprite.setOrigin(gripX / size, art.grip[1] / size).setScale(tool === 'hoe' ? .115 : tool === 'water' ? .14 : .30);
    const behind = direction.startsWith('up');
    const character = resolveCharacter(this.profile);
    const hand = HANDS[character.id][direction];
    const handX = (hand[0] - character.originX) / 4;
    const handY = (hand[1] - character.originY) / 4 - 3;
    // Rotate rigid timber/metal around a fixed palm pivot, like the hoe, without
    // frame-to-frame grip jumps. The tool stays hidden outside the action.
    const forward = directionVector(direction);
    this.sprite.setAngle(toolSwingAngle(tool, use.frame, direction === 'left')).setPosition(x + handX + forward.x * 7, y + handY + forward.y * 7)
      .setDepth(y + (behind ? -1 : 1)).setVisible(true);
  }

  /** The same rigid pivot swing is used for inventory-operated sickles and shovels. */
  playGather(tool:EconomicTool,direction:CharacterDirection,player:{x:number;y:number},tier:number):void{
    this.hide();
    this.sprite.setData('gathering',true);
    this.show(tool,direction,player.x,player.y,{active:true,frame:0},tier);
    this.gatherTween=this.sprite.scene.tweens.addCounter({from:0,to:8,duration:450,onUpdate:tween=>{
      this.show(tool,direction,player.x,player.y,{active:true,frame:Math.floor(tween.getValue()??0)},tier);
    },onComplete:()=>{this.gatherTween=undefined;this.sprite.setData('gathering',false);this.hide();}});
  }
}
