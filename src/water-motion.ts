import Phaser from 'phaser';
/** Tiny looping glints; the terrain and collision stay fixed. */
export function addWaterMotion(scene:Phaser.Scene,water:(x:number,y:number)=>boolean):void {
  const key='water-ripple-frames';
  if(!scene.textures.exists(key)){
    const c=document.createElement('canvas');c.width=256;c.height=16;const g=c.getContext('2d')!;
    for(let f=0;f<8;f++){
      g.fillStyle=`rgba(180,230,219,${Math.sin((f+1)/9*Math.PI)*.50})`;
      g.fillRect(f*32+4+f,5,9,1);g.fillRect(f*32+9+f,6,5,1);
      g.fillRect(f*32+15-Math.floor(f/2),11,7,1);
    }
    const texture=scene.textures.addCanvas(key,c)!;
    for(let f=0;f<8;f++)texture.add(f,0,f*32,0,32,16);
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  if(!scene.anims.exists(key))scene.anims.create({key,frames:Array.from({length:8},(_,frame)=>({key,frame})),frameRate:4,repeat:-1});
  for(let y=2;y<70;y+=2)for(let x=2;x<94;x+=2){
    if(!water(x,y)||!water(x-1,y)||!water(x+1,y)||!water(x,y+1))continue;
    const phase=((x*17+y*31)>>>0)%8;
    scene.add.sprite(x*32+16,y*32+12,key,phase).setDepth(-80).play({key,startFrame:phase});
  }
}
