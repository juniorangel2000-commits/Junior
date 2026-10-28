import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import type Phaser from 'phaser';
import manifest from '../public/assets/visual/village/icaro/personagem.json';
import {ICARO_WALK_FRAMES,preloadIcaroSprites} from '../src/icaro-sprites';
import {CHARACTER_DIRECTIONS} from '../src/character-directions';
describe('animação original do Icaro',()=>{
 it('preserva os PNGs recebidos, com seis passos e uma pose por direção',()=>{
  expect(manifest.originalPngs).toHaveLength(62);expect(manifest.walkFrames).toBe(ICARO_WALK_FRAMES);
  expect(manifest.southRepair.frames).toHaveLength(7);
  expect(createHash('sha256').update(readFileSync('public/assets/visual/village/icaro/'+manifest.southRepair.file)).digest('hex')).toBe(manifest.southRepair.sha256);
  for(const f of manifest.originalPngs){const b=readFileSync('public/assets/visual/village/icaro/'+f.file);expect(createHash('sha256').update(b).digest('hex')).toBe(f.sha256);expect(b.readUInt32BE(16)).toBe(f.width);expect(b.readUInt32BE(20)).toBe(f.height);}
 });
 it('carrega todas as poses existentes e reutiliza o atlas entre cenas',()=>{
  const files=new Map<string,string>();let cached=false;
  const scene={textures:{exists:()=>cached},load:{image:(key:string,file:string)=>files.set(key,file)}} as unknown as Phaser.Scene;
  preloadIcaroSprites(scene);expect(files.size).toBe((CHARACTER_DIRECTIONS.length-1)*(ICARO_WALK_FRAMES+1)+1);
  expect(files.has('icaro-south-refinado')).toBe(true);
  for(const f of files.values())expect(()=>readFileSync('public/'+f)).not.toThrow();
  cached=true;files.clear();preloadIcaroSprites(scene);expect(files.size).toBe(0);
 });
});
