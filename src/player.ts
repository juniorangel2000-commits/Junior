import { SwimmingVisual, SWIM_SPEED_FACTOR } from './swimming';
import Phaser from 'phaser';
import type { CharacterProfile } from './types';
import { createCharacterFrames } from './art';
import { CHARACTER_WIDTH, CHARACTER_HEIGHT } from './character-sprites';
import { characterFrame, directionFromVector } from './character-directions';
import { resolveCharacter } from './data/characters';
import { TILE } from './world';

type MovementKeys = Record<string, Phaser.Input.Keyboard.Key>;

export const PLAYER_SPEED = 84;
/** Two alternating footfalls over one complete walk cycle, in world pixels. */
export const PLAYER_WALK_CYCLE_DISTANCE = 48;
const RELEASE_TURN_GRACE = .03;
const COLLISION_PRECISION = .01;

export class Player {
  readonly sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  facing = { x: 0, y: 1 };
  isSwimming=false;
  private swimmingVisual?:SwimmingVisual;
  private walkDistance = 0;
  private previousInput = { x: 0, y: 0 };
  private releaseTurn?: { x: number; y: number; elapsed: number };
  private readonly keys: MovementKeys;
  private readonly walkFrames: number;

  constructor(private readonly scene: Phaser.Scene, private readonly profile: CharacterProfile, x: number, y: number, private readonly textureKey = 'player') {
    this.x = x;
    this.y = y;
    this.walkFrames = resolveCharacter(profile).walkFrames;
    const texture = createCharacterFrames(scene, profile, textureKey);
    this.sprite = scene.add.sprite(x, y, texture, characterFrame('down'))
      .setOrigin(0.5, 1).setDisplaySize(CHARACTER_WIDTH, CHARACTER_HEIGHT);
    this.keys = scene.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT', false) as MovementKeys;
  }

  setVisible(visible:boolean):void {this.sprite.setVisible(visible);this.swimmingVisual?.setVisible(visible&&this.isSwimming);}

  update(delta: number, isBlocked: (x: number, y: number) => boolean,
    isBlockedPoint?: (x: number, y: number) => boolean, movementEnabled = true, isWaterPoint?: (x:number,y:number)=>boolean): void {
    const speed=PLAYER_SPEED*(isWaterPoint?.(this.x,this.y)?SWIM_SPEED_FACTOR:1);
    const inputX = movementEnabled ? Number(this.keys.D.isDown || this.keys.RIGHT.isDown) - Number(this.keys.A.isDown || this.keys.LEFT.isDown) : 0;
    const inputY = movementEnabled ? Number(this.keys.S.isDown || this.keys.DOWN.isDown) - Number(this.keys.W.isDown || this.keys.UP.isDown) : 0;
    const moving = inputX !== 0 || inputY !== 0;
    const previousX = this.x, previousY = this.y;
    let distance = 0;
    if (moving) {
      const length = Math.hypot(inputX, inputY);
      const dx = inputX / length, dy = inputY / length;
      const canStand = (x: number, y: number) =>
        [[-7, -5], [7, -5], [-7, 3], [7, 3]].every(([ox, oy]) =>
          isBlockedPoint ? !isBlockedPoint(x + ox, y + oy)
            : !isBlocked(Math.floor((x + ox) / TILE), Math.floor((y + oy) / TILE)));
      const moveAxis = (amount: number, horizontal: boolean): void => {
        if (!amount) return;
        const fits = (offset: number) => canStand(this.x + (horizontal ? offset : 0), this.y + (horizontal ? 0 : offset));
        let allowed = amount;
        if (!fits(amount)) {
          // Clip the last substep to the wall instead of stopping a whole step early.
          // This keeps wall sliding consistent at different rendering frame rates.
          if (!fits(0)) return;
          let low = 0, high = 1;
          for (let i = 0; i < 10; i++) {
            const fraction = (low + high) / 2;
            if (fits(amount * fraction)) low = fraction; else high = fraction;
          }
          allowed = amount * low;
          if (Math.abs(allowed) < COLLISION_PRECISION) return;
        }
        if (horizontal) this.x += allowed; else this.y += allowed;
      };
      // Small substeps preserve the existing foot collision box even after a slow frame.
      const steps = Math.max(1, Math.ceil(speed * delta / 6));
      for (let i = 0; i < steps; i++) {
        const startX = this.x, startY = this.y;
        moveAxis(dx * speed * delta / steps, true);
        moveAxis(dy * speed * delta / steps, false);
        distance += Math.hypot(this.x - startX, this.y - startY);
      }

      const actualX = this.x - previousX, actualY = this.y - previousY;
      // Follow the actual sliding axis; when fully blocked, still face the interaction target.
      const slideX = Math.abs(actualX) > COLLISION_PRECISION ? Math.sign(actualX) : 0;
      const slideY = Math.abs(actualY) > COLLISION_PRECISION ? Math.sign(actualY) : 0;
      const facingX = distance > COLLISION_PRECISION ? slideX : inputX;
      const facingY = distance > COLLISION_PRECISION ? slideY : inputY;
      const releasedDiagonal = this.previousInput.x !== 0 && this.previousInput.y !== 0
        && ((inputX === this.previousInput.x && inputY === 0) || (inputY === this.previousInput.y && inputX === 0));
      if (releasedDiagonal) this.releaseTurn = { x: inputX, y: inputY, elapsed: 0 };
      if (this.releaseTurn && (this.releaseTurn.x !== inputX || this.releaseTurn.y !== inputY)) this.releaseTurn = undefined;
      if (this.releaseTurn) {
        this.releaseTurn.elapsed += delta;
        if (this.releaseTurn.elapsed >= RELEASE_TURN_GRACE) this.releaseTurn = undefined;
      }
      if (!this.releaseTurn && (facingX || facingY)) {
        const facingLength = Math.hypot(facingX, facingY);
        this.facing = { x: facingX / facingLength, y: facingY / facingLength };
      }
    } else {
      // Stop immediately, without inertia; a fresh walk starts at the contact pose.
      this.walkDistance = 0;
      this.releaseTurn = undefined;
    }
    this.previousInput = { x: inputX, y: inputY };
    const walked = distance > 1e-7;
    if (walked) this.walkDistance = (this.walkDistance + distance) % PLAYER_WALK_CYCLE_DISTANCE;
    const phase = Math.floor((this.walkDistance + 1e-7) / PLAYER_WALK_CYCLE_DISTANCE * this.walkFrames) % this.walkFrames + 1;
    const direction = directionFromVector(this.facing.x, this.facing.y);
    const swimming=!!isWaterPoint?.(this.x,this.y);
    if(swimming){
      this.isSwimming=true;this.swimmingVisual??=new SwimmingVisual(this.scene,this.profile);
      this.swimmingVisual.update(this.sprite,this.x,this.y,direction,walked,delta);return;
    }
    if(this.isSwimming){this.sprite.setTexture(this.textureKey).setOrigin(.5,1);this.swimmingVisual?.setVisible(false);}
    this.isSwimming=false;
    this.sprite.setFrame(characterFrame(direction, walked ? phase : 0, this.walkFrames));
    this.sprite.setPosition(this.x, this.y).setDepth(this.y);
  }
}
