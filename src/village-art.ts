import type Phaser from 'phaser';
import {VILLAGE_MERCHANT_IDS,type VillageMerchantId} from './data/village';

/** Small shop fittings are painted at their world pixel scale. The original
 * cottage facade remains untouched and supplies all architectural detail. */
export function setupVillageArt(scene:Phaser.Scene):void {
 const paint=(key:string,width:number,height:number,draw:(c:CanvasRenderingContext2D)=>void)=>{
  if(scene.textures.exists(key))return;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;draw(c);
  scene.textures.addCanvas(key,canvas)?.setFilter(0);
 };
 const colors:Record<VillageMerchantId,readonly [string,string,string]>={
  seeds:['#486a3b','#83a058','#d2c58a'],blacksmith:['#52686a','#859898','#d4cbb2'],carpenter:['#7e5239','#b1814f','#dfc797'],
  general:['#6e5134','#ab8750','#e1c68e'],herbalist:['#465a40','#759b64','#d5d8a3'],
  traveler:['#76513d','#b18a57','#ddd2a3'],tailor:['#6e4a60','#a77c9b','#e3c8c6'],
  fisher:['#3d6170','#6c9a9c','#d2dcc0'],inn:['#825e38','#c49b62','#e9d4a0'],mechanic:['#4c5b56','#8a9990','#d4cab0'],
 };
 for(const kind of VILLAGE_MERCHANT_IDS)paint(`village-shop-${kind}`,100,68,c=>{
  const p=(color:string,x:number,y:number,w:number,h:number)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  const [dark,light,cream]=colors[kind];
  p('#342d22',4,16,92,6);p('#6f4e30',7,18,5,48);p('#ab8050',8,19,2,46);
  p('#6f4e30',88,18,5,48);p('#b08b56',89,19,2,46);
  for(let row=0;row<4;row++){p(dark,10-row*2,4+row*4,80+row*4,5);p(light,11-row*2,4+row*4,78+row*4,2);}
  for(let stripe=0;stripe<8;stripe++)p(stripe%2?cream:light,6+stripe*11,19,11,7);
  p('#3f2e20',35,32,31,25);p('#ad824c',37,34,27,21);p('#d4ac6a',39,35,23,2);
  if(kind==='seeds'||kind==='herbalist'){
   p('#d8c98f',46,39,11,11);p('#f0e3ad',47,39,8,2);p('#417342',50,38,2,10);
   p('#92aa51',45,40,6,3);p('#a9bd67',52,37,5,3);p('#65452a',49,48,5,2);
  }else if(kind==='blacksmith'){
   p('#303b3a',43,45,18,4);p('#b9c3b6',42,41,20,4);p('#7d918a',47,45,11,5);p('#d5d3b9',43,40,13,2);
  }else if(kind==='carpenter'){
   p('#543a25',43,42,19,7);p('#c7a271',43,40,19,6);p('#e7c595',43,40,18,2);
   p('#644426',48,43,1,2);p('#87603c',54,42,1,3);
  }else if(kind==='fisher'){
   p('#bad4c5',44,42,13,5);p('#d7e4c6',47,41,7,7);p('#95beb0',57,41,4,7);p('#3e534a',46,43,1,1);
  }else if(kind==='tailor'){
   p('#e4ceb5',47,39,10,3);p('#9f6f91',48,42,8,7);p('#e4ceb5',47,49,10,3);p('#ceb39e',51,42,2,7);
  }else if(kind==='inn'){
   p('#6f482d',43,42,2,10);p('#6f482d',59,44,2,8);p('#e6d1a2',45,41,5,4);p('#a8a783',45,45,14,4);
  }else if(kind==='mechanic'){
   p('#bcc7b4',47,40,11,10);p('#6a8278',50,43,5,4);
   for(const [x,y] of [[50,38],[50,50],[45,43],[58,43]])p('#c6ccba',x,y,4,4);
  }else{
   p('#d6bd7d',44,43,16,8);p('#916232',46,41,12,2);p('#e7d393',45,44,14,1);p('#725237',46,49,12,1);
   if(kind==='traveler'){p('#5d5c45',49,39,6,4);p('#abbb90',50,39,4,2);}
  }
  for(const x of [10,90]){p('#3e3629',x,28,1,2);p('#cfb385',x,25,1,1);}
 });
 paint('village-lantern',32,76,c=>{
  const p=(color:string,x:number,y:number,w:number,h:number)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  p('#36472d44',5,71,25,4);p('#4d3929',14,15,6,59);p('#aa8050',15,15,3,57);p('#d6b17a',16,17,1,52);
  p('#3b3c32',9,9,18,3);p('#6b5b3e',10,4,16,6);p('#ac8953',13,2,10,3);
  p('#473e2b',10,12,16,19);p('#d7ba6c',12,14,12,14);p('#e3d295',13,15,10,11);
  p('#5d5337',17,13,2,16);p('#776645',10,29,16,4);
 });
}
