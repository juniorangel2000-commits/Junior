import {describe,it,expect} from 'vitest';
import {createNewSave} from '../src/systems/save';
import {createCharacterProfile} from '../src/data/characters';
import {survivorActivity,survivorHome,SURVIVOR_DAY} from '../src/systems/property-survivors';
import {weatherForDay} from '../src/weather-model';
import {HOME_ENTRANCE_WORLD} from '../src/systems/home';

const sunny=()=>{for(let d=2;d<60;d++)if(weatherForDay(d)==='clear')return d;throw new Error();};
const rainy=()=>{for(let d=2;d<60;d++)if(weatherForDay(d)==='rain')return d;throw new Error();};
const save=()=>{const s=createNewSave(createCharacterProfile('Amiga'));s.villageSurvivors=['marina','rui'];s.day=sunny();return s;};

describe('Marina e Rui na propriedade',()=>{
 it('ficam em casa à noite e aparecem de manhã',()=>{
  const s=save();
  for(const time of [0,6*60,SURVIVOR_DAY.sleep,23*60]){s.time=time;for(const id of ['marina','rui'] as const){const a=survivorActivity(id,s);expect(a.visible).toBe(false);expect(a.task).toBe('inside');expect(Math.abs(a.point.x-HOME_ENTRANCE_WORLD.x)).toBeLessThan(1);}}
  s.time=SURVIVOR_DAY.wake;expect(survivorActivity('marina',s).visible).toBe(true);
 });
 it('mudam de tarefa ao longo do dia e almoçam em frente de casa',()=>{
  const s=save(),tasks=new Set<string>();
  for(let t=7*60;t<20*60;t+=20){s.time=t;tasks.add(survivorActivity('marina',s).task);}
  expect(tasks.has('home')).toBe(true);expect(tasks.has('well')).toBe(true);expect(tasks.has('garden')).toBe(true);
  s.time=11*60+30;expect(survivorActivity('marina',s)).toMatchObject({task:'home',point:survivorHome(0)});
  s.time=12*60+30;expect(survivorActivity('rui',s)).toMatchObject({task:'home',point:survivorHome(1)});
 });
 it('cuidam das plantações e da bancada quando existem; sem elas, vão à horta',()=>{
  const s=save();s.time=8*60;s.crops=[];s.buildings=[];
  expect(survivorActivity('rui',s).task).toBe('garden');
  s.buildings=[{kind:'workbench',x:30,y:22}];expect(survivorActivity('rui',s)).toMatchObject({task:'workbench',point:{x:30.5*32,y:23.5*32}});
  s.time=7*60+5;expect(survivorActivity('marina',s).task).toBe('garden');
  s.crops=[{x:40,y:30} as never];expect(survivorActivity('marina',s)).toMatchObject({task:'crops',point:{x:40.5*32,y:31.5*32}});
 });
 it('com chuva ficam na varanda o dia todo, cada um com uma fala',()=>{
  const s=save();s.day=rainy();s.time=10*60;
  const m=survivorActivity('marina',s),r=survivorActivity('rui',s);
  expect(m.task).toBe('porch');expect(r.task).toBe('porch');expect(m.line).not.toBe(r.line);expect(m.point).not.toEqual(r.point);
 });
});
