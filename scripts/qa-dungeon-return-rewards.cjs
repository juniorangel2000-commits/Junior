const { chromium } = require("playwright"),
  fs = require("node:fs"),
  assert = require("node:assert/strict");
const out =
  process.env.DUNGEON_QA_OUTPUT || "/workspace/after-rain-dungeon-return";
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
    for (const outcome of ["victory", "defeat", "abandoned"]) {
      if (outcome !== "victory") {
        await page.evaluate(() => {
          game.scene.getScene("AcessoCidade").enterDungeons();
          game.loop.wake();
        });
        await page.waitForSelector('[data-start="abandoned-central-square"]');
        await page.locator('[data-start="abandoned-central-square"]').click();
        await page.evaluate(() => {
          window.d = game.scene.getScene("Dungeons");
          game.loop.sleep();
        });
      }
      const before = await page.evaluate(() => ({
        xp: d.state.dungeons.xp,
        coins: d.state.villageEconomy.coins,
        scrap: d.state.inventory.scrap,
        cloth: d.state.inventory.cloth,
        metal: d.state.inventory.metalPart,
        pets: d.state.dungeons.pets.length,
      }));
      await page.evaluate((outcome) => {
        const s = d.run.state;
        s.kills = 500;
        s.foundPet = "cat";
        s.foundPetRare = false;
        s.pickups = [];
        s.enemies = [];
        s.elapsed = outcome === "victory" ? 899.99 : 300;
        s.eventClock = s.elapsed;
        s.spawnClock = s.elapsed;
        s.timedBossCount = 5;
        s.player.invulnerable = 0;
        s.buffs = {};
        s.phase = "fighting";
        window.testResultId = s.id;
        if (outcome === "defeat") {
          s.player.hp = 1;
          s.enemies = [
            {
              id: 999999,
              x: s.player.x,
              y: s.player.y,
              hp: 1000,
              maxHp: 1000,
              speed: 1,
              damage: 100,
              special: false,
              kind: "walker",
              streak: 0,
              lastHit: 0,
            },
          ];
        }
        d.ui.resume();
        d.lastPhase = "";
        if (outcome !== "abandoned") {
          d.run.step(1 / 30);
          d.update(950000, 0);
        } else d.ui.update(d.run);
      }, outcome);
      if (outcome === "abandoned") {
        await page.locator("[data-pause]").click();
        await page
          .getByRole("button", { name: "Abandonar e voltar ao acesso" })
          .click();
        await page.getByRole("button", { name: "Confirmar abandono" }).click();
      }
      const ended = await page.evaluate(() => ({
        phase: d.run.state.phase,
        settled: d.settled,
        reward: d.reward,
      }));
      check(
        outcome + ": resultado salvo antes de sair",
        ended.phase === outcome && ended.settled,
        ended,
      );
      await page
        .getByRole("button", { name: "Voltar ao ponto de acesso" })
        .click();
      await page.evaluate(() => game.loop.wake());
      await page.waitForFunction(
        () =>
          game.scene.isActive("AcessoCidade") &&
          document.querySelector("#ui")?.dataset.area === "cityForest",
      );
      const returned = await page.evaluate(async () => {
        const f = game.scene.getScene("AcessoCidade");
        game.loop.sleep();
        const { loadSave } = await import("/src/systems/save.ts");
        const stored = loadSave();
        const pack = (s) =>
          s && {
            xp: s.dungeons.xp,
            coins: s.villageEconomy.coins,
            scrap: s.inventory.scrap,
            cloth: s.inventory.cloth,
            metal: s.inventory.metalPart,
            pets: s.dungeons.pets.length,
            run: !!s.dungeonRun,
            area: s.activeArea,
            resultCount: s.dungeons.recentResults.filter(
              (id) => id === window.testResultId,
            ).length,
          };
        return {
          hudCoins: document.querySelector("#hud-coins")?.textContent,
          normalMap: !game.scene.isActive("Dungeons"),
          x: f.player.x,
          y: f.player.y,
          state: pack(f.state),
          stored: pack(stored),
        };
      });
      check(
        outcome + ": volta à floresta no ponto da estrada",
        returned.normalMap &&
          returned.x === 720 &&
          returned.y === 80 &&
          returned.state.area === "cityForest" &&
          !returned.state.run,
        returned,
      );
      check(
        outcome + ": HUD do mapa normal exibe o saldo salvo",
        returned.hudCoins === `${returned.state.coins} C`,
        returned.hudCoins,
      );
      const a = returned.state,
        r = ended.reward;
      check(
        outcome + ": XP, moedas, materiais e pet chegam ao mapa normal",
        a.xp - before.xp === r.xp &&
          a.coins - before.coins === r.coins &&
          a.scrap - before.scrap === (r.materials?.scrap ?? 0) &&
          a.cloth - before.cloth === (r.materials?.cloth ?? 0) &&
          a.metal - before.metal === (r.materials?.metalPart ?? 0) &&
          a.pets - before.pets === 1 &&
          a.resultCount === 1,
        { before, reward: r, after: a },
      );
      check(
        outcome + ": recompensas persistem no save reaberto",
        JSON.stringify(a) === JSON.stringify(returned.stored),
        returned.stored,
      );
      if (outcome === "abandoned")
        check(
          "Abandono preserva XP e pet, sem moedas nem materiais",
          r.xp === 500 &&
            r.coins === 0 &&
            !Object.keys(r.materials ?? {}).length,
          r,
        );
      await render();
      await page.screenshot({ path: out + "/retorno-" + outcome + ".png" });
    }
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
