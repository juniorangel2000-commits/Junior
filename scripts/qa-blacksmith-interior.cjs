const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const out='docs/cenarios/vila-refinada';const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const page=await browser.newPage({viewport:{width:1280,height:960}}),errors=[];page.setDefaultTimeout(60000);
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(process.env.GAME_URL??'http://127.0.0.1:5181');await page.locator('#new-game').click();await page.locator('#character-name').fill('Ferraria');await page.getByRole('button',{name:'Começar minha história'}).click();await page.locator('.toolbelt').waitFor();
 await page.evaluate(async()=>{const{game}=await import(document.querySelector('script[src*="main.ts"]').src);window.game=game;window.base=game.scene.getScene('Vale');window.maps=JSON.stringify([base.state.mapEdits,base.state.forestMapEdits]);base.enterVillage();});await page.locator('#ui[data-area="village"] .toolbelt').waitFor();
 await page.evaluate(()=>{window.vi=game.scene.getScene('Vila');game.loop.sleep();vi.paused=false;vi.player.x=1840;vi.player.y=1064;Object.assign(vi.bentoRoutine.state,{x:2032,y:1008,wait:60});vi.update(0,0);vi.player.update(0,vi.blocked,vi.blockedPoint,false);vi.input.keyboard.resetKeys();});
 const step=async(count)=>page.evaluate(count=>{for(let i=0;i<count;i++)game.step(performance.now()+i*100,100);},count);
 await page.keyboard.down('w');await step(10);await page.keyboard.up('w');await step(3);
 const entered=await page.evaluate(()=>({inside:vi.inBlacksmith,x:vi.player.x,y:vi.player.y,fixtures:vi.roomView?.objects.filter(o=>o.getData('blacksmith-fixture')).map(o=>o.texture.key),beds:vi.children.list.filter(o=>o.visible&&o.texture?.key==='home-furniture-bed').length,outdoorHouses:vi.children.list.filter(o=>o.visible&&o.getData?.('village-building')).length,saved:vi.persist()}));
 assert.ok(entered.inside&&entered.saved);assert.equal(entered.beds,0);assert.equal(entered.outdoorHouses,0);assert.equal(entered.fixtures.length,16);assert.ok(entered.fixtures.includes('blacksmith-armor-stand'));
 const fire=await page.evaluate(async()=>{
  const{setVisualSettings}=await import('/src/visual-settings.ts');setVisualSettings({dynamicLighting:true,intensity:1});
  const hearth=vi.roomView.objects.find(o=>o.getData('blacksmith-hearth')),lights=vi.children.list.filter(o=>o.getData?.('blacksmith-hearth-light')),frames=new Set();
  for(let i=0;i<8;i++){game.step(performance.now()+i*100,100);frames.add(hearth.texture.key);}
  const on=lights.length===1&&lights[0].visible;setVisualSettings({dynamicLighting:false});game.step(performance.now(),0);const off=!lights[0].visible;
  setVisualSettings({dynamicLighting:true,intensity:0});game.step(performance.now(),0);const zero=!lights[0].visible;
  setVisualSettings({intensity:1});game.step(performance.now(),0);return{frames:[...frames],on,off,zero};
 });assert.equal(fire.frames.length,3);assert.ok(fire.on&&fire.off&&fire.zero);
 const counter=await page.evaluate(()=>{
  const sprites=vi.roomView.objects.filter(o=>/^blacksmith-counter-(left|middle|right)$/.test(o.texture.key)).sort((a,b)=>a.x-b.x);
  const gaps=sprites.slice(1).map((s,i)=>s.getBounds().left-sprites[i].getBounds().right);
  const parts=sprites.map(s=>s.texture.key),c=document.createElement('canvas');c.width=64;c.height=96;const ctx=c.getContext('2d');
  const opaque=[];for(const key of ['blacksmith-counter-left','blacksmith-counter-middle','blacksmith-counter-right']){
   ctx.clearRect(0,0,64,96);ctx.drawImage(vi.textures.get(key).getSourceImage(),0,0);const p=ctx.getImageData(0,0,64,96).data;
   opaque.push({key,left:[32,48,72].every(y=>p[(y*64)*4+3]===255),right:[32,48,72].every(y=>p[(y*64+63)*4+3]===255)});
  }
  return{parts,gaps,opaque};
 });assert.deepEqual(counter.parts,['blacksmith-counter-left','blacksmith-counter-middle','blacksmith-counter-middle','blacksmith-counter-right']);assert.ok(counter.gaps.every(g=>Math.abs(g)<.01));assert.ok(counter.opaque[0].right&&counter.opaque[1].left&&counter.opaque[1].right&&counter.opaque[2].left);
 // The same original actor circulates inside, then heads back through the door.
 const npc=await page.evaluate(async()=>{
  const{BentoRoutine}=await import('/src/systems/bento-routine.ts');vi.player.x=48;vi.player.y=250;
  vi.bentoRoutine=new BentoRoutine({area:'blacksmith-home',x:192,y:296,direction:'up',stop:4,wait:0,doorway:false});
  let moved=0;for(let i=0;i<30;i++){const before={...vi.bentoRoutine.state};vi.update(i*100,100);if(Math.hypot(before.x-vi.bentoRoutine.state.x,before.y-vi.bentoRoutine.state.y)>.01)moved++;}
  const b=vi.villagers.find(n=>n.data.id==='bento');return{moved,visible:b.sprite.visible,count:vi.villagers.filter(n=>n.data.id==='bento').length,area:vi.bentoRoutine.state.area};
 });assert.ok(npc.moved>0&&npc.visible);assert.equal(npc.count,1);
 await page.evaluate(()=>{vi.player.x=192;vi.player.y=272;vi.player.update(0,vi.blocked,vi.blockedPoint,false);vi.updateHUD();vi.paused=true;vi.villagers.forEach(n=>n.label.setVisible(false));game.step(performance.now(),0);});
 await page.screenshot({path:out+'/ferraria-interior.png'});
 await page.evaluate(()=>{document.querySelector('#ui').style.display='none';game.step(performance.now(),0);});await page.screenshot({path:out+'/ferraria-interior-sem-hud.png'});await page.evaluate(()=>document.querySelector('#ui').style.display='');
 // Exercise the existing home editor through the actual H shortcut and DOM controls.
 await page.evaluate(()=>{window.propertyHome=JSON.stringify(vi.state.home??null);game.loop.wake();});await page.keyboard.press('h');await page.locator('.home-customization-card').waitFor();await page.evaluate(()=>game.loop.sleep());
 assert.equal(await page.locator('.home-customization-card h2').innerText(),'Ferraria de Bento');assert.equal(await page.locator('[data-home-kind="bed"]').count(),0);
 const cell=(x,y)=>page.locator(`.home-cell[data-home-x="${x}"][data-home-y="${y}"]`);
 const piece=id=>page.locator(`[data-home-piece="${id}"]`),remove=page.locator('[data-home-remove]'),move=page.locator('[data-home-move]');
 await page.locator('[data-home-kind="counter"]').click();await cell(10,5).click();
 assert.equal(await page.evaluate(()=>vi.smithRoom.data.furniture.filter(p=>p.kind==='counter').length),5);
 assert.equal(await page.evaluate(()=>vi.roomView.objects.find(o=>o.getData('homeFurnitureId')==='home-counter-13').texture.key),'blacksmith-counter-middle');
 await piece('home-counter-1').click();await remove.click();
 await piece('home-fireplace-15').click();await remove.click();assert.equal(await page.evaluate(()=>vi.children.list.filter(o=>o.getData?.('blacksmith-hearth-light')).length),0);
 await page.locator('[data-home-kind="fireplace"]').click();await cell(6,2).click();assert.equal(await page.evaluate(()=>vi.children.list.filter(o=>o.getData?.('blacksmith-hearth-light')).length),1);
 await piece('home-smithWorkbench-3').click();await move.click();await cell(1,5).click();
 assert.equal(await page.evaluate(()=>vi.smithRoom.data.furniture.find(p=>p.kind==='tongs').x),1);
 await page.locator('[data-home-kind="anvil"]').click();await cell(5,7).click();assert.ok((await page.locator('.home-edit-status.is-error').innerText()).includes('Bento'));
 await page.locator('.home-floor-styles').getByText('Madeira escura',{exact:true}).click();await page.locator('.home-wall-styles').getByText('Verde sálvia',{exact:true}).click();
 // A failed disk write must leave both the rendered and persisted layout unchanged.
 await page.evaluate(()=>{window.realStorageSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('QA simulated disk failure');};});
 await page.locator('.home-floor-styles').getByText('Madeira clara',{exact:true}).click();assert.ok((await page.locator('.home-edit-status.is-error').innerText()).includes('Falha ao salvar'));
 await page.evaluate(()=>{Storage.prototype.setItem=window.realStorageSetItem;});assert.equal(await page.evaluate(()=>vi.smithRoom.data.floor),'dark');
 await page.locator('.home-floor-styles').getByText('Madeira escura',{exact:true}).click();
 assert.equal(await page.locator('.home-edit-status.is-error').count(),0);
 const unobscured=await page.evaluate(()=>{const h=document.querySelector('.home-customization-card h2'),r=h.getBoundingClientRect(),at=document.elementFromPoint(r.x+10,r.y+r.height/2);return h.contains(at)||at===h;});assert.ok(unobscured);
 await page.screenshot({path:out+'/ferraria-editor.png'});
 await page.locator('.home-customization-card .modal-heading > button').click();
 const editing=await page.evaluate(()=>({layout:structuredClone(vi.smithRoom.data),propertyUnchanged:JSON.stringify(vi.state.home??null)===window.propertyHome,lights:vi.children.list.filter(o=>o.getData?.('blacksmith-hearth-light')).length}));assert.ok(editing.propertyUnchanged);assert.equal(editing.lights,1);
 await page.evaluate(()=>{document.querySelector('#ui').style.display='none';vi.paused=true;game.step(performance.now(),0);});await page.screenshot({path:out+'/ferraria-interior-editada.png'});await page.evaluate(()=>document.querySelector('#ui').style.display='');
 await page.evaluate(()=>{const b=vi.villagers.find(n=>n.data.id==='bento');vi.paused=false;vi.player.x=b.sprite.x+48;vi.player.y=b.sprite.y;vi.player.update(0,vi.blocked,vi.blockedPoint,false);game.loop.wake();});
 await page.keyboard.press('e');await page.locator('.village-layer[data-npc="bento"]:not([hidden])').waitFor();await page.evaluate(()=>game.loop.sleep());assert.ok((await page.locator('#village-npc-name').innerText()).includes('Bento'));await page.screenshot({path:out+'/ferraria-comercio-interior.png'});await page.locator('[data-village-close]').click();
 const persistence=await page.evaluate(async()=>{vi.player.x=192;vi.player.y=272;vi.player.update(0,vi.blocked,vi.blockedPoint,false);const before=JSON.stringify([vi.state.mapEdits,vi.state.forestMapEdits]);if(!vi.persist())throw Error('Interior save rejected');const{loadSave}=await import('/src/systems/save.ts');window.saved=loadSave();return{inside:saved.blacksmithInterior,npc:saved.bentoRoutine,coins:saved.villageEconomy.coins,maps:before===window.maps};});assert.ok(persistence.inside);assert.ok(persistence.npc);assert.ok(persistence.maps);
 // Recreate the real scene from the disk snapshot; preserve trade balances.
 await page.evaluate(()=>{vi.scene.restart({save:saved,ui:vi.ui,onReturn:vi.onReturn});});await step(4);assert.equal(await page.evaluate(()=>vi.inBlacksmith),true);
 assert.equal(await page.evaluate(()=>vi.state.villageEconomy.coins),persistence.coins);assert.deepEqual(await page.evaluate(()=>vi.smithRoom.data),editing.layout);
 await page.evaluate(()=>{vi.paused=false;vi.player.x=192;vi.player.y=272;Object.assign(vi.bentoRoutine.state,{x:112,y:144,stop:5,wait:60,doorway:false});vi.update(0,0);vi.input.keyboard.resetKeys();});
 await page.keyboard.down('s');await step(10);await page.keyboard.up('s');await step(3);
 const exited=await page.evaluate(()=>({inside:vi.inBlacksmith,x:vi.player.x,y:vi.player.y,interiorSaved:!!vi.state.blacksmithInterior,houses:vi.children.list.filter(o=>o.visible&&o.getData?.('village-building')).length,hearthLights:vi.children.list.filter(o=>o.getData?.('blacksmith-hearth-light')).length}));assert.equal(exited.inside,false);assert.equal(exited.interiorSaved,false);assert.equal(exited.houses,10);assert.equal(exited.x,1840);assert.ok(exited.y>=1052&&exited.y<1080);assert.equal(exited.hearthLights,0);
 assert.deepEqual(errors,[]);fs.writeFileSync(`${out}/validacao-interior.json`,JSON.stringify({passed:true,entered,counter,fire,npc,editing,persistence,exited,errors,published:false},null,2));console.log('PASS: lareira animada, luz configurável, balcão, 16 objetos, Bento, comércio e salvamento.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
