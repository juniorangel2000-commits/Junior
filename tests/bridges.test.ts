import {describe,it,expect,vi} from 'vitest';
import type Phaser from 'phaser';
import {Player} from '../src/player';
import {createCharacterProfile} from '../src/data/characters';
import {PROPERTY_BRIDGES,bridgeAtPoint,bridgeRailAtPoint,bridgeAllowsStep} from '../src/data/bridges';
import {isBridgeTile,TILE} from '../src/data/regions';
import {isWaterPoint} from '../src/data/terrain-shape';
vi.mock('phaser',()=>({default:{}}));
vi.mock('../src/art',()=>({createCharacterFrames:()=> 'player'}));
vi.mock('../src/swimming',()=>({SWIM_SPEED_FACTOR:.55,prepareSwimmingTextures:vi.fn(),SwimmingVisual:class {update(){}setVisible(){}}}));
function fixture(x:number,y:number){
 const keys=Object.fromEntries('W,A,S,D,UP,DOWN,LEFT,RIGHT'.split(',').map(k=>[k,{isDown:false}]));
 const sprite={setOrigin(){return this;},setCrop(){return this;},setDisplaySize(){return this;},setFrame(){return this;},setPosition(){return this;},setDepth(){return this;},setTexture(){return this;}};
 const scene={add:{sprite:()=>sprite},input:{keyboard:{addKeys:()=>keys}}} as unknown as Phaser.Scene;
 return {player:new Player(scene,createCharacterProfile('Ponte','farmer-female'),x,y),keys};
}
const wet=(x:number,y:number)=>!bridgeAtPoint(x,y)&&isWaterPoint(x,y);
describe('pontes e entrada em terra',()=>{
 it('mantém exatamente os dois tabuleiros existentes e deixa as cabeceiras abertas',()=>{
   for(let y=0;y<72;y++)for(let x=0;x<96;x++)expect(!!bridgeAtPoint(x*TILE+16,y*TILE+16)).toBe(isBridgeTile(x,y));
   for(const b of PROPERTY_BRIDGES){
     expect(bridgeRailAtPoint((b.x+1)*TILE,b.y*TILE+2)).toBe(true);
     expect(bridgeRailAtPoint((b.x+1)*TILE,(b.y+2)*TILE-2)).toBe(true);
     expect(bridgeRailAtPoint(b.x*TILE,b.y*TILE+32)).toBe(false);
   }
 });
 it.each(PROPERTY_BRIDGES)('atravessa $id pelas duas cabeceiras sem bloquear o percurso',b=>{
   for(const east of [true,false]) {
     const {player,keys}=fixture((b.x+(east?-.5:b.width+.5))*TILE,(b.y+1)*TILE);
     keys[east?'D':'A'].isDown=true;
     const allow=(x:number,y:number)=>bridgeAllowsStep(player.x,player.y,x,y,wet);
     for(let i=0;i<300;i++)player.update(1/60,()=>false,bridgeRailAtPoint,true,undefined,allow);
     expect(east?player.x>(b.x+b.width)*TILE:player.x<b.x*TILE).toBe(true);
   }
 });
 it.each([20,60])('bloqueia as duas laterais nas duas pontes a %i FPS, mesmo no raso',fps=>{
   for(const b of PROPERTY_BRIDGES)for(const fromNorth of [true,false]) {
     const x=(b.x+b.width/2)*TILE,y=(fromNorth?b.y*TILE-16:(b.y+2)*TILE+16);
     const {player,keys}=fixture(x,y);keys[fromNorth?'S':'W'].isDown=true;
     const allow=(x:number,y:number)=>bridgeAllowsStep(player.x,player.y,x,y,wet);
     for(let i=0;i<fps*2;i++)player.update(1/fps,()=>false,bridgeRailAtPoint,true,()=>.2,allow);
     expect(bridgeAtPoint(player.x,player.y)).toBeUndefined();
     expect(fromNorth?player.y<b.y*TILE:player.y>=(b.y+2)*TILE).toBe(true);
   }
 });
 it('impede sair do tabuleiro pela lateral e não impede sair da água em uma margem normal',()=>{
   const b=PROPERTY_BRIDGES[0],{player,keys}=fixture((b.x+3)*TILE,b.y*TILE+24);keys.W.isDown=true;
   for(let i=0;i<120;i++)player.update(1/60,()=>false,bridgeRailAtPoint,true,undefined,(x,y)=>bridgeAllowsStep(player.x,player.y,x,y,wet));
   expect(player.y).toBeGreaterThanOrEqual(b.y*TILE+11-.02);
   expect(bridgeAllowsStep(100,100,102,100,()=>true)).toBe(true);
 });
 it('não permite entrar em uma cabeceira que tenha sido pintada de água',()=>{
   const b=PROPERTY_BRIDGES[0];
   expect(bridgeAllowsStep(b.x*TILE-1,b.y*TILE+32,b.x*TILE+1,b.y*TILE+32,()=>true)).toBe(false);
   expect(bridgeAllowsStep(b.x*TILE-1,b.y*TILE+32,b.x*TILE+1,b.y*TILE+32,()=>false)).toBe(true);
 });
 it('recusa entrada pelas laterais mesmo que o ponto externo esteja seco',()=>{
   for(const b of PROPERTY_BRIDGES){
     const x=(b.x+b.width/2)*TILE,top=b.y*TILE,bottom=(b.y+b.height)*TILE;
     expect(bridgeAllowsStep(x,top-1,x,top+1,()=>false)).toBe(false);
     expect(bridgeAllowsStep(x,bottom+1,x,bottom-1,()=>false)).toBe(false);
   }
 });
});
