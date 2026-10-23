interface Point { x: number; y: number }

/** Independent saved positions for floating HUD elements, including button handles. */
export function makeDraggablePanel(panel: HTMLElement, handle: HTMLElement, root: HTMLElement, storageKey: string): () => void {
  let position: Point | undefined;
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved && typeof saved === 'object' && 'x' in saved && 'y' in saved
      && typeof saved.x === 'number' && Number.isFinite(saved.x)
      && typeof saved.y === 'number' && Number.isFinite(saved.y)) position = { x: saved.x, y: saved.y };
  } catch { /* A blocked or corrupted preference must not disable dragging. */ }
  const save = (): void => {
    if (!position) return;
    try { localStorage.setItem(storageKey, JSON.stringify(position)); } catch { /* Keep the session position. */ }
  };
  const place = (x: number, y: number): void => {
    position = {
      x: Math.max(0, Math.min(Math.max(0, window.innerWidth - panel.offsetWidth), x)),
      y: Math.max(0, Math.min(Math.max(0, window.innerHeight - panel.offsetHeight), y)),
    };
    panel.style.left = `${position.x}px`;
    panel.style.top = `${position.y}px`;
  };
  const clamp = (): void => {
    // Hidden elements have no dimensions. Restore/clamp after they are shown.
    if (!position || !panel.getClientRects().length) return;
    place(position.x, position.y);
  };
  clamp();
  let drag: { pointer: number; start: Point; offset: Point; moved: boolean } | null = null;
  let suppressClick = false;
  const down = (event: PointerEvent): void => {
    if (event.button !== 0 || drag) return;
    const button = (event.target as Element).closest('button');
    if (button && button !== handle) return;
    suppressClick = false;
    const bounds = panel.getBoundingClientRect();
    drag = { pointer: event.pointerId, start: { x: event.clientX, y: event.clientY },
      offset: { x: event.clientX - bounds.left, y: event.clientY - bounds.top }, moved: false };
    handle.setPointerCapture(event.pointerId);
    event.stopPropagation();
  };
  const move = (event: PointerEvent): void => {
    if (!drag || event.pointerId !== drag.pointer) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.start.x, event.clientY - drag.start.y) < 6) return;
    drag.moved = true;
    place(event.clientX - drag.offset.x, event.clientY - drag.offset.y);
    event.preventDefault(); event.stopPropagation();
  };
  const finish = (event: PointerEvent): void => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const ended = drag; drag = null;
    suppressClick = ended.moved && event.type !== 'pointercancel';
    if (ended.moved) save();
    if (handle.hasPointerCapture(ended.pointer)) handle.releasePointerCapture(ended.pointer);
    event.stopPropagation();
  };
  const click = (event: MouseEvent): void => {
    // Keyboard activation has detail 0 and should always open a minimized tab.
    if (suppressClick && event.detail !== 0) { event.preventDefault(); event.stopImmediatePropagation(); }
    suppressClick = false;
  };
  handle.addEventListener('pointerdown', down);
  handle.addEventListener('pointermove', move);
  handle.addEventListener('pointerup', finish);
  handle.addEventListener('pointercancel', finish);
  handle.addEventListener('lostpointercapture', finish);
  handle.addEventListener('click', click, true);
  const observer = new ResizeObserver(clamp);
  observer.observe(root); observer.observe(panel);
  window.addEventListener('resize', clamp);
  return () => {
    const pointer = drag?.pointer; drag = null;
    if (pointer !== undefined && handle.hasPointerCapture(pointer)) handle.releasePointerCapture(pointer);
    observer.disconnect(); window.removeEventListener('resize', clamp);
    handle.removeEventListener('pointerdown', down);
    handle.removeEventListener('pointermove', move);
    handle.removeEventListener('pointerup', finish);
    handle.removeEventListener('pointercancel', finish);
    handle.removeEventListener('lostpointercapture', finish);
    handle.removeEventListener('click', click, true);
  };
}
