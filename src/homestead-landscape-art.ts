import {reusableTerrainTexture} from './terrain-texture-cache';
import type Phaser from 'phaser';
import type {PetShelterData} from './systems/pet-shelter';
import {homesteadPetPath,mountainLayout} from './data/homestead-landscape';
export function drawHomesteadLandscape(scene:Phaser.Scene,site:PetShelterData,cliff:boolean,blocked:(x:number,y:number)=>boolean, signature:unknown=[]):void{
 if(cliff&&scene.textures.exists('homestead-mossy-cliff')){
  const texture=scene.textures.get('homestead-mossy-cliff');
  if(!texture.has('landscape'))texture.add('landscape',0,42,120,1742,645);
  const plan=mountainLayout(site);
  scene.add.image(plan.x,plan.baseY,'homestead-mossy-cliff','landscape').setOrigin(.5,1).setScale(plan.width/1742).setDepth(plan.baseY).setData('homestead-mountain',true);
 }
 const points=homesteadPetPath(site),key=`homestead-pet-path-v3-${site.x}-${site.y}`;
 const left=Math.floor(Math.min(...points.map(p=>p.x))-22),top=Math.floor(Math.min(...points.map(p=>p.y))-22);
 const width=Math.ceil(Math.max(...points.map(p=>p.x))-left+22),height=Math.ceil(Math.max(...points.map(p=>p.y))-top+22);
 if(!reusableTerrainTexture(scene.textures,key,signature)){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d')!;
  const noise=(x:number,y:number)=>((Math.imul(x,374761393)^Math.imul(y,668265263))>>>0)/4294967295;
  for(let y=0;y<height;y+=2)for(let x=0;x<width;x+=2){
   const wx=left+x,wy=top+y;let d2=Infinity,nearest=0;
   for(let i=0;i<points.length;i++){
    const dx=wx-points[i].x,dy=wy-points[i].y,dist=dx*dx+dy*dy;
    if(dist<d2){d2=dist;nearest=i;}
   }
   const grain=noise(wx,wy),patch=noise(Math.floor(wx/10),Math.floor(wy/10));
   const radius=9+Math.sin(nearest*.19)*1.6+(patch-.5)*3;
   const distance=Math.sqrt(d2),edge=radius+5-distance;
   if(edge<=0||blocked(wx,wy))continue;
   const center=Math.max(0,Math.min(1,(radius-distance)/radius));
   let alpha=Math.min(.76,edge/8)*(.52+grain*.42);
   if(distance>radius-2&&patch>.64)alpha*=.12;
   const shade=Math.round((grain-.5)*24+(patch-.5)*12+center*5);
   ctx.fillStyle=`rgba(${153+shade},${126+shade},${82+shade},${alpha})`;
   ctx.fillRect(x,y,2,2);
   if(center>.2&&grain>.985){ctx.fillStyle='rgba(190,174,137,.65)';ctx.fillRect(x,y,2,1);}
  }
  scene.textures.addCanvas(key,canvas)?.setFilter(0);
 }
 scene.add.image(left,top,key).setOrigin(0).setDepth(-2).setData('homestead-pet-path',true);
}
