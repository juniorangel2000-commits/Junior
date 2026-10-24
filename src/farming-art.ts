import Phaser from 'phaser';
import type { CropData, TilePoint } from './types';
import { TILE } from './data/regions';

const soilNoise=(x:number,y:number,seed:number):number=>{
  const n=Math.imul(x+seed*31,374761393)^Math.imul(y+seed*17,668265263);
  return ((Math.imul(n^(n>>>13),1274126177)^(n>>>16))>>>0)/4294967296;
};

/** Dry clods and damp furrows share the same shape, grain and world footprint. */
export function drawPreparedSoil(scene: Phaser.Scene, points: readonly TilePoint[], crops: readonly CropData[]=[]): Phaser.GameObjects.Image[] {
  const cells = new Set(points.map(p => `${p.x},${p.y}`));
  const damp = new Set(crops.filter(c=>c.watered).map(c=>`${c.x},${c.y}`));
  return points.map(p => {
    const mask = [[0,-1],[1,0],[0,1],[-1,0]].reduce((n,[dx,dy],i) => n | (cells.has(`${p.x+dx},${p.y+dy}`) ? 1 << i : 0), 0);
    const variant = Math.abs(Math.imul(p.x, 73856093) ^ Math.imul(p.y, 19349663)) % 4;
    const wet=damp.has(`${p.x},${p.y}`);
    const key = `prepared-soil-v2:${wet?'wet':'dry'}:${mask}:${variant}`;
    if (!scene.textures.exists(key)) {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = TILE;
      const ctx = canvas.getContext('2d')!; ctx.imageSmoothingEnabled = false;
      if (scene.textures.exists('asset-ground-soil')) {
        const source = scene.textures.get('asset-ground-soil').getSourceImage() as HTMLCanvasElement;
        ctx.drawImage(source, variant % 3 * TILE, Math.floor(variant / 3) * TILE, TILE, TILE, 0, 0, TILE, TILE);
      } else { ctx.fillStyle = '#765436'; ctx.fillRect(0,0,TILE,TILE); }
      const earth=ctx.getImageData(0,0,TILE,TILE);
      for(let y=0;y<TILE;y++)for(let x=0;x<TILE;x++) {
        const i=(y*TILE+x)*4,noise=soilNoise(x,y,variant)*8-4;
        // Moist earth darkens into brown rather than becoming a square blue stain.
        const shade=wet?.66:1.06;
        for(let c=0;c<3;c++)earth.data[i+c]=earth.data[i+c]*shade+noise;
      }
      ctx.putImageData(earth,0,0);
      // Broken shallow channels avoid the old straight wooden-plank appearance.
      for(let row=0;row<3;row++)for(let x=2;x<30;x++) {
        if(soilNoise(Math.floor(x/3),row,variant+7)<.14)continue;
        const y=7+row*8+Math.round(Math.sin(x*.29+variant+row)*1.1);
        ctx.fillStyle=wet?'#392b22':'#60442d';ctx.fillRect(x,y,1,2);
        ctx.fillStyle=wet?'#735437':'#a17b4e';ctx.fillRect(x,y+2,1,1);
      }
      for(let i=0;i<27;i++) {
        const x=2+Math.floor(soilNoise(i,1,variant+11)*28),y=2+Math.floor(soilNoise(i,2,variant+11)*28);
        ctx.fillStyle=wet?(i%3?'#59402b':'#80613e'):(i%3?'#87613c':'#b48b57');
        ctx.fillRect(x,y,i%4===0?2:1,1);
        if(wet&&i%9===0){ctx.fillStyle='#a48c66';ctx.fillRect(x,y,1,1);}
      }
      const pixels = ctx.getImageData(0,0,TILE,TILE);
      for (let y=0;y<TILE;y++) for (let x=0;x<TILE;x++) {
        const top = mask & 1 ? 0 : 2 + (Math.floor(x/3)+variant)%3;
        const right = mask & 2 ? 0 : 2 + (Math.floor(y/4)+variant)%3;
        const bottom = mask & 4 ? 0 : 2 + (Math.floor(x/4)+variant)%3;
        const left = mask & 8 ? 0 : 2 + (Math.floor(y/3)+variant)%3;
        if (x < left || x >= TILE-right || y < top || y >= TILE-bottom) pixels.data[(y*TILE+x)*4+3]=0;
      }
      ctx.putImageData(pixels,0,0);
      scene.textures.addCanvas(key,canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    return scene.add.image(p.x*TILE,p.y*TILE,key).setOrigin(0).setDepth(-50);
  });
}
