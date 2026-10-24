import Phaser from 'phaser';
import { Player } from '../player';
import type { SaveData } from '../types';
import { saveGame } from '../systems/save';
import { advanceClock, GAME_MINUTES_PER_SECOND } from '../systems/clock';
import { Farming } from '../systems/farming';
import { directionFromVector, directionVector } from '../character-directions';
import { animalSprite, setupAnimalArt } from '../forest-art';
import { FOREST_ANIMALS, FOREST_ENTRY, FOREST_TREES, ANIMAL_NAMES, forestBlocked, forestWater, forestBridge, forestPathDistance, recruitAnimal } from '../data/ancient-forest';
import { gameAudio } from '../audio';
import { loadCameraZoom, saveCameraZoom, stepCameraZoom } from '../camera-zoom';
import '../forest.css';

export interface ForestStart { save: SaveData; onReturn: (save: SaveData, title?: boolean) => void }
export class ForestScene extends Phaser.Scene {
  private state!: SaveData;
  private player!: Player;
  private farming!: Farming;
  private onReturn!: ForestStart['onReturn'];
  private panel?: HTMLElement;
  private trees: Phaser.GameObjects.Image[]=[];
  private animals: Array<{id:string;x:number;y:number;sprite:Phaser.GameObjects.Sprite}> = [];
  private paused=false;
  private mapOpen=false;
  private leaving=false;
  private zoom=1;
  private elapsed=0;
  private messageUntil=0;
  private locationUntil=0;
  private marker!:Phaser.GameObjects.Arc;
  constructor(){super('Floresta');}
  create(data:ForestStart):void {
    this.state=structuredClone(data.save);this.state.activeArea='forest';this.onReturn=data.onReturn;
    this.paused=false;this.mapOpen=false;this.leaving=false;this.elapsed=0;this.locationUntil=this.time.now+10000;this.animals=[];this.trees=[];
    this.zoom=loadCameraZoom();this.farming=new Farming(this.state.crops);setupAnimalArt(this);
    this.drawGround();
    for(const t of FOREST_TREES){
      const key=`asset-${t.pine?'pine':'tree'}-${(t.x+t.y)%3}`;
      const sprite=this.add.image(t.x*32+16,t.y*32+25,key).setOrigin(.5,128/132).setScale(t.ancient?3.6:2.0).setDepth(t.y*32+25);
      this.trees.push(sprite);
    }
    for(const a of FOREST_ANIMALS)if(!this.state.recruitedAnimals?.includes(a.id))this.animals.push({id:a.id,x:a.x*32+16,y:a.y*32+16,sprite:animalSprite(this,a.kind,a.x*32+16,a.y*32+16)});
    const p=this.state.forestPosition;
    const valid=p&&!forestBlocked(Math.floor(p.x/32),Math.floor(p.y/32));
    this.player=new Player(this,this.state.profile,valid?p.x:(FOREST_ENTRY.x+.5)*32,valid?p.y:(FOREST_ENTRY.y+.5)*32,'forest-player');
    this.player.facing=directionVector(valid?p.direction??'up':'up');this.player.update(0,forestBlocked);
    this.marker=this.add.circle(this.player.x,this.player.y,16,0xffe68c).setStrokeStyle(4,0x3b2a1f).setDepth(10000).setVisible(false);
    this.add.text(48.5*32,69*32,'↓ Propriedade Abandonada', {fontFamily:'Georgia',fontSize:'17px',color:'#fff1ca',backgroundColor:'#443b29',padding:{x:9,y:6}}).setOrigin(.5).setDepth(2300);
    this.cameras.main.setBounds(0,0,3072,2304);this.applyCamera();this.cameras.main.fadeIn(300);
    this.panel=document.createElement('section');this.panel.className='forest-hud';
    this.panel.innerHTML=`<header><strong>Floresta Antiga</strong><span>Árvores antigas e novos companheiros</span><button data-action="map">Mapa · M</button><button data-action="minus">−</button><button data-action="plus">+</button><button data-action="pause">Pausar · Esc</button><button data-action="title">Salvar e sair</button></header><div class="forest-location">Floresta Antiga</div><div class="forest-pause" hidden>Partida pausada · Esc para continuar</div><footer><span class="forest-prompt"></span><small>WASD / setas: andar · E: acolher animal · saída ao sul</small></footer>`;
    document.body.append(this.panel);
    this.panel.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.onclick=()=>this.action(b.dataset.action!));
    this.input.keyboard!.on('keydown',this.key,this);this.input.on('wheel',this.wheel,this);
    this.scale.on('resize',this.applyCamera,this);
    window.addEventListener('pagehide',this.save);window.addEventListener('beforeunload',this.save);window.addEventListener('blur',this.blur);
    document.addEventListener('visibilitychange',this.visibility);
    this.events.once('shutdown',()=>{this.panel?.remove();this.input.keyboard?.off('keydown',this.key,this);this.input.off('wheel',this.wheel,this);this.scale.off('resize',this.applyCamera,this);window.removeEventListener('pagehide',this.save);window.removeEventListener('beforeunload',this.save);window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);});
    this.save();this.refreshPrompt();
  }
  private drawGround():void {
    if(!this.textures.exists('ancient-forest-ground')){
      const c=document.createElement('canvas');c.width=3072;c.height=2304;const g=c.getContext('2d')!;
      let seed=4729;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      for(let y=0;y<72;y++)for(let x=0;x<96;x++){
        const water=forestWater(x,y),path=forestPathDistance(x,y)<1.5,bridge=forestBridge(x,y);
        g.fillStyle=water?'#518d94':path?'#baa16d':'#718c4d';g.fillRect(x*32,y*32,32,32);
        for(let j=0;j<12;j++){g.fillStyle=water?'#91bbc066':path?'#e4c68a66':'#a8b96b66';g.fillRect(x*32+rnd()*30,y*32+rnd()*30,water?7:2,2);}
        if(bridge){g.fillStyle='#806344';g.fillRect(x*32,y*32,32,32);g.fillStyle='#c09d6d';for(let j=0;j<4;j++)g.fillRect(x*32+2,y*32+j*8+1,28,5);}
        if(!water&&!path&&rnd()<.16){g.fillStyle=rnd()<.5?'#e9d99a':'#bd94ae';g.fillRect(x*32+10,y*32+12,3,3);g.fillRect(x*32+22,y*32+24,3,3);}
      }
      this.textures.addCanvas('ancient-forest-ground',c)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    this.add.image(0,0,'ancient-forest-ground').setOrigin(0).setDepth(-100);
    // Small banks and rocks support the animal clearings without blocking paths.
    for(const [x,y] of [[16,13],[27,12],[19,19],[62,18],[62,12],[38,15],[80,49]])this.add.image(x*32,y*32,'asset-stone').setScale(1.3).setDepth(y*32);
  }
  private applyCamera():void {
    if(!this.player)return;
    if(this.mapOpen){this.cameras.main.stopFollow();this.cameras.main.removeBounds();this.cameras.main.setZoom(Math.min(this.scale.width/3072,(this.scale.height-130)/2304)).centerOn(1536,1152);}
    else {this.cameras.main.setBounds(0,0,3072,2304);this.cameras.main.setZoom(2*this.zoom).startFollow(this.player.sprite,false,1,1);this.cameras.main.centerOn(this.player.x,this.player.y);}
    this.marker?.setVisible(this.mapOpen);
  }
  private action(action:string):void {
    if(this.leaving)return;
    if(action==='map'){this.mapOpen=!this.mapOpen;this.messageUntil=0;this.applyCamera();this.refreshPrompt();}
    if(action==='minus'||action==='plus'){this.zoom=stepCameraZoom(this.zoom,action==='plus'?1:-1);saveCameraZoom(this.zoom);this.applyCamera();}
    if(action==='pause'){this.paused=!this.paused;this.input.keyboard?.resetKeys();this.panel!.querySelector<HTMLElement>('.forest-pause')!.hidden=!this.paused;}
    if(action==='title')this.leave(true);
  }
  private key(e:KeyboardEvent):void {
    if(e.repeat)return;
    if(e.key.toLowerCase()==='m')this.action('map');
    else if(e.key==='Escape')this.action('pause');
    else if(e.key==='+'||e.key==='=')this.action('plus');
    else if(e.key==='-')this.action('minus');
    else if(e.key.toLowerCase()==='e'&&!this.paused&&!this.mapOpen)this.interact();
  }
  private wheel=(_p:unknown,_objects:unknown,_dx:number,dy:number):void=>{if(!this.mapOpen&&!this.paused)this.action(dy<0?'plus':'minus');};
  private blur=():void=>{if(!this.paused)this.action('pause');this.save();};
  private visibility=():void=>{if(document.hidden)this.blur();};
  private nearExit():boolean{return Math.abs(this.player.x-48.5*32)<65&&this.player.y>67*32;}
  private nearest(){return this.animals.find(a=>Math.hypot(a.x-this.player.x,a.y-this.player.y)<64);}
  private interact():void {
    if(this.nearExit()){this.leave();return;}
    const a=this.nearest();if(!a)return;
    this.state.recruitedAnimals=recruitAnimal(this.state.recruitedAnimals??[],a.id);
    const info=FOREST_ANIMALS.find(x=>x.id===a.id)!;
    a.sprite.destroy();this.animals=this.animals.filter(x=>x!==a);gameAudio.play('pickup');
    this.panel!.querySelector('.forest-prompt')!.textContent=`${ANIMAL_NAMES[info.kind]} acolhido! Ele estará na sua propriedade.`;
    this.messageUntil=this.time.now+3000;this.save();
  }
  private refreshPrompt():void {
    if(this.time.now<this.messageUntil)return;
    const a=this.nearest(),info=a&&FOREST_ANIMALS.find(x=>x.id===a.id);
    this.panel!.querySelector('.forest-prompt')!.textContent=this.mapOpen?'Mapa da Floresta Antiga · ponto dourado: você · M para fechar':this.nearExit()?'E · Voltar à Propriedade Abandonada':info?`E · Acolher ${ANIMAL_NAMES[info.kind]}`:`Explore as clareiras · ${this.state.recruitedAnimals?.length??0}/${FOREST_ANIMALS.length} animais acolhidos`;
  }
  private save=():boolean=>{
    if(!this.player||this.leaving)return false;
    this.state.forestPosition={x:this.player.x,y:this.player.y,direction:directionFromVector(this.player.facing.x,this.player.facing.y)};
    this.state.crops=this.farming.crops.map(c=>({...c}));return saveGame(this.state);
  };
  private leave(title=false):void {
    if(this.leaving)return;this.save();this.leaving=true;
    if(!title){this.state.activeArea='property';this.state.forestPosition=undefined;}
    saveGame(this.state);this.cameras.main.fadeOut(250);
    this.time.delayedCall(250,()=>{const save=structuredClone(this.state);this.scene.stop();this.onReturn(save,title);});
  }
  update(_time:number,ms:number):void {
    if(!this.player||this.paused||this.mapOpen||this.leaving||document.hidden)return;
    const delta=Math.min(ms/1000,.1);this.player.update(delta,forestBlocked);this.farming.update(delta);
    Object.assign(this.state,advanceClock(this.state,delta*GAME_MINUTES_PER_SECOND));
    this.marker.setPosition(this.player.x,this.player.y);
    this.trees.forEach(t=>t.setAlpha(this.player.y<t.y&&Math.abs(this.player.x-t.x)<t.displayWidth*.4&&this.player.y>t.y-t.displayHeight*.85?.42:1));
    for(const a of this.animals)a.sprite.setFlipX(Math.sin(this.time.now/7000+a.x)>.7);
    this.refreshPrompt();this.elapsed+=delta;
    if(this.elapsed>=5){this.save();this.elapsed=0;}
    const title=this.panel?.querySelector<HTMLElement>('.forest-location');if(title&&this.time.now>this.locationUntil)title.hidden=true;
  }
}
