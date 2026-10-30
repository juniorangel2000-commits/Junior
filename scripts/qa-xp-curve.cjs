const { chromium } = require("playwright"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
const out = process.env.XP_QA_OUTPUT || "/workspace/xp-curve/interface";
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
      viewport: { width: 1200, height: 900 },
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
      const { createDungeonProgress } =
        await import("/src/dungeons/progression.ts");
      const { UPGRADES } = await import("/src/dungeons/upgrades.ts");
      const progress = createDungeonProgress();
      for (const key of Object.keys(progress.attributes))
        progress.attributes[key] = 5;
      progress.pets = [
        {
          id: "pet",
          species: "dog",
          rare: true,
          xp: 0,
          attributes: {
            speed: 5,
            resistance: 5,
            perception: 5,
            protection: 5,
            efficiency: 5,
          },
        },
      ];
      window.xpRun = new DungeonRun(
        "xp-ui",
        "abandoned-central-square",
        progress,
        "pet",
      );
      xpRun.state.weapons = ["sword", "bow", "hammer", "spear"];
      for (const u of UPGRADES)
        if (!u.weapon || xpRun.state.weapons.includes(u.weapon))
          xpRun.state.levels[u.id] = u.max;
      const icons = {};
      for (const id of [
        "sword",
        "bow",
        "hammer",
        "spear",
        "boomerang",
        "rotating-blade",
        "orbiting-shield",
      ])
        icons[id] =
          "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
      window.xpUI = new DungeonUI({}, icons);
      xpUI.resume();
      const rows = [];
      for (const level of [10, 30, 50, 100]) {
        xpRun.state.level = level;
        xpRun.state.xp = 0;
        xpUI.update(xpRun);
        rows.push({
          level,
          cost: xpRun.xpNeeded,
          label: document.querySelector(".hud-experience").textContent,
        });
      }
      xpRun.state.level = 100;
      xpRun.state.xp = 150;
      xpRun.grantXP(12);
      xpUI.update(xpRun);
      return {
        rows,
        level: xpRun.state.level,
        cost: xpRun.xpNeeded,
        xp: xpRun.state.xp,
        label: document.querySelector(".hud-experience").textContent,
        pet: xpRun.state.pet.species,
        strength: xpRun.state.permanent.strength,
      };
    });
    assert.deepEqual(
      result.rows.map((r) => r.cost),
      [51, 103, 123, 173],
    );
    checks.push({
      name: "HUD mostra custos crescentes com melhorias e pet ativos",
      passed: true,
      details: result.rows,
    });
    assert.equal(result.level, 101);
    assert.equal(result.cost, 174);
    assert.match(result.label, /2 \/ 174 XP/);
    assert.equal(result.pet, "dog");
    assert.equal(result.strength, 5);
    checks.push({
      name: "Próximo nível cobra o custo novo e mantém XP excedente",
      passed: true,
      details: result,
    });
    await page.screenshot({ path: out + "/xp-proximo-nivel.png" });
    assert.deepEqual(errors, []);
    checks.push({ name: "Sem erros JavaScript", passed: true });
  } catch (e) {
    errors.push(e.stack || String(e));
    process.exitCode = 1;
  } finally {
    fs.writeFileSync(
      out + "/validacao.json",
      JSON.stringify({ checks, errors }, null, 2),
    );
    await browser.close();
  }
})();
