const { chromium } = require("playwright"),
  fs = require("node:fs"),
  assert = require("node:assert/strict");
const out = process.env.DUNGEON_QA_OUTPUT || "/workspace/dungeon-hub/fluxo";
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

    const listeners = await page.evaluate(() =>
      d.input.keyboard.listenerCount("keydown"),
    );
    for (const [index, outcome] of [
      "victory",
      "defeat",
      "abandoned",
    ].entries()) {
      const dungeon = index === 1 ? "mall-parking" : "abandoned-central-square";
      if (index) {
        await page.locator(`[data-start="${dungeon}"]`).click();
      }
      const fresh = await page.evaluate(() => ({
        id: d.run.state.id,
        level: d.run.state.level,
        xp: d.run.state.xp,
        phase: d.run.state.phase,
        weapons: d.run.state.weapons,
        permanent: d.run.state.permanent.strength,
        expected: d.state.dungeons.attributes.strength,
        pet: d.run.state.pet?.id,
        selected: d.state.dungeons.selectedPet,
      }));
      check(
        "Nova expedição começa limpa · " + index,
        fresh.level === 1 &&
          fresh.xp === 0 &&
          fresh.phase === "fighting" &&
          fresh.weapons.length === 1 &&
          fresh.weapons[0] === "sword" &&
          fresh.permanent === fresh.expected &&
          fresh.pet === fresh.selected,
        fresh,
      );
      await page.evaluate(() => d.ui.update(d.run));
      await page.locator("[data-pause]").click();
      check(
        "Pausa atua na partida nova · " + index,
        await page.evaluate(() => d.run.state.phase === "paused"),
        {},
      );
      await page.locator("[data-resume]").click();
      const before = await page.evaluate(() => d.state.dungeons.xp);
      await page.evaluate(
        ({ index, outcome }) => {
          const s = d.run.state;
          Object.assign(s, {
            phase: outcome,
            level: 30,
            kills: 150,
            elapsed: outcome === "victory" ? 900 : 300,
            round: index === 1 ? 25 : 1,
            waveRemaining: 1,
            pickups: [],
            enemies: [],
          });
          if (index === 0) s.foundPet = "dog";
          if (index === 1) {
            window.realStorageWrite = Storage.prototype.setItem;
            Storage.prototype.setItem = function () {
              throw Error("QA disk failure");
            };
          }
          d.finish();
        },
        { index, outcome },
      );
      if (index === 1) {
        const blocked = await page.evaluate(() => {
          d.menu();
          d.setPaused(false);
          return {
            settled: d.settled,
            mode: d.mode,
            xp: d.state.dungeons.xp,
            menu: !!document.querySelector("[data-results-menu]"),
            pending: document.querySelector(".reward-totals strong")
              ?.textContent,
          };
        });
        check(
          "Falha de gravação mantém recibo e impede sair sem salvar",
          !blocked.settled &&
            blocked.mode === "run" &&
            blocked.xp === before &&
            !blocked.menu &&
            blocked.pending !== "0",
          blocked,
        );
        await page.screenshot({ path: out + "/salvamento-pendente.png" });
        await page.evaluate(
          () => (Storage.prototype.setItem = window.realStorageWrite),
        );
        await page.locator("[data-retry]").click();
      }
      const receipt = await page.evaluate(() => ({
        xp: d.reward.xp,
        coins: d.reward.coins,
        settled: d.settled,
        stored: d.state.dungeons.recentResults.filter(
          (id) => id === d.run.state.id,
        ).length,
        wallet: d.state.dungeons.xp,
      }));
      check(
        "Recompensas salvas uma única vez · " + outcome,
        receipt.settled &&
          receipt.stored === 1 &&
          receipt.wallet === before + receipt.xp,
        receipt,
      );
      check(
        "Tela de recompensas mostra ganhos e retorno ao menu",
        (await page.locator(".reward-screen").isVisible()) &&
          (await page.locator("[data-results-menu]").count()) === 1,
        receipt,
      );
      await page.setViewportSize({ width: 390, height: 844 });
      check(
        "Recibo cabe em tela estreita · " + index,
        await page
          .locator(".reward-screen")
          .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
        {},
      );
      await page.screenshot({ path: out + `/recompensas-${outcome}.png` });
      await page.setViewportSize({ width: 1600, height: 1200 });
      await page.locator("[data-results-menu]").click();
      const hub = await page.evaluate(() => ({
        mode: d.mode,
        run: !!d.run,
        children: d.children.list.length,
        active: game.scene.isActive("Dungeons"),
        outside: game.scene.isActive("AcessoCidade"),
        snapshot: !!d.state.dungeonRun,
        listeners: d.input.keyboard.listenerCount("keydown"),
      }));
      check(
        "Retorno fica no menu, limpa o mapa e mantém os controles únicos · " +
          index,
        hub.mode === "menu" &&
          !hub.run &&
          hub.children === 0 &&
          hub.active &&
          !hub.outside &&
          !hub.snapshot &&
          hub.listeners === listeners,
        hub,
      );
      await render();
      if (index === 0) {
        await page.screenshot({ path: out + "/menu-expedicoes.png" });
        await page.locator("[data-evolution]").click();
        await page.locator('[data-attribute="strength"]').click();
        await page.locator("[data-back]").click();
        const pet = await page.evaluate(() => d.state.dungeons.pets[0].id);
        await page.locator("[data-pet]").selectOption(pet);
      }
      await page.setViewportSize({ width: 390, height: 844 });
      check(
        "Menu cabe em tela estreita · " + index,
        await page
          .locator(".expedition-menu")
          .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
        {},
      );
      await page.screenshot({ path: out + "/menu-390.png" });
      await page.setViewportSize({ width: 1600, height: 1200 });
    }
    await page.locator("[data-exit-menu]").click();
    await page.evaluate(() => game.loop.wake());
    await page.waitForFunction(
      () =>
        game.scene.isActive("AcessoCidade") && !game.scene.isActive("Dungeons"),
    );
    check(
      "Sair do menu volta ao mundo normal por escolha do jogador",
      (await page.locator("#dungeon-ui").count()) === 0,
      {},
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
