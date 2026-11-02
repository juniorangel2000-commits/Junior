import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {bakeHighlandGround,GROUND_SECTIONS,type GroundPixels,type GroundSections} from '../src/highland-ground-detail';
import metadata from '../public/assets/visual/highland/ground-detailed.json';
function pixels(width:number,height:number,rgb:readonly number[]):GroundPixels {
 const data=new Uint8ClampedArray(width*height*4);for(let i=0;i<data.length;i+=4)data.set([...rgb,255],i);return{width,height,data};
}
function sections(rgb:readonly number[]):GroundSections{return Object.fromEntries(GROUND_SECTIONS.map(name=>[name,pixels(18,18,rgb)])) as GroundSections;}
describe('redrawn highland terrain composition',()=>{
 it('uses the authored ground while keeping the complete canonical water mask at twice the resolution',()=>{
  const base=pixels(32,32,[170,130,70]),rows=Array.from({length:32},(_,y)=>y>6&&y<25?[[14,18]]:[]),result=bakeHighlandGround(base,sections([80,130,50]),rows);
  expect([result.width,result.height]).toEqual([64,64]);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
   const i=(y*64+x)*4,water=x>=28&&x<36&&y>=14&&y<50;
   expect(result.data[i+3]).toBe(water?0:255);if(!water)expect([...result.data.slice(i,i+3)]).toEqual([80,130,50]);
  }
 });
 it('fits redrawn riverbanks to the collision contour without exposing static water on solid land',()=>{
  const tiles=sections([100,130,50]);GROUND_SECTIONS.forEach((name,n)=>{
   const p=tiles[name];for(let y=0;y<18;y++)for(let x=0;x<18;x++)if(n%2?x<4:x>=14)p.data.set([10,90,95,255],(y*18+x)*4);
  });
  const result=bakeHighlandGround(pixels(32,32,[170,130,70]),tiles,Array.from({length:32},()=>[[15,17]]));
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
   const i=(y*64+x)*4;if(result.data[i+3])expect([...result.data.slice(i,i+3)]).toEqual([100,130,50]);
  }
 });
 it('binds the shipped texture to all four authored sections and the unchanged layout/shoreline',()=>{
  const hash=(file:string)=>createHash('sha256').update(readFileSync(file)).digest('hex'),root='public/assets/visual/highland/';
  expect(metadata.baseSha256).toBe(hash(root+'terrain.png'));for(const name of GROUND_SECTIONS)expect(metadata.sectionsSha256[name]).toBe(hash(root+'terrain-sections/'+name+'.png'));
  expect(metadata.shoreSha256).toBe(hash('src/data/highland-river-contour.json'));expect(metadata.recipeSha256).toBe(hash('src/highland-ground-detail.ts'));expect(metadata.sha256).toBe(hash(root+'ground-detailed.png'));
  const png=readFileSync(root+'ground-detailed.png');expect([png.readUInt32BE(16),png.readUInt32BE(20)]).toEqual([3072,2048]);expect(metadata.scale).toBe(2);
 });
});
