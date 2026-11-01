const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out='/workspace/all-map-editors-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:960}});page.setDefaultTimeout(180000);const errors=[],checks=[];
 const check=(name,value)=>{checks.push({name,passed:!!value});console.log(name,!!value);assert.ok(value,name);};
 page.on('pageerror',e=>{errors.push(e.stack||e.message);console.log('PAGE ERROR',e.stack||e.message);});page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 const wait=()=>page.waitForTimeout(120);
 const focus=async p=>{await page.evaluate(p=>{window.editorScene=game.scene.getScene('Editor');const c=editorScene.cameras.main;c.setZoom(1).centerOn((p.x+.5)*32-170,(p.y+.5)*32-70);c.preRender();},p);await wait();};
 const screen=p=>page.evaluate(p=>{const c=editorScene.cameras.main;c.preRender();const a=c.getWorldPoint(0,0);return{x:((p.x+.5)*32-a.x)*c.zoom,y:((p.y+.5)*32-a.y)*c.zoom};},p);
 const free=()=>page.evaluate(()=>{const e=editorScene.editor;for(let y=55;y<66;y++)for(let x=65;x<80;x++)if(!e.protected({x,y},true)&&e.adapter.canPlace(x,y,undefined,'whiteFlowers')&&!e.adapter.objects().some(o=>o.x===x&&o.y===y))return{x,y};throw Error('no free tile');});
 const paint=async p=>{await focus(p);await page.locator('[data-mode=terrain][data-terrain=wood]').click();const s=await screen(p);await page.mouse.click(s.x,s.y);await wait();check('Piso pintado em '+await page.locator('.map-editor-ui').getAttribute('data-map-area'),await page.evaluate(p=>editorScene.editor.history.current.terrain[`${p.x},${p.y}`]==='wood',p));};
 try{
  await page.goto(process.env.QA_URL||'http://127.0.0.1:5190');await page.locator('#edit-map').click();await page.locator('.map-editor-ui').waitFor();
  await page.evaluate(async()=>{window.game=(await import(document.querySelector('script[src*="main.ts"]').src)).game;window.v=game.scene.getScene('Vale');window.editorScene=game.scene.getScene('Editor');});
  check('Sete cenários no seletor',await page.locator('button[data-map-area]').count()===7);
  const painted={};
  for(const area of ['property','forest','village','cityForest','fishingLake','abandoned-central-square','mall-parking']){
   if(area!=='property'){await page.locator(`[data-map-area="${area}"]`).click();console.log('Trocar para',area,'status:',await page.locator('[data-status]').innerText());await page.waitForFunction(area=>document.querySelector('.map-editor-ui')?.dataset.mapArea===area,area,{timeout:10000});}
   if(area==='village'){
    for(const kind of ['village-barrel','village-lantern','village-bench-south']){
     const move=await page.evaluate(kind=>{const e=editorScene.editor,o=e.adapter.objects().find(o=>o.kind===kind&&!e.protected(o));if(!o)throw Error('unselectable '+kind);for(let radius=2;radius<6;radius++)for(const [dx,dy]of [[radius,0],[-radius,0],[0,radius],[0,-radius]]){const p={x:o.x+dx,y:o.y+dy};if(e.free(p,o.id))return{object:o,to:p};}throw Error('no move destination');},kind);
     await focus({x:(move.object.x+move.to.x)/2,y:(move.object.y+move.to.y)/2});await page.locator('[data-mode=select]').click();
     const a=await screen(move.object),b=await screen(move.to);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:8});await page.mouse.up();await wait();
     check('Arrastar '+kind,await page.evaluate(({object,to})=>editorScene.editor.history.current.objects[object.id]?.x===to.x&&editorScene.editor.history.current.objects[object.id]?.y===to.y,move));
     await page.locator('[data-action=undo]').click();await wait();check('Desfazer '+kind,await page.evaluate(o=>!editorScene.editor.history.current.objects[o.id],move.object));
     await page.locator('[data-action=redo]').click();await wait();
    }
    await page.screenshot({path:out+'/vila-objetos-editaveis.png'});
   }
   painted[area]=await free();await paint(painted[area]);
   const before=await page.evaluate(()=>editorScene.editor.history.current);
   const downloadPromise=page.waitForEvent('download');await page.locator('[data-action=export]').click();const download=await downloadPromise;check('Exportação '+area,JSON.stringify(JSON.parse(fs.readFileSync(await download.path(),'utf8')))===JSON.stringify(before));
   if(area==='mall-parking')await page.screenshot({path:out+'/editor-estacionamento.png'});
  }
  await page.locator('[data-action=apply]').click();await page.waitForSelector('.map-editor-ui',{state:'detached'});
  const stored=await page.evaluate(async painted=>{const {loadSave,validateSave}=await import('/src/systems/save.ts');const {readSceneMap}=await import('/src/systems/scene-map-edits.ts');const s=loadSave();window.saved=s;return validateSave(s)&&Object.entries(painted).every(([area,p])=>readSceneMap(s,area).terrain[`${p.x},${p.y}`]==='wood');},painted);check('Aplicar salva todos os sete mapas',stored);
  await page.evaluate(()=>{v.villageActive=true;v.scene.sleep();game.scene.start('AcessoCidade',{save:structuredClone(saved),ui:v.ui,onReturn(){}});});
  await page.waitForFunction(()=>game.scene.isActive('AcessoCidade')&&document.querySelector('#ui').dataset.area==='cityForest');await page.keyboard.press('F2');await page.waitForSelector('.map-editor-ui');check('F2 abre diretamente no acesso à cidade',await page.locator('.map-editor-ui').getAttribute('data-map-area')==='cityForest');
  await page.locator('[data-action=cancel]').click();await page.waitForSelector('.map-editor-ui',{state:'detached'});
  await page.evaluate(()=>{game.scene.stop('AcessoCidade');game.scene.start('Dungeons',{save:structuredClone(saved),ui:v.ui,onReturn(){},skipTravel:true});});
  await page.waitForSelector('.dungeon-menu');await page.evaluate(()=>game.scene.getScene('Dungeons').startRun('mall-parking'));
  await page.waitForFunction(()=>game.scene.getScene('Dungeons').run?.state.phase==='fighting');
  const before=await page.evaluate(()=>{const d=game.scene.getScene('Dungeons');d.run.pause();d.ui.pause(d.run);return{elapsed:d.run.state.elapsed,hp:d.run.state.player.hp};});
  await page.locator('[data-edit-map]').click();await page.waitForSelector('.map-editor-ui');check('Menu de pausa abre diretamente o mapa da dungeon',await page.locator('.map-editor-ui').getAttribute('data-map-area')==='mall-parking');
  await page.locator('[data-action=apply]').click();await page.waitForSelector('.map-editor-ui',{state:'detached'});
  check('Retorno preserva combate e pausa',await page.evaluate(before=>{const d=game.scene.getScene('Dungeons');return d.run.state.phase==='paused'&&Math.abs(d.run.state.elapsed-before.elapsed)<.1&&d.run.state.player.hp===before.hp;},before));
  check('Sem erros ou recursos ausentes',errors.length===0);
 }catch(e){await page.screenshot({path:out+'/falha.png'});throw e;}
 finally{fs.writeFileSync(out+'/resultado.json',JSON.stringify({checks,errors},null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
