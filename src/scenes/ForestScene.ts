import Phaser from 'phaser';
import { Player } from '../player';
import type { SaveData } from '../types';
import { saveGame } from '../systems/save';
import { advanceClock, GAME_MINUTES_PER_SECOND } from '../systems/clock';
import { Farming } from '../systems/farming';
import { directionFromVector, directionVector } from '../character-directions';
import { animalSprite, setupAnimalArt } from '../forest-art';
import { FOREST_ANIMALS, FOREST_ENTRY, FOREST_TREES, ANIMAL_NAMES, forestBlocked, forestWater, forestBridge, forestClearing, forestPathDistance, recruitAnimal } from '../data/ancient-forest';
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
    this.drawWoodlandDetails();
    for(const t of FOREST_TREES){
      const key=`asset-${t.pine?'pine':'tree'}-${(t.x+t.y)%3}`;
      const sprite=this.add.image(t.x*32+16,t.y*32+25,key).setOrigin(.5,128/132).setScale((t.ancient?3.6:2.0)/(this.textures.exists('reference-trees-source')?2:1)).setDepth(t.y*32+25);
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
    // Small cached terrain chunks avoid a single oversized canvas/GPU upload.
    const samples=new Map<string,CanvasImageSource>();
    for(const material of ['water','path-dry','meadow','forest']){
      const key=`asset-ground-${material}`;
      if(this.textures.exists(key))samples.set(material,this.textures.get(key).getSourceImage() as HTMLCanvasElement);
    }
    for(let cy=0;cy<9;cy++)for(let cx=0;cx<12;cx++){
      const key=`forest-ground-${cx}-${cy}`;
      if(!this.textures.exists(key)){
        const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
        const g=canvas.getContext('2d',{willReadFrequently:true})!;g.imageSmoothingEnabled=false;
        for(let ty=0;ty<8;ty++)for(let tx=0;tx<8;tx++){
          const x=cx*8+tx,y=cy*8+ty,water=forestWater(x,y),path=forestPathDistance(x,y)<1.5;
          const material=water?'water':path?'path-dry':forestClearing(x,y)?'meadow':'forest';
          g.fillStyle=water?'#3c878f':path?'#b18955':'#416531';g.fillRect(tx*32,ty*32,32,32);
          const source=samples.get(material);
          if(source)g.drawImage(source,(x%3)*32,(y%3)*32,32,32,tx*32,ty*32,32,32);
          let seed=(Math.imul(x+19,73856093)^Math.imul(y+7,19349663))>>>0;
          const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
          if(path&&!water)for(let j=0;j<9;j++){
            const px=tx*32+Math.floor(rnd()*28),py=ty*32+Math.floor(rnd()*28),w=3+Math.floor(rnd()*4);
            g.fillStyle='#735936';g.fillRect(px,py+1,w,3);g.fillStyle=j%2?'#c4a364':'#ac8c53';g.fillRect(px,py,w-1,2);
          }
          if(forestBridge(x,y)){
            g.fillStyle='#806344';g.fillRect(tx*32,ty*32,32,32);g.fillStyle='#c09d6d';
            for(let j=0;j<4;j++)g.fillRect(tx*32+2,ty*32+j*8+1,28,5);
          }
        }
        this.textures.addCanvas(key,canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
      this.add.image(cx*256,cy*256,key).setOrigin(0).setDepth(-100);
    }
  }
  private drawWoodlandDetails():void {
    const detail=(kind:string,x:number,y:number,size:number)=>{
      const key=`forest-detail-${kind}`;if(!this.textures.exists(key))return;
      this.add.image(x*32+16,y*32+25,key).setOrigin(.5,124/128).setDisplaySize(size,size).setDepth(y*32+25);
    };
    // Soft vegetation is walk-through; large wood rests against existing blocked trunks.
    for(let y=3;y<69;y+=2)for(let x=3;x<94;x+=2){
      const seed=(Math.imul(x,73856093)^Math.imul(y,19349663))>>>0;
      if(forestWater(x,y)||forestPathDistance(x,y)<1.8)continue;
      const shore=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>forestWater(x+dx,y+dy));
      if(shore){detail(seed%3?'shore':'reeds',x,y,seed%3?38:46);continue;}
      if(seed%7===0)detail('fern',x,y,36);
      else if(seed%11===0)detail('flowers',x,y,30);
      else if(seed%23===0)detail('mushrooms',x,y,26);
    }
    FOREST_TREES.forEach((t,i)=>{
      if(t.ancient)return;
      if(i%17===0)detail('log',t.x,t.y,58);
      else if(i%13===0)detail('stump',t.x,t.y,36);
      else if(i%7===0)detail('bush',t.x+.5,t.y,45);
    });
    for(const [x,y] of [[16,13],[27,12],[19,19],[62,18],[62,12],[38,15],[80,49]])detail('boulder',x,y,46);
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
