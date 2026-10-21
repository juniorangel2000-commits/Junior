import { describe, it, expect } from 'vitest';
import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';
const { installFullscreenShortcut } = createRequire(import.meta.url)('../desktop/fullscreen.cjs');

function fixture() {
  const window = Object.assign(new EventEmitter(), {
    webContents: new EventEmitter(), fullscreen: false, toggles: 0,
    isFullScreen() { return this.fullscreen; },
    setFullScreen(value: boolean) { this.fullscreen = value; this.toggles++; },
  });
  installFullscreenShortcut(window);
  const input = (value: Record<string, unknown>) => {
    let prevented = false;
    window.webContents.emit('before-input-event', { preventDefault() { prevented = true; } },
      { type: 'keyDown', key: 'Alt', control: true, alt: true, ...value });
    return prevented;
  };
  return { window, input };
}
describe('Ctrl + Alt no executável', () => {
  it('alterna nos dois sentidos e impede disparo duplicado no renderer', () => {
    const {window,input}=fixture();
    expect(input({})).toBe(true); expect(window.fullscreen).toBe(true);
    input({type:'keyUp',key:'Alt',alt:false});
    input({key:'Control'}); expect(window.fullscreen).toBe(false);
  });
  it('não alterna novamente ao manter as teclas pressionadas', () => {
    const {window,input}=fixture();input({});input({isAutoRepeat:true});input({});
    expect(window.toggles).toBe(1);
    window.emit('blur');input({});expect(window.toggles).toBe(2);
  });
  it('ignora modificadores sozinhos, AltGr e outras combinações', () => {
    const {window,input}=fixture();
    for(const value of [{alt:false},{control:false},{shift:true},{meta:true},{key:'AltGraph'},{key:'a'}]) expect(input(value)).toBe(false);
    expect(window.toggles).toBe(0);
  });
});
