const { chromium } = require("playwright"), fs = require("node:fs"), assert = require("node:assert/strict");
const out = process.env.CITY_QA_OUTPUT || "/workspace/cinematic-qa/fluxo";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const checks = [], errors = [];
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(120000);
  page.on("pageerror", e => errors.push(e.message));
  page.on("response", r => { if (r.status() >= 400) errors.push(r.url()); });
  const check = (name, value, details) => {
    checks.push({ name, passed: !!value, details }); console.log(name, !!value);
    assert.ok(value, name + " " + JSON.stringify(details));
  };
  try {
    await page.goto(process.env.QA_URL || "http://127.0.0.1:5187");
    await page.locator("#new-game").click();
    await page.locator("#character-name").fill("Estrada");
    await page.getByRole("button", { name: "Começar minha história" }).click();
    await page.waitForFunction(() => document.querySelector("#ui")?.dataset.area === "property");
    await page.evaluate(async () => {
      window.game = (await import(document.querySelector('script[src*="main.ts"]').src)).game;
      window.sound = (await import("/src/audio.ts")).gameAudio;
      const v = game.scene.getScene("Vale"); v.enterVillage(v.snapshotState());
    });
    await page.waitForFunction(() => game.scene.isActive("Vila") && document.querySelector("#ui")?.dataset.area === "village");
    await page.evaluate(() => {
      const v = game.scene.getScene("Vila");
      v.state.cityForestPosition = { x: 720, y: 210, direction: "up" };
      v.enterCityForest(true);
    });
    await page.waitForFunction(() => game.scene.isActive("AcessoCidade") && document.querySelector("#ui")?.dataset.area === "cityForest");
    await page.evaluate(() => { window.f = game.scene.getScene("AcessoCidade"); });
    await page.keyboard.down("w");
    await page.locator("[data-city-confirm]").waitFor();
    await page.keyboard.up("w");
    check("Caminhar até a estrada abre confirmação sem apertar E", await page.evaluate(() => f.paused && !game.scene.isActive("Dungeons")), {});
    await page.screenshot({ path: out + "/confirmacao.png" });
    await page.locator("[data-city-cancel]").click();
    await page.waitForTimeout(250);
    check("Cancelar mantém o mundo e não reabre o aviso no mesmo local", await page.evaluate(() => !f.paused && !document.querySelector("[data-city-confirm]")), {});
    await page.evaluate(() => {
      f.player.y = 250; f.update(100, 0);
      f.player.y = 100; f.update(101, 0);
    });
    await page.locator("[data-city-confirm]").waitFor();
    check("Afastar-se e retornar permite perguntar novamente", true, {});
    await page.keyboard.press("Escape");
    check("Escape cancela a confirmação", await page.locator("[data-city-confirm]").count() === 0, {});
    await page.evaluate(() => {
      f.player.y = 250; f.update(102, 0);
      f.player.y = 100; f.update(103, 0);
      f.state.profile.characterId = "farmer-female";
    });
    await page.locator("[data-city-confirm]").click();
    await page.waitForSelector(".expedition-intro video");
    await page.waitForFunction(() => document.querySelector(".expedition-intro video").currentTime > .3);
    await page.waitForFunction(() => sound.musicMode === "expedition" && !!sound.music);
    await page.evaluate(() => { window.d = game.scene.getScene("Dungeons"); window.travelTheme = sound.music; });
    check("Confirmação inicia o vídeo da fazendeira", await page.evaluate(() => document.querySelector(".expedition-intro video").src.endsWith("road-female.mp4") && d.mode === "travel"), {});
    await page.screenshot({ path: out + "/video.png" });
    await page.locator("[data-skip-intro]").waitFor({ state: "visible" });
    await page.locator("[data-skip-intro]").click();
    await page.waitForSelector("[data-start]");
    check("Pular abre menu com a mesma música sem reinício", await page.evaluate(() => d.mode === "menu" && sound.music === travelTheme && !document.querySelector("video")), {});
    await page.locator('[data-start="abandoned-central-square"]').click();
    await page.waitForFunction(() => sound.musicMode === "combat" && !sound.music && !sound.fadingMusic);
    check("Começar partida toca suspense e encerra a música", await page.evaluate(() => d.run.state.phase === "fighting" && sound.lastSound.has("dungeon-start")), {});
    await page.evaluate(() => { game.loop.sleep(); d.run.abandon(); d.finish(); });
    await page.locator("[data-results-menu]").click();
    await page.waitForFunction(() => sound.musicMode === "expedition" && !!sound.music);
    check("Recompensas voltam ao menu com trilha e sem repetir vídeo", await page.evaluate(() => d.mode === "menu" && !document.querySelector("video")), {});
    await page.locator("[data-exit-menu]").click();
    await page.evaluate(() => game.loop.wake());
    await page.waitForFunction(() => game.scene.isActive("AcessoCidade") && !game.scene.isActive("Dungeons"));
    await page.waitForFunction(() => sound.musicMode === "game");
    await page.waitForTimeout(300);
    check("Sair restaura áudio do mundo sem perguntar novamente ao chegar", await page.locator("[data-city-confirm]").count() === 0, {});

    await page.evaluate(() => {
      window.f = game.scene.getScene("AcessoCidade");
      f.player.y = 250; f.update(105, 0);
      f.player.y = 100; f.update(106, 0);
      f.state.profile.characterId = "farmer-male";
    });
    await page.locator("[data-city-confirm]").click();
    await page.waitForFunction(() => document.querySelector(".expedition-intro video")?.currentTime > .3);
    check("Próxima viagem seleciona o vídeo masculino", await page.evaluate(() => document.querySelector(".expedition-intro video").src.endsWith("road-male.mp4")), {});
    const started = Date.now();
    await page.locator("[data-start]").first().waitFor();
    check("Final natural do vídeo abre menu sem interação", Date.now() - started > 4000, { waitMs: Date.now() - started });
    check("Vídeo finalizado não fica reproduzindo fora da tela", await page.locator("video").count() === 0, {});
    check("Sem erros JavaScript ou arquivos ausentes", errors.length === 0, errors);
  } catch (error) {
    errors.push(error.stack || String(error)); process.exitCode = 1;
    await page.screenshot({ path: out + "/falha.png" });
  } finally {
    fs.writeFileSync(out + "/validacao.json", JSON.stringify({ checks, errors }, null, 2));
    await browser.close();
  }
})();
