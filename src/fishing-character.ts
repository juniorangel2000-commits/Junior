import type Phaser from 'phaser';
import type {Player} from './player';
import {CHARACTERS} from './data/characters';
import {FISHING_DIRECTIONS,FISHING_CHARACTER_POSES,FISHING_CAST_POSES,FISHING_POSE_CELL,FISHING_CAST_TIMING,fishingCastStage,fishingCharacterKey,fishingCharacterFile,fishingCastCharacterKey,fishingCastCharacterFile,fishingPoseScale,fishingPosePoint,type FishingDirection,type FishingCharacterPose} from './data/fishing-character-poses';
export function preloadFishingCharacters(scene:Phaser.Scene):void {
 for(const character of CHARACTERS)for(const[key,file]of[[fishingCharacterKey(character.id),fishingCharacterFile(character.id)],[fishingCastCharacterKey(character.id),fishingCastCharacterFile(character.id)]])if(!scene.textures.exists(key))scene.load.image(key,file);
}
/** Full-body fishing art contains the held pole, so no second pole is drawn over it. */
export function createFishingCharacter(scene:Phaser.Scene,player:Player,direction:FishingDirection){
 const key=fishingCharacterKey(player.characterId);if(!scene.textures.exists(key))return undefined;
 const texture=scene.textures.get(key),cell=FISHING_POSE_CELL;
 for(const[index,name]of FISHING_DIRECTIONS.entries())if(!texture.has(name))texture.add(name,0,index%2*cell,Math.floor(index/2)*cell,cell,cell);
 const pose=FISHING_CHARACTER_POSES[player.characterId][direction],visible=player.sprite.visible;
 const castKey=fishingCastCharacterKey(player.characterId),hasCast=scene.textures.exists(castKey);
 if(hasCast){const atlas=scene.textures.get(castKey);for(const stage of ['prepare','release'] as const){const frame=`${stage}-${direction}`,r=FISHING_CAST_POSES[player.characterId][stage][direction].rect;if(!atlas.has(frame))atlas.add(frame,0,...r);}}
 const sample=(elapsed:number)=>{
  const stage=hasCast?fishingCastStage(elapsed):'rest';
  let current:FishingCharacterPose=pose,width=cell,height=cell;
  if(stage!=='rest'){const p=FISHING_CAST_POSES[player.characterId][stage][direction],r=p.rect;width=r[2];height=r[3];current={...p,foot:[p.foot[0]-r[0],p.foot[1]-r[1]],head:p.head-r[1],tip:[p.tip[0]-r[0],p.tip[1]-r[1]]};}
  const rotation=stage==='prepare'?-Math.sin(Math.min(1,elapsed/FISHING_CAST_TIMING.release)*Math.PI/2)*.055:stage==='release'?Math.sin((elapsed-FISHING_CAST_TIMING.release)/(FISHING_CAST_TIMING.rest-FISHING_CAST_TIMING.release)*Math.PI)*.04:Math.sin(Math.max(0,elapsed-FISHING_CAST_TIMING.rest)*1.8)*.0025;
  return{stage,current,width,height,rotation};
 };
 const sprite=scene.add.image(player.x,player.y+pose.ground,key,direction).setOrigin(pose.foot[0]/cell,pose.foot[1]/cell).setScale(fishingPoseScale(pose)).setDepth(player.y).setVisible(visible).setData('fishing-character',true).setData('fishing-character-id',player.characterId).setData('fishing-cast-rod',true);
 player.setVisible(false);let destroyed=false;
 return{
  sprite,
  tipAt(elapsed:number):{x:number;y:number}{const s=sample(elapsed);return fishingPosePoint(s.current,s.current.tip,player.x,player.y,s.rotation);},
  update(elapsed:number):{x:number;y:number}{
   const{stage,current,width,height,rotation}=sample(elapsed);
   sprite.setTexture(stage==='rest'?key:castKey,stage==='rest'?direction:`${stage}-${direction}`).setOrigin(current.foot[0]/width,current.foot[1]/height).setScale(fishingPoseScale(current)).setData('fishing-cast-stage',stage);
   sprite.setPosition(player.x,player.y+current.ground).setRotation(rotation).setDepth(player.y);
   return fishingPosePoint(current,current.tip,player.x,player.y,rotation);
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
