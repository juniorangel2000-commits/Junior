const { chromium } = require("playwright"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
const out = process.env.MENU_QA_OUTPUT || "/workspace/dungeon-hub/layout";
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
      viewport: { width: 1280, height: 720 },
    }),
    checks = [],
    errors = [];
  page.setDefaultTimeout(120000);
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto(process.env.QA_URL || "http://127.0.0.1:5186");
    await page.waitForSelector("#new-game");
    await page.evaluate(async () => {
      const { game } = await import(
        document.querySelector('script[src*="main.ts"]').src
      );
      game.loop.sleep();
      const { DungeonUI } = await import("/src/dungeons/ui.ts");
      const { createDungeonProgress } =
        await import("/src/dungeons/progression.ts");
      window.menuExitCount = 0;
      window.menuData = createDungeonProgress();
      menuData.xp = 924;
      menuData.completed["abandoned-central-square"] = 1;
      window.menuTest = new DungeonUI({ back: () => menuExitCount++ }, {});
      window.menuPreviews = {
        "abandoned-central-square":
          "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
        "mall-parking":
          "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
      };
      menuTest.menu(menuData, menuPreviews);
    });
    for (const [width, height] of [
      [1280, 720],
      [390, 844],
    ]) {
      await page.setViewportSize({ width, height });
      const v = await page.locator("[data-exit-top]").evaluate((el) => {
        const r = el.getBoundingClientRect();
        return {
          visible:
            r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
          focused: document.activeElement.id === "expedition-title",
          fits:
            el.closest(".expedition-menu").scrollWidth <=
            el.closest(".expedition-menu").clientWidth + 1,
        };
      });
      assert.ok(v.visible && v.focused && v.fits);
      checks.push({
        name: `Saída visível sem rolar em ${width}px e foco seguro no título`,
        passed: true,
        details: v,
      });
    }
    await page.locator("[data-exit-top]").click();
    assert.equal(await page.evaluate(() => menuExitCount), 1);
    checks.push({
      name: "Fechar no cabeçalho chama a mesma saída explícita do menu",
      passed: true,
    });
    assert.deepEqual(errors, []);
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
