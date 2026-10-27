import Phaser from 'phaser';
import {smithAsset,smithPieceVisible,type SmithLayout} from './systems/smith-layout';

/** Effects stay inside the glass, hearth and water surface; architecture is still. */
export function animateSmithProps(scene:Phaser.Scene,data:SmithLayout,sprites:Map<string,Phaser.GameObjects.Image|Phaser.GameObjects.TileSprite>):()=>void{
 const owned:Phaser.GameObjects.GameObject[]=[],updates:Array<(t:number)=>void>=[];let elapsed=0;
 const add=<T extends Phaser.GameObjects.GameObject>(o:T)=>{owned.push(o);return o;};
 for(const p of data.pieces){if(!smithPieceVisible(data,p)||p.effects===false)continue;const sprite=sprites.get(p.id)!,a=smithAsset(p.asset)!,b=a.bounds,w=b[2]-b[0],h=b[3]-b[1];
  if(!['fornalha_completa','tanque_resfriamento','lamparina','lamparina_loja','lampiao_balcao'].includes(p.asset))continue;
  const point=(u:number,v:number)=>({x:sprite.x+(b[0]+w*u-a.ox*a.w)*p.sx,y:sprite.y+(b[1]+h*v-a.oy*a.h)*p.sy});
  const drawing=add(scene.add.graphics().setData('smith-effect',p.id)),cut=add(scene.make.graphics({x:0,y:0},false));drawing.setMask(cut.createGeometryMask());
  if(p.asset==='tanque_resfriamento'){
   updates.push(t=>{if(!drawing.active||!sprite.active)return;const c=point(.5,.285),rx=w*p.sx*.39,ry=h*p.sy*.15;cut.clear().fillStyle(0xffffff).fillEllipse(c.x,c.y,rx*2,ry*2);drawing.clear().setDepth(sprite.depth+.02);for(let i=0;i<3;i++){const phase=(t*.00024+i/3)%1;drawing.lineStyle(.65,0xa1edf0,(1-phase)*.34).strokeEllipse(c.x+Math.sin(t*.001+i)*1.2,c.y,rx*2*phase,ry*2*phase);}drawing.lineStyle(.6,0xd7f8ed,.25).lineBetween(c.x-rx*.55,c.y+Math.sin(t*.002)*ry*.35,c.x-rx*.1,c.y+Math.sin(t*.002)*ry*.35);});
  }else{
   const furnace=p.asset==='fornalha_completa',glass=p.asset==='lampiao_balcao'?.56:.65;
   let flame:Phaser.GameObjects.Image|undefined;
   if(furnace){flame=add(scene.add.image(p.x,p.y,'smith-layout-'+p.asset).setOrigin(a.ox,a.oy).setScale(p.sx,p.sy).setCrop(b[0]+w*.27,b[1]+h*.56,w*.46,h*.20));flame.setMask(cut.createGeometryMask());}
   updates.push(t=>{if(!drawing.active||!sprite.active)return;const c=point(.5,furnace?.68:glass),flicker=.78+Math.sin(t*.014)*.12+Math.sin(t*.027)*.1;drawing.clear().setDepth(sprite.depth+.04);cut.clear().fillStyle(0xffffff);
    if(furnace){const top=point(.27,.56);cut.fillRect(top.x,top.y,w*p.sx*.46,h*p.sy*.20);flame!.setPosition(sprite.x+Math.sin(t*.009)*.28,sprite.y-(Math.sin(t*.011)+1)*.65).setDepth(sprite.depth+.03).setAlpha(.65+flicker*.3);for(let i=0;i<5;i++){const q=(t*.00055+i*.21)%1;drawing.fillStyle(i%2?0xffc84b:0xffe690,(1-q)*.65).fillRect(Math.round(c.x+Math.sin(i*7+t*.002)*w*p.sx*.13),Math.round(c.y+5-q*14),1,1);}}
    else{cut.fillEllipse(c.x,c.y,w*p.sx*.52,h*p.sy*.31);drawing.fillStyle(0xffb139,.45).fillRect(Math.round(c.x)-1,Math.round(c.y)-2,2,3);drawing.fillStyle(0xfff2b1,.5+flicker*.2).fillRect(Math.round(c.x+Math.sin(t*.01)*.4),Math.round(c.y)-1-Math.round(flicker),1,2);}
    sprite.setData('fixture-light',{offsetX:c.x-sprite.x,offsetY:c.y-sprite.y,radius:furnace?65:40,always:true,strength:.8});
   });
  }
 }
 const update=(_time:number,ms:number)=>{elapsed+=Math.min(ms,100);for(const f of updates)f(elapsed);};scene.events.on('update',update);update(0,0);
 return()=>{scene.events.off('update',update);for(const o of owned)o.destroy();};
}
