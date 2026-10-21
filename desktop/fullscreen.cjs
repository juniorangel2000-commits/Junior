// Native window fullscreen also works when HTML fullscreen permission is unavailable.
function installFullscreenShortcut(window) {
  let held = false;
  window.on('blur', () => { held = false; });
  window.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyUp') {
      if (input.key === 'Control' || input.key === 'Alt' || !input.control || !input.alt) held = false;
      return;
    }
    if (input.type !== 'keyDown' || !input.control || !input.alt || input.shift || input.meta
      || (input.key !== 'Control' && input.key !== 'Alt')) return;
    event.preventDefault(); // Do not also toggle HTML fullscreen in the renderer.
    if (held || input.isAutoRepeat) return;
    held = true;
    window.setFullScreen(!window.isFullScreen());
  });
}
module.exports = { installFullscreenShortcut };
