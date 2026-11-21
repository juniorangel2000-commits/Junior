import {describe,it,expect} from 'vitest';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const require=createRequire(import.meta.url);
const sharp=require('sharp');
const {compressPng,compressDistribution,isPng,isWebp}=require('../scripts/compress-distribution.cjs');

/** Pixel art de teste: quadrados opacos, meia transparência e área transparente. */
async function samplePng(){
 const w=64,h=64,raw=Buffer.alloc(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(x<32){raw[i]=(x*8)&255;raw[i+1]=(y*4)&255;raw[i+2]=120;raw[i+3]=y<32?255:128;}else{raw[i]=200;raw[i+1]=10;raw[i+2]=30;raw[i+3]=0;}}
 return sharp(raw,{raw:{width:w,height:h,channels:4}}).png({compressionLevel:0}).toBuffer();
}
const visible=(px:Buffer)=>{const out:number[]=[];for(let i=0;i<px.length;i+=4)out.push(px[i+3],...(px[i+3]?[px[i],px[i+1],px[i+2]]:[]));return out;};

describe('compressão das imagens da distribuição',()=>{
 it('troca o PNG por WebP sem perda, com os mesmos pixels visíveis',async()=>{
  const png=await samplePng(),out=await compressPng(sharp,png);
  expect(isPng(png)).toBe(true);expect(out).toBeDefined();expect(isWebp(out)).toBe(true);expect(out.length).toBeLessThan(png.length);
  const a=await sharp(png).ensureAlpha().raw().toBuffer(),b=await sharp(out).ensureAlpha().raw().toBuffer();
  expect(visible(b)).toEqual(visible(a));
 });
 it('mantém o arquivo quando não é PNG ou tem 16 bits por canal',async()=>{
  expect(await compressPng(sharp,Buffer.from('nao e imagem'))).toBeUndefined();
  const deep=await sharp(Buffer.alloc(8*8*4,90),{raw:{width:8,height:8,channels:4}}).toColourspace('rgb16').png().toBuffer();
  expect(await compressPng(sharp,deep)).toBeUndefined();
 });
 it('percorre a pasta, mantém os nomes .png e não toca em outros arquivos',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dist-'));fs.mkdirSync(path.join(dir,'a/b'),{recursive:true});
  fs.writeFileSync(path.join(dir,'a/b/x.png'),await samplePng());fs.writeFileSync(path.join(dir,'a/dados.json'),'{"ok":1}');
  const r=await compressDistribution(dir,{effort:1,concurrency:1});
  expect(r).toMatchObject({files:1,converted:1});expect(r.after).toBeLessThan(r.before);
  expect(isWebp(fs.readFileSync(path.join(dir,'a/b/x.png')))).toBe(true);expect(fs.readFileSync(path.join(dir,'a/dados.json'),'utf8')).toBe('{"ok":1}');
  // Rodar de novo não estraga nada: o arquivo já é WebP e fica como está.
  expect(await compressDistribution(dir,{effort:1,concurrency:1})).toMatchObject({files:1,converted:0});
  fs.rmSync(dir,{recursive:true});
 });
});
