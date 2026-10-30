const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out=process.env.PAUSE_QA_OUTPUT||'/workspace/pause-ui-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(120000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(process.env.QA_URL||'http://127.0.0.1:5187');await page.locator('#new-game').waitFor();
  await page.evaluate(async()=>{
   const {game}=await import(document.querySelector('script[src*="main.ts"]').src);game.loop.sleep();
   document.querySelector('#ui').style.display='none';
   const scene=game.scene.getScene('Vale');
   const m=await (await fetch('/assets/visual/dungeons/weapons-remake.json')).json();
   await new Promise(resolve=>{scene.load.image('pause-weapons-source',m.file);scene.load.once('complete',resolve);scene.load.start();});
   const {setupVillagePropAtlas}=await import('/src/village-prop-atlas.ts');
   setupVillagePropAtlas(scene,'pause-weapons','pause-weapons-source',m);
   window.icons=Object.fromEntries(Object.keys(m.frames).map(id=>[id,scene.textures.getBase64('pause-weapons',id)]));
   const {DungeonRun}=await import('/src/dungeons/run.ts'),{createDungeonProgress}=await import('/src/dungeons/progression.ts');
   const {DungeonUI}=await import('/src/dungeons/ui.ts');
   window.resumed=0;window.abandoned=0;
   window.panel=new DungeonUI({resume:()=>resumed++,abandon:()=>abandoned++,start:()=>{},back:()=>{},menu:()=>{},choose:()=>{},evolve:()=>{},pet:()=>{},retry:()=>{}},icons);
   window.run=new DungeonRun('pause-qa','abandoned-central-square',createDungeonProgress());run.pause();panel.pause(run);
  });
  await page.locator('.pause-screen').waitFor();
  assert.equal(await page.locator('.pause-weapon').count(),4);
  await page.getByText('Sua combinação começa aqui.',{exact:true}).waitFor();
  assert.ok(await page.locator('[data-resume]').evaluate(b=>b===document.activeElement));
  await page.keyboard.press('Tab');assert.ok(await page.locator('[data-resume-top]').evaluate(b=>b===document.activeElement));
  await page.keyboard.press('Shift+Tab');assert.ok(await page.locator('[data-resume]').evaluate(b=>b===document.activeElement));
  await page.screenshot({path:out+'/inicio-1280.png'});
  await page.evaluate(()=>{
   run.state.elapsed=427;run.state.kills=2345;run.state.level=51;
   run.state.weapons=['sword','bow','spear','boomerang'];
   run.state.levels={'sword-speed':3,'sword-wide':1,'sword-dual':1,'xp':4,'health':3,'advanced-attack':2,'pickup':3,'movement':2};
   run.state.player.hp=61;
   run.state.pet={species:'cat',rare:true,hp:32,maxHp:45};panel.pause(run);
  });
  assert.equal(await page.locator('.pause-weapon.is-evolved').count(),1);
  assert.equal(await page.locator('.pause-upgrade').count(),8);
  assert.equal(await page.getByRole('meter',{name:'Vida do personagem'}).getAttribute('aria-valuenow'),'61');
  await page.getByText('Gato ✦',{exact:true}).waitFor();
  assert.equal(await page.locator('.pause-screen').getByText(/shiny/i).count(),0);
  for(const [width,height] of [[1280,800],[960,540],[390,844],[360,640]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(150);
   const dialog=await page.locator('.pause-screen').boundingBox();
   assert.ok(dialog.x>=0&&dialog.x+dialog.width<=width+1&&dialog.y>=0&&dialog.y+dialog.height<=height+1,JSON.stringify(dialog));
   assert.ok(await page.locator('.pause-screen').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
   for(const selector of ['[data-resume]','[data-abandon]','[data-resume-top]']){
    const b=await page.locator(selector).boundingBox();assert.ok(b.y>=0&&b.y+b.height<=height+1,selector+' always visible '+height);
   }
   if(width>600){const a=await page.locator('[data-resume]').boundingBox(),b=await page.locator('[data-abandon]').boundingBox();assert.ok(Math.abs(a.y-b.y)<2,'desktop actions sit side by side');}
   await page.screenshot({path:`${out}/partida-${width}x${height}.png`});
  }
  await page.locator('[data-abandon]').click();
  await page.getByRole('heading',{name:'Abandonar a expedição?'}).waitFor();
  assert.equal(await page.evaluate(()=>abandoned),0);
  await page.locator('[data-back]').click();await page.locator('.pause-screen').waitFor();
  await page.locator('[data-resume-top]').click();assert.equal(await page.evaluate(()=>resumed),1);
  await page.evaluate(()=>{run.state.dungeon='mall-parking';run.state.round=25;panel.pause(run)});
  await page.getByText('25 / 50',{exact:true}).waitFor();
  await page.locator('[data-resume]').click();assert.equal(await page.evaluate(()=>resumed),2);
  await page.evaluate(()=>panel.pause(run));await page.locator('[data-abandon]').click();await page.locator('[data-abandon]').click();
  assert.equal(await page.evaluate(()=>abandoned),1);
  assert.deepEqual(errors,[]);
  console.log('PASS pause: actual weapon icons, empty and upgraded states, evolution, pet, stats, focus loop, 4 viewports, visible actions, resume, wave count and abandonment confirmation');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
