// Conferência das sementes na mochila e das 76 fases no cenário.
// Servidor Vite em 127.0.0.1:5190; CHROMIUM_PATH pode indicar outro Chromium.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.argv[2] || 'docs/planejamento/qa-catalogo-cultivos';
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
    page.setDefaultTimeout(180000);
    page.on('pageerror', (e) => { errors.push(e.message); console.log('JSERROR', e.message); });
    await page.goto('http://127.0.0.1:5190');console.log('titulo');
    await page.locator('#new-game').click();console.log('criacao');
    await page.locator('#character-name').fill('Horta QA');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => {document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click();return document.querySelector('#ui')?.dataset.area === 'property';});console.log('propriedade');
    await page.evaluate(async () => {
      window.game = (await import(document.querySelector('script[src*="main.ts"]').src)).game;
      window.v = game.scene.getScene('Vale');
      v.state.time=600;v.inventory.data.carrotSeeds=4;v.inventory.data.hoe=1;
      v.farming.prepare(21,20,v.inventory,{area:'property',terrainAt:()=> 'grass',occupied:()=>false,reserved:()=>false});
      v.player.x=21*32+16;v.player.y=19*32+20;v.player.facing={x:0,y:1};v.updateHUD();
      v.ui.toggleInventory(v.inventory.data);
    });
    await page.locator('[data-bag-item="item:carrotSeeds"]').first().click();
    await page.locator('[data-use-item="carrotSeeds"]').click();
    assert.equal(await page.evaluate(()=>v.state.selectedCrop),'carrot');
    assert.match(await page.locator('body').innerText(),/Plantar cenoura/);
    await page.evaluate(()=>{const refused=v.farming.plant(31,30,v.inventory,v.state.day,v.state.selectedCrop);if(refused.ok||v.inventory.data.carrotSeeds!==4)throw Error('Plantio fora da terra arada foi aceito');const r=v.farming.plant(21,20,v.inventory,v.state.day,v.state.selectedCrop);if(!r.ok)throw Error(r.message);v.syncSprites();});
    assert.equal(await page.evaluate(()=>v.farming.cropAt(21,20).crop),'carrot');
    assert.equal(await page.evaluate(()=>v.inventory.data.carrotSeeds),3);
    // Jardim de conferência: todas as espécies e todas as fases, sem avançar estações.
    const report=await page.evaluate(async()=>{
      const {CROP_CATALOG}=await import('/src/data/crop-catalog.ts');
      v.farming.crops.splice(0);v.state.selectedCrop='carrot';
      CROP_CATALOG.forEach((c,i)=>{for(let stage=0;stage<4;stage++){
        const x=20+i%10,y=18+Math.floor(i/10)*5+stage;
        if(!v.farming.isPrepared(x,y)){const result=v.farming.prepare(x,y,v.inventory,{area:'property',terrainAt:()=> 'grass',occupied:()=>false,reserved:()=>false});if(!result.ok)throw Error(result.message);}
        v.farming.crops.push({x,y,crop:c.id,days:Math.floor(c.days*stage/3),day:v.state.day,growth:stage/3,watered:true});
      }});
      if(v.farming.crops.some(c=>!v.farming.isPrepared(c.x,c.y)))throw Error('Planta sem terra arada na prévia');
      v.syncSprites();v.player.x=25*32;v.player.y=22*32;
      v.cameras.main.setZoom(2);v.updateHUD();
      
      return {plants:CROP_CATALOG.length,sprites:v.cropSprites.length,missing:v.cropSprites.filter(s=>s.texture.key==='__MISSING').length};
    });
    assert.deepEqual(report,{plants:19,sprites:76,missing:0});
    await page.waitForTimeout(400);await page.screenshot({path:`${out}/jardim-catalogo.png`});
    assert.deepEqual(errors,[]);console.log('QA OK: semente equipada pela mochila, plantio recusado fora da terra arada, cenoura e 76 fases em canteiros arados; nenhum erro JS');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
