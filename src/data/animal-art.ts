import type {AnimalKind} from './ancient-forest';
import {CHARACTER_DIRECTIONS,type CharacterDirection} from '../character-directions';
import headAnchors from './animal-head-anchors.json';

/** Atlas compactos reservam só cinco imagens por direção, sem duplicar poses na GPU. */
export const COMPACT_ANIMAL_KINDS=['pig','duck','rabbit','deer','bee'] as const;
export const PREPARED_ANIMAL_KINDS=['bee'] as const;
export const compactAnimal=(kind:AnimalKind)=>COMPACT_ANIMAL_KINDS.includes(kind as typeof COMPACT_ANIMAL_KINDS[number]);
export const animalColumns=(kind:AnimalKind)=>compactAnimal(kind)?5:9;
export const ANIMAL_ART = {
  pig:{cell:224,scale:.28,foot:90,stride:36,maxWalkFps:8},
  duck:{cell:224,scale:.18,foot:90,stride:24,maxWalkFps:10},
  rabbit:{cell:224,scale:.16,foot:90,stride:24,maxWalkFps:10},
  deer:{cell:224,scale:.28,foot:90,stride:48,maxWalkFps:9},
  bee:{cell:224,scale:.08,foot:90,stride:16,maxWalkFps:12},
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
  const step=Math.floor(Math.max(0,distance)/ANIMAL_ART[kind].stride*8)%8;
  const phase=moving?(compactAnimal(kind)?Math.floor(step/2)+1:step+1):0;
  return CHARACTER_DIRECTIONS.indexOf(direction)*animalColumns(kind)+phase;
}
/** Local head position measured separately in every supplied idle/walk pose. */
export function animalHeadOffset(kind:AnimatedAnimalKind,frame:number):{x:number;y:number} {
  const row=Math.floor(frame/animalColumns(kind)),scale=ANIMAL_ART[kind].scale;
  const anchors=kind==='pig'?[[0,-85],[-65,-80],[65,-80],[0,-120],[-45,-80],[45,-80],[-45,-110],[45,-110]]
    :kind==='rabbit'?[[0,-95],[-50,-90],[50,-90],[0,-115],[-35,-90],[35,-90],[-35,-110],[35,-110]]
    :kind==='bee'?[[0,-25],[-25,-20],[25,-20],[0,-35],[-20,-20],[20,-20],[-20,-30],[20,-30]]
    :[[0,-115],[-65,-105],[65,-105],[0,-140],[-45,-110],[45,-110],[-45,-130],[45,-130]];
  const [x,y]=kind==='cow'||kind==='horse'||kind==='chicken'?headAnchors[kind][frame]:anchors[row];
  return {x:x*scale,y:y*scale};
}

/** Asas têm ciclo de voo próprio; não dependem de passos no chão. */
export function beeFlightFrame(direction:CharacterDirection,seconds:number):number{return CHARACTER_DIRECTIONS.indexOf(direction)*5+1+Math.floor(Math.max(0,seconds)*12)%4;}
