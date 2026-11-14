// Conferência dos móveis (Vite em 127.0.0.1:5190): arte nativa, editor, colisão e reentrada.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.argv[2] || 'docs/planejamento/qa-moveis';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.setDefaultTimeout(120000); page.on('pageerror', (e) => { errors.push(e.message); console.log('JSERROR', e.message); });
    await page.goto('http://127.0.0.1:5190');
    await page.locator('#new-game').click(); await page.locator('#character-name').fill('Cozinha QA');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => { document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click(); return document.querySelector('#ui')?.dataset.area === 'property'; });
    await page.evaluate(async () => {
      const { game } = await import(document.querySelector('script[src*="main.ts"]').src);
      window.v = game.scene.getScene('Vale');
      v.enterHome();
    });
    await page.waitForTimeout(4300);
    const furniture = await page.evaluate(() => v.homeView.objects.filter(o => o.getData('homeFurnitureId')).map(o => ({id:o.getData('homeFurnitureId'), key:o.texture.key, w:o.displayWidth, h:o.displayHeight, sourceWidth:o.width, uniform:Math.abs(o.scaleX-o.scaleY)<0.00001})));
    assert.equal(furniture.length, 7);
    assert.ok(furniture.every(o => o.sourceWidth > 100 && o.uniform));
    await page.screenshot({path: `${out}/casa-moveis.png`});
    await page.keyboard.press('h');
    await page.waitForSelector('.home-editor');
    await page.locator('[data-home-x="2"][data-home-y="6"]').click();
    await page.locator('[data-home-move]').click();
    await page.locator('[data-home-x="1"][data-home-y="6"]').click();
    assert.match(await page.locator('.home-edit-status').innerText(), /reposicionado/);
    await page.keyboard.press('Escape');
    const layout = await page.evaluate(() => {
      const plant = v.home.data.furniture.find(f => f.kind === 'plant');
      return {plant, blocked:v.home.isBlocked(1,6), cleared:!v.home.isBlocked(2,6), bed:!!v.home.bedNear({x:3,y:4},1.1), exit:v.home.canReachExit({x:5,y:8})};
    });
    assert.equal(layout.plant.x,1);assert.ok(layout.blocked && layout.cleared && layout.bed && layout.exit);
    await page.evaluate(() => { v.persist(); v.leaveHome(); v.enterHome(); });
    assert.equal(await page.evaluate(() => v.home.data.furniture.find(f => f.kind === 'plant').x),1);
    await page.screenshot({path: `${out}/casa-reorganizada.png`});
    fs.writeFileSync(`${out}/validacao.json`, JSON.stringify({furniture,layout,errors},null,2));
    assert.deepEqual(errors, []); console.log('QA dos móveis: OK');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
