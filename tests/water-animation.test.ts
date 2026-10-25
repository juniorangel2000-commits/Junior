import {describe,it,expect} from 'vitest';
import {WATER_ANIMATION,waterSurfaceAlpha,animatedWaterRGB} from '../src/data/water-animation';
describe('ondas suaves',()=>{
 it('fecha o ciclo sem salto e mantém os limites de opacidade',()=>{
   for(let y=0;y<64;y+=3)for(let x=0;x<64;x+=3){
     expect(waterSurfaceAlpha(0,x,y)).toBe(waterSurfaceAlpha(WATER_ANIMATION.frames,x,y));
     for(let f=0;f<WATER_ANIMATION.frames;f+=4){const a=waterSurfaceAlpha(f,x,y);expect(a).toBeGreaterThanOrEqual(0);expect(a).toBeLessThanOrEqual(80);}
   }
 });
 it('usa coordenadas globais para manter o padrão nas bordas entre células',()=>{
   for(let f=0;f<64;f+=5)for(let n=0;n<64;n++){
     expect(waterSurfaceAlpha(f,n,WATER_ANIMATION.period)).toBe(waterSurfaceAlpha(f,n,0));
     expect(waterSurfaceAlpha(f,WATER_ANIMATION.period,n)).toBe(waterSurfaceAlpha(f,0,n));
   }
 });
 it('muda gradualmente entre quadros, inclusive na virada da animação',()=>{
   let changed=false;
   for(let f=0;f<64;f++)for(let y=0;y<64;y+=8)for(let x=0;x<64;x+=8){
     const a=waterSurfaceAlpha(f,x,y),b=waterSurfaceAlpha(f+1,x,y);
     expect(Math.abs(a-b)).toBeLessThanOrEqual(18);changed ||=a!==b;
   }
   expect(changed).toBe(true);
 });
 it('move a própria textura, preserva a continuidade entre células e fecha o ciclo',()=>{
   const size=WATER_ANIMATION.period,pixels=new Uint8ClampedArray(size*size*4);
   for(let y=0;y<size;y++)for(let x=0;x<size;x++)pixels.set([60+x,100+y,140,255],(y*size+x)*4);
   const source={size,pixels};
   expect(animatedWaterRGB(0,40,40,source)).not.toEqual(animatedWaterRGB(16,40,40,source));
   expect(animatedWaterRGB(0,40,40,source)).toEqual(animatedWaterRGB(64,40,40,source));
   expect(animatedWaterRGB(16,40,40,source)).toEqual(animatedWaterRGB(16,40+size,40,source));
   const left=animatedWaterRGB(17,31.999,48,source),right=animatedWaterRGB(17,32.001,48,source);
   left.forEach((v,i)=>expect(Math.abs(v-right[i])).toBeLessThanOrEqual(1));
 });
});
