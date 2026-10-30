const { chromium } = require("playwright"),
  fs = require("node:fs"),
  assert = require("node:assert/strict");
const out = process.env.DUNGEON_QA_OUTPUT || "/workspace/after-rain-pet-marker";
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
    console.log(name, ok);
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
    await page.locator("[data-city-confirm]").click();
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
    const inspect = () =>
      page.evaluate(() => {
        const marker = document.querySelector(".dungeon-rescue-marker"),
          r = marker.getBoundingClientRect();
        return {
          visible: !marker.hidden,
          text: marker.textContent,
          arrow: marker.querySelector(".rescue-direction").style.transform,
          x: r.x,
          y: r.y,
          right: r.right,
          bottom: r.bottom,
          count: document.querySelectorAll(".dungeon-rescue-marker").length,
        };
      });
    await page.evaluate(() => {
      d.run.state.pickups = [];
      d.lastPhase = "";
      d.update(900000, 0);
    });
    check("Sem alerta quando nenhum pet apareceu", !(await inspect()).visible);
    await page.evaluate(() => {
      const s = d.run.state,
        p = s.player;
      s.spawnClock = 100;
      s.enemies = [];
      s.pickups = [
        {
          id: 99001,
          x: p.x + 130,
          y: p.y,
          kind: "pet",
          amount: 0,
          species: "cat",
        },
      ];
      d.update(900001, 0);
    });
    await render();
    await page.evaluate(() => d.update(900002, 0));
    let marker = await inspect();
    check(
      "Pet no chão exibe alerta com espécie e seta",
      marker.visible &&
        marker.text.includes("Gato") &&
        marker.arrow === "rotate(0deg)",
      marker,
    );
    await page.screenshot({ path: out + "/pet-proximo.png" });
    await page.evaluate(() => {
      const s = d.run.state;
      s.player.x = s.pickups[0].x + 130;
      d.syncPlayer();
      d.update(900003, 0);
    });
    marker = await inspect();
    check(
      "Seta muda de sentido conforme o jogador passa pelo pet",
      marker.arrow === "rotate(180deg)",
      marker,
    );
    await page.evaluate(() => {
      const s = d.run.state;
      s.pickups[0].x = 2900;
      s.pickups[0].y = 200;
      d.update(900004, 0);
    });
    await render();
    await page.evaluate(() => d.update(900005, 0));
    marker = await inspect();
    check(
      "Pet fora da câmera mantém alerta dentro da tela",
      marker.visible &&
        marker.x >= 0 &&
        marker.y >= 0 &&
        marker.right <= 1600 &&
        marker.bottom <= 1200,
      marker,
    );
    await page.screenshot({ path: out + "/pet-fora-da-camera.png" });
    await page.evaluate(() => {
      d.run.pause();
      d.update(900006, 0);
    });
    check("Alerta fica oculto no menu de pausa", !(await inspect()).visible);
    await page.evaluate(() => {
      d.run.resume();
      d.ui.resume();
      d.update(900007, 0);
    });
    check("Alerta retorna ao retomar combate", (await inspect()).visible);
    await page.setViewportSize({ width: 360, height: 780 });
    await render();
    await page.evaluate(() => d.update(900008, 0));
    marker = await inspect();
    check(
      "Alerta cabe na tela estreita",
      marker.visible &&
        marker.x >= 0 &&
        marker.right <= 360 &&
        marker.y >= 0 &&
        marker.bottom <= 780,
      marker,
    );
    await page.screenshot({ path: out + "/pet-tela-estreita.png" });
    await page.setViewportSize({ width: 1600, height: 1200 });
    await render();
    await page.evaluate(() => {
      const snapshot = d.run.snapshot();
      d.run.restore(snapshot);
      d.syncPlayer();
      d.update(900009, 0);
    });
    marker = await inspect();
    check(
      "Pet pendente continua sinalizado após restaurar partida",
      marker.visible && marker.count === 1,
      marker,
    );
    await page.evaluate(() => {
      const s = d.run.state,
        p = s.player;
      s.pickups[0].x = p.x + 30;
      s.pickups[0].y = p.y;
      d.update(900010, 0);
    });
    check(
      "Alerta orienta aproximação quando o jogador está perto",
      (await inspect()).text.includes("aproxime-se"),
    );
    await page.evaluate(() => {
      const s = d.run.state,
        p = s.player;
      s.pickups[0].x = p.x;
      s.pickups[0].y = p.y;
      d.run.step(1 / 30);
      d.update(900011, 0);
    });
    marker = await inspect();
    const rescued = await page.evaluate(() => d.run.state.foundPet);
    check(
      "Resgatar o pet remove o alerta imediatamente",
      !marker.visible && rescued === "cat",
      marker,
    );
    check(
      "Sem erros JavaScript ou requisições falhas",
      errors.length === 0,
      errors,
    );
  } catch (e) {
    errors.push(e.stack || String(e));
    await page.screenshot({ path: out + "/falha.png" });
    process.exitCode = 1;
  } finally {
    fs.writeFileSync(
      out + "/validacao.json",
      JSON.stringify({ checks, errors }, null, 2),
    );
    await browser.close();
  }
})();
