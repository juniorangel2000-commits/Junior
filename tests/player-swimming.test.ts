import {describe,it,expect,vi} from 'vitest';
import type Phaser from 'phaser';
import {Player,PLAYER_SPEED} from '../src/player';
import {createCharacterProfile} from '../src/data/characters';
vi.mock('phaser',()=>({default:{}}));
vi.mock('../src/art',()=>({createCharacterFrames:()=> 'player'}));
vi.mock('../src/swimming',()=>({SWIM_SPEED_FACTOR:.55,SwimmingVisual:class {update(){}setVisible(){}}}));
function fixture(){
 const keys=Object.fromEntries('W,A,S,D,UP,DOWN,LEFT,RIGHT'.split(',').map(k=>[k,{isDown:false}]));
 const sprite={setOrigin(){return this;},setDisplaySize(){return this;},setFrame(){return this;},setPosition(){return this;},setDepth(){return this;},setTexture:vi.fn().mockReturnThis()};
 const scene={add:{sprite:()=>sprite},input:{keyboard:{addKeys:()=>keys}}} as unknown as Phaser.Scene;
 return {player:new Player(scene,createCharacterProfile('Swim','farmer-female'),100,100),keys,sprite};
}
describe('swimming movement',()=>{
 it.each([['D'],['D','S'],['A','W']])('normalizes %j in water without the diagonal speed boost',(...held)=>{
   const {player,keys}=fixture();held.forEach(k=>keys[k].isDown=true);
   for(let i=0;i<10;i++)player.update(.1,()=>false,undefined,true,()=>true);
   expect(Math.hypot(player.x-100,player.y-100)).toBeCloseTo(PLAYER_SPEED*.55,6);expect(player.isSwimming).toBe(true);
 });
 it('returns to walking on the shore and restores the walk texture',()=>{
   const {player,keys,sprite}=fixture();keys.D.isDown=true;
   player.update(.1,()=>false,undefined,true,()=>true);expect(player.isSwimming).toBe(true);
   const before=player.x;player.update(.1,()=>false,undefined,true,()=>false);
   expect(player.x-before).toBeCloseTo(PLAYER_SPEED*.1);expect(player.isSwimming).toBe(false);expect(sprite.setTexture).toHaveBeenCalledWith('player');
 });
 it('keeps rock collision and pauses movement while floating',()=>{
   const {player,keys}=fixture();keys.D.isDown=true;
   for(let i=0;i<30;i++)player.update(.1,(x)=>x>=5,undefined,true,()=>true);
   expect(player.x).toBeLessThanOrEqual(5*32-7);const before=player.x;
   player.update(.3,()=>false,undefined,false,()=>true);expect(player.x).toBe(before);expect(player.isSwimming).toBe(true);
 });
});
