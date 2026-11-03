import { TOOL_USE_FPS, TOOL_USE_FRAMES, TOOL_IMPACT_FRAME, type AnimatedTool } from '../data/tool-art';
import type { CharacterDirection } from '../character-directions';
import {CHARACTER_DIRECTIONS} from '../character-directions';
import type { ResourceNode } from '../types';

export const TOOL_USE_DURATION = TOOL_USE_FRAMES / TOOL_USE_FPS;
export interface ToolStrike {
  tool: AnimatedTool;
  direction: CharacterDirection;
  target: ResourceNode;
  soilAction?: 'prepare' | 'restore';
}
export interface ToolUseSnapshot{strike:ToolStrike|null;elapsed:number;impacted:boolean}
export function validToolUseSnapshot(value:unknown):value is ToolUseSnapshot{
 if(!value||typeof value!=='object')return false;const s=value as ToolUseSnapshot;
 if(!Number.isFinite(s.elapsed)||s.elapsed<0||s.elapsed>TOOL_USE_DURATION+.00001||typeof s.impacted!=='boolean')return false;
 if(s.impacted&&s.elapsed+1e-8<TOOL_IMPACT_FRAME/TOOL_USE_FPS)return false;
 if(s.strike!==null&&!s.impacted&&s.elapsed+1e-8>=TOOL_IMPACT_FRAME/TOOL_USE_FPS)return false;
 if(s.strike===null)return true;const strike=s.strike,node=strike?.target;
 return !!strike&&['hatchet','pickaxe','water','hoe'].includes(strike.tool)&&CHARACTER_DIRECTIONS.includes(strike.direction)&&!!node&&typeof node.id==='string'&&node.id.length>0&&node.id.length<=80&&Number.isFinite(node.x)&&Number.isFinite(node.y);
}

/** One strike, one impact. Cancel discards the action; NPCs may persist its explicit snapshot. */
export class ToolUse {
  private strike: ToolStrike | null = null;
  private elapsed = 0;
  private impacted = false;

  get current(): ToolStrike | null { return this.strike; }
  get active(): boolean { return this.strike !== null; }
  get frame(): number { return Math.min(TOOL_USE_FRAMES - 1, Math.floor(this.elapsed * TOOL_USE_FPS + 1e-8)); }
  get progress(): number { return this.elapsed / TOOL_USE_DURATION; }
  snapshot():ToolUseSnapshot{return{strike:this.strike?structuredClone(this.strike):null,elapsed:this.elapsed,impacted:this.impacted};}
  restore(value:ToolUseSnapshot):boolean{if(!validToolUseSnapshot(value))return false;this.strike=value.strike?structuredClone(value.strike):null;this.elapsed=value.elapsed;this.impacted=value.impacted;return true;}

  start(strike: ToolStrike): boolean {
    if (this.active) return false;
    this.strike = { ...strike, target: { ...strike.target } };
    this.elapsed = 0; this.impacted = false;
    return true;
  }

  advance(seconds: number): ToolStrike | null {
    if (!this.strike || !Number.isFinite(seconds) || seconds <= 0) return null;
    this.elapsed = Math.min(TOOL_USE_DURATION, this.elapsed + seconds);
    const impact = !this.impacted && this.elapsed + 1e-8 >= TOOL_IMPACT_FRAME / TOOL_USE_FPS ? this.strike : null;
    if (impact) this.impacted = true;
    if (this.elapsed + 1e-8 >= TOOL_USE_DURATION) this.strike = null;
    return impact;
  }

  cancel(): void { this.strike = null; this.elapsed = 0; this.impacted = false; }
}
