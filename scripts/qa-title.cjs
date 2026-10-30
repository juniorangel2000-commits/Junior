const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.env.TITLE_QA_OUTPUT || '/workspace/title-opening-qa';
fs.mkdirSync(out, { recursive: true });
(async () => {
 const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
 const page = await browser.newPage({ viewport: { width:1280,height:800 } });
 page.setDefaultTimeout(120000);
 const errors=[]; page.on('pageerror', e=>errors.push(e.message));
 try {
  await page.goto(process.env.QA_URL || 'http://127.0.0.1:5187');
  await page.locator('#new-game').waitFor();
  await page.waitForFunction(()=>document.querySelector('.title-illustration')?.naturalWidth > 0);
  await page.evaluate(async()=>{
   const {game}=await import(document.querySelector('script[src*="main.ts"]').src);
   window.game=game; window.scene=game.scene.scenes[0]; game.loop.sleep();
   window.sound=(await import(document.querySelector('script[src*="main.ts"]').src)).gameAudio;
  });
  assert.equal(await page.locator('[data-title-motion]').count(),0);
  const frame=()=>page.locator('.title-weather').evaluate(c=>c.toDataURL());
  const first=await frame(); await page.waitForTimeout(250); assert.notEqual(first,await frame());
  const artTransform=()=>page.locator('.title-illustration').evaluate(img=>getComputedStyle(img).transform);
  const initialTransform=await artTransform(); await page.waitForTimeout(2200);
  assert.notEqual(initialTransform,await artTransform(),'illustration visibly moves while the title is open');
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('.title-illustration').evaluate(img=>getComputedStyle(img).animationName),'none');
  await page.evaluate(()=>{
   window.thunderCalls=0; const play=sound.play.bind(sound);
   sound.play=name=>{if(name==='thunder')thunderCalls++;play(name)};
   scene.ui.showTitle(false);
  });
  await page.waitForFunction(()=>thunderCalls>=1,{},{timeout:12000});
  assert.equal(await page.evaluate(()=>thunderCalls),1,'reduced visual motion must not disable thunder');
  const reducedFrame=await frame(); await page.waitForTimeout(200); assert.notEqual(reducedFrame,await frame(),'rain continues with reduced motion');
  await page.locator('.title-visual-settings summary').click();
  await page.getByLabel('Animações e clarões',{exact:true}).selectOption('full');
  assert.equal(await page.locator('.title-illustration').evaluate(img=>getComputedStyle(img).animationName),'property-title-drift','explicit choice enables motion under system reduction');
  await page.evaluate(()=>{thunderCalls=0;scene.ui.showTitle(false)});
  assert.equal(await page.getByLabel('Animações e clarões',{exact:true}).inputValue(),'full','visual choice survives returning to the menu');
  let flash=false;
  for(let attempt=0;attempt<65;attempt++) {
   await page.waitForTimeout(100);
   flash=await page.locator('.title-weather').evaluate(c=>{const p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let i=0;i<p.length;i+=4)if(p[i]>180&&p[i+1]>200&&p[i+2]>200)return true;return false});
   if(flash)break;
  }
  assert.ok(flash,'explicit choice restores a real lightning flash under system reduction');
  await page.waitForFunction(()=>thunderCalls===1);
  await page.locator('.title-visual-settings summary').click();
  await page.getByLabel('Animações e clarões',{exact:true}).selectOption('system');
  await page.locator('.title-visual-settings summary').click();
  await page.emulateMedia({reducedMotion:'no-preference'});
  for(const [width,height] of [[1280,800],[960,640],[390,844]]) {
   await page.setViewportSize({width,height}); await page.waitForTimeout(250);
   for(const selector of ['#new-game','[data-title-sound]']) {
    const b=await page.locator(selector).boundingBox();
    assert.ok(b.x>=0 && b.x+b.width<=width+1 && b.y>=0 && b.y+b.height<=height+1, selector+' fits '+width);
   }
   const overflow=await page.locator('.after-rain-title').evaluate(root=>{
    const img=root.querySelector('.title-illustration');
    const motion=img.getAnimations()[0];
    if(motion)motion.currentTime=12000;
    return {width:root.clientWidth,scroll:root.scrollWidth};
   });
   assert.ok(overflow.scroll<=overflow.width+1,'no horizontal scroll at maximum background scale '+JSON.stringify(overflow));
   await page.screenshot({path:`${out}/title-${width}.png`});
  }
  await page.setViewportSize({width:1280,height:800});
  await page.mouse.click(5,5);
  await page.evaluate(()=>scene.startNew({name:'Abertura',characterId:'farmer-male',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'curto'}));
  await page.waitForFunction(()=>document.querySelector('.new-game-opening video')?.currentTime>.2);
  await page.locator('[data-skip-intro]').waitFor({state:'visible'});
  const playing=await page.evaluate(()=>({mode:scene.ui.mode,paused:scene.paused,source:document.querySelector('video').src,muted:document.querySelector('video').muted,duration:document.querySelector('video').duration,buffers:sound.cinematicBuffers.size,audio:sound.scene}));
  assert.equal(playing.mode,'opening'); assert.equal(playing.paused,true); assert.equal(playing.muted,true);
  assert.ok(playing.source.endsWith('/opening/male.mp4')); assert.ok(playing.duration>=25); assert.equal(playing.buffers,2); assert.equal(playing.audio,'cinematic');
  const buffers=await page.evaluate(async()=>Promise.all([...sound.cinematicBuffers.values()].map(async p=>(await p)?.duration)));
  assert.ok(buffers.every(d=>d>=25),JSON.stringify(buffers));
  await page.screenshot({path:out+'/opening.png'});
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  assert.equal(await page.locator('video').evaluate(v=>v.paused),true);
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await page.waitForFunction(()=>!document.querySelector('video').paused);
  await page.locator('[data-skip-intro]').click(); await page.locator('.toolbelt').waitFor();
  assert.equal(await page.locator('video').count(),0);
  assert.equal(await page.evaluate(()=>scene.paused),false);
  assert.equal(await page.evaluate(()=>scene.state.profile.characterId),'farmer-male');
  await page.evaluate(()=>{scene.mainMenu();scene.continueGame()});
  assert.equal(await page.locator('video').count(),0);
  await page.evaluate(()=>{scene.mainMenu();scene.startNew({name:'Ela',characterId:'farmer-female',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso'})});
  assert.equal(await page.locator('video').count(),0);
  assert.equal(await page.evaluate(()=>scene.state.profile.characterId),'farmer-female');
  assert.deepEqual(errors,[]);
  console.log('PASS title art, animated rain, no pause control, 3 sizes; real opening video + two decoded audio stems; frozen game, focus, gated skip, cleanup, continue, character fidelity');
 } finally { await browser.close(); }
})().catch(e=>{ console.error(e);process.exit(1); });
