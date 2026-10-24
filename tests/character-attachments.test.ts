import {describe,it,expect} from 'vitest';
import {CHARACTERS} from '../src/data/characters';
import {characterLeftHand} from '../src/character-attachments';
import leftHands from '../src/data/character-left-hand.json';
import {characterFrame,CHARACTER_DIRECTIONS} from '../src/character-directions';

const sprite={x:500,y:600,scaleX:.25,scaleY:.25,displayOriginX:96,displayOriginY:256,rotation:0};
describe('anatomical left hand attachment',()=>{
 it.each(CHARACTERS)('$label: keeps the left hand on the correct side in front and back views',character=>{
  const data=leftHands[character.id];expect(data).toHaveLength(8*(character.walkFrames+1));
  const front=characterLeftHand({characterId:character.id},characterFrame('down',0,character.walkFrames),sprite);
  const back=characterLeftHand({characterId:character.id},characterFrame('up',0,character.walkFrames),sprite);
  expect(front.x).toBeGreaterThan(sprite.x);expect(back.x).toBeLessThan(sprite.x);
  for(const [x,y] of data){expect(x).toBeGreaterThan(55);expect(x).toBeLessThan(200);expect(y).toBeGreaterThan(125);expect(y).toBeLessThan(190);}
 });
 it.each(CHARACTERS)('$label: follows the hand through every supplied walk pose and all eight directions',character=>{
  for(const direction of CHARACTER_DIRECTIONS){
   const positions=[];
   for(let phase=0;phase<=character.walkFrames;phase++){
    const frame=characterFrame(direction,phase,character.walkFrames),point=characterLeftHand({characterId:character.id},frame,sprite),[x,y]=leftHands[character.id][frame];
    expect(point.x).toBe(500+(x-character.originX)/4);
    expect(point.y).toBe(600+(y-character.originY-12)/4);
    positions.push(`${point.x},${point.y}`);
   }
   expect(new Set(positions).size).toBeGreaterThan(2);
  }
 });
 it('respects sprite translation, scale and rotation without depending on camera zoom',()=>{
  const profile={characterId:'farmer-female' as const},point=characterLeftHand(profile,0,sprite);
  const scaled=characterLeftHand(profile,0,{...sprite,x:100,y:200,scaleX:.5,scaleY:.5});
  expect(scaled.x-100).toBe((point.x-500)*2);expect(scaled.y-200).toBe((point.y-600)*2);
  const rotated=characterLeftHand(profile,0,{...sprite,rotation:Math.PI/2});
  expect(rotated.x-500).toBeCloseTo(-(point.y-600));expect(rotated.y-600).toBeCloseTo(point.x-500);
  expect(characterLeftHand({},0,sprite)).toEqual(point);
 });
});
