import type Phaser from 'phaser';
/** Fogueira portátil acesa no chão, na frente do personagem, enquanto o caderno da fogueira
 * está aberto (arte da fase 02: 3 quadros de chama). À noite ela acende uma luz em volta. */
const KEY='campfire-lit',ANIM='campfire-lit-burn',FRAME={w:487,h:545},WIDTH=30;
function ensure(scene:Phaser.Scene,done:()=>void):void{
 if(scene.textures.exists(KEY)){done();return;}
 scene.load.spritesheet(KEY,'assets/visual/kitchen/campfire-lit.png',{frameWidth:FRAME.w,frameHeight:FRAME.h});
 scene.load.once('complete',done);scene.load.start();
}
export function showCampfire(scene:Phaser.Scene,player:{x:number;y:number;facing?:{x:number;y:number}}):()=>void{
 let sprite:Phaser.GameObjects.Sprite|undefined,gone=false;
 const f=player.facing??{x:0,y:1},x=player.x+Math.sign(f.x)*26,y=player.y+(f.y>0?24:f.y<0?-14:6);
 ensure(scene,()=>{
  if(gone||!scene.sys.isActive())return;
  if(!scene.anims.exists(ANIM))scene.anims.create({key:ANIM,frames:scene.anims.generateFrameNumbers(KEY,{start:0,end:2}),frameRate:7,repeat:-1});
  sprite=scene.add.sprite(x,y,KEY,0).setOrigin(.5,.9).setDepth(y).setScale(WIDTH/FRAME.w).setData('fixture-light',{radius:60,always:true,strength:1.1});
  sprite.play(ANIM);
 });
 return()=>{gone=true;sprite?.destroy();};
}
