import Phaser from 'phaser';
import {
  HALL_ART, HALL_BACK, HALL_BOARDS, HALL_DOOR, HALL_FLOORS, HALL_FRONT, HALL_LEFT, HALL_PROPS, HALL_RIGHT,
  HALL_TEXTURES, HALL_WALL_PANELS, RAILWAY_HALL_SIZE, createRailwayHallLayout,
} from './data/railway-hall';
import {railwayTexture} from './data/railway-art';
import {railwaySeed} from './data/railway';

const FLOOR='railway-hall-floor-v2';
export function preloadRailwayHall(scene:Phaser.Scene):void {
  for(const file of HALL_FLOORS){
    const key=railwayTexture(file);
    if(!scene.textures.exists(key))scene.load.image(key,`assets/visual/railway/${file}.png`);
  }
  for(const file of HALL_TEXTURES){
    const key=railwayTexture(file);
    if(!scene.textures.exists(key))scene.load.image(key,`assets/visual/railway/interior-frontal/${file}.png`);
  }
}
function drawFloor(scene:Phaser.Scene):void {
  if(!scene.textures.exists(FLOOR)){
    const {width,height}=RAILWAY_HALL_SIZE,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
    c.fillStyle='#141310';c.fillRect(0,0,width,height);
    const pattern=(file:string)=>{const image=scene.textures.get(railwayTexture(file)).getSourceImage() as HTMLImageElement;
      const tile=document.createElement('canvas');tile.width=tile.height=128;const t=tile.getContext('2d')!;t.imageSmoothingEnabled=false;t.drawImage(image,0,0,128,128);
      return c.createPattern(tile,'repeat')!;};
    c.fillStyle=pattern('ladrilho-antigo');
    c.fillRect(HALL_LEFT-9,HALL_BACK-12,HALL_RIGHT-HALL_LEFT+18,HALL_FRONT-HALL_BACK+40);
    c.fillStyle='#342a2045';
    c.fillRect(HALL_LEFT-9,HALL_BACK-12,HALL_RIGHT-HALL_LEFT+18,HALL_FRONT-HALL_BACK+40);
    c.fillStyle=pattern('tabuas-internas');
    c.fillRect(HALL_BOARDS.left-9,HALL_BOARDS.top-12,HALL_BOARDS.right-HALL_BOARDS.left+9,HALL_BOARDS.bottom-HALL_BOARDS.top+12);
    c.fillRect(HALL_DOOR.left,HALL_FRONT,HALL_DOOR.right-HALL_DOOR.left,height-HALL_FRONT);
    c.fillStyle='#32271b';
    c.fillRect(HALL_BOARDS.left,HALL_BOARDS.bottom-3,HALL_BOARDS.right-HALL_BOARDS.left,3);
    c.fillRect(HALL_BOARDS.right-3,HALL_BOARDS.top,3,HALL_BOARDS.bottom-HALL_BOARDS.top);
    c.fillStyle='#94734b';
    c.fillRect(HALL_BOARDS.left,HALL_BOARDS.bottom-4,HALL_BOARDS.right-HALL_BOARDS.left,1);

    // Sombra baixa nas bordas do salão, onde a poeira e a umidade se acumulam.
    const fade=(x0:number,y0:number,x1:number,y1:number,x:number,y:number,w:number,h:number)=>{
      const shadow=c.createLinearGradient(x0,y0,x1,y1);
      shadow.addColorStop(0,'#19150f80');shadow.addColorStop(1,'#19150f00');c.fillStyle=shadow;c.fillRect(x,y,w,h);
    };
    fade(HALL_LEFT,HALL_BACK,HALL_LEFT,HALL_BACK+46,HALL_LEFT,HALL_BACK,HALL_RIGHT-HALL_LEFT,46);
    fade(HALL_LEFT,HALL_BACK,HALL_LEFT+35,HALL_BACK,HALL_LEFT,HALL_BACK,35,HALL_FRONT-HALL_BACK);
    fade(HALL_RIGHT,HALL_BACK,HALL_RIGHT-35,HALL_BACK,HALL_RIGHT-35,HALL_BACK,35,HALL_FRONT-HALL_BACK);
    for(let i=0;i<34;i++){
      const x=HALL_LEFT+railwaySeed(i,17)*(HALL_RIGHT-HALL_LEFT),y=HALL_BACK+railwaySeed(i,72)*(HALL_FRONT-HALL_BACK);
      const rx=14+railwaySeed(i,34)*30,g=c.createRadialGradient(x,y,1,x,y,rx);
      g.addColorStop(0,i%4?'#3a2e2236':'#4a5a4440');g.addColorStop(1,'#2a221a00');c.fillStyle=g;
      c.beginPath();c.ellipse(x,y,rx,rx*.55,0,0,2*Math.PI);c.fill();
    }
    for(let i=0;i<300;i++){c.fillStyle=i%2?'#8a7a6050':'#2a221a70';c.fillRect(HALL_LEFT+railwaySeed(i,9)*(HALL_RIGHT-HALL_LEFT),HALL_BACK+railwaySeed(i,41)*(HALL_FRONT-HALL_BACK),1+i%3,1+i%2);}
    scene.textures.addCanvas(FLOOR,canvas)!.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  scene.add.image(0,0,FLOOR).setOrigin(0).setDepth(-100);
}

/** Sala de espera: paredes, guichê, bancos e bagagens. O rodapé da frente fica baixo e
 * esmaece quando o personagem passa atrás dele, para não esconder o sprite. */
export class RailwayHallWorld {
  readonly layout=createRailwayHallLayout();
  private readonly front:Phaser.GameObjects.Image[]=[];
  private readonly door:Phaser.GameObjects.Image;
  constructor(scene:Phaser.Scene){
    drawFloor(scene);
    const wallWidth=(HALL_RIGHT-HALL_LEFT+20)/HALL_WALL_PANELS.length;
    for(const [i,file] of HALL_WALL_PANELS.entries()){
      scene.add.image(HALL_LEFT-10+i*wallWidth,HALL_BACK,railwayTexture(file))
        .setOrigin(0,1).setDisplaySize(wallWidth+1,154).setFlipX(i===2).setDepth(HALL_BACK-60);
    }
    const stone=railwayTexture('rodape-de-pedra'),sill=railwayTexture('lambril-frontal');
    for(const x of [HALL_LEFT-5,HALL_RIGHT+5]){
      for(let y=HALL_BACK+34;y<HALL_FRONT;y+=68){
        scene.add.image(x,y,stone).setAngle(90).setDisplaySize(70,17).setDepth(HALL_BACK-59);
      }
    }
    for(const [left,right] of [[HALL_LEFT-9,HALL_DOOR.left],[HALL_DOOR.right,HALL_RIGHT+9]]){
      const width=(right-left)/3;
      for(let i=0;i<3;i++){
        this.front.push(scene.add.image(left+i*width,HALL_FRONT+27,sill)
          .setOrigin(0,1).setDisplaySize(width+1,32).setDepth(HALL_FRONT+27));
      }
    }
    this.door=scene.add.image((HALL_DOOR.left+HALL_DOOR.right)/2,HALL_FRONT+28,railwayTexture('porta-da-plataforma'))
      .setOrigin(.5,1).setDisplaySize(93,100).setDepth(HALL_FRONT+28);
    for(const [kind,x,y] of HALL_PROPS){
      const art=HALL_ART[kind],[width,height]=art.size;
      const sprite=scene.add.image(x,y,railwayTexture(art.file)).setOrigin(.5,.99).setDisplaySize(width,height)
        .setDepth('floor' in art?-94:'wall' in art?HALL_BACK-50:y);
      if('floor' in art)sprite.setData('no-shadow',true);
      if('light' in art)sprite.setData('fixture-light',{offsetX:0,offsetY:-12,radius:120,strength:.8,always:true});
    }
  }
  update(_dt:number,player:{x:number;y:number}):void {
    for(const s of this.front)s.setAlpha(player.y>HALL_FRONT-26&&player.y<s.depth&&player.x>s.x-8&&player.x<s.x+s.displayWidth+8?.45:1);
    const underDoor=player.y>HALL_FRONT-94&&player.y<this.door.y&&Math.abs(player.x-this.door.x)<54;
    this.door.setAlpha(underDoor?.38:1);
  }
  destroy():void {}
}
