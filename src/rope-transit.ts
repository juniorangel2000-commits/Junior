import type Phaser from 'phaser';
import {AnimalPopulation} from './animals';
import {PLAYER_SPEED} from './player';
import {releaseAnimalEscort,type AnimalBlocked,type AnimalPoint} from './systems/animals';
import {ropeBack,ROPE_PLACE,type RopeArea} from './data/wild-animals';
import type {SaveData} from './types';

type Point=AnimalPoint&{readonly leftHandPosition:AnimalPoint};
/** Cenários de passagem (Floresta da Cidade e Vila, preview.48): não têm animais soltos, só o que
 * vem na corda a caminho da propriedade. G solta a corda e o animal corre de volta pela saída que
 * leva ao cenário de onde ele veio. */
export class RopeTransit{
 private readonly population:AnimalPopulation;
 constructor(scene:Phaser.Scene,private readonly state:()=>SaveData,private readonly area:'cityForest'|'village',blocked:AnimalBlocked,
  /** Ponto da saída rumo a cada cenário vizinho (para onde o animal corre ao ser solto). */
  private readonly exitTo:(area:RopeArea)=>AnimalPoint|undefined){
  this.population=new AnimalPopulation(scene,state(),area,blocked,PLAYER_SPEED);
 }
 get escorting():boolean{return this.state().animalEscort?.area===this.area;}
 update(dt:number,player:Point):void{this.population.update(dt,player);}
 store():void{this.population.store();}
 canLeave(player:AnimalPoint):boolean{return this.population.canLeave(player);}
 /** Aviso da HUD enquanto o animal está na corda. */
 prompt():{prompt:string;interactionKey:'G'}|undefined{return this.escorting?{prompt:'Conduzindo animal · siga até a propriedade · soltar corda',interactionKey:'G'}:undefined;}
 /** G: solta a corda. Devolve a mensagem para o aviso. */
 release():string|undefined{
  const s=this.state(),e=s.animalEscort;if(!e||e.area!==this.area)return;
  const back=ropeBack(e.id,this.area),exit=back&&this.exitTo(back),home=!!exit&&this.population.runHome(exit);
  if(!releaseAnimalEscort(s))return 'Não foi possível guardar a corda.';
  return home&&back?`Animal solto. Ele corre de volta para ${ROPE_PLACE[back]}, e a corda voltou para você.`:'Animal solto. A corda voltou para você.';
 }
 destroy():void{this.population.destroy();}
}
