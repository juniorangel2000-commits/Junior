import { describe, expect, it } from 'vitest';
import { forestGroundPixels } from '../src/forest-ground';

describe('forest terrain composition',()=>{
  it('restores the forest floor through the old southern path including the map edge',()=>{
    expect(forestGroundPixels(undefined,48*32+16,71*32+16,1)).toEqual(forestGroundPixels(undefined,55*32+16,71*32+16,1));
  });
  it('adds a sandy bank around the lake while keeping the middle as water',()=>{
    const sample=(x:number,y:number)=>forestGroundPixels(undefined,Math.floor((x+.5)*32),Math.floor((y+.5)*32),1);
    const shore=sample(54,24),inland=sample(54,28),water=sample(54,16);
    expect(shore[0]).toBeGreaterThan(inland[0]+30);
    expect(water[2]).toBeGreaterThan(water[0]);
  });

  it('uses world coordinates so neighboring chunks match a single larger bake',()=>{
    const whole=forestGroundPixels(undefined,640,1056,64);
    const right=forestGroundPixels(undefined,672,1056,32);
    for(let y=0;y<32;y++){
      expect(right.slice(y*32*4,(y+1)*32*4)).toEqual(whole.slice((y*64+32)*4,(y*64+64)*4));
    }
  });
  it('keeps every pixel opaque, including odd-sized chunks',()=>{
    const pixels=forestGroundPixels(undefined,0,0,17);
    for(let i=3;i<pixels.length;i+=4)expect(pixels[i]).toBe(255);
  });
  it('recreates identical borders when revisiting an area',()=>{
    const first=forestGroundPixels(undefined,640,1056,32);
    forestGroundPixels(undefined,2048,512,32);
    expect(forestGroundPixels(undefined,640,1056,32)).toEqual(first);
  });
});
