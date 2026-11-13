import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createNewSave,migrateSave,validateSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {FIELDS_ANIMALS,fieldsBlocked} from '../src/data/open-fields';
import {AnimalBrain} from '../src/systems/animals';
import {ANIMAL_ART,animalFrame} from '../src/data/animal-art';
import {CHARACTER_DIRECTIONS} from '../src/character-directions';
describe('cavalo fornecido nos Campos Abertos',()=>{
 it('preserva os 308 PNGs fornecidos e todas as direções sem recortes',()=>{const base='public/assets/animals/horse',a=JSON.parse(fs.readFileSync(base+'/atlas.json','utf8'));expect(a.cell).toBe(ANIMAL_ART.horse.cell);expect(a.frames).toHaveLength(308);for(const f of a.frames){expect(createHash('sha256').update(fs.readFileSync(base+'/'+f.file)).digest('hex')).toBe(f.sha256);expect(f.x).toBeGreaterThanOrEqual(0);expect(f.y).toBeGreaterThanOrEqual(0);expect(f.x+f.width).toBeLessThanOrEqual(a.cell);expect(f.y+f.height).toBeLessThanOrEqual(a.cell);}for(const [i,d]of CHARACTER_DIRECTIONS.entries()){expect(animalFrame('horse',d,false,0)).toBe(i*9);expect(new Set(Array.from({length:8},(_,n)=>animalFrame('horse',d,true,n*ANIMAL_ART.horse.stride/8))).size).toBe(8);}});
 it('nasce em terra livre, anda sem atravessar obstáculos e persiste sem duplicar',()=>{const defs=FIELDS_ANIMALS.filter(a=>a.kind==='horse');expect(defs).toHaveLength(1);const p=defs[0],a=new AnimalBrain(p.id,p.kind,p.x,p.y,true,(x,y)=>fieldsBlocked(x*32+16,y*32+16),84,()=>0,fieldsBlocked);expect(a.radius).toBe(18);expect(a.canStand(a.x,a.y)).toBe(true);for(let t=0;t<160;t++){const before={x:a.x,y:a.y};a.update(.1,{x:p.x+50,y:p.y+50},[a]);expect(a.canStand(a.x,a.y)).toBe(true);expect(Math.hypot(a.x-before.x,a.y-before.y)).toBeLessThan(19);}const s=createNewSave(createCharacterProfile('Cavalo'));s.activeArea='openFields';s.openFields={version:1,cut:{},animals:[a.snapshot()]};expect(validateSave(s)).toBe(true);const loaded=migrateSave(s)!;expect(loaded.openFields!.animals).toEqual([a.snapshot()]);expect(FIELDS_ANIMALS.filter(d=>d.id===p.id)).toHaveLength(1);const old=createNewSave(createCharacterProfile('Antes'));old.activeArea='openFields';old.openFields={version:1,cut:{},animals:[]};expect(validateSave(migrateSave(old))).toBe(true);});
});
