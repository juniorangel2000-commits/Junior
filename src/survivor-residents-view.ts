import type Phaser from 'phaser';
import type {SaveData} from './types';
import type {GameUI} from './ui';
import type {CampPerson,SurvivorArea} from './systems/survivor-camp';
import {survivorTexture} from './survivor-sprites';
import {survivorLook,survivorWalkFrame} from './data/survivor-looks';
import {registerSurvivorNavigation} from './systems/survivor-navigation';
import {showSurvivorHelp} from './survivor-dialog';
import {saveGame} from './systems/save';
interface Context {save:SaveData;area:SurvivorArea;player:{x:number;y:number};visible:boolean;blocked:(x:number,y:number)=>boolean}
/** One renderer shared by every map along a recruit's journey. Simulation lives in the background clock. */
export class SurvivorResidentsView {
 private sprites=new Map<string,{sprite:Phaser.GameObjects.Sprite;label:Phaser.GameObjects.Text;distance:number;cycle:number}>();
 private loading=false;
 private saved?:SaveData;
 private unregister?:()=>void;
 constructor(private scene:Phaser.Scene,private get:()=>Context,private ui:GameUI,private onChange:()=>void=()=>{}){scene.events.on('update',this.update,this);scene.events.once('shutdown',this.destroy,this);}
 private people():CampPerson[]{const c=this.get();return(c.save.survivorCamp?.residents??[]).filter(p=>(p.area??'survivorCamp')===c.area&&!p.homeInside);}
 nearest():CampPerson|undefined {const c=this.get();return c.visible?this.people().filter(p=>Math.hypot(p.x-c.player.x,p.y-c.player.y)<78).sort((a,b)=>Math.hypot(a.x-c.player.x,a.y-c.player.y)-Math.hypot(b.x-c.player.x,b.y-c.player.y))[0]:undefined;}
 interact():boolean{const p=this.nearest();if(!p||this.ui.isModalOpen())return false;showSurvivorHelp(this.ui,this.get().save,p.id,saveGame,this.onChange);return true;}
 blocked(x:number,y:number):boolean{return this.get().visible&&this.people().some(p=>Math.abs(p.x-x)<10&&Math.abs(p.y-y)<6);}
 private update():void {
  const c=this.get();if(!c.save||!c.player)return;
  if(this.saved!==c.save){this.unregister?.();this.saved=c.save;this.unregister=registerSurvivorNavigation(c.save,c.area,c.blocked);}
  const people=this.people();if(people.length&&!this.scene.textures.exists('camp-look-male')&&!this.loading){this.loading=true;for(const sex of ['male','female'])if(!this.scene.textures.exists('camp-look-'+sex))this.scene.load.image('camp-look-'+sex,'assets/visual/survivor-camp/'+sex+'-idle.png');this.scene.load.once('complete',()=>{this.loading=false;});if(!this.scene.load.isLoading())this.scene.load.start();}
  const ids=new Set<string>();for(const p of people){if(!this.scene.textures.exists('camp-look-male')||!this.scene.textures.exists('camp-look-female'))continue;ids.add(p.id);let a=this.sprites.get(p.id);const look=survivorLook(p.character,p.name);if(!a){a={sprite:this.scene.add.sprite(p.x,p.y,survivorTexture(this.scene,look),0).setOrigin(.5,1).setDisplaySize(48,64),label:this.scene.add.text(p.x,p.y-66,p.name+' · aliado',{fontSize:'12px',fontFamily:'Georgia',color:'#f6efd8',backgroundColor:'#243b2bd9',padding:{x:5,y:3}}).setOrigin(.5,1),distance:p.distance,cycle:0};this.sprites.set(p.id,a);}const moving=p.distance>a.distance+.001;a.cycle=moving?(a.cycle+p.distance-a.distance)%48:0;a.distance=p.distance;a.sprite.setPosition(p.x,p.y).setDepth(p.y).setFrame(survivorWalkFrame(look,p.direction,a.cycle,moving)).setVisible(c.visible);a.label.setPosition(p.x,p.y-66).setDepth(p.y+2).setVisible(c.visible&&Math.hypot(c.player.x-p.x,c.player.y-p.y)<180);}
  for(const[id,a]of this.sprites)if(!ids.has(id)){a.sprite.destroy();a.label.destroy();this.sprites.delete(id);}
 }
 destroy():void{this.unregister?.();this.saved=undefined;this.scene.events.off('update',this.update,this);this.scene.events.off('shutdown',this.destroy,this);for(const a of this.sprites.values()){a.sprite.destroy();a.label.destroy();}this.sprites.clear();}
}
