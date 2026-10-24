import { MapEditor } from '../map-editor';
import { emptyMapEdits, isProtectedMapTile, type MapEditData, type EditorObjectKind } from '../systems/map-editor';
import type { WorldEditorObject } from '../world';
import { natureArt } from '../data/nature-catalog';
import { drawMapTerrainEdits } from '../map-editor-terrain';
import { addWaterMotion } from '../water-motion';
import Phaser from 'phaser';
import { Player } from '../player';
import type { SaveData } from '../types';
import { saveGame } from '../systems/save';
import { advanceClock, GAME_MINUTES_PER_SECOND } from '../systems/clock';
import { Farming } from '../systems/farming';
import { directionFromVector, directionVector } from '../character-directions';
import { animalSprite, setupAnimalArt } from '../forest-art';
import { FOREST_ANIMALS, FOREST_ENTRY, FOREST_TREES, ANIMAL_NAMES, forestWater, FOREST_ROCKS, forestPathDistance, forestTreeAppearance, recruitAnimal } from '../data/ancient-forest';
import { gameAudio } from '../audio';
import { loadCameraZoom, saveCameraZoom, stepCameraZoom } from '../camera-zoom';
import '../forest.css';
import { readTerrainSprites } from '../terrain-sprites';
import { forestGroundPixels } from '../forest-ground';

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
  private mapEditor?:MapEditor;
  private environment:Phaser.GameObjects.GameObject[]=[];
  private editorObjects:WorldEditorObject[]=[];
  private originalObjects:WorldEditorObject[]=[];
  private solid=new Set<string>();
  private edits?:MapEditData;
  private waterAt=(x:number,y:number):boolean=>{const terrain=this.edits?.terrain[`${x},${y}`];return terrain?terrain==='water':forestWater(x,y);};
  private blockedAt=(x:number,y:number):boolean=>x<1||y<1||x>=95||y>=71||this.waterAt(x,y)||this.solid.has(`${x},${y}`);
  private entry(){return this.edits?.points?.entry??FOREST_ENTRY;}
  private exit(){return this.edits?.points?.exit??{x:48,y:69};}
  constructor(){super('Floresta');}

  create(data:ForestStart):void {
    this.state=structuredClone(data.save);this.state.activeArea='forest';this.onReturn=data.onReturn;
    this.paused=false;this.mapOpen=false;this.leaving=false;this.elapsed=0;this.locationUntil=this.time.now+10000;this.animals=[];this.trees=[];
    this.zoom=loadCameraZoom();this.farming=new Farming(this.state.crops);setupAnimalArt(this);
    this.environment=[];this.mapEditor=undefined;
    this.rebuildEnvironment();this.originalObjects=this.editorObjects.map(o=>({...o}));
    if(this.state.forestMapEdits)this.rebuildEnvironment(this.state.forestMapEdits);
    for(const a of FOREST_ANIMALS)if(!this.state.recruitedAnimals?.includes(a.id))this.animals.push({id:a.id,x:a.x*32+16,y:a.y*32+16,sprite:animalSprite(this,a.kind,a.x*32+16,a.y*32+16)});
    const p=this.state.forestPosition;
    const valid=p&&!this.blockedAt(Math.floor(p.x/32),Math.floor(p.y/32));
    this.player=new Player(this,this.state.profile,valid?p.x:(this.entry().x+.5)*32,valid?p.y:(this.entry().y+.5)*32,'forest-player');
    this.player.facing=directionVector(valid?p.direction??'up':'up');this.player.update(0,this.blockedAt);
    this.marker=this.add.circle(this.player.x,this.player.y,16,0xffe68c).setStrokeStyle(4,0x3b2a1f).setDepth(10000).setVisible(false);

    this.cameras.main.setBounds(0,0,3072,2304);this.applyCamera();this.cameras.main.fadeIn(300);
    this.panel=document.createElement('section');this.panel.className='forest-hud';
    this.panel.innerHTML=`<header><strong>Floresta Antiga</strong><span>Árvores antigas e novos companheiros</span><button data-action="editor">Editar · F2</button><button data-action="map">Mapa · M</button><button data-action="minus">−</button><button data-action="plus">+</button><button data-action="pause">Pausar · Esc</button><button data-action="title">Salvar e sair</button></header><div class="forest-location">Floresta Antiga</div><div class="forest-pause" hidden>Partida pausada · Esc para continuar</div><footer><span class="forest-prompt"></span><small>WASD / setas: andar · E: acolher animal · saída sinalizada</small></footer>`;
    document.body.append(this.panel);
    this.panel.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.onclick=()=>this.action(b.dataset.action!));
    this.input.keyboard!.on('keydown',this.key,this);this.input.on('wheel',this.wheel,this);
    this.scale.on('resize',this.applyCamera,this);
    window.addEventListener('pagehide',this.save);window.addEventListener('beforeunload',this.save);window.addEventListener('blur',this.blur);
    document.addEventListener('visibilitychange',this.visibility);
    this.events.once('shutdown',()=>{this.mapEditor?.destroy();this.mapEditor=undefined;this.panel?.remove();this.input.keyboard?.off('keydown',this.key,this);this.input.off('wheel',this.wheel,this);this.scale.off('resize',this.applyCamera,this);window.removeEventListener('pagehide',this.save);window.removeEventListener('beforeunload',this.save);window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);});
    this.save();this.refreshPrompt();
  }
  private addEnvironmentObject(id:string,kind:EditorObjectKind,x:number,y:number,texture:string,width:number,height:number,pivot:number,solid:boolean,flip=false):void {
    const edit=this.edits?.objects[id];if(edit?.removed)return;
    x=edit?.x??x;y=edit?.y??y;
    if(this.editorObjects.some(o=>o.x===x&&o.y===y)||this.waterAt(x,y)&&!natureArt(kind)?.water)return;
    const sprite=this.add.image(x*32+16,y*32+25,texture).setOrigin(.5,pivot).setDisplaySize(width,height).setFlipX(flip).setDepth(y*32+25);
    this.editorObjects.push({id,kind,x,y,texture});if(solid)this.solid.add(`${x},${y}`);
    if(kind==='standingTree'||kind==='pine'||kind.startsWith('oak')||kind.startsWith('pine'))this.trees.push(sprite);
  }
  private rebuildEnvironment(edits?:MapEditData):void {
    this.environment.forEach(o=>o.destroy());this.environment=[];this.editorObjects=[];this.trees=[];this.solid.clear();this.edits=edits;
    const before=new Set(this.children.list);
    this.drawGround();
    if(edits)drawMapTerrainEdits(this,edits.terrain,'forest-map-edits',forestWater);
    addWaterMotion(this,this.waterAt);
    for(const t of FOREST_TREES){
      const art=forestTreeAppearance(t),scale=art.scale/(this.textures.exists('reference-trees-source')?2:1),texture=`asset-${t.pine?'pine':'tree'}-${art.variant}`;
      const source=this.textures.get(texture).getSourceImage() as HTMLCanvasElement;
      this.addEnvironmentObject(`standingTree-${t.x}-${t.y}`,t.pine?'pine':'standingTree',t.x,t.y,texture,source.width*scale,source.height*scale,128/132,true,art.flip);
    }
    for(const r of FOREST_ROCKS){
      const kind=(`lakeRock${String.fromCharCode(65+r.variant)}`) as EditorObjectKind,art=natureArt(kind)!;
      this.addEnvironmentObject(`${kind}-${r.x}-${r.y}`,kind,r.x,r.y,art.texture,art.width,art.height,art.pivot,true);
    }
    this.drawWoodlandDetails();
    for(const [id,edit] of Object.entries(edits?.objects??{})){
      if(!id.startsWith('editor-')||!edit.kind||edit.removed)continue;
      const art=natureArt(edit.kind);
      const fallback:Record<string,string>={standingTree:'asset-tree-0',pine:'asset-pine-0',stone:'asset-stone',vein:'asset-vein',tree:'asset-branch',fiber:'asset-fiber',seeds:'asset-seeds',scrap:'asset-scrap'};
      const tree=edit.kind==='standingTree'||edit.kind==='pine';
      this.addEnvironmentObject(id,edit.kind,edit.x,edit.y,art?.texture??fallback[edit.kind],art?.width??(tree?166:32),art?.height??(tree?211:32),art?.pivot??(tree?128/132:1),art?.solid??tree);
    }
    const exit=this.exit();this.add.text((exit.x+.5)*32,(exit.y+.5)*32,'Propriedade Abandonada',{fontFamily:'Georgia',fontSize:'17px',color:'#fff1ca',backgroundColor:'#443b29',padding:{x:9,y:6}}).setOrigin(.5).setDepth(exit.y*32+30);
    this.environment=this.children.list.filter(o=>!before.has(o));
  }
  private openMapEditor():void {
    if(this.mapEditor||this.leaving)return;
    const original=this.state.forestMapEdits?structuredClone(this.state.forestMapEdits):undefined;
    const initial=original??emptyMapEdits('forest');this.paused=true;this.mapOpen=false;
    this.input.keyboard?.resetKeys();this.panel!.hidden=true;this.player.sprite.setVisible(false);this.marker.setVisible(false);
    const close=(edits:MapEditData|undefined)=>{
      this.mapEditor?.destroy();this.mapEditor=undefined;this.rebuildEnvironment(edits);this.paused=false;
      if(this.blockedAt(Math.floor(this.player.x/32),Math.floor(this.player.y/32))){this.player.x=(this.entry().x+.5)*32;this.player.y=(this.entry().y+.5)*32;}
      this.player.sprite.setVisible(true);this.panel!.hidden=false;this.panel!.querySelector<HTMLElement>('.forest-pause')!.hidden=true;this.applyCamera();this.input.keyboard?.resetKeys();
    };
    this.mapEditor=new MapEditor(this,initial,{
      rebuild:edits=>this.rebuildEnvironment(edits),objects:()=>this.editorObjects,originalObjects:this.originalObjects,
      protectedTile:(x,y)=>isProtectedMapTile(x,y,'forest'),baseWater:forestWater,
      defaultPoints:{entry:FOREST_ENTRY,exit:{x:48,y:69}},
      canPlace:(x,y,id,kind)=>!this.blockedAt(x,y)||this.editorObjects.some(o=>o.id===id&&o.x===x&&o.y===y)||!!natureArt(kind)?.water&&this.waterAt(x,y),
      apply:edits=>{
        const previous=this.state.forestMapEdits;this.state.forestMapEdits=structuredClone(edits);
        if(!saveGame(this.state)){this.state.forestMapEdits=previous;return false;}
        close(edits);this.save();return true;
      },cancel:()=>close(original),
    });
  }
  private drawGround():void {
    // Small cached terrain chunks avoid a single oversized canvas/GPU upload.
    const sprites=readTerrainSprites(this);
    for(let cy=0;cy<9;cy++)for(let cx=0;cx<12;cx++){
      const key=`forest-ground-woodland-${cx}-${cy}`;
      if(!this.textures.exists(key)){
        const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
        const g=canvas.getContext('2d',{willReadFrequently:true})!;g.imageSmoothingEnabled=false;
        const pixels=g.createImageData(256,256);pixels.data.set(forestGroundPixels(sprites,cx*256,cy*256));g.putImageData(pixels,0,0);
        for(let ty=0;ty<8;ty++)for(let tx=0;tx<8;tx++){
          const x=cx*8+tx,y=cy*8+ty,water=forestWater(x,y);
          let seed=(Math.imul(x+19,73856093)^Math.imul(y+7,19349663))>>>0;
          const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
          if(!water&&forestPathDistance(x,y)<2.3){
            const colors=['#666746','#7c784c','#8b8151','#5e6040','#747b49','#8b7447'];
            for(let j=0;j<30;j++){
              const px=tx*32+4+Math.floor(rnd()*24),py=ty*32+4+Math.floor(rnd()*24);
              const distance=forestPathDistance(cx*8+px/32-.5,cy*8+py/32-.5);
              if(distance>2.1||rnd()>(distance<.65?.28:distance<1.7?.88:.45))continue;
              const color=colors[Math.floor(rnd()*colors.length)],vertical=rnd()>.5;
              // Compact leaf silhouettes with subtle veins, without heavy outlines.
              g.fillStyle=color;
              if(vertical){
                g.fillRect(px+2,py-2,2,1);g.fillRect(px+1,py-1,4,4);g.fillRect(px+2,py+3,2,2);
                g.fillStyle='#78734c';g.fillRect(px+2,py+1,1,2);
              }else{
                g.fillRect(px,py,2,2);g.fillRect(px+2,py-1,3,4);g.fillRect(px+5,py,2,2);
                g.fillStyle='#78734c';g.fillRect(px+2,py+1,2,1);
              }
            }
          }

        }
        this.textures.addCanvas(key,canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
      this.add.image(cx*256,cy*256,key).setOrigin(0).setDepth(-100);
    }
  }
  private drawWoodlandDetails():void {
    const detail=(kind:string,x:number,y:number,size:number)=>{
      const kinds:Record<string,EditorObjectKind>={boulder:'mossBoulder',log:'fallenLog',stump:'stump',fern:'fern',flowers:'whiteFlowers',bush:'bush',shore:'shoreStones',reeds:'reeds',mushrooms:'mushrooms'};
      const k=kinds[kind];x=Math.floor(x);y=Math.floor(y);
      if(FOREST_TREES.some(t=>t.x===x&&t.y===y)||FOREST_ROCKS.some(r=>r.x===x&&r.y===y))return;
      this.addEnvironmentObject(`${k}-${x}-${y}`,k,x,y,`forest-detail-${kind}`,size,size,124/128,false);
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
    if(!this.player||this.mapEditor)return;
    if(this.mapOpen){this.cameras.main.stopFollow();this.cameras.main.removeBounds();this.cameras.main.setZoom(Math.min(this.scale.width/3072,(this.scale.height-130)/2304)).centerOn(1536,1152);}
    else {this.cameras.main.setBounds(0,0,3072,2304);this.cameras.main.setZoom(2*this.zoom).startFollow(this.player.sprite,false,1,1);this.cameras.main.centerOn(this.player.x,this.player.y);}
    this.marker?.setVisible(this.mapOpen);
  }
  private action(action:string):void {
    if(this.leaving||this.mapEditor)return;
    if(action==='editor'){this.openMapEditor();return;}
    if(action==='map'){this.mapOpen=!this.mapOpen;this.messageUntil=0;this.applyCamera();this.refreshPrompt();}
    if(action==='minus'||action==='plus'){this.zoom=stepCameraZoom(this.zoom,action==='plus'?1:-1);saveCameraZoom(this.zoom);this.applyCamera();}
    if(action==='pause'){this.paused=!this.paused;this.input.keyboard?.resetKeys();this.panel!.querySelector<HTMLElement>('.forest-pause')!.hidden=!this.paused;}
    if(action==='title')this.leave(true);
  }
  private key(e:KeyboardEvent):void {
    if(e.repeat||this.mapEditor)return;
    if(e.key==='F2'){e.preventDefault();this.openMapEditor();return;}
    if(e.key.toLowerCase()==='m')this.action('map');
    else if(e.key==='Escape')this.action('pause');
    else if(e.key==='+'||e.key==='=')this.action('plus');
    else if(e.key==='-')this.action('minus');
    else if(e.key.toLowerCase()==='e'&&!this.paused&&!this.mapOpen)this.interact();
  }
  private wheel=(_p:unknown,_objects:unknown,_dx:number,dy:number):void=>{if(!this.mapOpen&&!this.paused)this.action(dy<0?'plus':'minus');};
  private blur=():void=>{if(!this.paused)this.action('pause');this.save();};
  private visibility=():void=>{if(document.hidden)this.blur();};
  private nearExit():boolean {const p=this.exit();return Math.hypot(this.player.x-(p.x+.5)*32,this.player.y-(p.y+.5)*32)<65;}
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
    if(!this.player||this.leaving||this.mapEditor)return false;
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
    if(!this.player||this.paused||this.mapOpen||this.leaving||this.mapEditor||document.hidden)return;
    const delta=Math.min(ms/1000,.1);this.player.update(delta,this.blockedAt);this.farming.update(delta);
    Object.assign(this.state,advanceClock(this.state,delta*GAME_MINUTES_PER_SECOND));
    this.marker.setPosition(this.player.x,this.player.y);
    this.trees.forEach(t=>t.setAlpha(this.player.y<t.y&&Math.abs(this.player.x-t.x)<t.displayWidth*.4&&this.player.y>t.y-t.displayHeight*.85?.42:1));
    for(const a of this.animals)a.sprite.setFlipX(Math.sin(this.time.now/7000+a.x)>.7);
    this.refreshPrompt();this.elapsed+=delta;
    if(this.elapsed>=5){this.save();this.elapsed=0;}
    const title=this.panel?.querySelector<HTMLElement>('.forest-location');if(title&&this.time.now>this.locationUntil)title.hidden=true;
  }
}
