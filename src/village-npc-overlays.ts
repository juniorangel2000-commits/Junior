import type Phaser from 'phaser';
import './village-npc-overlays.css';
export interface NpcOverlayActor {id:string;name:string;role:string;sprite:Phaser.GameObjects.Sprite}
export interface NpcOverlayState {actors:readonly NpcOverlayActor[];blocked:boolean;speech?:{id:string;text:string}}
/** DOM text stays crisp at every camera zoom. Reuses the HUD's paper and timber
 * frame; only the world anchor is transformed, never the text itself. */
export class VillageNpcOverlays {
 private root=document.createElement('div');
 private name=document.createElement('div');
 private speech=document.createElement('div');
 private cursor?:{x:number;y:number};
 private overCanvas=false;
 constructor(private scene:Phaser.Scene,private state:()=>NpcOverlayState){
  this.root.className='village-npc-overlays';this.root.dataset.npcScene=this.scene.sys.settings.key;this.root.setAttribute('aria-live','off');
  this.name.className='village-npc-name';this.name.setAttribute('role','tooltip');this.name.hidden=true;
  this.speech.className='village-npc-speech';this.speech.setAttribute('role','status');this.speech.hidden=true;
  this.root.append(this.name,this.speech);(document.querySelector('#ui .hud')??document.querySelector('#ui')!).prepend(this.root);
  window.addEventListener('pointermove',this.pointer,true);window.addEventListener('blur',this.blur);window.addEventListener('pointerout',this.leave,true);
  this.scene.game.events.on('postrender',this.draw);
 }
 private pointer=(event:PointerEvent)=>{this.cursor={x:event.clientX,y:event.clientY};this.overCanvas=event.target===this.scene.game.canvas;};
 private leave=(event:PointerEvent)=>{if(!event.relatedTarget)this.blur();};
 private blur=()=>{this.overCanvas=false;this.name.hidden=true;};
 private draw=()=>{
  const {actors,blocked,speech}=this.state();
  if(!this.scene.sys.isActive()){this.root.remove();return;}
  if(blocked){this.name.hidden=true;this.speech.hidden=true;return;}
  if((!this.cursor||!this.overCanvas)&&!speech){this.name.hidden=true;this.speech.hidden=true;return;}
  if(!this.root.isConnected)(document.querySelector('#ui .hud')??document.querySelector('#ui'))?.prepend(this.root);
  const camera=this.scene.cameras.main,rect=this.scene.game.canvas.getBoundingClientRect(),host=this.root.getBoundingClientRect();
  if(!rect.width||!rect.height)return;const scaleX=rect.width/this.scene.scale.width,scaleY=rect.height/this.scene.scale.height;
  const visible=actors.filter(a=>a.sprite.visible&&a.sprite.active);let named=false;
  if(this.cursor&&this.overCanvas){
   const screenX=(this.cursor.x-rect.left)/scaleX,screenY=(this.cursor.y-rect.top)/scaleY;
   if(screenX>=camera.x&&screenX<camera.x+camera.width&&screenY>=camera.y&&screenY<camera.y+camera.height){
    const world=camera.getWorldPoint(screenX,screenY);
    const hovered=visible.filter(a=>a.sprite.getBounds().contains(world.x,world.y)).sort((a,b)=>b.sprite.depth-a.sprite.depth)[0];
    if(hovered){
     if(this.name.dataset.npcHover!==hovered.id){const title=document.createElement('strong'),role=document.createElement('small');title.textContent=hovered.name;role.textContent=hovered.role;this.name.replaceChildren(title,role);this.name.dataset.npcHover=hovered.id;}
     named=true;this.name.hidden=false;const width=this.name.offsetWidth,height=this.name.offsetHeight;
     this.name.style.left=Math.max(8,Math.min(host.width-width-8,this.cursor.x-host.left+14))+'px';
     this.name.style.top=Math.max(8,Math.min(host.height-height-8,this.cursor.y-host.top+16))+'px';
    }
   }
  }
  if(!named)this.name.hidden=true;
  const speaker=speech&&visible.find(a=>a.id===speech.id);if(!speaker||!speech){this.speech.hidden=true;return;}
  const point={x:rect.left-host.left+(camera.x+(speaker.sprite.x-camera.worldView.x)*camera.zoom)*scaleX,y:rect.top-host.top+(camera.y+(speaker.sprite.getBounds().top-camera.worldView.y)*camera.zoom)*scaleY};
  if(point.x<0||point.x>host.width||point.y<0||point.y>host.height){this.speech.hidden=true;return;}
  if(this.speech.textContent!==speech.text)this.speech.textContent=speech.text;this.speech.dataset.npcSpeaker=speaker.id;this.speech.setAttribute('aria-label','Fala de '+speaker.name);this.speech.hidden=false;
  const width=this.speech.offsetWidth,height=this.speech.offsetHeight,left=Math.max(8,Math.min(host.width-width-8,point.x-width/2));
  this.speech.style.left=left+'px';this.speech.style.top=Math.max(8,point.y-height-16)+'px';this.speech.style.setProperty('--speech-tail',Math.max(14,Math.min(width-14,point.x-left))+'px');
 };
 destroy():void{this.scene.game.events.off('postrender',this.draw);window.removeEventListener('pointermove',this.pointer,true);window.removeEventListener('blur',this.blur);window.removeEventListener('pointerout',this.leave,true);this.root.remove();}
}
