import {describe,it,expect,vi} from 'vitest';
import type Phaser from 'phaser';
import {Player,PLAYER_SPEED,PLAYER_RUN_MULTIPLIER} from '../src/player';
import {CHARACTERS,createCharacterProfile} from '../src/data/characters';
import {CHARACTER_DIRECTIONS,directionVector,characterFrame} from '../src/character-directions';
vi.mock('phaser',()=>({default:{}}));
vi.mock('../src/art',()=>({createCharacterFrames:(_scene:unknown,_profile:unknown,key:string)=>key}));
vi.mock('../src/swimming',()=>({SWIM_SPEED_FACTOR:.55,prepareSwimmingTextures:vi.fn(),SwimmingVisual:class{update(){}setVisible(){}}}));
function fixture(id:typeof CHARACTERS[number]['id']){
 const keys=Object.fromEntries('W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT'.split(',').map(k=>[k,{isDown:false}]));
 const sprite={setOrigin(){return this;},setCrop(){return this;},setDisplaySize(){return this;},setFrame:vi.fn().mockReturnThis(),setPosition:vi.fn().mockReturnThis(),setDepth(){return this;},setTexture:vi.fn().mockReturnThis()};
 const scene={add:{sprite:()=>sprite},input:{keyboard:{addKeys:()=>keys}}} as unknown as Phaser.Scene;
 return{player:new Player(scene,createCharacterProfile('Corredor',id),300,300),sprite,keys};
}
describe.each(CHARACTERS)('$label: Shift running',character=>{
 it.each(CHARACTER_DIRECTIONS)('runs with normalized movement and the supplied %s animation',direction=>{
  const{player,keys,sprite}=fixture(character.id),v=directionVector(direction);keys.SHIFT.isDown=true;
  if(v.x)keys[v.x>0?'D':'A'].isDown=true;if(v.y)keys[v.y>0?'S':'W'].isDown=true;
  player.update(.2,()=>false);
  expect(Math.hypot(player.x-300,player.y-300)).toBeCloseTo(PLAYER_SPEED*PLAYER_RUN_MULTIPLIER*.2);
  expect(player.isRunning).toBe(true);expect(sprite.setTexture).toHaveBeenCalledWith(`character-run-${character.id}`);
  const frame=sprite.setFrame.mock.lastCall![0],first=characterFrame(direction,0,character.runFrames);
  expect(frame).toBeGreaterThan(first);expect(frame).toBeLessThanOrEqual(first+character.runFrames);
 });
 it('returns to walking when Shift is released and to idle when movement stops',()=>{
  const{player,keys,sprite}=fixture(character.id);keys.D.isDown=keys.SHIFT.isDown=true;player.update(.2,()=>false);
  const before=player.x;keys.SHIFT.isDown=false;player.update(.2,()=>false);
  expect(player.x-before).toBeCloseTo(PLAYER_SPEED*.2);expect(player.isRunning).toBe(false);expect(sprite.setTexture).toHaveBeenLastCalledWith('player');
  keys.SHIFT.isDown=true;keys.D.isDown=false;player.update(.2,()=>false);expect(player.isRunning).toBe(false);
  expect(sprite.setFrame).toHaveBeenLastCalledWith(characterFrame('right',0,character.walkFrames));
 });
 it('keeps collision substeps and cannot sprint through a wall',()=>{
  const{player,keys}=fixture(character.id);keys.D.isDown=keys.SHIFT.isDown=true;
  player.update(1,()=>false,(x)=>x>=350);expect(player.x).toBeCloseTo(343,1);expect(player.x).toBeLessThan(350);
 });
 it('does not accelerate swimming and preserves existing speed bonuses on land',()=>{
  const wet=fixture(character.id);wet.keys.D.isDown=wet.keys.SHIFT.isDown=true;wet.player.update(.2,()=>false,undefined,true,()=>1);
  expect(wet.player.x-300).toBeCloseTo(PLAYER_SPEED*.55*.2);expect(wet.player.isRunning).toBe(false);expect(wet.player.isSwimming).toBe(true);
  const dry=fixture(character.id);dry.keys.D.isDown=dry.keys.SHIFT.isDown=true;dry.player.speedMultiplier=1.2;dry.player.update(.2,()=>false);
  expect(dry.player.x-300).toBeCloseTo(PLAYER_SPEED*1.2*PLAYER_RUN_MULTIPLIER*.2);
 });
});
