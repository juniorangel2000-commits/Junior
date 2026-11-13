// Conferência das sementes na mochila e das 95 fases no cenário.
// Servidor Vite em 127.0.0.1:5190; CHROMIUM_PATH pode indicar outro Chromium.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.argv[2] || 'docs/planejamento/qa-cesta-helena';
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1440 } });
    page.setDefaultTimeout(180000);
    page.on('pageerror', (e) => { errors.push(e.message); console.log('JSERROR', e.message); });
    await page.goto('http://127.0.0.1:5190');console.log('titulo');
    await page.locator('#new-game').click();console.log('criacao');
    await page.locator('#character-name').fill('Horta QA');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => {document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click();return document.querySelector('#ui')?.dataset.area === 'property';});console.log('propriedade');
    await page.evaluate(async()=>{
      window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;
      const v=game.scene.getScene('Vale');v.state.day=40;v.state.time=600;v.state.villageEconomy.coins=100;
      Object.assign(v.inventory.data,{carrot:3,strawberry:3,corn:3});v.enterVillage();
    });
    await page.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='village');
    await page.evaluate(async()=>{
      window.v=game.scene.getScene('Vila');Object.assign(v.state.inventory,v.inventory.data);
      const {VILLAGE_NPCS}=await import('/src/data/village.ts');v.shop.open(VILLAGE_NPCS.find(n=>n.id==='helena'));
    });
    await page.locator('[data-village-tab="services"]').click();
    const order=page.locator('[data-village-service="create-harvest-basket"]');await order.scrollIntoViewIfNeeded();
    await page.screenshot({path:`${out}/helena-cesta.png`});await order.click();
    const report=await page.evaluate(()=>({basket:v.inventory.data.harvestBasket,carrot:v.inventory.data.carrot,strawberry:v.inventory.data.strawberry,corn:v.inventory.data.corn,coins:v.state.villageEconomy.coins}));
    assert.deepEqual(report,{basket:1,carrot:2,strawberry:2,corn:2,coins:80});
    await page.locator('[data-village-close]').click();
    await page.evaluate(()=>v.ui.toggleInventory(v.inventory.data));
    await page.locator('[data-bag-item="item:harvestBasket"]').click();
    assert.match(await page.locator('body').innerText(),/Cesta de colheita/);
    await page.screenshot({path:`${out}/cesta-mochila.png`});assert.deepEqual(errors,[]);
    console.log('QA OK: serviço real da Helena entregou cesta na mochila, consumiu receita e 20 C; nenhum erro JS');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
