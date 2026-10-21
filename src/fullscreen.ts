/** Ctrl + Alt toggles fullscreen once per press, including while menus are open. */
export function installFullscreenShortcut(onError: () => void): void {
  let held = false, changing = false;
  window.addEventListener('keyup', event => {
    if (!event.ctrlKey || !event.altKey) held = false;
  }, true);
  window.addEventListener('blur', () => { held = false; });
  window.addEventListener('keydown', event => {
    if (!event.ctrlKey || !event.altKey || event.shiftKey || event.metaKey || event.getModifierState('AltGraph')
      || (event.key !== 'Control' && event.key !== 'Alt')) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (held || event.repeat) return;
    held = true;
    if (changing) return;
    changing = true;
    try {
      const action = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
      void action.catch(onError).finally(() => { changing = false; });
    } catch { changing = false; onError(); }
  }, true);
}
