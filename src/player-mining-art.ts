import type Phaser from 'phaser';
import type {CharacterProfile} from './types';
import {resolveCharacter,type CharacterId} from './data/characters';
import {playerMiningFrame,playerMiningRow,PLAYER_PICKAXE_HEADS,playerMiningMetal} from './data/player-mining';
import type {CharacterDirection} from './character-directions';
import art from '../public/assets/visual/characters/player-mining.json';
import chopping from '../public/assets/visual/characters/player-chopping.json';
type Work='mining'|'chopping';
const sourceKey=(id:CharacterId,work:Work='mining')=>'player-'+work+'-source-'+id;
export function preloadPlayerMiningArt(scene:Phaser.Scene):void{for(const work of ['mining','chopping']as const)for(const[id,data]of Object.entries((work==='mining'?art:chopping).characters))if(!scene.textures.exists(sourceKey(id as CharacterId,work)))scene.load.image(sourceKey(id as CharacterId,work),data.file);}
function texture(scene:Phaser.Scene,id:CharacterId,tier:number,work:Work):string|undefined{
 const source=sourceKey(id,work);if(!scene.textures.exists(source))return;
 const key=tier>0?source+'-'+tier:source;if(!scene.textures.exists(key)){
  const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1024;const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;c.drawImage(scene.textures.get(source).getSourceImage()as HTMLImageElement,0,0);
  const pixels=c.getImageData(0,0,1536,1024);for(let row=0;row<4;row++)for(let frame=0;frame<6;frame++){
   const [x,y,w,h]=PLAYER_PICKAXE_HEADS[row][frame];for(let dy=y;dy<Math.min(256,y+h);dy++)for(let dx=x;dx<Math.min(256,x+w);dx++){
    const i=((row*256+dy)*1536+frame*256+dx)*4;if(!pixels.data[i+3])continue;
    const rgb=playerMiningMetal(pixels.data[i],pixels.data[i+1],pixels.data[i+2],tier);for(let k=0;k<3;k++)pixels.data[i+k]=rgb[k];
   }
  }c.putImageData(pixels,0,0);scene.textures.addCanvas(key,canvas);
 }
 const t=scene.textures.get(key);t.setFilter(0);for(let frame=0;frame<24;frame++)if(!t.has(String(frame)))t.add(frame,0,(frame%6)*256,Math.floor(frame/6)*256,256,256);return key;
}
function playerWorkPose(scene:Phaser.Scene,profile:CharacterProfile,direction:CharacterDirection,frame:number,tier:number,work:Work){
 const id=resolveCharacter(profile).id,key=texture(scene,id,Math.max(0,Math.min(3,Number.isFinite(tier)?Math.floor(tier):0)),work);if(!key)return;
 const data=(work==='mining'?art:chopping).characters[id],row=data.rows[playerMiningRow(direction)];return{key,frame:playerMiningFrame(direction,frame),scale:data.scale,originX:row.originX,originY:row.originY};
}

export const playerMiningPose=(scene:Phaser.Scene,profile:CharacterProfile,direction:CharacterDirection,frame:number,tier:number)=>playerWorkPose(scene,profile,direction,frame,tier,'mining');
export const playerChoppingPose=(scene:Phaser.Scene,profile:CharacterProfile,direction:CharacterDirection,frame:number,tier:number)=>playerWorkPose(scene,profile,direction,frame,tier,'chopping');
