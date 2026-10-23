const { _electron: electron } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const executablePath = process.env.AFTER_RAIN_DESKTOP_BINARY || '/tmp/after-rain-editor-linux/linux-unpacked/depois-da-chuva';
const exportPath = '/tmp/after-rain-editor-native-export.json';
(async () => {
  const app = await electron.launch({ executablePath, args: ['--no-sandbox', '--disable-dev-shm-usage'],
    env: { ...process.env, DISPLAY: process.env.DISPLAY || ':97', XDG_CONFIG_HOME: '/tmp/after-rain-editor-native-profile' } });
  try {
    const page = await app.firstWindow();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.locator('#edit-map').waitFor();
    assert.equal(new URL(page.url()).protocol, 'chuva:');
    await page.evaluate(() => localStorage.clear());
    await page.reload(); await page.locator('#edit-map').click();
    const editor = page.locator('.map-editor-ui'); await editor.waitFor();
    const map = { version: 1, width: 96, height: 72, terrain: { '67,18': 'path' }, objects: {} };
    await editor.locator('input[type=file]').setInputFiles({ name: 'meu-mapa.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(map)) });
    await page.waitForFunction(() => document.querySelector('.me-draft-state')?.textContent === 'Rascunho alterado');
    // The desktop download uses its real session; choose a test path instead of opening the OS dialog.
    await app.evaluate(({ BrowserWindow }, path) => {
      BrowserWindow.getAllWindows()[0].webContents.session.on('will-download', (_event, item) => item.setSavePath(path));
    }, exportPath);
    await fs.rm(exportPath, { force: true });
    await editor.locator('[data-action=export]').click();
    for (let i=0; i<40; i++) { try { JSON.parse(await fs.readFile(exportPath,'utf8')); break; } catch { await page.waitForTimeout(100); } }
    assert.deepEqual(JSON.parse(await fs.readFile(exportPath,'utf8')), map, 'native desktop exported exact map JSON');
    // Failed save must retain the editor and permit a retry/export.
    await page.evaluate(() => { window.originalStorageSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function(k,v){ if(k==='depois-da-chuva-v1') throw new DOMException('full','QuotaExceededError'); return window.originalStorageSetItem.call(this,k,v); }; });
    await editor.locator('[data-action=apply]').click();
    await page.waitForFunction(()=>document.querySelector('.map-editor-ui [data-status]')?.textContent.includes('Não foi possível salvar'));
    assert.equal(await page.evaluate(()=>localStorage.getItem('depois-da-chuva-v1')),null);
    await page.evaluate(()=>{Storage.prototype.setItem=window.originalStorageSetItem});
    await editor.locator('[data-action=apply]').click();await editor.waitFor({state:'detached'});
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('depois-da-chuva-v1')).mapEdits),map);
    await page.reload(); await page.locator('#continue-game').click(); await page.keyboard.press('F2'); await editor.waitFor();
    await page.screenshot({path:'/tmp/after-rain-editor-desktop.png'});
    await editor.locator('[data-action=cancel]').click();
    assert.deepEqual(errors,[]);
    console.log('PASS packaged Electron desktop (chuva://): import, actual file export, save failure recovery, apply, save/reload and F2.');
  } finally { await app.close(); }
})().catch(error=>{console.error(error);process.exit(1)});
