const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const out=process.env.PERMANENT_QA_OUTPUT||'/workspace/after-rain-permanent-focused';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:1600,height:1200}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.QA_URL||'http://127.0.0.1:5184');
 await page.evaluate(async()=>{
 const {DungeonUI}=await import('/src/dungeons/ui.ts');const {createDungeonProgress,buyPermanentAttribute}=await import('/src/dungeons/progression.ts');
 const p=window.progress=createDungeonProgress();p.xp=10000;p.pets=[{id:'pet-very-long-internal-identifier',species:'dog',rare:false,xp:500,attributes:{speed:0,resistance:0,perception:0,protection:0,efficiency:0}}];
 window.permanentUI=new DungeonUI({evolve:(key,pet,attribute)=>{const before=structuredClone(p);buyPermanentAttribute(p,key,pet,attribute);if(window.failPurchase)Object.assign(p,before);}},{});
 permanentUI.evolution(p,()=>{});
 });
 await page.locator('[data-attribute="agility"]').click();await page.keyboard.press('Enter');
 assert.deepEqual(await page.evaluate(()=>[progress.attributes.strength,progress.attributes.agility,document.activeElement.dataset.attribute]),[0,2,'agility']);
 await page.screenshot({path:out+'/personagem.png'});
 await page.locator('[data-evolution-target]').selectOption('pet-very-long-internal-identifier');
 assert.equal(await page.locator('[data-evolution-target] option:checked').textContent(),'Cão · Companheiro 1');
 await page.locator('[data-pet-attribute="speed"]').click();assert.equal(await page.evaluate(()=>progress.pets[0].xp),380);
 await page.screenshot({path:out+'/pet.png'});
 await page.locator('[data-evolution-target]').selectOption('character');await page.evaluate(()=>window.failPurchase=true);
 await page.locator('[data-attribute="vitality"]').click();assert.equal(await page.evaluate(()=>progress.attributes.vitality),0);
 assert.match(await page.locator('.permanent-feedback').textContent(),/não foi aplicada/);
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>{const p=document.querySelector('.permanent-menu');return p.scrollWidth<=p.clientWidth+1;}));
 await page.evaluate(()=>document.querySelector('.permanent-menu').scrollTop=0);
 await page.screenshot({path:out+'/390.png'});
 assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/validacao.json',JSON.stringify({passed:true,checks:['Keyboard focus preserves selected attribute','Pet selector hides internal identifiers','Pet purchase uses its own balance','Failed purchase reports rollback','390px layout has no horizontal overflow','No JavaScript errors'],errors},null,2));
 console.log('PASS 6 focused checks');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
