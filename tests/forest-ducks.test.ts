import {it,expect} from 'vitest';
import {createForestDuck,duckHabitatBlocked,FOREST_DUCK_SPAWNS} from '../src/systems/forest-ducks';
import {forestWaterDistanceAt} from '../src/data/ancient-forest';
import {createFieldAnimalBrain} from '../src/systems/open-fields';
import {FIELDS_ANIMALS,fieldsSafe} from '../src/data/open-fields';
const water=(x:number,y:number)=>x>400&&x<800&&y>300&&y<700;
it('nasce no lago e não ignora sólidos nem sai para o interior da floresta',()=>{
 const solid=(x:number,y:number)=>x>560&&x<592&&y>400&&y<600,duck=createForestDuck('duck',480,500,water,solid)!;expect(duck).toBeDefined();
 for(let t=0;t<300;t++){duck.update(.1,{x:430,y:520},[duck]);expect(duck.canStand(duck.x,duck.y)).toBe(true);expect(duckHabitatBlocked(duck.x,duck.y,water,solid)).toBe(false);}
 expect(duckHabitatBlocked(100,100,water,solid)).toBe(true);expect(duckHabitatBlocked(575,500,water,solid)).toBe(true);
});
it('entra na água a partir da margem por movimento contínuo ao fugir do jogador',()=>{
 // Ponto mais distante da água em que o pato ainda pode ficar (faixa da margem).
 const duck=createForestDuck('duck-shore',480,500,water,()=>false)!,shore=[...Array(40).keys()].map(i=>360+i).find(x=>!water(x,500)&&duck.canStand(x,500))!;
 expect(shore).toBeDefined();expect(water(shore,500)).toBe(false);duck.x=shore;duck.y=500;let entered=false;
 // O jogador está em terra, fora do habitat do pato: ele precisa notar mesmo assim.
 expect(duck.lineClear(duck,{x:280,y:500})).toBe(false);expect(duck.canSee(duck,{x:280,y:500})).toBe(true);
 for(let t=0;t<180;t++){const previous={x:duck.x,y:duck.y};duck.update(.1,{x:280,y:500},[duck]);expect(Math.hypot(duck.x-previous.x,duck.y-previous.y)).toBeLessThanOrEqual(8);entered ||= water(duck.x,duck.y);}
 expect(entered).toBe(true);
});
it('as posições iniciais pertencem ao lago real e o habitat removido não força um pato em terra',()=>{
 for(const p of FOREST_DUCK_SPAWNS)expect(forestWaterDistanceAt(p.x,p.y)).toBeLessThan(0);
 expect(createForestDuck('no-water',480,500,()=>false,()=>false)).toBeUndefined();
});
it('animais soltos dos Campos fogem da aproximação; cavalo com raio zero continua dócil',()=>{
 for(const d of FIELDS_ANIMALS){const a=createFieldAnimalBrain(d,d);expect(a.wild).toBe(true);const player=[{x:a.x-90,y:a.y},{x:a.x+90,y:a.y},{x:a.x,y:a.y-90},{x:a.x,y:a.y+90}].find(p=>fieldsSafe(p)&&a.lineClear(a,p))!;expect(player).toBeDefined();
  const distance=Math.hypot(a.x-player.x,a.y-player.y);for(let t=0;t<20;t++)a.update(.05,player,[a]);expect(a.mode,d.id).toBe('flee');expect(Math.hypot(a.x-player.x,a.y-player.y),d.id).toBeGreaterThan(distance);
 }
 const d=FIELDS_ANIMALS.find(d=>d.kind==='horse')!,horse=createFieldAnimalBrain(d,d);horse.fleeRadius=0;horse.update(.1,{x:horse.x-50,y:horse.y},[horse]);expect(horse.mode).not.toBe('flee');
});
