/** Original pixel art: a 3×3 atlas keeps the nine toolbar illustrations aligned. */
const cells: Record<string, [number, number]> = {
  inventory: [0, 0], map: [1, 0], crafting: [2, 0],
  building: [0, 1], audio: [1, 1], save: [2, 1],
  controls: [0, 2], options: [1, 2], chevron: [2, 2],
};
export function toolbarIcon(name: string): string {
  if(name==='mineJournal')return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3h8l2 2h8v17h-8l-2-2H3Zm8 0v17M14 9l6 3m-6 5 4-8"/></svg>';
  if(name==='fishingJournal')return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3h8l2 2h8v17h-8l-2-2H3Zm8 0v17"/><path d="m15 12 2-3 3 3-3 3Z"/></svg>';
  if(name==='pets')return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><ellipse cx="5" cy="8" rx="2" ry="3"/><ellipse cx="10" cy="5" rx="2" ry="3"/><ellipse cx="15" cy="5" rx="2" ry="3"/><ellipse cx="20" cy="8" rx="2" ry="3"/><path d="M5 19C2 16 8 11 12 11S22 16 19 19C17 22 15 20 12 20S7 22 5 19Z"/></svg>';
  if(name==='graphics'||name==='controls')return `<span class="icon toolbar-art-icon toolbar-new-art" data-toolbar-icon="${name}" aria-hidden="true" style="background-position:${name==='graphics'?0:100}% 0%"></span>`;
  const cell = cells[name] ?? cells.options;
  return `<span class="icon toolbar-art-icon" data-toolbar-icon="${name}" aria-hidden="true" style="background-position:${cell[0] * 50}% ${cell[1] * 50}%"></span>`;
}
