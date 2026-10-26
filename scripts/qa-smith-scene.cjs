const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const out='/workspace/after-rain-smith-preview';fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(process.env.GAME_URL??'http://127.0.0.1:5181');await page.locator('#new-game').click();await page.locator('#character-name').fill('Ferraria');await page.getByRole('button',{name:'Começar minha história'}).click();await page.locator('.toolbelt').waitFor();
 await page.evaluate(async()=>{const{game}=await import(document.querySelector('script[src*="main.ts"]').src);window.game=game;window.base=game.scene.getScene('Vale');base.enterVillage();});await page.locator('#ui[data-area="village"] .toolbelt').waitFor();
 const collision=await page.evaluate(async()=>{
  const{PROPERTY_WELL}=await import('/src/data/property-well.ts'),{HOMESTEAD_HOUSE}=await import('/src/data/property-homestead.ts');const p=base.player,original={x:p.x,y:p.y},world=base.world,results=[];
  const drive=(x,y,key)=>{p.x=x;p.y=y;for(const k of Object.values(p.keys))k.isDown=false;p.keys[key].isDown=true;for(let i=0;i<160;i++)p.update(1/60,world.isBlocked,world.isBlockedPoint);p.keys[key].isDown=false;return{x:p.x,y:p.y,free:[[-7,-5],[7,-5],[-7,3],[7,3]].every(([dx,dy])=>!world.isBlockedPoint(p.x+dx,p.y+dy))};};
  const c={x:PROPERTY_WELL.x,y:PROPERTY_WELL.y-68*.42};for(const[dx,dy,key]of [[0,70,'W'],[0,-70,'S'],[-70,0,'D'],[70,0,'A']])results.push(drive(c.x+dx,c.y+dy,key));
  const approach=drive(HOMESTEAD_HOUSE.x-130,HOMESTEAD_HOUSE.y-45,'D');Object.assign(p,original);p.update(0,world.isBlocked,world.isBlockedPoint,false);return{well:results,house:approach};
 });if(!process.env.SNAPSHOT_ONLY){assert.ok(collision.well.every(r=>r.free));assert.ok(collision.house.free&&collision.house.x>690&&collision.house.x<708);}
 if(process.env.AFTER_RAIN_QA_ADMIN_PASSWORD){const ok=await page.evaluate(async(password)=>{const{AdminAccess}=await import('/src/systems/admin.ts');const a=new AdminAccess();if(await a.unlock('senha-incorreta'))return false;return await a.unlock(password);},process.env.AFTER_RAIN_QA_ADMIN_PASSWORD);assert.equal(ok,true);}
 await page.evaluate(()=>{window.vi=game.scene.getScene('Vila');vi.setBlacksmithRoom(true);game.loop.sleep();vi.paused=false;vi.update(0,0);});
 const step=async(n)=>page.evaluate(n=>{for(let i=0;i<n;i++)game.step(performance.now()+i*100,100);},n);
 await step(3);assert.equal(await page.evaluate(()=>vi.roomView.objects.find(o=>o.getData?.('smithLayoutId')==='structure').frame.name),'__BASE');assert.equal(await page.evaluate(()=>vi.children.list.filter(o=>o.getData?.('smith-effect')).length),5);await page.screenshot({path:out+'/interior.png'});
 console.log(JSON.stringify(await page.evaluate(()=>({inside:vi.inBlacksmith,save:vi.persist(),position:{x:vi.player.x,y:vi.player.y},pieces:vi.smithLayout.pieces.length}))),errors);
 if(process.env.SNAPSHOT_ONLY)return;
 await page.evaluate(()=>game.loop.wake());await page.keyboard.press('h');await page.locator('.smith-editor').waitFor();await page.evaluate(()=>game.loop.sleep());await page.screenshot({path:out+'/editor.png'});
 const choose=id=>page.locator('[data-pieces]').selectOption(id),apply=()=>page.locator('[data-apply]').click();
 await choose('window');await page.locator('[data-x]').fill('124');await apply();assert.equal(await page.evaluate(()=>vi.smithLayout.pieces.find(p=>p.id==='window').x),124);
 await choose('floor-left');await page.locator('[data-material]').selectOption('floor-right');await apply();assert.equal(await page.evaluate(()=>vi.smithLayout.pieces.find(p=>p.id==='floor-left').asset),'floor-right');
 await choose('floor-left');await page.locator('[data-material]').selectOption('floor-left');await apply();
 await choose('window');await page.locator('[data-x]').fill('119');await apply();
 await choose('lamparina');await page.locator('[data-effects]').uncheck();await apply();assert.equal(await page.evaluate(()=>vi.smithLayout.pieces.find(p=>p.id==='lamparina').effects),false);
 await page.locator('[data-effects]').check();await apply();
 await choose('structure');assert.equal(await page.locator('[data-shade]').inputValue(),'0.98');
 // Drive the native JSON import/export through actual controls.
 const imported=await page.evaluate(()=>{const d=structuredClone(vi.smithLayout);d.pieces.find(p=>p.id==='window').x=121;return d;});await page.locator('[data-import]').setInputFiles({name:'Ferraria.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))});await page.waitForFunction(()=>vi.smithLayout.pieces.find(p=>p.id==='window').x===121);
 const download=page.waitForEvent('download');await page.locator('[data-export]').click();const exported=await download;await exported.saveAs(out+'/Ferraria-Editada.json');assert.deepEqual(JSON.parse(fs.readFileSync(out+'/Ferraria-Editada.json')),JSON.parse(JSON.stringify(imported)));
 await choose('window');await page.locator('[data-x]').fill('119');await apply();

 const before=await page.evaluate(()=>JSON.stringify(vi.smithLayout));await page.evaluate(()=>{window.set=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('QA disk');};});await page.locator('[data-x]').fill('210');await apply();assert.match(await page.locator('[data-message]').innerText(),/Falha ao salvar/);await page.evaluate(()=>Storage.prototype.setItem=window.set);assert.equal(await page.evaluate(()=>JSON.stringify(vi.smithLayout)),before);
 await page.locator('[data-close]').click();await page.evaluate(()=>{game.loop.wake();vi.ui.toggleMap();});await page.locator('.map-snapshot').waitFor();await page.waitForFunction(()=>document.querySelector('.map-snapshot').naturalWidth===1152);assert.equal(await page.locator('.map-card h2').innerText(),'Interior da ferraria');const marker=await page.locator('.map-player').evaluate(e=>({x:parseFloat(e.style.left),y:parseFloat(e.style.top)}));assert.ok(Math.abs(marker.x-245/576*100)<.01&&Math.abs(marker.y-309/352*100)<.01);await page.locator('[aria-label="Fechar mapa"]').click();await page.evaluate(()=>game.loop.sleep());
 const persisted=await page.evaluate(async()=>{if(!vi.persist())throw Error('save rejected');const{loadSave}=await import('/src/systems/save.ts');window.saved=loadSave();return JSON.stringify(saved.blacksmithScene);});assert.equal(persisted,await page.evaluate(()=>JSON.stringify(vi.smithLayout)));
 // Capturing a real animated loop rather than an illustrative reconstruction.
 await page.evaluate(()=>{vi.ui.element;document.querySelector('#ui').style.display='none';vi.villagers.forEach(n=>n.label.setVisible(false));});
 for(let i=0;i<24;i++){await step(1);await page.screenshot({path:out+`/frame-${String(i).padStart(3,'0')}.png`});}
 await page.evaluate(()=>{document.querySelector('#ui').style.display='';vi.scene.restart({save:saved,ui:vi.ui,onReturn:vi.onReturn});});await step(6);assert.equal(await page.evaluate(()=>vi.inBlacksmith),true);assert.equal(await page.evaluate(()=>JSON.stringify(vi.smithLayout)),persisted);
 // Door crossing without E, outward and inward, preserving the edited scene.
 await page.evaluate(()=>{vi.paused=false;vi.player.x=245;vi.player.y=303;vi.homePassage.reset();vi.input.keyboard.resetKeys();});await page.keyboard.down('s');await step(12);await page.keyboard.up('s');await step(5);assert.equal(await page.evaluate(()=>vi.inBlacksmith),false);
 await page.evaluate(()=>{vi.player.x=1840;vi.player.y=1052;vi.homePassage.reset();vi.input.keyboard.resetKeys();});await page.keyboard.down('w');await step(12);await page.keyboard.up('w');await step(5);assert.equal(await page.evaluate(()=>vi.inBlacksmith),true);
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/browser-validation.json',JSON.stringify({passed:true,collision,pieces:await page.evaluate(()=>vi.smithLayout.pieces.length),checks:['H editor','property well and house collisions','updated admin access','JSON import/export','window movement','floor replacement','animation toggle','disk rollback','save and restart','animated frames','exit and entry without E'],errors},null,2));console.log('PASS real scene/editor/animations/persistence/doorway');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
