import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import type Phaser from 'phaser';
import manifest from '../public/assets/visual/village/celina/personagem.json';
import {CELINA_WALK_FRAMES,preloadCelinaSprites} from '../src/celina-sprites';
import {CHARACTER_DIRECTIONS} from '../src/character-directions';
describe('animação original do Celina',()=>{
 it('preserva os 72 PNGs recebidos, com oito passos e uma pose por direção',()=>{
  expect(manifest.originalPngs).toHaveLength(72);expect(manifest.walkFrames).toBe(CELINA_WALK_FRAMES);
  expect(manifest.southRepair.frames).toHaveLength(9);
  expect(createHash('sha256').update(readFileSync('public/assets/visual/village/celina/'+manifest.southRepair.file)).digest('hex')).toBe(manifest.southRepair.sha256);
  for(const f of manifest.originalPngs){const b=readFileSync('public/assets/visual/village/celina/'+f.file);expect(createHash('sha256').update(b).digest('hex')).toBe(f.sha256);expect(b.readUInt32BE(16)).toBe(f.width);expect(b.readUInt32BE(20)).toBe(f.height);}
 });
 it('carrega todas as poses existentes e reutiliza o atlas entre cenas',()=>{
  const files=new Map<string,string>();let cached=false;
  const scene={textures:{exists:()=>cached},load:{image:(key:string,file:string)=>files.set(key,file)}} as unknown as Phaser.Scene;
  preloadCelinaSprites(scene);expect(files.size).toBe((CHARACTER_DIRECTIONS.length-1)*(CELINA_WALK_FRAMES+1)+1);
  expect(files.has('celina-south-refinado')).toBe(true);
  for(const f of files.values())expect(()=>readFileSync('public/'+f)).not.toThrow();
  cached=true;files.clear();preloadCelinaSprites(scene);expect(files.size).toBe(0);
 });
});
