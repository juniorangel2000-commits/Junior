const { chromium } = require("playwright"),
  fs = require("node:fs"),
  assert = require("node:assert/strict");
const out =
  process.env.DUNGEON_QA_OUTPUT ||
  "/workspace/after-rain-weapon-remake-focused";
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
    const ids = [
      "sword",
      "bow",
      "spear",
      "boomerang",
      "hammer",
      "rotating-blade",
      "orbiting-shield",
    ];
    for (const evolved of [false, true])
      for (const id of ids) {
        const result = await page.evaluate(
          ({ id, evolved }) => {
            const s = d.run.state,
              p = s.player;
            const evolution = {
              sword: "sword-dual",
              bow: "bow-triple",
              spear: "spear-fan",
              boomerang: "boomerang-cross",
              hammer: "hammer-double",
              "rotating-blade": "blade-double",
              "orbiting-shield": "shield-double",
            };
            s.phase = "fighting";
            s.elapsed = 20;
            s.spawnClock = 100;
            s.eventClock = 100;
            s.weapons = [id];
            s.levels = evolved ? { [evolution[id]]: 1 } : {};
            s.cooldowns = {};
            s.pendingAttacks = [];
            s.projectiles = [];
            s.pickups = [];
            s.shield = { charges: evolved ? 2 : 1, recharge: 0 };
            s.player.hp = d.run.maxHealth;
            s.player.invulnerable = 0;
            s.enemies = [
              {
                id: 95000,
                x: p.x + (id === "orbiting-shield" ? 0 : 65),
                y: p.y,
                hp: 10000,
                maxHp: 10000,
                speed: 1,
                damage: 1,
                special: false,
                kind: "walker",
                streak: 0,
                lastHit: 0,
              },
            ];
            d.run.effects.length = 0;
            d.run.impacts.length = 0;
            delete s.buffs.invulnerable;
            d.run.step(1 / 30);
            d.run.step(1 / 30);
            d.run.pause();
            d.syncPlayer();
            d.lastPhase = "";
            d.update(850000, 0);
            d.ui.resume();
            const before = JSON.stringify({
              state: d.run.snapshot(),
              effects: d.run.effects,
            });
            d.update(850001, 0);
            d.update(850002, 0);
            d.ui.resume();
            const frame = id + (evolved ? "-evolved" : "");
            const images = [
              ...d.effects,
              ...d.orbitals,
              ...d.projectileImages.values(),
            ].filter((i) => i.visible);
            const icon = document.querySelector(".hud-weapon img");
            return {
              frame,
              exists: d.textures.get("dungeon-weapons").has(frame),
              shown: images.some(
                (i) =>
                  i.frame.name === frame ||
                  (id === "bow" &&
                    i.texture.key ===
                      (evolved ? "dungeon-arrow-evolved" : "dungeon-arrow")),
              ),
              untinted: images.every((i) => i.tintTopLeft === 0xffffff),
              frozen:
                before ===
                JSON.stringify({
                  state: d.run.snapshot(),
                  effects: d.run.effects,
                }),
              icon:
                icon?.getAttribute("src") ===
                d.textures.getBase64("dungeon-weapons", frame),
              effect: d.run.effects.some((e) => e.weapon === id),
            };
          },
          { id, evolved },
        );
        check(
          `${id} ${evolved ? "evoluída" : "base"}: sprite, HUD, cores e pausa`,
          result.exists &&
            result.shown &&
            result.untinted &&
            result.frozen &&
            result.icon,
          result,
        );
        await render();
        await page.screenshot({
          path: out + `/${id}-${evolved ? "evoluida" : "base"}.png`,
        });
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
