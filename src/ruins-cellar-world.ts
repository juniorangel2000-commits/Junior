import type Phaser from 'phaser';
import {drawEditorProp} from './editor-prop-art';
import {CELLAR_PROPS,CELLAR_SEAL,RUINS_CELLAR_SIZE,createRuinsCellarLayout} from './data/ruins-cellar';

export class RuinsCellarWorld {
  readonly layout=createRuinsCellarLayout();
  private readonly seal?:Phaser.GameObjects.Image;
  constructor(scene:Phaser.Scene,sealFound:boolean){
    const {width,height}=RUINS_CELLAR_SIZE;
    scene.add.tileSprite(0,0,width,height,'asset-ground-moss').setOrigin(0).setDepth(-100).setTint(0x434043);
    scene.add.tileSprite(48,112,width-96,height-148,'asset-ground-paving').setOrigin(0).setDepth(-99).setTint(0x877964);
    scene.add.tileSprite(48,73,width-96,70,'asset-ground-paving').setOrigin(0).setDepth(-98).setTint(0x615346);
    scene.add.tileSprite(291,350,90,66,'asset-ground-paving').setOrigin(0).setDepth(-98).setTint(0x877964);
    const border=scene.add.graphics().setDepth(-97);
    for(const x of [35,width-51]){
      border.fillStyle(0x302823).fillRect(x,70,17,286);
      for(let y=80;y<353;y+=23)border.fillStyle(0x665947,.7).fillRect(x+2,y,14,16);
    }
    for(let x=54;x<width-55;x+=73){
      const wall=drawEditorProp(scene,'ruin-wall',x+35,119);
      wall?.setDisplaySize(78,26).setTint(0x8d8172);
    }
    for(const [kind,x,y] of CELLAR_PROPS){
      const sprite=drawEditorProp(scene,kind,x,y)?.setTint(0xb7a186);
      if(kind==='ruin-flagstones'||kind==='ruin-steps')sprite?.setDepth(-95);
    }
    for(const [x,y] of [[102,145],[351,154],[527,159]]){
      scene.add.rectangle(x,y,6,14,0x745031).setOrigin(.5,1).setDepth(y);
      scene.add.ellipse(x,y-15,8,10,0xffc780).setDepth(y-1)
        .setData('fixture-light',{radius:97,strength:.68,always:true});
    }
    if(!sealFound)this.seal=scene.add.image(CELLAR_SEAL.x,CELLAR_SEAL.y-40,'ruins-bronze-seal').setDisplaySize(23,23).setDepth(CELLAR_SEAL.y+1);
  }
  takeSeal():void { this.seal?.setVisible(false); }
}
