const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out='/workspace/loading-regression-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const checks=[],errors=[];
 const check=(name,ok)=>{checks.push({name,passed:!!ok});console.log(name,!!ok);assert.ok(ok,name);};
 const url=process.env.QA_URL||'http://127.0.0.1:5190';
 try{
  const page=await browser.newPage();page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.locator('#new-game').waitFor();
  check('Menu sem construir a propriedade',await page.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;window.v=game.scene.getScene('Vale');return !v.world;}));
  let release;const held=new Promise(resolve=>release=resolve);let waiting=false;
  await page.route('**/assets/visual/nature/small-stones.png',async route=>{waiting=true;await held;await route.continue();});
  await page.locator('#new-game').click();await page.locator('[data-character="farmer-male"]').click();await page.locator('#character-name').fill('Abertura');await page.getByRole('button',{name:'Começar minha história'}).click();
  await page.waitForFunction(()=>document.querySelector('.new-game-opening video')?.currentTime>0);
  while(!waiting)await page.waitForTimeout(50);
  check('Vídeo já toca enquanto os recursos carregam',await page.locator('.new-game-opening video').evaluate(v=>v.currentTime>0&&!v.paused));
  check('Pular permanece bloqueado com recurso pendente',await page.locator('[data-skip-intro]').isHidden()&&await page.evaluate(()=>!v.world));
  release();await page.locator('[data-skip-intro]').waitFor({state:'visible'});
  check('Pular só aparece com cenário pronto',await page.evaluate(()=>!!v.world));await page.locator('[data-skip-intro]').click();await page.waitForFunction(()=>document.querySelector('#ui').dataset.area==='property');
  check('Novo jogo masculino termina no mundo',await page.evaluate(()=>v.running&&v.state.profile.characterId==='farmer-male'));await page.close();
  const retry=await browser.newPage();retry.setDefaultTimeout(180000);retry.on('pageerror',e=>errors.push(e.message));await retry.goto(url);await retry.locator('#new-game').click();await retry.locator('#character-name').fill('Recuperada');
  await retry.route('**/assets/visual/nature/small-stones.png',route=>route.abort());await retry.getByRole('button',{name:'Começar minha história'}).click();await retry.locator('#new-game').waitFor({state:'visible'});
  check('Falha de recurso retorna ao menu e preserva o save',await retry.evaluate(async()=>{window.storage=await import('/src/systems/save.ts');return storage.loadSave()?.profile.name==='Recuperada';}));
  await retry.unroute('**/assets/visual/nature/small-stones.png');await retry.locator('#continue-game').click();await retry.waitForFunction(()=>document.querySelector('#ui').dataset.area==='property');
  check('Tentar novamente carrega a partida preservada',await retry.evaluate(()=>storage.loadSave()?.profile.name==='Recuperada'));
  check('Sem erros JavaScript',errors.length===0);
 }finally{fs.writeFileSync(out+'/results.json',JSON.stringify({checks,errors},null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
