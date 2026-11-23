import {describe,expect,it} from 'vitest';
import {workDirection} from '../src/character-directions';
import {mineDarkness} from '../src/systems/underground-light';

describe('direção de trabalho e escuridão da mina (preview.48)',()=>{
 it('rocha ao lado e um pouco acima dos pés continua sendo "ao lado"',()=>{
  expect(workDirection(-24,-6)).toBe('left');
  expect(workDirection(24,-10)).toBe('right');
  expect(workDirection(3,-26)).toBe('up');
  expect(workDirection(-4,20)).toBe('down');
 });
 it('sem lampião, as galerias profundas ficam quase cegas',()=>{
  const deep=mineDarkness(40*32,false),lit=mineDarkness(40*32,true);
  expect(deep.alpha).toBeGreaterThan(.95);
  expect(deep.radius).toBeLessThan(45);
  expect(lit.radius).toBeGreaterThan(deep.radius*3);
 });
});
