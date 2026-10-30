const { chromium } = require("playwright"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
const out =
  process.env.OPENING_QA_OUTPUT || "/workspace/early-upgrades/interface";
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
      viewport: { width: 1000, height: 1000 },
    }),
    checks = [],
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto(process.env.QA_URL || "http://127.0.0.1:5186");
    await page.waitForSelector("#new-game");
    const result = await page.evaluate(async () => {
      const { game } = await import(
        document.querySelector('script[src*="main.ts"]').src
      );
      game.loop.sleep();
      const { DungeonUI } = await import("/src/dungeons/ui.ts");
      const { DungeonRun } = await import("/src/dungeons/run.ts");
      const { createNewSave } = await import("/src/systems/save.ts");
      const {
        createDungeonProgress,
        applyDungeonResult,
        buyPermanentAttribute,
      } = await import("/src/dungeons/progression.ts");
      const save = createNewSave({
        name: "Teste",
        skin: "#d9a276",
        hairStyle: "curto",
        hairColor: "#754323",
        outfit: "#638a9d",
      });
      save.dungeons = createDungeonProgress();
      window.openingProgress = save.dungeons;
      window.openingUI = new DungeonUI(
        {
          evolve: (key, pet, petKey) =>
            buyPermanentAttribute(openingProgress, key, pet, petKey),
        },
        {},
      );
      const run = new DungeonRun(
        "opening-ui",
        "abandoned-central-square",
        openingProgress,
      );
      Object.assign(run.state, { phase: "defeat", elapsed: 120, kills: 20 });
      const reward = applyDungeonResult(save, run.result());
      openingUI.result(run, reward, true);
      return {
        xp: reward.xp,
        survival: reward.survivalXP,
        learning: reward.learningXP,
      };
    });
    assert.deepEqual(result, { xp: 100, survival: 30, learning: 50 });
    assert.match(
      await page.locator(".dungeon-menu").innerText(),
      /50 XP de apoio/,
    );
    checks.push("Resultado explica os 100 XP e o apoio à primeira derrota");
    await page.screenshot({ path: out + "/primeira-derrota.png" });
    await page.evaluate(async () => {
      const { applyDungeonResult } =
        await import("/src/dungeons/progression.ts");
      const { createNewSave } = await import("/src/systems/save.ts");
      const save = createNewSave({
        name: "Teste",
        skin: "#d9a276",
        hairStyle: "curto",
        hairColor: "#754323",
        outfit: "#638a9d",
      });
      save.dungeons = openingProgress;
      applyDungeonResult(save, {
        id: "second-ui",
        dungeon: "abandoned-central-square",
        outcome: "defeat",
        elapsed: 120,
        kills: 20,
      });
      openingUI.evolution(openingProgress, () => {});
    });
    assert.match(
      await page.locator(".dungeon-menu").innerText(),
      /Para atacar melhor/,
    );
    await page.locator('[data-attribute="strength"]').click();
    assert.deepEqual(
      await page.evaluate(() => [
        openingProgress.xp,
        openingProgress.attributes.strength,
      ]),
      [50, 1],
    );
    checks.push(
      "Duas tentativas permitem comprar uma melhoria escolhida, sem equipar uma rota automaticamente",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(
      await page
        .locator(".permanent-menu")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    );
    checks.push("Orientações de ataque e sobrevivência cabem em 390px");
    await page.screenshot({ path: out + "/primeira-melhoria.png" });
    assert.deepEqual(errors, []);
    checks.push("Sem erros JavaScript");
  } catch (e) {
    errors.push(e.stack || String(e));
    process.exitCode = 1;
  } finally {
    fs.writeFileSync(
      out + "/validacao.json",
      JSON.stringify({ passed: errors.length === 0, checks, errors }, null, 2),
    );
    await browser.close();
  }
})();
