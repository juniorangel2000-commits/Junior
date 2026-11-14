import type {AnimalKind} from './ancient-forest';
import {CHARACTER_DIRECTIONS,type CharacterDirection} from '../character-directions';
import headAnchors from './animal-head-anchors.json';

export const ANIMAL_ART = {
  sheep:{cell:224,scale:.28,foot:90,stride:38,maxWalkFps:8},
  goat:{cell:224,scale:.27,foot:90,stride:42,maxWalkFps:8},
  horse:{cell:192,scale:.65,foot:56,stride:58,maxWalkFps:10},
  chicken:{cell:64,scale:.75,foot:17,stride:24,maxWalkFps:12},
  cow:{cell:192,scale:.5,foot:46,stride:48,maxWalkFps:9},
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
  const grazer=kind==='sheep'||kind==='goat';
  const row=Math.floor(frame/9);
  const [x,y]=grazer?[[0,-115],[-65,-105],[65,-105],[0,-140],[-45,-110],[45,-110],[-45,-130],[45,-130]][row]:headAnchors[kind][frame],scale=ANIMAL_ART[kind].scale;
  return {x:x*scale,y:y*scale};
}
