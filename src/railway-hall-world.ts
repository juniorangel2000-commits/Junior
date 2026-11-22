import Phaser from 'phaser';
import {
  HALL_ART, HALL_BACK, HALL_BOARDS, HALL_DOOR, HALL_FRONT, HALL_LEFT, HALL_PROPS, HALL_RIGHT, HALL_TEXTURES,
  RAILWAY_HALL_ENTRY, RAILWAY_HALL_EXIT, RAILWAY_HALL_SIZE, createRailwayHallLayout,
} from './data/railway-hall';
import {railwayTexture} from './data/railway-art';
import {railwaySeed} from './data/railway';
import {drawExitSign} from './exit-signs';

const FLOOR='railway-hall-floor-v1';
export function preloadRailwayHall(scene:Phaser.Scene):void {
  for(const file of HALL_TEXTURES){const key=railwayTexture(file);if(!scene.textures.exists(key))scene.load.image(key,`assets/visual/railway/${file}.png`);}
}
function drawFloor(scene:Phaser.Scene):void {
  if(!scene.textures.exists(FLOOR)){
    const {width,height}=RAILWAY_HALL_SIZE,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
    c.fillStyle='#1d1a17';c.fillRect(0,0,width,height);
    const pattern=(file:string)=>{const image=scene.textures.get(railwayTexture(file)).getSourceImage() as HTMLImageElement;
      const tile=document.createElement('canvas');tile.width=tile.height=128;const t=tile.getContext('2d')!;t.imageSmoothingEnabled=false;t.drawImage(image,0,0,128,128);
      return c.createPattern(tile,'repeat')!;};
    c.fillStyle=pattern('ladrilho-antigo');c.fillRect(HALL_LEFT-16,HALL_BACK-24,HALL_RIGHT-HALL_LEFT+32,HALL_FRONT-HALL_BACK+40);
    c.fillStyle=pattern('tabuas-internas');c.fillRect(HALL_BOARDS.left-16,HALL_BOARDS.top,HALL_BOARDS.right-HALL_BOARDS.left+16,HALL_BOARDS.bottom-HALL_BOARDS.top);
    // Vão da porta: soleira de tábuas até a borda sul.
    c.fillRect(HALL_DOOR.left,HALL_FRONT,HALL_DOOR.right-HALL_DOOR.left,height-HALL_FRONT);
    // Poeira, manchas de umidade e cacos soltos no ladrilho.
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
  constructor(scene:Phaser.Scene){
    drawFloor(scene);
    const wall=railwayTexture('parede-do-fundo'),side=railwayTexture('parede-lateral'),sill=railwayTexture('rodape-frontal');
    for(let i=0,x=HALL_LEFT-28;x<HALL_RIGHT+28;i++,x+=150)
      scene.add.image(x,HALL_BACK+4,wall).setOrigin(0,1).setDisplaySize(152,150).setFlipX(i%2===1).setDepth(HALL_BACK-60);
    for(const y of [250,350,450,540])for(const [s,x] of [HALL_LEFT-14,HALL_RIGHT+14].entries())
      scene.add.image(x,y,side).setOrigin(.5,1).setDisplaySize(52,108).setFlipX(s===1).setDepth(y);
    for(let x=HALL_LEFT-10;x<HALL_RIGHT+10;x+=130){
      if(x+130>HALL_DOOR.left&&x<HALL_DOOR.right){
        // Rodapé interrompido no vão da porta: um pedaço até o batente de cada lado.
        const left=x,right=HALL_DOOR.left;if(right-left>20)this.front.push(scene.add.image(left,HALL_FRONT+30,sill).setOrigin(0,1).setDisplaySize(right-left,32).setDepth(HALL_FRONT+30));
        const l2=HALL_DOOR.right,r2=x+130;if(r2-l2>20)this.front.push(scene.add.image(l2,HALL_FRONT+30,sill).setOrigin(0,1).setDisplaySize(r2-l2,32).setDepth(HALL_FRONT+30));
        continue;
      }
      this.front.push(scene.add.image(x,HALL_FRONT+30,sill).setOrigin(0,1).setDisplaySize(130,32).setDepth(HALL_FRONT+30));
    }
    for(const [kind,x,y] of HALL_PROPS){
      const art=HALL_ART[kind],[width,height]=art.size;
      const sprite=scene.add.image(x,y,railwayTexture(art.file)).setOrigin(.5,.99).setDisplaySize(width,height)
        .setDepth(kind==='trapdoor'?-92:'wall' in art?HALL_BACK-50:y);
      if('light' in art)sprite.setData('fixture-light',{offsetX:0,offsetY:-12,radius:120,strength:.8,always:true});
    }
    drawExitSign(scene,RAILWAY_HALL_EXIT,RAILWAY_HALL_ENTRY);
  }
  update(_dt:number,player:{x:number;y:number}):void {
    for(const s of this.front)s.setAlpha(player.y>HALL_FRONT-26&&player.y<s.depth&&player.x>s.x-8&&player.x<s.x+s.displayWidth+8?.45:1);
  }
  destroy():void {}
}
