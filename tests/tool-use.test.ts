import { describe, expect, it } from 'vitest';
import { ToolUse, TOOL_USE_DURATION } from '../src/systems/tool-use';
import { TOOL_USE_FPS, TOOL_IMPACT_FRAME, toolUseArt, toolIdleArt } from '../src/data/tool-art';
import { Resources } from '../src/systems/resources';
import { Inventory } from '../src/systems/inventory';

const target = { id: 'vein-18-30', kind: 'vein', x: 18, y: 30 } as const;
const strike = { tool: 'pickaxe', direction: 'right', target } as const;

describe('golpe de ferramenta', () => {
  it.each([30, 60, 144])('gera um único impacto no contato, com a mesma duração a %i FPS', fps => {
    const use = new ToolUse(); use.start(strike);
    const impacts: number[] = [];
    for (let i = 1; i <= fps; i++) if (use.advance(1 / fps)) impacts.push(i / fps);
    expect(impacts).toHaveLength(1);
    expect(impacts[0]).toBeGreaterThanOrEqual(TOOL_IMPACT_FRAME / TOOL_USE_FPS - 1e-8);
    expect(impacts[0]).toBeLessThan(TOOL_IMPACT_FRAME / TOOL_USE_FPS + 1 / fps + 1e-8);
    expect(use.active).toBe(false);
  });

  it('não duplica o impacto ao atravessar o ciclo inteiro em um quadro longo', () => {
    const use = new ToolUse(); use.start(strike);
    expect(use.advance(TOOL_USE_DURATION * 2)).toEqual(strike);
    expect(use.advance(1)).toBeNull();
    expect(use.active).toBe(false);
  });

  it('recusa golpes simultâneos e preserva o alvo capturado', () => {
    const use = new ToolUse(); const action = structuredClone(strike);
    expect(use.start(action)).toBe(true);
    expect(use.start({ ...strike, direction: 'left' })).toBe(false);
    (action.target as { x: number }).x = 99;
    expect(use.advance(.25)?.target.x).toBe(18);
  });

  it('cancelar antes do contato não causa golpe nem recompensa tardia', () => {
    const use = new ToolUse(); use.start(strike); use.advance(.1); use.cancel();
    expect(use.advance(10)).toBeNull();
    expect(use.start(strike)).toBe(true);
    expect(use.frame).toBe(0);
    expect(use.advance(.25)).toEqual(strike);
  });

  it('cancelar após o contato não repete um impacto já entregue', () => {
    const use = new ToolUse(); use.start(strike);
    expect(use.advance(.25)).toEqual(strike);
    use.cancel(); expect(use.advance(.5)).toBeNull();
  });

  it('só entrega a recompensa final após cinco contatos e não a repete', () => {
    const use = new ToolUse(), resources = new Resources(), inventory = new Inventory({ pickaxe: 1 });
    for (let count = 1; count <= 5; count++) {
      use.start(strike); expect(use.advance(.1)).toBeNull();
      expect(inventory.data.stone).toBe(0);
      const impact = use.advance(.15)!;
      const result = resources.hit(impact.target, impact.tool, inventory);
      expect(result.ok).toBe(true);
      expect(result.depleted ?? false).toBe(count === 5);
      expect(use.advance(.25)).toBeNull();
    }
    expect(inventory.data.stone).toBe(4);
    expect(resources.hit(target, 'pickaxe', inventory).ok).toBe(false);
    expect(inventory.data.stone).toBe(4);
  });

  it.each([NaN, Infinity, -1, 0])('ignora tempo inválido %s', seconds => {
    const use = new ToolUse(); use.start(strike);
    expect(use.advance(seconds)).toBeNull(); expect(use.frame).toBe(0);
  });
});

describe('artes de ferramenta disponíveis', () => {
  it('mantém a sequência original à esquerda e espelha os nove quadros à direita', () => {
    for (let frame = 0; frame < 9; frame++) {
      const right = toolUseArt('pickaxe', 'right', frame);
      for (const direction of ['left', 'down-left', 'up-left'] as const) {
        const left = toolUseArt('pickaxe', direction, frame);
        expect(left.path).toBe(right.path);
        expect(left.key).toBe(right.key);
        expect(left.flipX).toBe(false);
      }
      expect(right.flipX).toBe(true);
    }
  });

  it('usa as animações próprias dos dois lados do machado e as poses nas outras vistas', () => {
    expect(toolUseArt('hatchet', 'right', 4).path).toContain('/west/frame_004.png');
    expect(toolUseArt('hatchet', 'left', 4).path).toContain('/east/frame_004.png');
    for (const direction of ['up', 'down', 'up-left', 'down-left', 'up-right', 'down-right'] as const) {
      expect(toolUseArt('hatchet', direction, 4)).toEqual(toolIdleArt('hatchet', direction));
    }
  });
});
