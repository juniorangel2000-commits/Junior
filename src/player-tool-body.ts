import type Phaser from 'phaser';
import type {CharacterProfile} from './types';
import type {CharacterDirection} from './character-directions';
import {resolveCharacter} from './data/characters';
import {playerToolMotion,type BodyTool} from './data/player-tool-motion';
import art from '../public/assets/visual/characters/player-tool-body.json';
export function preloadPlayerToolBody(scene:Phaser.Scene):void{for(const[id,data]of Object.entries(art.characters)){const key='player-tool-body-'+id;if(!scene.textures.exists(key))scene.load.spritesheet(key,data.file,{frameWidth:art.frameWidth,frameHeight:art.frameHeight});}}
export function playerToolBody(scene:Phaser.Scene,profile:CharacterProfile,tool:BodyTool,direction:CharacterDirection,frame:number){const id=resolveCharacter(profile).id,key='player-tool-body-'+id;if(!scene.textures.exists(key))return;const m=playerToolMotion(tool,direction,frame),a=art.characters[id],r=a.rows[m.row-2],hand=a.hands[m.row-2][m.pose];return{...m,key,frame:(m.row-2)*6+m.pose,bodyScale:a.scale,originX:r.originX,originY:r.originY,handX:(hand[0]-r.originX*art.frameWidth)*a.scale,handY:(hand[1]-r.originY*art.frameHeight)*a.scale};}
