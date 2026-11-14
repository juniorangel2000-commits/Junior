import type {TilePoint} from '../types';
import type {FarmKind} from './farm-buildings';
/** Interiores das construções de animais (docs/planejamento/ANIMAIS-E-RECEITAS.md).
 * Grade de 32 px. Paredes na borda; a porta fica no meio da parede de baixo. Os
 * objetos fixos aparecem já nesta etapa e ganham uso na produção de ovos e leite. */
export const INTERIOR_TILE=32;
export type InteriorFixtureKind='trough'|'water'|'nest'|'stall';
/** Retângulo em pixels dentro do interior; `solid` bloqueia a passagem. */
export interface InteriorFixture{id:string;kind:InteriorFixtureKind;x:number;y:number;w:number;h:number;solid:boolean;label:string}
export interface FarmInteriorLayout{width:number;height:number;doorX:number;doorWidth:number;fixtures:InteriorFixture[];floor:'straw'|'planks'}
const T=INTERIOR_TILE;
const fixture=(id:string,kind:InteriorFixtureKind,tx:number,ty:number,tw:number,th:number,label:string,solid=true):InteriorFixture=>({id,kind,x:tx*T,y:ty*T,w:tw*T,h:th*T,solid,label});
export const FARM_INTERIORS:Partial<Record<FarmKind,FarmInteriorLayout>>={
 // Galinheiro 10×8: cocho e bebedouro no alto, seis ninhos na parede da direita.
 coop:{width:10,height:8,doorX:4,doorWidth:2,floor:'straw',fixtures:[
  fixture('trough','trough',1,1,2,1,'Cocho'),fixture('water','water',4,1,1,1,'Bebedouro'),
  ...Array.from({length:6},(_,i)=>fixture(`nest-${i+1}`,'nest',8,1+i,1,1,'Ninho')),
 ]},
 // Aprisco 12×9: área de tosquia aberta pela frente e corredor livre até a porta.
 aprisco:{width:12,height:9,doorX:5,doorWidth:2,floor:'straw',fixtures:[
  fixture('trough','trough',1,1,3,1,'Cocho'),fixture('water','water',10,1,1,1,'Bebedouro'),
  fixture('shearing-pen','stall',8,4,3,3,'Área de tosquia',false),
  {id:'stall-divider-shearing',kind:'stall',x:8*T-3,y:4*T,w:6,h:3*T-8,solid:true,label:'Divisória da tosquia'},
 ]},
 // Curral 14×10: quatro baias no alto, separadas por divisórias; cocho e bebedouro embaixo.
 barn:{width:14,height:10,doorX:6,doorWidth:2,floor:'planks',fixtures:[
  ...Array.from({length:4},(_,i)=>fixture(`stall-${i+1}`,'stall',1+i*3,1,3,3,'Baia',false)),
  ...Array.from({length:3},(_,i)=>({id:`stall-divider-${i+1}`,kind:'stall' as const,x:(4+i*3)*T-3,y:T,w:6,h:3*T-8,solid:true,label:'Divisória da baia'})),
  fixture('trough','trough',1,7,3,1,'Cocho'),fixture('water','water',12,7,1,1,'Bebedouro'),
 ]},
};
export const hasInterior=(kind:FarmKind)=>!!FARM_INTERIORS[kind];
export const interiorSize=(l:FarmInteriorLayout)=>({width:l.width*T,height:l.height*T});
/** Ponto de partida do jogador ao entrar: logo acima da porta. */
export const interiorSpawn=(l:FarmInteriorLayout):TilePoint=>({x:(l.doorX+l.doorWidth/2)*T,y:(l.height-1.5)*T});
/** Faixa da porta: cruzar para baixo devolve o jogador à Propriedade. */
export const interiorExit=(l:FarmInteriorLayout)=>({x:(l.doorX+l.doorWidth/2)*T,y:(l.height-.35)*T,halfWidth:l.doorWidth*T/2,depth:14,direction:'down' as const});
/** Colisão em pixels: paredes na borda (com a abertura da porta) e objetos fixos sólidos. */
export function interiorBlocked(l:FarmInteriorLayout,px:number,py:number):boolean{
 const W=l.width*T,H=l.height*T;
 if(px<T+4||px>W-T-4||py<T+10)return true;
 if(py>H-T-2){const left=l.doorX*T+4,right=(l.doorX+l.doorWidth)*T-4;if(px<left||px>right||py>H+T)return true;}
 return l.fixtures.some(f=>f.solid&&px>=f.x-6&&px<=f.x+f.w+6&&py>=f.y-2&&py<=f.y+f.h+8);
}
export const interiorSafe=(l:FarmInteriorLayout,p:TilePoint)=>[[-8,-5],[8,-5],[-8,4],[8,4]].every(([dx,dy])=>!interiorBlocked(l,p.x+dx,p.y+dy));
