import {describe, it, expect} from 'vitest';
import {bodyVisibility} from '../src/swimming/underwater-appearance';
import {SWIMMING_CONFIG} from '../src/swimming/config';

describe('underwater visibility', () => {
  it('preserves the upper body and fades continuously from the waist to the feet', () => {
    const waist=180,feet=220;
    expect(bodyVisibility(130,waist,feet)).toBe(1);
    expect(bodyVisibility(waist,waist,feet)).toBe(1);
    let previous=1;
    for(let y=waist;y<=feet;y++){const value=bodyVisibility(y,waist,feet);expect(value).toBeLessThanOrEqual(previous);expect(value).toBeGreaterThanOrEqual(SWIMMING_CONFIG.footVisibility);previous=value;}
    expect(bodyVisibility(200,waist,feet)).toBeCloseTo(.5125);
  });
  it('keeps the entire feet almost invisible while preserving their geometry', () => {
    for(const y of [220,225,240,256]){
      const visible=bodyVisibility(y,180,220)*SWIMMING_CONFIG.bodyOpacity;
      expect(visible).toBeGreaterThan(0);expect(visible).toBeLessThan(.02);
    }
  });
  it('has no abrupt opacity band at the waist or the foot line', () => {
    expect(1-bodyVisibility(180.01,180,220)).toBeLessThan(.00001);
    expect(bodyVisibility(219.99,180,220)-SWIMMING_CONFIG.footVisibility).toBeLessThan(.00001);
  });
});
