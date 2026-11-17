import {describe,it,expect,vi} from 'vitest';
vi.mock('phaser',()=>({default:{Scenes:{Events:{START:'start',SHUTDOWN:'shutdown'}},Core:{Events:{READY:'ready'}}}}));
vi.stubGlobal('window',{setTimeout:()=>0});
import {installSceneTextureRelease} from '../src/scene-texture-release';

class Events{private l=new Map<string,(()=>void)[]>();on(e:string,f:()=>void){(this.l.get(e)??this.l.set(e,[]).get(e)!).push(f);}emit(e:string){for(const f of this.l.get(e)??[])f();}}
const fakeScene=(key:string)=>({scene:{key},events:new Events(),children:{list:[] as unknown[]},cameras:{cameras:[]},sys:{isActive:()=>false,isSleeping:()=>false,isPaused:()=>false}});

describe('liberação das imagens ao trocar de cenário',()=>{
 it('apaga o que o cenário anterior criou antes do próximo começar a carregar (Damião virava um quadradinho)',()=>{
  const keys=new Set(['base']);
  const vila=fakeScene('Vila'),estrada=fakeScene('AcessoCidade');
  const game={scene:{scenes:[vila,estrada]},events:new Events(),textures:{getTextureKeys:()=>[...keys],exists:(k:string)=>keys.has(k),remove:(k:string)=>keys.delete(k)},anims:{anims:{values:()=>[]},remove:()=>{}}};
  installSceneTextureRelease(game as never);
  vila.events.emit('start');keys.add('village-npc-damiao');
  vila.events.emit('shutdown');
  expect(keys.has('village-npc-damiao')).toBe(true);
  // O próximo cenário começa: a imagem sai agora, e o carregamento dele vai montar de novo.
  estrada.events.emit('start');
  expect(keys.has('village-npc-damiao')).toBe(false);expect(keys.has('base')).toBe(true);
 });
});
