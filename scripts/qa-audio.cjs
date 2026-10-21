// Browser QA: actual Web Audio output, autoplay, controls, persistence and gameplay hooks.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 try {
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const attach=async()=>{await page.waitForTimeout(1800);await page.waitForFunction(async()=>{const module=await import(document.querySelector('script[src*="main.ts"]').src);window.scene=module.game.scene.scenes[0];window.sound=module.gameAudio;return !!scene?.player});};
  await page.goto(process.env.QA_URL||'http://127.0.0.1:5173');await attach();
  assert.equal(await page.evaluate(()=>!!sound.context),false,'no autoplay before gesture');
  await page.mouse.click(1200,780);
  await page.waitForFunction(()=>sound.context?.state==='running'&&!!sound.music,{},{timeout:20000});
  const stats=await page.evaluate(()=>{const samples=sound.music.buffer.getChannelData(0);let peak=0,squares=0;for(const v of samples){if(!Number.isFinite(v))throw Error('nonfinite audio');peak=Math.max(peak,Math.abs(v));squares+=v*v;}window.originalMusic=sound.music;return {peak,rms:Math.sqrt(squares/samples.length),duration:sound.music.buffer.duration,seam:Math.abs(samples[0]-samples[samples.length-1])}});
  assert.ok(stats.duration>50&&stats.peak<.98&&stats.rms>.01&&stats.seam<.03,JSON.stringify(stats));console.log('PASS original music waveform / loop:',stats);
  for(const name of ['step','ui','pickup','wood','stone','plant','water','craft','door','build']){
   const peak=await page.evaluate(async name=>{
    const {synthesizeEffect}=await import('/src/audio.ts');
    const offline=new OfflineAudioContext(1,44100,44100);
    synthesizeEffect(offline,offline.destination,name);
    const buffer=await offline.startRendering();let peak=0;
    for(const value of buffer.getChannelData(0)){if(!Number.isFinite(value))throw Error('nonfinite effect');peak=Math.max(peak,Math.abs(value));}
    return peak;
   },name);assert.ok(peak>.001&&peak<1,`${name} waveform: ${peak}`);
  }
  await page.evaluate(()=>sound.setSettings({muted:true}));await page.waitForTimeout(400);
  assert.ok(await page.evaluate(()=>sound.master.gain.value)<.00001,'mute silences output');
  await page.evaluate(()=>{sound.setSettings({muted:false,music:.45});scene.startNew({name:'Som',skin:'#e9bc98',hairColor:'#563b2c',outfit:'#457398',hairStyle:'preso'});window.events=[];const play=sound.play.bind(sound);sound.play=name=>{events.push(name);play(name)}});
  await page.waitForTimeout(500);await page.keyboard.down('s');await page.waitForTimeout(200);await page.keyboard.up('s');assert.ok(await page.evaluate(()=>events.includes('step')));
  await page.evaluate(()=>{events=[];scene.enterHome();scene.player.x=7.5*32;scene.player.y=7.5*32;scene.nextInteractionAt=0;scene.interactHome({x:7,y:7})});
  assert.deepEqual(await page.evaluate(()=>events),['door','pickup']);
  await page.evaluate(()=>{scene.leaveHome();scene.player.x=25.5*32;scene.player.y=21.5*32;scene.state.homeSupplies.wateringCan=true;scene.selectTool('plant');scene.nextInteractionAt=0;events=[];scene.interact({x:25,y:22})});
  assert.ok(await page.evaluate(()=>events.includes('plant')),'plant sound after successful planting');
  await page.evaluate(()=>{scene.selectTool('water');scene.nextInteractionAt=0;events=[];scene.interact({x:25,y:22})});assert.ok(await page.evaluate(()=>events.includes('water')));
  await page.evaluate(()=>{scene.nextInteractionAt=0;events=[];scene.interact({x:25,y:22})});assert.ok(await page.evaluate(()=>!events.includes('water')),'failed action is silent');
  await page.keyboard.press('Escape');
  await page.getByRole('slider',{name:'Volume da música'}).fill('23');await page.getByRole('slider',{name:'Volume dos efeitos'}).fill('76');await page.getByRole('checkbox',{name:'Silenciar todos os sons'}).check();
  assert.deepEqual(await page.evaluate(()=>sound.settings),{music:.23,effects:.76,muted:true});
  await page.getByRole('button',{name:/Voltar ao vale/}).click();
  await page.evaluate(()=>{scene.mainMenu();scene.continueGame()});await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>sound.music===originalMusic),true,'one music source across menus/saves');
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>sound.context.state),'suspended');
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>sound.context.state),'running');
  await page.reload();await attach();assert.deepEqual(await page.evaluate(()=>sound.settings),{music:.23,effects:.76,muted:true});
  await page.mouse.click(1200,780);await page.waitForFunction(()=>sound.context?.state==='running');assert.equal(await page.evaluate(()=>sound.master.gain.value),0);
  await page.evaluate(()=>scene.continueGame());await page.keyboard.press('Escape');assert.equal(await page.getByRole('slider',{name:'Volume da música'}).inputValue(),'23');assert.equal(await page.getByRole('checkbox',{name:'Silenciar todos os sons'}).isChecked(),true);
  await page.screenshot({path:'/tmp/after-rain-audio-settings.png'});
  assert.deepEqual(errors,[]);console.log('PASS all 10 effects render non-silent waveforms, successful gameplay hooks, mute, independent volumes, reload, one loop, background suspension, no JS errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
