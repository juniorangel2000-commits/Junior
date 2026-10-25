const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const axis=process.env.QA_GATE_AXIS==='horizontal'?0:1;
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const page=await browser.newPage({viewport:{width:1280,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await page.goto(process.env.QA_URL||'http://127.0.0.1:5178');await page.locator('#new-game').click();await page.locator('#character-name').fill('Porteiras');await page.getByRole('button',{name:'Começar minha história'}).click();await page.locator('.toolbelt').waitFor();
 await page.evaluate(async axis=>{window.gateAxis=axis;const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.game=game;window.s=game.scene.getScene('Vale');game.loop.sleep();s.inventory.data.wood=20;s.state.time=720;let best;
 for(let y=25;y<64&&!best;y++)for(let x=8;x<80&&!best;x++)if([0,5].every(offset=>[[-1,0],[0,0],[1,0],[0,-1],[0,1],[-1,1]].every(([dx,dy])=>s.world.isBuildable(x+offset+dx,y+dy)&&!s.farming.isPrepared(x+offset+dx,y+dy))))best={x,y};if(!best)throw Error('No gate site');window.target=best;s.player.x=(best.x+(axis?-.5:.5))*32;s.player.y=(best.y+(axis?.5:1.5))*32;s.player.facing=axis?{x:1,y:0}:{x:0,y:-1};s.lastAim=null;s.updateHUD()},axis);
 await page.keyboard.press('b');await page.locator('[data-build="gate"]').click();if(axis===1)await page.keyboard.press('r');assert.equal(await page.evaluate(()=>s.rotation),axis);
 await page.evaluate(()=>{s.nextInteractionAt=0;s.interact(target)});assert.equal(await page.evaluate(()=>s.building.at(target.x,target.y)?.rotation),axis);assert.equal(await page.evaluate(()=>s.building.isBlocked(target.x,target.y)),true);
 const dir='docs/cenarios/cercado-funcional';fs.mkdirSync(dir,{recursive:true});
 await page.evaluate(()=>{
  window.other={x:target.x+5,y:target.y};
  const result=s.building.place('gate',other.x,other.y,s.inventory,s.freeForBuilding(other.x,other.y,'gate'),{nearWorkbench:false,rotation:gateAxis});if(!result.ok)throw Error(result.message);
  s.building.toggleGate(other.x,other.y);
  for(const point of [target,other])for(const offset of [-1,1]){const x=point.x+(gateAxis?0:offset),y=point.y+(gateAxis?offset:0);const r=s.building.place('fence',x,y,s.inventory,s.freeForBuilding(x,y,'fence'),{nearWorkbench:false,day:s.state.day});if(!r.ok)throw Error(r.message)}
  if(gateAxis===0){s.player.x=(target.x-.5)*32;s.player.y=(target.y+1.5)*32}
  s.selectTool('hand');s.selection.clear();s.afterAction();s.player.update(0,s.movementBlocked,s.movementBlockedPoint,true,s.swimmingPoint);
  s.cameras.main.stopFollow().setZoom(3.5).centerOn((target.x+.5)*32+80,(target.y+.5)*32-14);s.updateNight();
  for(const o of s.children.list)if(/^asset-(tree|pine)(-[012])?$|^solar-silhouette:.*:asset-(tree|pine)/.test(o.texture?.key??''))o.setVisible(false);
  document.querySelector('#ui').style.visibility='hidden';game.step(s.time.now+1,0);
 });
 await page.screenshot({path:`${dir}/porteira-${axis?'vertical':'horizontal'}-no-jogo.png`});
 await page.evaluate(()=>{document.querySelector('#ui').style.visibility=''});
 await page.evaluate(()=>{s.selectTool('hand');s.nextInteractionAt=0;s.interact(target)});assert.equal(await page.evaluate(()=>s.building.isBlocked(target.x,target.y)),false);await page.evaluate(()=>s.persist());
 await page.reload();await page.locator('#continue-game').click();await page.locator('.toolbelt').waitFor();
 const result=await page.evaluate(async()=>{const {game}=await import(document.querySelector('script[src*="main.ts"]').src);window.s=game.scene.getScene('Vale');game.loop.sleep();const gate=s.building.buildings.find(b=>b.kind==='gate');const c=document.createElement('canvas');c.width=960;c.height=800;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#30472b';ctx.fillRect(0,0,960,800);ctx.fillStyle='#f4dfb7';ctx.font='bold 24px Georgia';ctx.fillText('AFTER RAIN · PORTEIRAS',30,38);
 for(const rotation of [0,1])for(const open of [false,true]){const x=rotation*480,y=open?420:90;ctx.fillStyle='#f4dfb7';ctx.font='21px Georgia';ctx.fillText((rotation?'Vertical':'Horizontal')+' · '+(open?'Aberta':'Fechada'),x+30,y);const img=s.textures.get(`gate-${rotation}-${open?'open':'closed'}`).getSourceImage();ctx.drawImage(img,x+100,y+10,256,384)}
 const panel=s.textures.get('gate-1-open-1').getSourceImage().getContext('2d').getImageData(0,49*4,256,32*4).data;let panelInPassage=0;for(let i=3;i<panel.length;i+=4)if(panel[i]>80)panelInPassage++;
 const layers=s.buildingSprites.filter(o=>o.getData('gate')).map(o=>({layer:o.getData('gateLayer'),depth:o.depth,y:o.y}));
 return {gate,layers,panelInPassage,blocked:s.building.isBlocked(gate.x,gate.y),valid:(await import('/src/systems/save.ts')).validateSave(s.state),image:c.toDataURL()};});assert.equal(result.gate.rotation,axis);assert.equal(result.panelInPassage,0);assert.ok(result.layers.find(o=>o.layer===1).depth<result.layers[0].y);assert.ok(result.layers.find(o=>o.layer===2).depth>result.layers[0].y);assert.equal(result.gate.open,true);assert.equal(result.blocked,false);assert.equal(result.valid,true);assert.deepEqual(errors,[]);
 fs.writeFileSync(`${dir}/porteiras.png`,Buffer.from(result.image.split(',')[1],'base64'));delete result.image;fs.writeFileSync(`${dir}/orientacao${axis?'':'-horizontal'}.json`,JSON.stringify({...result,errors},null,2));console.log('PASS: real UI R rotation, vertical placement, E open, saved orientation and all gate art loaded');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
