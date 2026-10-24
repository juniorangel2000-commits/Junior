import { emptyQuickbar } from '../systems/quickbar';
import { MapEditor } from '../map-editor';
import { emptyMapEdits, isProtectedMapTile, type MapEditData, type EditorObjectKind } from '../systems/map-editor';
import type { WorldEditorObject } from '../world';
import { natureArt } from '../data/nature-catalog';
import { drawMapTerrainEdits } from '../map-editor-terrain';
import { addWaterMotion } from '../water-motion';
import Phaser from 'phaser';
import { Player } from '../player';
import type { SaveData, Tool } from '../types';
import type { GameUI } from '../ui';
import { saveGame } from '../systems/save';
import { advanceClock, GAME_MINUTES_PER_SECOND } from '../systems/clock';
import { Farming } from '../systems/farming';
import { directionFromVector, directionVector } from '../character-directions';
import { animalSprite, setupAnimalArt } from '../forest-art';
import { FOREST_ANIMALS, FOREST_ENTRY, FOREST_TREES, forestWater, FOREST_ROCKS, forestPathDistance, forestTreeAppearance, recruitAnimal } from '../data/ancient-forest';
import { gameAudio } from '../audio';
import { loadCameraZoom, saveCameraZoom, stepCameraZoom } from '../camera-zoom';
import { readTerrainSprites } from '../terrain-sprites';
import { forestGroundPixels } from '../forest-ground';

export interface ForestStart { save: SaveData; ui: GameUI; onReturn: (save: SaveData, title?: boolean) => void }
export class ForestScene extends Phaser.Scene {
  private state!: SaveData;
  private player!: Player;
  private farming!: Farming;
  private onReturn!: ForestStart['onReturn'];
  private ui!:GameUI;
  private trees: Phaser.GameObjects.Image[]=[];
  private animals: Array<{id:string;x:number;y:number;sprite:Phaser.GameObjects.Sprite}> = [];
  private paused=false;
  private leaving=false;
  private zoom=1;
  private elapsed=0;
  private hudElapsed=0;
  private mapEditor?:MapEditor;
  private environment:Phaser.GameObjects.GameObject[]=[];
  private editorObjects:WorldEditorObject[]=[];
  private originalObjects:WorldEditorObject[]=[];
  private solid=new Set<string>();
  private edits?:MapEditData;
  private waterAt=(x:number,y:number):boolean=>{const terrain=this.edits?.terrain[`${x},${y}`];return terrain?terrain==='water':forestWater(x,y);};
  private blockedAt=(x:number,y:number):boolean=>x<1||y<1||x>=95||y>=71||this.waterAt(x,y)||this.solid.has(`${x},${y}`);
  private movementBlockedAt=(x:number,y:number):boolean=>x<1||y<1||x>=95||y>=71||this.solid.has(`${x},${y}`);
  private swimmingPoint=(x:number,y:number):boolean=>{const terrain=this.edits?.terrain[`${Math.floor(x/32)},${Math.floor(y/32)}`];return terrain?terrain==='water':forestWater(x/32-.5,y/32-.5);};
  private entry(){return this.edits?.points?.entry??FOREST_ENTRY;}
  private exit(){return this.edits?.points?.exit??{x:48,y:69};}
  constructor(){super('Floresta');}

  create(data:ForestStart):void {
    this.ui=data.ui;this.state=structuredClone(data.save);this.state.activeArea='forest';this.onReturn=data.onReturn;
    this.paused=false;this.leaving=false;this.elapsed=0;this.hudElapsed=0;this.animals=[];this.trees=[];
    this.zoom=loadCameraZoom();this.farming=new Farming(this.state.crops);setupAnimalArt(this);
    this.environment=[];this.mapEditor=undefined;
    this.rebuildEnvironment();this.originalObjects=this.editorObjects.map(o=>({...o}));
    if(this.state.forestMapEdits)this.rebuildEnvironment(this.state.forestMapEdits);
    for(const a of FOREST_ANIMALS)if(!this.state.recruitedAnimals?.includes(a.id))this.animals.push({id:a.id,x:a.x*32+16,y:a.y*32+16,sprite:animalSprite(this,a.kind,a.x*32+16,a.y*32+16)});
    const p=this.state.forestPosition;
    const valid=p&&!this.movementBlockedAt(Math.floor(p.x/32),Math.floor(p.y/32));
    this.player=new Player(this,this.state.profile,valid?p.x:(this.entry().x+.5)*32,valid?p.y:(this.entry().y+.5)*32,'forest-player');
    this.player.facing=directionVector(valid?p.direction??'up':'up');this.player.update(0,this.movementBlockedAt,undefined,true,this.swimmingPoint);

    this.cameras.main.setBounds(0,0,3072,2304);this.applyCamera();this.cameras.main.fadeIn(300);
    document.querySelector<HTMLElement>('#ui')!.style.display='';this.ui.setQuickbar(this.state.quickbar??emptyQuickbar());this.ui.showHUD('forest');this.updateHUD();
    this.input.keyboard!.on('keydown',this.key,this);this.input.on('wheel',this.wheel,this);
    this.scale.on('resize',this.applyCamera,this);
    window.addEventListener('pagehide',this.save);window.addEventListener('beforeunload',this.save);window.addEventListener('blur',this.blur);
    document.addEventListener('visibilitychange',this.visibility);
    this.events.once('shutdown',()=>{this.mapEditor?.destroy();this.mapEditor=undefined;this.input.keyboard?.off('keydown',this.key,this);this.input.off('wheel',this.wheel,this);this.scale.off('resize',this.applyCamera,this);window.removeEventListener('pagehide',this.save);window.removeEventListener('beforeunload',this.save);window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);});
    this.save();
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
  openMapEditor():void {
    if(this.mapEditor||this.leaving)return;
    const original=this.state.forestMapEdits?structuredClone(this.state.forestMapEdits):undefined;
    const initial=original??emptyMapEdits('forest');this.paused=true;
    this.input.keyboard?.resetKeys();this.ui.showMapEditorMode();this.player.setVisible(false);
    const close=(edits:MapEditData|undefined)=>{
      this.mapEditor?.destroy();this.mapEditor=undefined;this.rebuildEnvironment(edits);this.paused=false;
      if(this.movementBlockedAt(Math.floor(this.player.x/32),Math.floor(this.player.y/32))){this.player.x=(this.entry().x+.5)*32;this.player.y=(this.entry().y+.5)*32;}
      this.player.setVisible(true);this.ui.showHUD('forest');this.applyCamera();this.updateHUD();this.input.keyboard?.resetKeys();
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
    const key='forest-ground-sandy-shore';
    if(!this.textures.exists(key)){
      const sprites=readTerrainSprites(this);
      const terrain=document.createElement('canvas');terrain.width=3072;terrain.height=2304;
      const context=terrain.getContext('2d',{willReadFrequently:true})!;context.imageSmoothingEnabled=false;
    for(let cy=0;cy<9;cy++)for(let cx=0;cx<12;cx++){

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
        context.drawImage(canvas,cx*256,cy*256);
    }
      this.textures.addCanvas(key,terrain)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    // One continuous quad prevents rounding gaps between chunks at fractional zoom.
    this.add.image(0,0,key).setOrigin(0).setDepth(-100);
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
    this.cameras.main.setBounds(0,0,3072,2304).setZoom(2*this.zoom).startFollow(this.player.sprite,false,1,1);
    this.cameras.main.centerOn(this.player.x,this.player.y);
  }
  setPaused(paused:boolean):void {
    this.paused=paused;this.input.keyboard?.resetKeys();this.ui.updateCameraZoom(this.zoom,!paused&&!this.mapEditor);
    if(paused)this.save();
  }
  selectTool(tool:Tool):void {this.state.equippedTool=tool;this.updateHUD();}
  persist():boolean {return this.save();}
  mainMenu():void {this.ui.closeModal();this.leave(true);}
  changeCameraZoom(direction:-1|0|1):void {
    if(this.paused||this.mapEditor||this.leaving)return;
    this.zoom=stepCameraZoom(this.zoom,direction);saveCameraZoom(this.zoom);this.applyCamera();this.ui.updateCameraZoom(this.zoom,true);
  }
  captureMap():Promise<string> {
    this.updateHUD();
    const texture=this.make.renderTexture({width:960,height:720},false);texture.camera.setZoom(960/3072).setScroll(0,0).setOrigin(0,0);
    this.children.depthSort();texture.draw(this.children.list.filter(o=>o!==this.player.sprite&&'visible' in o&&o.visible));
    return new Promise(resolve=>texture.snapshot(image=>{const url=image instanceof HTMLImageElement?image.src:'';texture.destroy();resolve(url);}));
  }
  private updateHUD():void {
    const nearest=this.nearest(),info=nearest&&FOREST_ANIMALS.find(a=>a.id===nearest.id);
    this.ui.updateHUD({area:'forest',inHome:false,name:this.state.profile.name,day:this.state.day,time:this.state.time,
      inventory:this.state.inventory,tool:this.state.equippedTool??'hand',wateringCan:!!this.state.homeSupplies?.wateringCan,wateringCanWater:this.state.wateringCanWater??0,
      playerTile:{x:this.player.x/32,y:this.player.y/32},prompt:this.player.isSwimming?'Nadar · siga até a margem para sair':this.nearExit()?'Voltar à Propriedade Abandonada':info?'Acolher animal':'Explorar a floresta',
      location:'Floresta Antiga',harvests:this.state.inventory.turnip,metLia:this.state.metLia,nearWorkbench:false,sheltered:false,shelterReason:'',resourceProgress:'',progress:this.state.progress});
    this.ui.updateCameraZoom(this.zoom,!this.paused&&!this.mapEditor);
  }
  private key(e:KeyboardEvent):void {
    if(e.repeat||this.mapEditor)return;
    const target=e.target;if(e.key!=='Escape'&&target instanceof HTMLElement&&target.matches('input,textarea,select,[contenteditable="true"]'))return;
    const key=e.key.toLowerCase();
    if(e.key==='F2'){e.preventDefault();this.openMapEditor();return;}
    if(e.key==='Escape'){e.preventDefault();if(!this.ui.dismissTopToolbar())this.ui.togglePause();return;}
    if(key==='m'){e.preventDefault();this.updateHUD();this.ui.toggleMap();return;}
    if(key==='i'){this.ui.toggleInventory(this.state.inventory);return;}
    if(key==='c'){this.ui.toggleCrafting(this.state.inventory,false);return;}
    if(key==='b'){this.ui.toggleBuilding(this.state.inventory,false);return;}
    if(this.paused)return;
    if(e.key>='1'&&e.key<='9')this.ui.activateSlot(Number(e.key)-1);
    if(e.key==='+'||e.key==='=')this.changeCameraZoom(1);
    else if(e.key==='-'||e.key==='_')this.changeCameraZoom(-1);
    else if(e.key==='Home')this.changeCameraZoom(0);
    else if(key==='e'){e.preventDefault();this.interact();}
  }
  private wheel=(_p:unknown,_objects:unknown,_dx:number,dy:number):void=>{if(!this.paused)this.changeCameraZoom(dy<0?1:-1);};
  private blur=():void=>{if(!this.paused){this.setPaused(true);this.ui.togglePause();}this.save();};
  private visibility=():void=>{if(document.hidden)this.blur();};
  private nearExit():boolean {const p=this.exit();return Math.hypot(this.player.x-(p.x+.5)*32,this.player.y-(p.y+.5)*32)<65;}
  private nearest(){return this.animals.find(a=>Math.hypot(a.x-this.player.x,a.y-this.player.y)<64);}
  private interact():void {
    if(this.player.isSwimming)return;
    if(this.nearExit()){this.leave();return;}
    const a=this.nearest();if(!a)return;
    this.state.recruitedAnimals=recruitAnimal(this.state.recruitedAnimals??[],a.id);
    a.sprite.destroy();this.animals=this.animals.filter(x=>x!==a);gameAudio.play('pickup');
    this.ui.toast('Animal acolhido! Ele estará na sua propriedade.');this.updateHUD();this.save();
  }
  private save=():boolean=>{
    if(!this.player||this.leaving||this.mapEditor)return false;
    this.state.quickbar=this.ui.getQuickbar();
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
    if(!this.player||this.paused||this.leaving||this.mapEditor||document.hidden)return;
    const delta=Math.min(ms/1000,.1);this.player.update(delta,this.movementBlockedAt,undefined,true,this.swimmingPoint);this.farming.update(delta);
    Object.assign(this.state,advanceClock(this.state,delta*GAME_MINUTES_PER_SECOND));
    this.trees.forEach(t=>t.setAlpha(this.player.y<t.y&&Math.abs(this.player.x-t.x)<t.displayWidth*.4&&this.player.y>t.y-t.displayHeight*.85?.42:1));
    for(const a of this.animals)a.sprite.setFlipX(Math.sin(this.time.now/7000+a.x)>.7);
    this.hudElapsed+=delta;if(this.hudElapsed>=.1){this.updateHUD();this.hudElapsed=0;}
    this.elapsed+=delta;
    if(this.elapsed>=5){this.save();this.elapsed=0;}
  }
}
