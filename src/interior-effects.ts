import type Phaser from 'phaser';
import type {SmithAsset,SmithLayout,SmithPiece} from './systems/smith-layout';
import type {FixtureSource} from './fixture-lighting';

export interface InteriorEffectProfile {
 kind:'lamp'|'hearth'|'water'|'steam';
 /** Coordinates within visible sprite bounds, excluding atlas/PNG margins. */
 center?:readonly [number,number];
 radius?:number;
 strength?:number;
}
export interface InteriorEffectSource {
 asset:(id:string)=>SmithAsset|undefined;
 visible:(piece:SmithPiece)=>boolean;
 profiles:Readonly<Record<string,InteriorEffectProfile>>;
}
type PropSprite=Phaser.GameObjects.Image|Phaser.GameObjects.TileSprite;

/** One bounded loop per room; sprites, collisions and authored positions stay fixed. */
export function animateInteriorProps(scene:Phaser.Scene,data:SmithLayout,sprites:Map<string,PropSprite>,source:InteriorEffectSource):()=>void {
 const owned:Phaser.GameObjects.GameObject[]=[],masks:Phaser.Display.Masks.GeometryMask[]=[],updates:Array<(t:number)=>void>=[],lights:Array<{sprite:PropSprite;light:FixtureSource;previous:unknown}>=[];
 let elapsed=0,pending=0,stopped=false;
 const add=<T extends Phaser.GameObjects.GameObject>(o:T)=>{owned.push(o);return o;};
 for(const p of data.pieces){
  const profile=source.profiles[p.asset],sprite=sprites.get(p.id),a=source.asset(p.asset);
  if(!profile||!sprite||!a||!source.visible(p)||p.effects===false)continue;
  const b=a.bounds,w=b[2]-b[0],h=b[3]-b[1];
  const point=(u:number,v:number)=>({x:sprite.x+(b[0]+w*u-a.ox*a.w)*sprite.scaleX,y:sprite.y+(b[1]+h*v-a.oy*a.h)*sprite.scaleY});
  const drawing=add(scene.add.graphics().setData('smith-effect',p.id).setData('interior-effect',profile.kind).setData('interior-effect-owner',p.id));
  const cut=add(scene.make.graphics({x:0,y:0},false)),mask=cut.createGeometryMask();masks.push(mask);drawing.setMask(mask);
  const phase=[...p.id].reduce((n,c)=>(n*31+c.charCodeAt(0))%997,0)*7;
  let flame:Phaser.GameObjects.Image|undefined;
  if(profile.kind==='hearth'){
   flame=add(scene.add.image(sprite.x,sprite.y,sprite.texture.key,sprite.frame.name).setOrigin(a.ox,a.oy).setScale(sprite.scaleX,sprite.scaleY).setCrop(b[0]+w*.27,b[1]+h*.56,w*.46,h*.20));
   flame.setMask(mask);
  }
  let light:FixtureSource|undefined;
  if(profile.kind==='lamp'||profile.kind==='hearth'){
   light={radius:profile.radius??(profile.kind==='hearth'?65:40),always:true,strength:profile.strength??.8};
   lights.push({sprite,light,previous:sprite.getData('fixture-light')});sprite.setData('fixture-light',light);
  }
  updates.push(t=>{
   if(!drawing.active||!sprite.active)return;
   const visible=sprite.visible&&source.visible(p)&&p.effects!==false;
   drawing.setVisible(visible);flame?.setVisible(visible);if(!visible){if(light)light.strength=0;return;}
   const sx=sprite.scaleX,sy=sprite.scaleY,c=point(...(profile.center??(profile.kind==='water'?[.5,.285]:profile.kind==='hearth'?[.5,.68]:[.5,.65]))),time=t+phase;
   drawing.clear().setDepth(sprite.depth+.04);cut.clear().fillStyle(0xffffff);
   if(profile.kind==='steam'){
    const rise=Math.min(16,h*sy*.65),width=Math.min(12,w*sx*.4);cut.fillEllipse(c.x,c.y-rise*.5,width,rise*1.4);
    for(let i=0;i<3;i++){const q=(time*.00024+i/3)%1,x=c.x+Math.sin(time*.001+i*2)*width*.14,y=c.y-q*rise;drawing.lineStyle(.6,0xe4e8d9,(1-q)*.18).lineBetween(x,y,x+Math.sin(q*5+i)*width*.15,y-rise*.17);}
    return;
   }
   if(profile.kind==='water'){
    const rx=w*sx*.39,ry=h*sy*.15;cut.fillEllipse(c.x,c.y,rx*2,ry*2);
    for(let i=0;i<3;i++){const q=(time*.00024+i/3)%1;drawing.lineStyle(.65,0xa1edf0,(1-q)*.34).strokeEllipse(c.x+Math.sin(time*.001+i)*1.2,c.y,rx*2*q,ry*2*q);}
    drawing.lineStyle(.6,0xd7f8ed,.25).lineBetween(c.x-rx*.55,c.y+Math.sin(time*.002)*ry*.35,c.x-rx*.1,c.y+Math.sin(time*.002)*ry*.35);
    return;
   }
   const flicker=.78+Math.sin(time*.014)*.12+Math.sin(time*.027)*.1;
   if(profile.kind==='hearth'){
    const top=point(.27,.56);cut.fillRect(top.x,top.y,w*sx*.46,h*sy*.20);
    flame!.setPosition(sprite.x+Math.sin(time*.009)*.28,sprite.y-(Math.sin(time*.011)+1)*.65).setScale(sx,sy).setDepth(sprite.depth+.03).setAlpha(.65+flicker*.3);
    for(let i=0;i<5;i++){const q=(time*.00055+i*.21)%1;drawing.fillStyle(i%2?0xffc84b:0xffe690,(1-q)*.65).fillRect(Math.round(c.x+Math.sin(i*7+time*.002)*w*sx*.13),Math.round(c.y+5-q*14),1,1);}
   }else{
    cut.fillEllipse(c.x,c.y,w*sx*.52,h*sy*.31);
    drawing.fillStyle(0xffb139,.32+flicker*.15).fillRect(Math.round(c.x)-1,Math.round(c.y)-2,2,3);
    drawing.fillStyle(0xfff2b1,.5+flicker*.2).fillRect(Math.round(c.x+Math.sin(time*.01)*.4),Math.round(c.y)-1-Math.round(flicker),1,2);
   }
   light!.offsetX=c.x-sprite.x;light!.offsetY=c.y-sprite.y;light!.strength=(profile.strength??.8)*(.92+flicker*.08);
  });
 }
 const update=(_time:number,ms:number)=>{
  const delta=Number.isFinite(ms)?Math.max(0,Math.min(ms,100)):0;elapsed+=delta;pending+=delta;
  if(ms!==0&&pending<1000/30)return;pending=0;for(const f of updates)f(elapsed);
 };
 const stop=()=>{
  if(stopped)return;stopped=true;scene.events.off('update',update);scene.events.off('shutdown',stop);
  for(const {sprite,light,previous} of lights)if(sprite.active&&sprite.getData('fixture-light')===light){if(previous===undefined)sprite.data.remove('fixture-light');else sprite.setData('fixture-light',previous);}
  for(const o of owned)if(o.active)o.destroy();for(const mask of masks)mask.destroy();
 };
 if(updates.length){scene.events.on('update',update);scene.events.once('shutdown',stop);update(0,0);}
 return stop;
}
