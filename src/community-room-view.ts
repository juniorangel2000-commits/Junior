import type Phaser from 'phaser';
import {createHomeArt} from './home-art';
import {drawMerchantInterior} from './merchant-interior';
import type {SmithLayout} from './systems/smith-layout';
import {COMMUNITY_BEDS} from './data/community-room';
/** Reuse the game's timber floor, walls and residential furniture at their normal scale. */
export function drawCommunityRoom(scene:Phaser.Scene):{destroy():void}{
 const layout:SmithLayout={version:1,pieces:[
  {id:'structure',asset:'structure',x:0,y:0,sx:1,sy:1,visible:true,wallShade:.35},
  {id:'floor',asset:'floor-wood',x:33,y:116,sx:510,sy:234,visible:true},
 ]};
 const shell=drawMerchantInterior(scene,'celina',layout);createHomeArt(scene);
 const owned:Phaser.GameObjects.GameObject[]=[];
 for(const p of COMMUNITY_BEDS)owned.push(scene.add.image(p.x,p.y,'home-furniture-bed').setOrigin(0,1).setDisplaySize(54,74).setDepth(p.y));
 for(const [x,y,kind,w,h] of [[252,224,'table',72,80],[40,118,'shelf',90,76],[460,118,'shelf',76,70],[216,127,'plant',32,48],[332,127,'plant',32,48]] as const)
  owned.push(scene.add.image(x,y,'home-furniture-'+kind).setOrigin(0,1).setDisplaySize(w,h).setDepth(y));
 owned.push(scene.add.image(288,292,'home-furniture-rug').setDisplaySize(66,52).setDepth(-890));
 owned.push(scene.add.text(288,60,'CENTRO COMUNITÁRIO',{fontFamily:'Georgia',fontSize:'16px',color:'#eee2bd'}).setOrigin(.5).setDepth(1));
 return{destroy(){shell.destroy();owned.forEach(o=>o.destroy());}};
}
