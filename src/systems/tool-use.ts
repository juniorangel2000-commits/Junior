import { TOOL_USE_FPS, TOOL_USE_FRAMES, TOOL_IMPACT_FRAME, type AnimatedTool } from '../data/tool-art';
import type { CharacterDirection } from '../character-directions';
import type { ResourceNode } from '../types';

export const TOOL_USE_DURATION = TOOL_USE_FRAMES / TOOL_USE_FPS;
export interface ToolStrike {
  tool: AnimatedTool;
  direction: CharacterDirection;
  target: ResourceNode;
  soilAction?: 'prepare' | 'restore';
}

/** One strike, one impact. No timers survive cancellation, menus or a loaded game. */
export class ToolUse {
  private strike: ToolStrike | null = null;
  private elapsed = 0;
  private impacted = false;

  get current(): ToolStrike | null { return this.strike; }
  get active(): boolean { return this.strike !== null; }
  get frame(): number { return Math.min(TOOL_USE_FRAMES - 1, Math.floor(this.elapsed * TOOL_USE_FPS + 1e-8)); }
  get progress(): number { return this.elapsed / TOOL_USE_DURATION; }

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
