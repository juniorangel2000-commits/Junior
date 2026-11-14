// Amostra de desempenho dos mapas. Vite em 5190; Chromium e Playwright externos.
// QA_SCENES=Campos,Floresta filtra; QA_CPU_PROFILE=1 grava perfis do DevTools.
// Mede quadros e métodos; não impõe FPS mínimos porque a GPU pode ser emulada.
// Execução direta das cenas para comparar renderização, sem substituir testes de travessia.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.argv[2] || '/tmp/after-rain-performance';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.setDefaultTimeout(120000); page.on('pageerror', (e) => { errors.push(e.message); console.log('JSERROR', e.message); });
    await page.goto(process.env.QA_URL || 'http://127.0.0.1:5190');
    await page.locator('#new-game').click(); await page.locator('#character-name').fill('Produção QA');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => { document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click(); return document.querySelector('#ui')?.dataset.area === 'property'; });

    await page.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;window.v=game.scene.getScene('Vale');window.perfSave=v.snapshotState();window.perfUI=v.ui;});
    const cdp=await page.context().newCDPSession(page);await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:1000});
    const results=[];
    const scenes=(process.env.QA_SCENES || 'Vale,Interior:1,Interior:2,Campos,Floresta,Lago,Serra,Mina,AcessoCidade,Vila').split(',').map(s=>{const [key,id]=s.split(':');return [key,id?Number(id):undefined];});
    for(const [key,siteId] of scenes){
      if(key!=='Vale'){
        await page.evaluate(({key,siteId})=>{
          for(const s of game.scene.getScenes(true))if(s.sys.settings.key!=='Vale')game.scene.stop(s.sys.settings.key);
          game.scene.sleep('Vale');
          const save=structuredClone(perfSave);save.farmConstruction={version:1,nextId:3,sites:[{id:1,kind:'coop',x:30,y:30,finished:true,delivered:{},animals:['forest-chicken-1','forest-chicken-2'],hay:0,gateOpen:true,animalsOverride:{inside:true,until:999999}},{id:2,kind:'barn',x:40,y:30,finished:true,delivered:{},animals:['forest-cow-1'],hay:0,gateOpen:true,animalsOverride:{inside:true,until:999999}}]};save.recruitedAnimals=['forest-chicken-1','forest-chicken-2','forest-cow-1'];
          game.scene.start(key,{save,ui:perfUI,siteId,onReturn:()=>{}});
        },{key,siteId});
        await page.waitForFunction(key=>{const s=game.scene.getScene(key);return game.scene.isActive(key)&&!!s.player&&!s.leaving;},key);
      }
      await page.waitForTimeout(1500);
      await page.evaluate(key=>{const s=game.scene.getScene(key);window.frameSamples=[];window.methodSamples={};window.handler=()=>frameSamples.push(performance.now());game.events.on('poststep',handler);for(const name of ['update','updateHUD','syncAnimals','persist']){if(typeof s[name]!=='function')continue;const orig=s[name];s[name]=function(...args){const start=performance.now();try{return orig.apply(this,args);}finally{(methodSamples[name]??=[]).push(performance.now()-start);}};s[name]._orig=orig;}},key);
      await cdp.send('Profiler.start');await page.waitForTimeout(Number(process.env.QA_SAMPLE_MS || 6500));const{profile}=await cdp.send('Profiler.stop');
      if(process.env.QA_CPU_PROFILE==='1')fs.writeFileSync(`${out}/${key}-${siteId??0}.cpuprofile`,JSON.stringify(profile));
      const result=await page.evaluate(key=>{game.events.off('poststep',handler);const stats=a=>{a.sort((a,b)=>a-b);return{n:a.length,mean:+(a.reduce((s,x)=>s+x,0)/a.length).toFixed(2),p95:+a[Math.floor(a.length*.95)]?.toFixed(2),max:+a.at(-1)?.toFixed(2)}};const gaps=frameSamples.slice(1).map((x,i)=>x-frameSamples[i]);const s=game.scene.getScene(key);const result={key,frames:stats(gaps),activeScenes:game.scene.getScenes(true).map(s=>s.sys.settings.key),methods:Object.fromEntries(Object.entries(methodSamples).map(([k,v])=>[k,stats(v)])),objects:s.children.length,renderer:game.renderer.type};for(const name of Object.keys(methodSamples))s[name]=s[name]._orig;return result;},key);
      results.push({...result,siteId});console.log(JSON.stringify({...result,siteId}));
    }
    const gpu=await page.evaluate(()=>{const gl=game.renderer.gl;if(!gl)return 'Canvas';const ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);});
    fs.writeFileSync(`${out}/results.json`,JSON.stringify({gpu,results},null,2));assert.deepEqual(errors,[]);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
