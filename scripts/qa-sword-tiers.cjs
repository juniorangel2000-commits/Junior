/* Conferência das espadas de nível no navegador (preview.41): mochila, ferraria do Bento e golpe.
 * Uso: node scripts/qa-sword-tiers.cjs <pasta das imagens> · jogo em http://127.0.0.1:5190 */
const{chromium}=require('playwright');
(async()=>{const out=process.argv[2];const b=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const page=await b.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(200000);const errs=[];page.on('pageerror',e=>errs.push(e.message));
await page.goto('http://127.0.0.1:5190');await page.locator('#new-game').click();await page.locator('#character-name').fill('Espada');await page.getByRole('button',{name:'Começar minha história'}).click();
await page.waitForFunction(()=>{document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click();return document.querySelector('#ui')?.dataset.area==='property';});
// 1. Espada de ouro na mochila: ícone e detalhe.
await page.evaluate(async()=>{window.__g=(await import(document.querySelector('script[src*="main.ts"]').src)).game;const v=__g.scene.getScene('Vale');window.v=v;
 const eco=await import('/src/systems/economy.ts');const s=v.snapshotState();s.inventory.sword=1;s.time=9*60+30;eco.configureTool(s,'sword',2);v.loadState(s);});
await page.waitForTimeout(1200);
await page.evaluate(()=>v.ui.toggleInventory(v.inventory.data));await page.waitForTimeout(600);
await page.locator('[data-bag-item="sword"], [data-bag-item^="tool:sword"], [data-bag-item*="sword"]').first().click().catch(e=>console.log('sem slot',e.message.slice(0,80)));
await page.waitForTimeout(500);await page.screenshot({path:out+'/espada-inventario.png'});
console.log('detalhe:',await page.evaluate(()=>document.querySelector('.detail-text')?.textContent));
await page.evaluate(()=>v.ui.toggleInventory(v.inventory.data));await page.waitForTimeout(300);
// 2. Ferraria: aba Ferramentas e reparos.
await page.evaluate(async()=>{const m=await import('/src/blacksmith-panel.ts');m.openBlacksmithPanel(()=>{const s=v.snapshotState();if(s.villageRoutines)delete s.villageRoutines.bento;delete s.bentoTravel;return s;},change=>({ok:false,message:'(teste)'}),()=>{},false);});
await page.waitForTimeout(600);
const tabs=await page.evaluate(()=>[...document.querySelectorAll('.village-layer:not([hidden]) nav button, .village-panel nav button')].map(b=>b.textContent));console.log('abas',JSON.stringify(tabs));
await page.getByRole('button',{name:'Ferramentas e reparos'}).click();await page.waitForTimeout(500);await page.locator('[data-smith-action^="reserve-sword"], article:has-text("Espada #")').first().scrollIntoViewIfNeeded().catch(()=>{});await page.screenshot({path:out+'/ferraria-bento.png'});console.log('espada na ferraria:',await page.evaluate(()=>[...document.querySelectorAll('article h3')].map(h=>h.textContent).filter(t=>t.includes('Espada')).join(' | ')));
await page.evaluate(()=>document.querySelectorAll('.village-layer').forEach(l=>{if(l.querySelector('.village-panel h2')?.textContent?.includes('Ferraria'))l.remove();}));
// 3. Golpe dos 4 níveis lado a lado.
await page.evaluate(async()=>{const m=await import('/src/camp-combat-art.ts');m.preloadCampCombat(v);await new Promise(r=>{if(!v.load.isLoading()&&v.load.totalToLoad===0){r();return;}v.load.once('complete',r);v.load.start();});
 document.querySelector('#ui').style.visibility='hidden';v.cameras.main.stopFollow();const c=v.cameras.main;c.centerOn(v.player.x,v.player.y);
 window.__arts=[0,1,2,3].map(t=>{const a=new m.CampCombatArt(v);a.swing({id:0,weapon:'sword',x:v.player.x-165+t*110,y:v.player.y-10,angle:-0.3,ttl:.22,variant:0,radius:60,tier:t});return a;});
 __g.loop.sleep();window.__t=performance.now();for(const a of __arts)a.update(.09);__t+=16;__g.step(__t,16);});
await page.waitForTimeout(200);await page.screenshot({path:out+'/golpes.png',clip:{x:260,y:250,width:760,height:260}});
console.log('erros',errs.length,errs.slice(0,3).join(' | '));await b.close();})();
