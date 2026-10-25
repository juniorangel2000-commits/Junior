/** Original pixel art: a 3×3 atlas keeps the nine toolbar illustrations aligned. */
const cells: Record<string, [number, number]> = {
  inventory: [0, 0], map: [1, 0], crafting: [2, 0],
  building: [0, 1], audio: [1, 1], save: [2, 1],
  controls: [0, 2], options: [1, 2], chevron: [2, 2],
};
export function toolbarIcon(name: string): string {
  if(name==='graphics'||name==='controls')return `<span class="icon toolbar-art-icon toolbar-new-art" data-toolbar-icon="${name}" aria-hidden="true" style="background-position:${name==='graphics'?0:100}% 0%"></span>`;
  const cell = cells[name] ?? cells.options;
  return `<span class="icon toolbar-art-icon" data-toolbar-icon="${name}" aria-hidden="true" style="background-position:${cell[0] * 50}% ${cell[1] * 50}%"></span>`;
}
