import { toolHandPlacement } from './data/tool-hand-placement';
import {minToolTier} from './data/economy-balance';
import {preloadPlayerMiningArt,playerMiningPose,playerChoppingPose} from './player-mining-art';
import Phaser from 'phaser';
import { CHARACTER_DIRECTIONS, type CharacterDirection } from './character-directions';
import { toolIdleArt, toolUseArt, toolSwingAngle, TOOL_USE_FRAMES, TOOL_FRAME_SIZE, type AnimatedTool } from './data/tool-art';
import type { CharacterProfile } from './types';
import type { ToolUse } from './systems/tool-use';
import anchors from './data/tool-art-anchors.json';
import {TOOL_MATERIALS} from './data/economy-art';
import type {EconomicTool} from './data/economy-balance';
import {hoeSwingAngle} from './data/tool-art';

export function preloadToolArt(scene: Phaser.Scene): void {
  preloadPlayerMiningArt(scene);
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
  private miningSprite?:Phaser.GameObjects.Image;
  private hiddenBody?:Phaser.GameObjects.Sprite;
  private bodyWasVisible=false;
  private gatherTween?:Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, private readonly profile: CharacterProfile) {
    this.sprite = scene.add.image(0, 0, toolIdleArt('hatchet', 'down').key).setVisible(false);
    scene.events.once('shutdown',()=>this.hideMiningPose());
  }

  private hideMiningPose():void{this.miningSprite?.setVisible(false);if(this.hiddenBody?.scene)this.hiddenBody.setVisible(this.bodyWasVisible);this.hiddenBody=undefined;}

  hide(): void { this.hideMiningPose(); this.gatherTween?.stop();this.gatherTween=undefined;this.sprite.setData('gathering',false).setVisible(false); }

  show(tool: AnimatedTool | 'sickle' | 'shovel', direction: CharacterDirection, x: number, y: number, use: Pick<ToolUse,'active'|'frame'>, tier=0,body?:Phaser.GameObjects.Sprite): void {
    if (!use.active) { this.hide(); return; }
    if((tool==='pickaxe'||tool==='hatchet')&&body){
      const pose=(tool==='hatchet'?playerChoppingPose:playerMiningPose)(this.sprite.scene,this.profile,direction,use.frame,tier);
      if(pose){
        if(this.hiddenBody!==body){this.hideMiningPose();this.hiddenBody=body;this.bodyWasVisible=body.visible;}
        body.setVisible(false);this.sprite.setVisible(false);
        this.miningSprite??=this.sprite.scene.add.image(x,y,pose.key,pose.frame).setData('player-mining-pose',true);
        this.miningSprite.setTexture(pose.key,pose.frame).setPosition(x,y).setOrigin(pose.originX,pose.originY).setScale(pose.scale).setDepth(body.depth).setAlpha(body.alpha).setVisible(this.bodyWasVisible);
        return;
      }
    }
    this.hideMiningPose();
    const side = direction.includes('left') ? 'left' : 'right';
    const hand = toolHandPlacement(this.profile,direction,x,y);
    if(tool!=='water'&&(tier>0||tool==='sickle'||tool==='shovel')){
      const material=TOOL_MATERIALS[Math.max(minToolTier(tool),Math.min(3,Math.floor(tier)))];
      this.sprite.setTexture(`economy-tool-${material}-${tool}`).setFlipX(side==='left').clearTint();
      this.sprite.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      const grip=anchors[`${material}-${tool}` as keyof typeof anchors];
      this.sprite.setOrigin((side==='left'?128-grip.x:grip.x)/128,grip.y/128).setScale(.32).setAngle(hoeSwingAngle(use.frame,side==='left'))
        .setPosition(hand.x,hand.y).setDepth(hand.depth).setVisible(true);
      return;
    }
    const art = use.active ? toolUseArt(tool, side, use.frame) : toolIdleArt(tool, side);
    this.sprite.setTexture(art.key);
    this.sprite.setFlipX(art.flipX);
    this.sprite.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    const size = tool === 'hoe' ? 320 : tool === 'water' ? 256 : TOOL_FRAME_SIZE;
    const gripX = art.flipX ? size - art.grip[0] : art.grip[0];
    this.sprite.setOrigin(gripX / size, art.grip[1] / size).setScale(tool === 'hoe' ? .115 : tool === 'water' ? .14 : .30);
    this.sprite.setAngle(toolSwingAngle(tool, use.frame, side === 'left')).setPosition(hand.x,hand.y)
      .setDepth(hand.depth).setVisible(true);
  }

  /** The same rigid pivot swing is used for inventory-operated sickles and shovels. */
  playGather(tool:Exclude<EconomicTool,'sword'>,direction:CharacterDirection,player:{x:number;y:number},tier:number,body?:Phaser.GameObjects.Sprite):void{
    this.hide();
    this.sprite.setData('gathering',true);
    this.show(tool,direction,player.x,player.y,{active:true,frame:0},tier,body);
    this.gatherTween=this.sprite.scene.tweens.addCounter({from:0,to:8,duration:450,onUpdate:tween=>{
      this.show(tool,direction,player.x,player.y,{active:true,frame:Math.floor(tween.getValue()??0)},tier,body);
    },onComplete:()=>{this.gatherTween=undefined;this.sprite.setData('gathering',false);this.hide();}});
  }
}
