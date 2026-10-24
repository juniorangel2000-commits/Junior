import type { CharacterDirection } from '../character-directions';
import type { Tool } from '../types';

import { WATER_ROOT, WATER_FULL_ICON } from './watering-can';
export type AnimatedTool = 'hatchet' | 'pickaxe' | 'water' | 'hoe';
export const isAnimatedTool = (tool: Tool): tool is AnimatedTool => tool === 'hatchet' || tool === 'pickaxe' || tool === 'water' || tool === 'hoe';
export const TOOL_FRAME_SIZE = 97;
export const TOOL_USE_FRAMES = 9;
export const TOOL_USE_FPS = 18;
export const TOOL_IMPACT_FRAME = 4;

const PICKAXE_ROOT = 'assets/visual/tools/pickaxe/quero_que_voce_faca_uma_picare';
const HATCHET_ROOT = 'assets/visual/tools/hatchet/troque_a_imagem_do_cabo_para_m';
const PICKAXE_CLIP = `${PICKAXE_ROOT}/animations/Create_a_pixel_art_animation_sprite_sheet_of_a_pri/unknown`;
const HATCHET_CLIP = `${HATCHET_ROOT}/animations/Prompt_machado_animado_batendo_na_arvore_Creat`;
export const TOOL_ICON_URLS: Record<AnimatedTool, string> = {
  hoe: 'assets/visual/tools/hoe/provisional.png',
  water: WATER_FULL_ICON,
  pickaxe: `${PICKAXE_ROOT}/rotations/quero_que_voce_faca_uma_picare.png`,
  hatchet: `${HATCHET_ROOT}/rotations/south.png`,
};
export const TOOL_EXPORT_DIRECTIONS: Record<CharacterDirection, string> = {
  down: 'south', left: 'west', right: 'east', up: 'north',
  'down-left': 'south-west', 'down-right': 'south-east',
  'up-left': 'north-west', 'up-right': 'north-east',
};
const GRIPS: Record<CharacterDirection, readonly [number, number]> = {
  down: [56, 83], right: [51, 78], left: [47, 78], up: [50, 79],
  'down-right': [75, 80], 'down-left': [22, 80],
  'up-right': [72, 78], 'up-left': [26, 77],
};
const PICKAXE_GRIPS = [[56, 83], [56, 83], [56, 83], [57, 83], [57, 83], [55, 83], [55, 83], [56, 83], [56, 83]] as const;
const AXE_GRIPS = {
  east: [[51, 78], [51, 78], [52, 78], [52, 79], [50, 77], [52, 79], [51, 78], [51, 79], [51, 78]],
  west: [[45, 78], [45, 78], [44, 78], [44, 79], [46, 77], [44, 79], [45, 78], [45, 79], [45, 78]],
} as const;

export function toolIdleArt(tool: AnimatedTool, direction: CharacterDirection) {
  if (tool === 'hoe') return { key: 'tool:hoe:provisional', path: TOOL_ICON_URLS.hoe, grip: [80, 220] as const, flipX: direction.includes('left') };
  if (tool === 'water') return { key: 'tool:water:idle', path: WATER_FULL_ICON, grip: [210, 130] as const, flipX: direction === 'right' };
  // The export's "west" view has its cutting edge on the right, and vice versa.
  const view = direction === 'right' ? 'left' : direction === 'left' ? 'right' : direction;
  return { key: `tool:${tool}:idle:${tool === 'pickaxe' ? 'base' : direction}`,
    path: tool === 'pickaxe' ? TOOL_ICON_URLS.pickaxe : `${HATCHET_ROOT}/rotations/${TOOL_EXPORT_DIRECTIONS[view]}.png`,
    grip: tool === 'pickaxe' ? [56, 83] as const : GRIPS[view],
    flipX: tool === 'pickaxe' && direction.includes('right') };
}

/** Only authored animation directions exist: other axe views keep their original pose. */
export function toolUseArt(tool: AnimatedTool, direction: CharacterDirection, frame: number) {
  if (tool === 'hoe') return toolIdleArt(tool, direction);
  if (tool === 'water') {
    const index = Math.max(0, Math.min(8, Math.floor(frame)));
    return { key: `tool:water:use:${index}`, path: `${WATER_ROOT}/animations/Create_an_8-frame_pixel_art_animation_of_this_exac/unknown/frame_${String(index).padStart(3, '0')}.png`, grip: [205, 115] as const, flipX: direction === 'right' };
  }
  if (tool === 'hatchet' && direction !== 'left' && direction !== 'right') return toolIdleArt(tool, direction);
  const index = Math.max(0, Math.min(TOOL_USE_FRAMES - 1, Math.floor(frame)));
  const view = direction === 'left' ? 'east' : 'west';
  return { key: `tool:${tool}:use:${tool === 'pickaxe' ? 'base' : view}:${index}`,
    path: `${tool === 'pickaxe' ? PICKAXE_CLIP : `${HATCHET_CLIP}/${view}`}/frame_${String(index).padStart(3, '0')}.png`,
    grip: tool === 'pickaxe' ? PICKAXE_GRIPS[index] : AXE_GRIPS[view][index],
    flipX: tool === 'pickaxe' && direction.includes('right') };
}

/** Temporary swing of the existing art. Replace only this art adapter on receipt of the authored clip. */
export function hoeSwingAngle(frame: number, left: boolean): number {
  const angle = [-40, -55, -35, 15, 75, 70, 45, 20, 0][Math.max(0, Math.min(8, Math.floor(frame)))];
  return left ? -angle : angle;
}
