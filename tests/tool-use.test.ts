import { describe, expect, it } from 'vitest';
import { ToolUse, TOOL_USE_DURATION } from '../src/systems/tool-use';
import { TOOL_USE_FPS, TOOL_IMPACT_FRAME, toolUseArt, toolSwingAngle, hoeSwingAngle } from '../src/data/tool-art';
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
  it.each(['hatchet','pickaxe'] as const)('mantém a forma e o ponto de pega do %s durante o golpe, respeitando o lado nativo da arte',tool=>{
    const first=toolUseArt(tool,'right',0);
    expect(first.path).toContain('/rotations/');
    expect(first.flipX).toBe(tool==='pickaxe');
    for(let frame=0;frame<9;frame++){
      expect(toolUseArt(tool,'right',frame)).toEqual(first);
      for(const direction of ['left','down-left','up-left'] as const){
        expect(toolUseArt(tool,direction,frame)).toEqual({...first,flipX:!first.flipX});
      }
    }
  });

  it.each(['hatchet','pickaxe'] as const)('leva a cabeça do %s para a frente no contato e retorna sem mudar a recompensa',tool=>{
    const use=new ToolUse();use.start({...strike,tool});
    const windup=toolSwingAngle(tool,1,false),contact=toolSwingAngle(tool,TOOL_IMPACT_FRAME,false);
    expect(windup).toBeLessThan(0);
    expect(contact).toBeGreaterThan(90);expect(contact).toBeLessThan(125);
    expect(toolSwingAngle(tool,8,false)).toBeLessThan(contact);
    for(let frame=0;frame<9;frame++)expect(toolSwingAngle(tool,frame,true)).toBe(-toolSwingAngle(tool,frame,false));
    expect(use.advance(TOOL_IMPACT_FRAME/TOOL_USE_FPS-.001)).toBeNull();
    expect(use.advance(.001)).toMatchObject({tool});
    expect(use.advance(TOOL_USE_DURATION)).toBeNull();
  });

  it('preserva o movimento da enxada e a animação sem rotação do regador',()=>{
    for(let frame=0;frame<9;frame++)for(const left of [false,true]){
      expect(toolSwingAngle('hoe',frame,left)).toBe(hoeSwingAngle(frame,left));
      expect(toolSwingAngle('water',frame,left)).toBe(0);
    }
  });
});
