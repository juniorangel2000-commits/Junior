import {depositMetal,canMine,metalDrop,recordMetal} from './mining';
import {toolCondition,configureTool} from './economy';
import {ECONOMY_BALANCE as BALANCE} from '../data/economy-balance';
import type {SaveData} from '../types';
import type { ResourceKind, ResourceNode, ResourceProgressData, Tool } from '../types';
import type { ActionResult } from './farming';
import { Inventory, ITEM_NAMES, type ItemCost } from './inventory';

export interface ResourceDefinition {
  label: string;
  tool: 'hand' | 'hatchet' | 'pickaxe';
  hits: number;
  drops: ItemCost;
}

export const RESOURCE_DEFINITIONS: Record<ResourceKind, ResourceDefinition> = {
  fallenLog: {label:'Tronco caído',tool:'hatchet',hits:3,drops:{wood:6,log:2,branch:2}},
  stump: {label:'Toco',tool:'hatchet',hits:3,drops:{wood:4,log:1,branch:1}},
  tree: { label: 'Galhos caídos', tool: 'hand', hits: 1, drops: { wood: 4, branch: 3 } },
  stone: { label: 'Pedras pequenas', tool: 'hand', hits: 1, drops: { stone: 3 } },
  seeds: { label: 'Arbusto de berries', tool: 'hand', hits: 1, drops: { seeds: 3, fiber: 2 } },
  fiber: { label: 'Fibras vegetais', tool: 'hand', hits: 1, drops: { fiber: 6 } },
  scrap: { label: 'Sucata', tool: 'hand', hits: 1, drops: { scrap: 2 } },
  standingTree: { label: 'Árvore', tool: 'hatchet', hits: 4, drops: { log: 2, branch: 3 } },
  vein: { label: 'Rocha minerável', tool: 'pickaxe', hits: 5, drops: { stone: 4 } },
};

export type ResourceActionResult = ActionResult & { depleted?: boolean };

export class Resources {
  readonly progress: ResourceProgressData[];
  private readonly depleted = new Set<string>();

  constructor(progress: ResourceProgressData[] = []) {
    const ids = new Set<string>();
    for (const entry of progress) {
      if (!entry.id || entry.id.length > 80 || ids.has(entry.id) || !Number.isSafeInteger(entry.hits) || entry.hits < 1) {
        throw new RangeError('Progresso de recurso inválido.');
      }
      ids.add(entry.id);
    }
    this.progress = progress.map((entry) => ({ ...entry }));
  }

  hit(node: ResourceNode, tool: Tool, inventory: Inventory,context:number|SaveData=0): ResourceActionResult {
    const definition = RESOURCE_DEFINITIONS[node.kind];
    const state=typeof context==='object'?context:undefined;
    const metal=depositMetal(node);
    const economicTool=tool==='pickaxe'||tool==='hatchet'?tool:undefined;
    const condition=state&&economicTool?toolCondition(state,economicTool):undefined;
    if(state&&metal&&!canMine(state,metal))return{ok:false,message:'Você precisa de uma picareta melhor para extrair este minério.'};
    if(condition&&condition.durability<=0)return{ok:false,message:'Ferramenta sem durabilidade. Repare-a na ferraria.'};
    const damage=condition?Math.floor(BALANCE.efficiency[condition.tier]+(condition.work??0)):1;
    const wear=()=>{if(state&&economicTool&&condition){configureTool(state,economicTool,condition.tier);state.economy6!.tools[economicTool]={...condition,durability:condition.durability-1,work:(BALANCE.efficiency[condition.tier]+(condition.work??0))%1};}};

    if (!definition || !node.id || node.id.length > 80) {
      return { ok: false, message: 'Este recurso não está disponível.' };
    }
    if (this.depleted.has(node.id)) return { ok: false, message: 'Este recurso já foi recolhido.' };
    if (tool !== 'hand' && tool !== 'hatchet' && tool !== 'pickaxe') {
      return { ok: false, message: 'Use as mãos, a machadinha ou a picareta para coletar recursos.' };
    }
    if (tool !== 'hand' && !inventory.has(tool)) {
      return { ok: false, message: `Você ainda não possui: ${ITEM_NAMES[tool]}.` };
    }
    if (definition.tool !== 'hand' && tool !== definition.tool) {
      return { ok: false, message: `Use a ferramenta: ${ITEM_NAMES[definition.tool]}.` };
    }

    const savedProgress = this.progress.find((entry) => entry.id === node.id);
    if (savedProgress && savedProgress.hits >= definition.hits) {
      return { ok: false, message: 'O progresso deste recurso é inválido.' };
    }
    const hits = (savedProgress?.hits ?? 0) + damage;
    if (hits < definition.hits) {
      if (savedProgress) savedProgress.hits = hits;
      else this.progress.push({ id: node.id, hits });
      wear();return { ok: true, message: `${definition.label}: ${hits} de ${definition.hits} golpes.` };
    }

    // O golpe final e todos os drops são uma única operação: uma mochila cheia não perde o recurso.
    const drops=metal?metalDrop(metal,node.id):{...definition.drops};
    if(node.kind==='fiber'&&node.plant){drops.herb=1;let h=0;for(const c of node.id)h=(Math.imul(h,31)+c.charCodeAt(0))>>>0;if((node.id.startsWith('f-')||node.id.startsWith('spawn-f-'))&&h%7===0)drops.rareHerb=1;}
    if (!inventory.transact({}, drops)) {
      return { ok: false, message: 'A mochila está cheia. Libere espaço antes de recolher este recurso.' };
    }
    if (savedProgress) this.progress.splice(this.progress.indexOf(savedProgress), 1);
    this.depleted.add(node.id);wear();if(state&&metal)recordMetal(state,metal);
    return { ok: true, message: `${definition.label}: materiais guardados na mochila.`, depleted: true };
  }
}
