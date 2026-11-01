import type Phaser from 'phaser';
import type {Player} from './player';
import {CHARACTERS} from './data/characters';
import {FISHING_DIRECTIONS,FISHING_CHARACTER_POSES,FISHING_POSE_CELL,fishingCharacterKey,fishingCharacterFile,fishingPoseScale,fishingPosePoint,type FishingDirection} from './data/fishing-character-poses';
export function preloadFishingCharacters(scene:Phaser.Scene):void {
 for(const character of CHARACTERS){const key=fishingCharacterKey(character.id);if(!scene.textures.exists(key))scene.load.image(key,fishingCharacterFile(character.id));}
}
/** Full-body fishing art contains the held pole, so no second pole is drawn over it. */
export function createFishingCharacter(scene:Phaser.Scene,player:Player,direction:FishingDirection){
 const key=fishingCharacterKey(player.characterId);if(!scene.textures.exists(key))return undefined;
 const texture=scene.textures.get(key),cell=FISHING_POSE_CELL;
 for(const[index,name]of FISHING_DIRECTIONS.entries())if(!texture.has(name))texture.add(name,0,index%2*cell,Math.floor(index/2)*cell,cell,cell);
 const pose=FISHING_CHARACTER_POSES[player.characterId][direction],visible=player.sprite.visible;
 const sprite=scene.add.image(player.x,player.y+pose.ground,key,direction).setOrigin(pose.foot[0]/cell,pose.foot[1]/cell).setScale(fishingPoseScale(pose)).setDepth(player.y).setVisible(visible).setData('fishing-character',true).setData('fishing-character-id',player.characterId).setData('fishing-cast-rod',true);
 player.setVisible(false);let destroyed=false;
 return{
  sprite,
  update(_elapsed:number):{x:number;y:number}{
   const rotation=0;
   sprite.setPosition(player.x,player.y+pose.ground).setRotation(rotation).setDepth(player.y);
   return fishingPosePoint(pose,pose.tip,player.x,player.y,rotation);
  },
  destroy():void{
   if(destroyed)return;destroyed=true;sprite.destroy();
   if(player.sprite.scene){player.setVisible(visible);player.update(0,()=>false,()=>false,false,()=>player.waterDepth);}
  },
 };
}

/** Leave the angler visible beside the right-hand minigame; preserve the user's zoom. */
export function frameFishingCamera(scene:Phaser.Scene,player:Player):()=>void {
 const camera=scene.cameras?.main;
 const follows=()=>!!camera&&(camera as unknown as {_follow?:unknown})._follow===player;
 if(!follows())return()=>{};
 const previous={x:camera.followOffset.x,y:camera.followOffset.y};let restored=false;
 const apply=()=>{if(!restored&&follows())camera.setFollowOffset(previous.x-(scene.scale.width>=1100?337/camera.zoom:0),previous.y);};
 scene.scale.on('resize',apply);apply();
 return()=>{if(restored)return;restored=true;scene.scale.off('resize',apply);if(follows())camera.setFollowOffset(previous.x,previous.y);};
}
