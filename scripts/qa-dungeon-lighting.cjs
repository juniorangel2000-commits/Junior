const { chromium } = require("playwright"),
  fs = require("node:fs"),
  assert = require("node:assert/strict");
const out = process.env.DUNGEON_QA_OUTPUT || "/workspace/after-rain-dungeon-lighting";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  const page = await browser.newPage({
      viewport: { width: 1600, height: 1200 },
    }),
    checks = [],
    errors = [];
  page.setDefaultTimeout(120000);
  const check = (name, ok, details) => {
    checks.push({ name, passed: !!ok, details });
    console.log(name,ok);
    assert.ok(ok, name + " " + JSON.stringify(details));
  };
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(r.url());
  });
  const render = () =>
    page.evaluate(() => {
      game.step(800000, 0);
      game.step(800001, 0);
    });
  try {
    await page.goto(process.env.QA_URL || "http://127.0.0.1:5182");
    await page.locator("#new-game").click();
    await page.locator("#character-name").fill("Expedições");
    await page.getByRole("button", { name: "Começar minha história" }).click();
    await page.waitForFunction(
      () => document.querySelector("#ui")?.dataset.area === "property",
    );
    await page.evaluate(async () => {
      window.game = (
        await import(document.querySelector('script[src*="main.ts"]').src)
      ).game;
      const s = game.scene.getScene("Vale");
      s.enterVillage(s.snapshotState());
    });
    await page.waitForFunction(
      () =>
        game.scene.isActive("Vila") &&
        document.querySelector("#ui")?.dataset.area === "village",
    );
    await page.evaluate(() => {
      const v = game.scene.getScene("Vila");
      v.state.cityForestPosition = { x: 720, y: 80, direction: "up" };
      v.enterCityForest(true);
    });
    await page.waitForFunction(
      () =>
        game.scene.isActive("AcessoCidade") &&
        document.querySelector("#ui")?.dataset.area === "cityForest",
    );
    await page.keyboard.press("e");
    await page.waitForFunction(() => game.scene.isActive("Dungeons"));
    const began = Date.now();
    await page.waitForSelector(".dungeon-travel");
    await page.screenshot({ path: out + "/viagem.png" });
    await page.waitForSelector("[data-start]");
    const duration = (Date.now() - began) / 1000;
    check(
      "Viagem chuvosa leva ao menu com duas opções",
      (await page.locator("[data-start]").count()) === 2 && duration >= 3.5,
      { duration },
    );
    await page.screenshot({ path: out + "/menu-cidade.png" });
    await page.setViewportSize({ width: 680, height: 950 });
    check(
      "Menu continua legível em viewport estreito",
      await page.evaluate(
        () =>
          document.querySelector(".dungeon-menu").getBoundingClientRect()
            .right <= innerWidth,
      ),
      680,
    );
    await page.screenshot({ path: out + "/menu-estreito.png" });
    await page.setViewportSize({ width: 1600, height: 1200 });
    await page.locator('[data-start="abandoned-central-square"]').click();
    await page.evaluate(() => {
      window.d = game.scene.getScene("Dungeons");
      game.loop.sleep();
    });
    for(const id of ['abandoned-central-square','mall-parking']){
      const initial=await page.evaluate(async id=>{
        const {DungeonRun}=await import('/src/dungeons/run.ts'),{DungeonWorld}=await import('/src/dungeons/world.ts');
        const {createDungeonProgress}=await import('/src/dungeons/progression.ts');
        window.visuals=await import('/src/visual-settings.ts');visuals.setVisualSettings({dynamicLighting:true,intensity:1});
        const progress=createDungeonProgress();progress.pets.push({id:'qa-dog',species:'dog',rare:false,xp:0,attributes:{speed:0,resistance:0,perception:0,protection:0,efficiency:0}});
        d.run=new DungeonRun('qa-light-'+id,id,progress,'qa-dog');d.world.destroy();d.world=new DungeonWorld(d,id);
        const lamp=d.world.lighting.bulbs[0],s=d.run.state;
        s.player.x=lamp.x+80;s.player.y=lamp.y+150;s.pet.x=s.player.x-90;s.pet.y=s.player.y+20;
        s.spawnClock=20;s.eventClock=1000;s.cooldowns.sword=30;s.pet.attack=10;s.pet.special=10;
        d.run.spawn(0,10);const boss=s.enemies.find(e=>e.kind==='boss');boss.x=s.player.x+100;boss.y=s.player.y-65;boss.boss={cooldown:0,sequence:0};
        for(const [i,dx] of [-120,-60,150].entries())s.enemies.push({id:99000+i,x:s.player.x+dx,y:s.player.y+60,hp:1000,maxHp:1000,speed:1,damage:0,kind:'walker',special:false,streak:0,lastHit:0});
        d.run.step(1/30);d.run.pause();d.syncPlayer();d.lastPhase='paused';d.ui.resume();d.ui.update(d.run);d.renderRun();
        d.cameras.main.stopFollow().setZoom(1.5).centerOn(s.player.x,s.player.y-100);
        return {bulbs:d.world.lighting.bulbs.length,pools:d.world.lighting.pools.visible,shadowDepth:d.actorShadows.depth,warningDepth:d.bossGraphics.depth,bossWarning:boss.boss.action?.stage,drawCommands:d.actorShadows.commandBuffer.length};
      },id);
      check(id+': luzes nos postes, sombras sob os avisos e chefe legível',initial.bulbs>0&&initial.pools&&initial.shadowDepth<initial.warningDepth&&initial.bossWarning==='warning'&&initial.drawCommands>0,initial);
      await render();await page.screenshot({path:out+'/'+id+'-combate.png'});
      const frozen=await page.evaluate(()=>{const before=JSON.stringify(d.run.snapshot()),alpha=d.world.lighting.bulbs[0].alpha;d.run.step(.25);d.renderRun();return before===JSON.stringify(d.run.snapshot())&&alpha===d.world.lighting.bulbs[0].alpha;});
      check(id+': iluminação respeita pausa sem modificar combate',frozen);
      await page.evaluate(()=>{d.cameras.main.stopFollow().setZoom(.5).centerOn(1536,1152);});await render();await page.screenshot({path:out+'/'+id+'-mapa.png'});
      const off=await page.evaluate(()=>{visuals.setVisualSettings({dynamicLighting:false});d.renderRun();return {pools:d.world.lighting.pools.visible,bulbs:d.world.lighting.bulbs.some(b=>b.visible),commands:d.actorShadows.commandBuffer.length};});
      check(id+': desligar iluminação remove luzes e sombras dinâmicas',!off.pools&&!off.bulbs&&off.commands===0,off);
      await render();await page.screenshot({path:out+'/'+id+'-sem-luzes.png'});
      const half=await page.evaluate(()=>{visuals.setVisualSettings({dynamicLighting:true,intensity:.5});d.renderRun();return {floor:d.world.lighting.pools.alpha,bulb:d.world.lighting.bulbs[0].alpha};});
      check(id+': intensidade é respeitada',half.floor===.5&&half.bulb<.2,half);
      const idle=await page.evaluate(()=>{
        visuals.setVisualSettings({intensity:1});const p=d.run.state.pet;delete p.action;p.walking=false;p.running=false;p.direction='south';
        const frames=[0,3,5,9].map(time=>{d.run.state.elapsed=time;d.renderRun();return d.petImage.frame.name;});return frames;
      });
      check(id+': cachorro parado alterna repouso com pausas',idle[0]===idle[1]&&idle[0]===idle[3]&&idle[2]!==idle[0],idle);
      const destroyed=await page.evaluate(()=>{const light=d.world.lighting;d.world.destroy();return !light.pools.scene&&!light.shadows.scene&&light.bulbs.every(b=>!b.scene);});
      check(id+': sair do mapa limpa os objetos de luz',destroyed);
    }
    const textures=await page.evaluate(()=>Object.keys(game.textures.list).filter(k=>k.startsWith('dungeon-shadow-')||k.startsWith('dungeon-light-')||k==='dungeon-lamp-halo'));
    check('Texturas compartilhadas permanecem limitadas entre os mapas',textures.length===5,textures);
    check('Sem erros JavaScript, requisições falhas ou WebGL',errors.length===0&&(await page.evaluate(()=>game.renderer.gl.getError()))===0,errors);
  }catch(e){errors.push(e.stack||String(e));try{await page.screenshot({path:out+'/falha.png'});}catch{}process.exitCode=1;}
  finally{fs.writeFileSync(out+'/validacao.json',JSON.stringify({checks,errors},null,2));await browser.close();}
})();
