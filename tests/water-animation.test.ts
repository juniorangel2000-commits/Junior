import {describe,it,expect} from 'vitest';
import {WATER_ANIMATION,waterSurfaceAlpha} from '../src/data/water-animation';
describe('ondas suaves',()=>{
 it('fecha o ciclo sem salto e mantém os limites de opacidade',()=>{
   for(let y=0;y<64;y+=3)for(let x=0;x<64;x+=3){
     expect(waterSurfaceAlpha(0,x,y)).toBe(waterSurfaceAlpha(WATER_ANIMATION.frames,x,y));
     for(let f=0;f<WATER_ANIMATION.frames;f+=4){const a=waterSurfaceAlpha(f,x,y);expect(a).toBeGreaterThanOrEqual(0);expect(a).toBeLessThanOrEqual(35);}
   }
 });
 it('usa coordenadas globais para manter o padrão nas bordas entre células',()=>{
   for(let f=0;f<64;f+=5)for(let n=0;n<64;n++){
     expect(waterSurfaceAlpha(f,n,64)).toBe(waterSurfaceAlpha(f,n,0));
     expect(waterSurfaceAlpha(f,64,n)).toBe(waterSurfaceAlpha(f,0,n));
   }
 });
 it('muda gradualmente entre quadros, inclusive na virada da animação',()=>{
   let changed=false;
   for(let f=0;f<64;f++)for(let y=0;y<64;y+=8)for(let x=0;x<64;x+=8){
     const a=waterSurfaceAlpha(f,x,y),b=waterSurfaceAlpha(f+1,x,y);
     expect(Math.abs(a-b)).toBeLessThanOrEqual(8);changed ||=a!==b;
   }
   expect(changed).toBe(true);
 });
});
