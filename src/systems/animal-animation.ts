import {ANIMAL_ART,animalFrame,type AnimatedAnimalKind} from '../data/animal-art';
import type {CharacterDirection} from '../character-directions';

/** Keep the supplied poses in order; fast travel must not skip the whole gait between frames. */
export class AnimalWalkCycle {
  private distance=0;
  private phase=0;
  private stoppedFor=0;
  private walking=false;
  constructor(readonly kind:AnimatedAnimalKind){}
  advance(delta:number,moving:boolean,totalDistance:number):void {
    const dt=Math.max(0,Math.min(delta,.1)),moved=Math.max(0,totalDistance-this.distance);
    this.distance=totalDistance;if(!dt)return;
    if(moving&&moved>.001){
      const art=ANIMAL_ART[this.kind];
      this.phase=(this.phase+Math.min(moved/art.stride*8,art.maxWalkFps*dt))%8;
      this.walking=true;this.stoppedFor=0;
    }else{
      this.stoppedFor+=dt;
      // Brief steering/collision pauses hold the contact pose, rather than flashing the idle art.
      if(this.stoppedFor>=.14){this.walking=false;this.phase=0;}
    }
  }
  frame(direction:CharacterDirection):number {
    return animalFrame(this.kind,direction,this.walking,this.phase/8*ANIMAL_ART[this.kind].stride);
  }
}
