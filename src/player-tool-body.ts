import type Phaser from 'phaser';
import type {CharacterProfile} from './types';
import type {CharacterDirection} from './character-directions';
import {resolveCharacter} from './data/characters';
import {playerToolMotion,type BodyTool} from './data/player-tool-motion';
import art from '../public/assets/visual/characters/player-tool-body.json';
export function preloadPlayerToolBody(scene:Phaser.Scene):void{for(const[id,data]of Object.entries(art.characters)){const key='player-tool-body-'+id;if(!scene.textures.exists(key))scene.load.spritesheet(key,data.file,{frameWidth:256,frameHeight:256});}}
export function playerToolBody(scene:Phaser.Scene,profile:CharacterProfile,tool:BodyTool,direction:CharacterDirection,frame:number){const id=resolveCharacter(profile).id,key='player-tool-body-'+id;if(!scene.textures.exists(key))return;const m=playerToolMotion(tool,direction,frame),a=art.characters[id],r=a.rows[m.row];return{...m,key,bodyScale:a.scale,originX:r.originX,originY:r.originY,handX:(m.hand[0]-r.originX*256)*a.scale,handY:(m.hand[1]-r.originY*256)*a.scale};}
