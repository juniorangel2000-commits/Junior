const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out='/workspace/save-delete-confirm-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:900}});page.setDefaultTimeout(60000);const errors=[];let nativeDialogs=0;
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{nativeDialogs++;await d.dismiss();});
 try{
  await page.goto(process.env.QA_URL||'http://127.0.0.1:5190');await page.locator('#new-game').waitFor();
  const fixture=await page.evaluate(async()=>{
   const lib=await import('/src/systems/save-library.ts'),storage=await import('/src/systems/save.ts'),slots=await import('/src/systems/save-slot-keys.ts');
   localStorage.clear();const fresh=name=>storage.createNewSave({name,skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso'});
   window.targetId=lib.createSavedGame(fresh('Juninho'),'JUNINHO').id;
   const s=storage.loadSave();s.day=2;storage.saveGame(s);window.targetKeys=slots.saveKeys(slots.slotSaveKey(targetId));
   window.otherId=lib.createSavedGame(fresh('Outra'),'Outra partida').id;window.originalStorage=JSON.stringify({...localStorage});
   return {targetId,otherId,targetKeys,originalStorage};
  });
  await page.reload();await page.locator('#load-games').click();await page.evaluate(fixture=>Object.assign(window,fixture),fixture);
  const remove=()=>page.locator(`[data-saved-game]`).filter({has:page.getByRole('heading',{name:'JUNINHO',exact:true})}).getByRole('button',{name:'Excluir',exact:true});
  await remove().click();await page.getByRole('alertdialog',{name:'Excluir partida?'}).waitFor();
  assert.equal(await page.locator('.save-delete-name').innerText(),'JUNINHO');
  assert.ok(await page.locator('footer [data-library-delete-cancel]').evaluate(el=>el===document.activeElement));
  await page.screenshot({path:out+'/confirmacao-excluir-partida.png'});
  await page.keyboard.press('Enter');assert.equal(await page.getByRole('alertdialog').count(),0);
  assert.ok(await page.evaluate(()=>JSON.stringify({...localStorage})===originalStorage));
  assert.ok(await remove().evaluate(el=>el===document.activeElement));
  await remove().click();await page.keyboard.press('Escape');assert.equal(await page.getByRole('alertdialog').count(),0);assert.equal(await page.locator('[data-saved-game]').count(),2);
  await remove().click();await page.locator('[data-library-delete-confirm]').focus();await page.keyboard.press('Tab');assert.ok(await page.locator('.save-delete-confirm header button').evaluate(el=>el===document.activeElement));
  await page.evaluate(()=>{window.originalRemove=Storage.prototype.removeItem;Storage.prototype.removeItem=function(){throw Error('Storage unavailable');};});
  await page.locator('[data-library-delete-confirm]').click();assert.equal(await page.locator('[data-library-delete-feedback]').innerText(),'Não foi possível concluir a exclusão.');assert.ok(await page.evaluate(()=>JSON.stringify({...localStorage})===originalStorage));
  await page.evaluate(()=>Storage.prototype.removeItem=window.originalRemove);
  await page.setViewportSize({width:390,height:844});
  const fit=await page.getByRole('alertdialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1&&el.getBoundingClientRect().width<=390);assert.ok(fit);
  await page.screenshot({path:out+'/confirmacao-tela-pequena.png'});
  await page.locator('[data-library-delete-confirm]').click();assert.equal(await page.locator('[data-saved-game]').count(),1);
  assert.ok(await page.evaluate(()=>Object.values(targetKeys).flat().every(k=>localStorage.getItem(k)===null)));
  const other=await page.evaluate(async()=>{const lib=await import('/src/systems/save-library.ts');return lib.listSavedGames().games[0];});assert.equal(other.name,'Outra partida');
  // User-supplied names must remain plain text, never executable markup.
  await page.evaluate(async()=>{const lib=await import('/src/systems/save-library.ts');lib.renameSavedGame(otherId,'<img src=x onerror=alert(1)>');});
  await page.keyboard.press('Escape');await page.locator('#load-games').click();await page.locator('[data-saved-game]').getByRole('button',{name:'Excluir',exact:true}).click();
  assert.equal(await page.locator('.save-delete-name img').count(),0);assert.equal(await page.locator('.save-delete-name').innerText(),'<img src=x onerror=alert(1)>');
  assert.equal(nativeDialogs,0);assert.deepEqual(errors,[]);
  console.log('PASS: confirmação interna, cancelamento por Enter/Escape, foco, erro de storage, exclusão isolada com backups, tela pequena e nomes seguros.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
