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
  tree: { label: 'Madeira caída', tool: 'hand', hits: 1, drops: { wood: 4, branch: 3 } },
  stone: { label: 'Pedras soltas', tool: 'hand', hits: 1, drops: { stone: 3 } },
  seeds: { label: 'Sementes silvestres', tool: 'hand', hits: 1, drops: { seeds: 3 } },
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

  hit(node: ResourceNode, tool: Tool, inventory: Inventory): ResourceActionResult {
    const definition = RESOURCE_DEFINITIONS[node.kind];
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
    const hits = (savedProgress?.hits ?? 0) + 1;
    if (hits < definition.hits) {
      if (savedProgress) savedProgress.hits = hits;
      else this.progress.push({ id: node.id, hits });
      return { ok: true, message: `${definition.label}: ${hits} de ${definition.hits} golpes.` };
    }

    // O golpe final e todos os drops são uma única operação: uma mochila cheia não perde o recurso.
    if (!inventory.transact({}, definition.drops)) {
      return { ok: false, message: 'A mochila está cheia. Libere espaço antes de recolher este recurso.' };
    }
    if (savedProgress) this.progress.splice(this.progress.indexOf(savedProgress), 1);
    this.depleted.add(node.id);
    return { ok: true, message: `${definition.label}: materiais guardados na mochila.`, depleted: true };
  }
}
