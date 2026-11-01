const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out=process.env.SAVE_LIBRARY_QA_OUTPUT||'/workspace/save-library-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:960}});page.setDefaultTimeout(180000);const errors=[],checks=[];
 const check=(name,value,details)=>{checks.push({name,passed:!!value,details});console.log(name,!!value,details??'');assert.ok(value,name);};
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url())});
 const setup=()=>page.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;window.v=game.scene.getScene('Vale');window.library=await import('/src/systems/save-library.ts');window.storage=await import('/src/systems/save.ts');});
 try{
  await page.goto(process.env.QA_URL||'http://127.0.0.1:5190');await page.locator('#new-game').waitFor();await setup();
  await page.evaluate(()=>{localStorage.clear();const old={...storage.createNewSave({name:'Pioneira',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso'}),version:2,day:6};localStorage.setItem(storage.SAVE_KEY,JSON.stringify(old));});
  await page.reload();await page.locator('#load-games').click();await setup();
  check('Partida antiga aparece na biblioteca',await page.locator('[data-saved-game=legacy]').count()===1);
  await page.locator('[data-saved-game=legacy]').getByRole('button',{name:'Renomear'}).click();await page.locator('[data-saved-game=legacy] input').fill('Primeiro refúgio');await page.getByRole('button',{name:'Salvar nome'}).click();
  check('Renomear preserva o personagem e os bytes do save',await page.evaluate(()=>library.listSavedGames().games[0].name==='Primeiro refúgio'&&JSON.parse(localStorage.getItem(storage.SAVE_KEY)).profile.name==='Pioneira'&&JSON.parse(localStorage.getItem(storage.SAVE_KEY)).version===2));
  await page.locator('[data-saved-game=legacy]').getByRole('button',{name:'Carregar',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#ui').dataset.area==='property');
  check('Carregar restaura a partida escolhida',await page.evaluate(()=>v.state.profile.name==='Pioneira'&&v.state.day===6));
  await page.evaluate(()=>v.mainMenu());await page.locator('#new-game').click();
  check('Criação informa que outras partidas serão mantidas',await page.locator('.creation-tip').innerText().then(t=>t.includes('preservadas')));
  await page.locator('#character-name').fill('Segunda');await page.getByRole('button',{name:'Começar minha história'}).click();await page.waitForFunction(()=>document.querySelector('#ui').dataset.area==='property');
  check('Novo jogo cria outra partida sem substituir a antiga',await page.evaluate(()=>library.listSavedGames().games.length===2&&v.state.profile.name==='Segunda'&&v.state.day===1&&library.listSavedGames().games.some(g=>g.id==='legacy'&&g.read.data.day===6)));
  await page.evaluate(()=>v.mainMenu());await page.locator('#load-games').click();await page.screenshot({path:out+'/partidas-salvas.png'});
  await page.locator('[data-saved-game=legacy]').getByRole('button',{name:'Carregar',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#ui').dataset.area==='property');
  check('Alternar entre partidas mantém os progressos separados',await page.evaluate(()=>v.state.profile.name==='Pioneira'&&v.state.day===6&&library.listSavedGames().games.find(g=>g.id!=='legacy').read.data.day===1));
  await page.evaluate(()=>v.mainMenu());await page.locator('#load-games').click();
  const other=page.locator('[data-saved-game]:not([data-saved-game=legacy])');await other.getByRole('button',{name:'Excluir',exact:true}).click();await page.locator('footer [data-library-delete-cancel]').click();
  check('Cancelar exclusão mantém ambas as partidas',await page.locator('[data-saved-game]').count()===2);
  await other.getByRole('button',{name:'Excluir',exact:true}).click();await page.locator('[data-library-delete-confirm]').click();
  check('Excluir remove apenas a partida confirmada',await page.locator('[data-saved-game]').count()===1&&await page.locator('[data-saved-game=legacy]').count()===1);
  await page.keyboard.press('Escape');await page.locator('#continue-game').click();await page.waitForFunction(()=>document.querySelector('#ui').dataset.area==='property');
  check('Continuar ainda abre a partida preservada',await page.evaluate(()=>v.state.profile.name==='Pioneira'&&v.state.day===6));
  check('Sem erros JavaScript ou arquivos ausentes',errors.length===0,errors);
 }finally{fs.writeFileSync(out+'/results.json',JSON.stringify({checks,errors},null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
