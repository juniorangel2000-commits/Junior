import Phaser from 'phaser';
import {CELLAR_ART,CELLAR_PROPS,CELLAR_SEAL,CELLAR_TEXTURES,RUINS_CELLAR_SIZE,createRuinsCellarLayout} from './data/ruins-cellar';
import {ruinsSeed} from './data/ruins';

const FLOOR='ruins-cellar-stone-floor';
export function preloadRuinsCellar(scene:Phaser.Scene):void {
  for(const name of ['bronze-seal',...CELLAR_TEXTURES.map(piece=>'cellar-'+piece)]){
    if(!scene.textures.exists('ruins-'+name))scene.load.image('ruins-'+name,'assets/visual/ruins/'+name+'.png');
  }
}

function stoneTile(source:HTMLImageElement):HTMLCanvasElement {
  const tile=document.createElement('canvas'),size=124;
  tile.width=tile.height=size;
  const ctx=tile.getContext('2d')!;
  const inset=.049;
  ctx.drawImage(source,source.width*inset,source.height*inset,source.width*(1-2*inset),source.height*(1-2*inset),0,0,size,size);
  const image=ctx.getImageData(0,0,size,size),original=image.data.slice();
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const wx=Math.max(0,1-(Math.min(x,size-1-x)+.5)/9)*.5;
    const wy=Math.max(0,1-(Math.min(y,size-1-y)+.5)/9)*.5;
    const i=(y*size+x)*4, mx=(y*size+size-1-x)*4, my=((size-1-y)*size+x)*4;
    const diagonal=((size-1-y)*size+size-1-x)*4;
    for(let k=0;k<3;k++)image.data[i+k]=(original[i+k]*(1-wx)+original[mx+k]*wx)*(1-wy)+
      (original[my+k]*(1-wx)+original[diagonal+k]*wx)*wy;
    image.data[i+3]=255;
  }
  ctx.putImageData(image,0,0);
  return tile;
}

function drawFloor(scene:Phaser.Scene):void {
  if(!scene.textures.exists(FLOOR)){
    const canvas=document.createElement('canvas');
    const {width,height}=RUINS_CELLAR_SIZE;canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d')!;
    ctx.fillStyle='#211e1b';ctx.fillRect(0,0,width,height);
    const source=scene.textures.get('ruins-cellar-floor').getSourceImage() as HTMLImageElement;
    ctx.save();
    ctx.beginPath();
    const outline=[[40,194],[55,163],[328,172],[342,105],[458,105],[473,169],[772,165],
      [793,222],[790,479],[766,515],[74,515],[44,491],[37,389]];
    outline.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
    ctx.closePath();ctx.clip();
    ctx.fillStyle=ctx.createPattern(stoneTile(source),'repeat')!;ctx.fillRect(0,0,width,height);
    for(let i=0;i<42;i++){
      const x=60+ruinsSeed(i,17)*709,y=200+ruinsSeed(i,72)*290;
      const rx=16+ruinsSeed(i,34)*26,ry=8+ruinsSeed(i,53)*13;
      const gradient=ctx.createRadialGradient(x,y,1,x,y,rx);
      gradient.addColorStop(0,i%4?'#2b2b213d':'#40534a55');gradient.addColorStop(1,'#23292000');
      ctx.fillStyle=gradient;ctx.beginPath();
      ctx.ellipse(x,y,rx,ry,(ruinsSeed(i,99)-.5)*.5,0,2*Math.PI);ctx.fill();
    }
    for(let i=0;i<470;i++){
      const x=55+ruinsSeed(i,8)*720,y=203+ruinsSeed(i,31)*300;
      ctx.fillStyle=i%2?'#75705a60':'#26231882';ctx.fillRect(x,y,1+i%3,1+i%2);
    }
    ctx.restore();
    scene.textures.addCanvas(FLOOR,canvas)!.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  scene.add.image(0,0,FLOOR).setOrigin(0).setDepth(-100);
}

export class RuinsCellarWorld {
  readonly layout=createRuinsCellarLayout();
  private readonly seal?:Phaser.GameObjects.Image;
  constructor(scene:Phaser.Scene,sealFound:boolean){
    drawFloor(scene);
    for(const [i,x] of [50,194,476,629].entries()){
      scene.add.image(x,204-i%2*5,'ruins-cellar-back-wall').setOrigin(0,.96)
        .setDisplaySize(157+i%2*5,87+i%3*5).setFlipX(i%2===1).setDepth(172);
    }
    for(const [i,y] of [239,341,445,514].entries())for(const [side,x] of [53,780].entries()){
      scene.add.image(x,y,'ruins-cellar-side-wall').setOrigin(.5,.94)
        .setDisplaySize(49+i%2*7,112+i%2*7).setFlipX((side+i)%2===1).setDepth(y);
    }
    for(const [i,x] of [115,258,401,544,687].entries()){
      scene.add.image(x,518,'ruins-cellar-sill').setOrigin(.5,.92).setDisplaySize(161,36)
        .setFlipX(i%2===1).setDepth(515);
    }
    scene.add.image(400,210,'ruins-cellar-stairs').setOrigin(.5,.94).setDisplaySize(138,135).setDepth(-97);
    for(const [kind,x,y] of CELLAR_PROPS){
      const art=CELLAR_ART[kind];
      const [width,height]=art.size;
      const sprite=scene.add.image(x,y,'ruins-cellar-'+kind).setOrigin(.5,art.pivot)
        .setDisplaySize(width,height).setDepth(kind==='drain'?-92:y);
      if(kind==='lantern')sprite.setData('fixture-light',{offsetX:-4,offsetY:-7,radius:116,strength:.79,always:true});
    }
    if(!sealFound)this.seal=scene.add.image(CELLAR_SEAL.x,CELLAR_SEAL.y-66,'ruins-bronze-seal')
      .setDisplaySize(23,23).setDepth(CELLAR_SEAL.y+1);
  }
  takeSeal():void {this.seal?.setVisible(false);}
}
