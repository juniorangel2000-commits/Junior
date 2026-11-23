import type {SaveData} from '../types';
import {projectDone} from './projects';
import {HOME_SIZES,type HomeSize} from './home';

/** Nível da casa do jogador: quantas etapas do Tobias já ficaram prontas (0 a 3, preview.48). */
export const HOME_STAGES=['home-1','home-2','home-3'] as const;
export const homeLevel=(s:Pick<SaveData,'projects'|'day'>):number=>{let n=0;for(const id of HOME_STAGES){if(!projectDone(s,id))break;n++;}return n;};
export const playerHomeSize=(s:Pick<SaveData,'projects'|'day'>):HomeSize=>HOME_SIZES[homeLevel(s)];
/** Quarto (etapa 2): acorda com vigor extra. Cozinha (etapa 3): fogão sem lenha e pratos de forno em casa. */
export const hasBedroom=(s:Pick<SaveData,'projects'|'day'>)=>homeLevel(s)>=2;
export const hasKitchen=(s:Pick<SaveData,'projects'|'day'>)=>homeLevel(s)>=3;
