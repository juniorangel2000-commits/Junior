import type Phaser from 'phaser';
const active=new WeakMap<Phaser.Scene,()=>void>();
/** Adults sway around their existing root pivot. One culled loop serves the whole scene. */
export function setupTreeWind(scene:Phaser.Scene):void{
 if(active.has(scene)||scene.sys.settings.key==='Editor')return;
 const trees=new Map<Phaser.GameObjects.Image,{rotation:number;phase:number}>();let elapsed=0,scan=0,pending=0;
 const update=(_time:number,ms:number)=>{
  const dt=Number.isFinite(ms)?Math.max(0,Math.min(ms,100)):0;elapsed+=dt;pending+=dt;if(pending<50)return;pending%=50;
  if(elapsed>=scan){scan=elapsed+500;for(const o of scene.children.list){const t=o as Phaser.GameObjects.Image;if(t.texture&&/^asset-(tree|pine)(-[0-2])?$/.test(t.texture.key)&&!trees.has(t))trees.set(t,{rotation:t.rotation,phase:((Math.round(t.x)*17+Math.round(t.y)*11)%1000)/100});}}
  const view=scene.cameras.main.worldView;
  for(const [tree,base] of trees){if(!tree.active){trees.delete(tree);continue;}const visible=tree.visible&&tree.x>view.x-220&&tree.x<view.right+220&&tree.y>view.y-40&&tree.y<view.bottom+260;
   tree.setRotation(visible?base.rotation+Math.sin(elapsed*.00085+base.phase)*.004+Math.sin(elapsed*.0017+base.phase*1.7)*.002:base.rotation);
  }
 };
 const stop=()=>{scene.events.off('update',update);scene.events.off('shutdown',stop);for(const[t,b]of trees)if(t.active)t.setRotation(b.rotation);trees.clear();active.delete(scene);};
 active.set(scene,stop);scene.events.on('update',update);scene.events.once('shutdown',stop);
}
