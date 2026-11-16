import {it,expect} from 'vitest';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {ANIMAL_ART,animalFrame,animalColumns,beeFlightFrame,PREPARED_ANIMAL_KINDS} from '../src/data/animal-art';
import {CHARACTER_DIRECTIONS} from '../src/character-directions';
import {AnimalWalkCycle} from '../src/systems/animal-animation';
import {preloadAnimalSprites} from '../src/animal-sprites';
import type Phaser from 'phaser';
it.each(['pig','duck','rabbit','deer','bee'] as const)('%s: atlas compacto preserva fonte, oito direções e todos os recortes',kind=>{
 const dir=`public/assets/animals/${kind}`,raw=fs.readFileSync(`${dir}/source.png`),atlas=JSON.parse(fs.readFileSync(`${dir}/atlas.json`,'utf8')),png=fs.readFileSync(`${dir}/atlas.png`);
 expect(atlas.sha256).toBe(createHash('sha256').update(raw).digest('hex'));expect(atlas.frames).toHaveLength(40);expect(atlas.directions).toEqual([...CHARACTER_DIRECTIONS]);expect(animalColumns(kind)).toBe(5);
 expect(png.readUInt32BE(16)).toBe(atlas.cell*5);expect(png.readUInt32BE(20)).toBe(atlas.cell*8);
 for(const f of atlas.frames){expect(f.x).toBeGreaterThanOrEqual(0);expect(f.y).toBeGreaterThanOrEqual(0);expect(f.x+f.source.width).toBeLessThanOrEqual(atlas.cell);expect(f.y+f.source.height).toBeLessThanOrEqual(atlas.cell);}
 for(const[row,direction]of CHARACTER_DIRECTIONS.entries()){
  expect(animalFrame(kind,direction,false,0)).toBe(row*5);const cycle=new AnimalWalkCycle(kind),frames=new Set<number>();let distance=0;
  for(let i=0;i<100;i++){distance+=1.4;cycle.advance(.04,true,distance);frames.add(cycle.frame(direction));}expect([...frames].every(f=>f>row*5&&f<row*5+5)).toBe(true);expect(frames.size).toBe(4);
  cycle.advance(.1,false,distance);cycle.advance(.1,false,distance);expect(cycle.frame(direction)).toBe(row*5);
 }
});
it('os animais pequenos mantêm escala menor que a da vaca e a abelha anima asas sem passos',()=>{
 for(const kind of ['duck','rabbit','bee'] as const)expect(ANIMAL_ART[kind].scale).toBeLessThan(ANIMAL_ART.cow.scale);
 for(const[row,direction]of CHARACTER_DIRECTIONS.entries())expect(new Set(Array.from({length:100},(_,i)=>beeFlightFrame(direction,i/60)))).toEqual(new Set([1,2,3,4].map(f=>row*5+f)));
});
it('não carrega porco e abelha sem uso, mas inclui os animais presentes e aceita pré-carregamento explícito',()=>{
 const loaded:string[]=[],files:string[]=[],scene={textures:{exists:()=>false},load:{atlas:(key:string,png:string,json:string)=>{loaded.push(key);files.push(png,json);}}} as unknown as Phaser.Scene;
 preloadAnimalSprites(scene);expect(loaded).toContain('animal-duck-animated');expect(loaded).toContain('animal-rabbit-animated');expect(loaded).toContain('animal-deer-animated');
 for(const kind of PREPARED_ANIMAL_KINDS)expect(loaded).not.toContain(`animal-${kind}-animated`);
 preloadAnimalSprites(scene,PREPARED_ANIMAL_KINDS);for(const kind of PREPARED_ANIMAL_KINDS)expect(loaded).toContain(`animal-${kind}-animated`);
 // O jogo carrega o atlas compactado (scripts/pack_animal_atlases.py), não o atlas.png original.
 expect(files.every(f=>/atlas-packed\.(png|json)$/.test(f))).toBe(true);
});
