const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const out=process.env.NILO_QA_OUTPUT||'/workspace/after-rain-nilo';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const errors=[],checks=[];
 try{
  const p=await browser.newPage({viewport:{width:1440,height:940}});p.setDefaultTimeout(120000);p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await p.goto('http://127.0.0.1:5188');await p.locator('#new-game').click();await p.locator('#character-name').fill('Nilo produção');await p.getByRole('button',{name:'Começar minha história'}).click();await p.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='property');
  const fixture=await p.evaluate(()=>{const key='depois-da-chuva-v1',s=JSON.parse(localStorage.getItem(key));s.activeArea='village';s.time=540;s.merchantInterior={owner:'nilo',x:288,y:335,direction:'up'};s.shopResidents=[{id:'nilo',x:288,y:151,direction:'down',shop:true}];s.villageRoutines={nilo:{area:'shop',x:288,y:151,direction:'down',stop:0,wait:60,serviceUntil:0,socialUntil:0,socialDay:0}};delete s.homePosition;delete s.animalEscort;return JSON.stringify(s);});
  // Install on navigation, after the previous scene's pagehide autosave.
  await p.addInitScript(save=>{if(!sessionStorage.getItem('nilo-fixture-installed')){localStorage.setItem('depois-da-chuva-v1',save);sessionStorage.setItem('nilo-fixture-installed','1');}},fixture);
  await p.reload();await p.locator('#continue-game').click();await p.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='village');console.log('Etapa concluída');checks.push('Build de produção carrega save dentro do antiquário');
  await p.keyboard.press('h');assert.equal(await p.locator('.smith-editor').count(),0);console.log('Etapa concluída');checks.push('Editor não aparece no build normal de produção');
  await p.keyboard.press('Escape');await p.getByRole('button',{name:'Salvar meu progresso',exact:true}).click();await p.reload();await p.locator('#continue-game').click();await p.waitForFunction(()=>document.querySelector('#ui')?.dataset.area==='village');
  assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('depois-da-chuva-v1')).merchantInterior.owner),'nilo');console.log('Etapa concluída');checks.push('Save e continuação preservam o interior do Nilo');
  assert.deepEqual(errors,[]);console.log('Etapa concluída');checks.push('Sem erros JavaScript ou assets ausentes');fs.writeFileSync(out+'/producao-validacao.json',JSON.stringify({passed:true,checks,errors},null,2));console.log(JSON.stringify({passed:true,checks,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
