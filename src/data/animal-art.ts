import type {AnimalKind} from './ancient-forest';
import {CHARACTER_DIRECTIONS,type CharacterDirection} from '../character-directions';
import headAnchors from './animal-head-anchors.json';

export const ANIMAL_ART = {
  chicken:{cell:64,scale:.75,foot:17,stride:24,maxWalkFps:12},
  cow:{cell:128,scale:.75,foot:34,stride:48,maxWalkFps:9},
} as const;
export type AnimatedAnimalKind=keyof typeof ANIMAL_ART;
export const animatedAnimal=(kind:AnimalKind):kind is AnimatedAnimalKind=>kind in ANIMAL_ART;
export const animalTexture=(kind:AnimatedAnimalKind):string=>`animal-${kind}-animated`;
/** Idle in column zero, followed by the original eight walk frames. Distance keeps feet in step. */
export function animalFrame(kind:AnimatedAnimalKind,direction:CharacterDirection,moving:boolean,distance:number):number {
  const phase=moving?Math.floor(Math.max(0,distance)/ANIMAL_ART[kind].stride*8)%8+1:0;
  return CHARACTER_DIRECTIONS.indexOf(direction)*9+phase;
}
/** Local head position measured separately in every supplied idle/walk pose. */
export function animalHeadOffset(kind:AnimatedAnimalKind,frame:number):{x:number;y:number} {
  const [x,y]=headAnchors[kind][frame],scale=ANIMAL_ART[kind].scale;
  return {x:x*scale,y:y*scale};
}
