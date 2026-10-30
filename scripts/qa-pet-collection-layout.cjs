const { chromium } = require("playwright");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const out =
  process.env.DUNGEON_QA_OUTPUT ||
  "/workspace/after-rain-pet-collection-layout";
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
    viewport: { width: 1000, height: 1100 },
  });
  const checks = [];
  try {
    await page.goto(process.env.QA_URL || "http://127.0.0.1:5186");
    await page.waitForSelector("#new-game");
    await page.evaluate(async () => {
      const { game } = await import(
        document.querySelector('script[src*="main.ts"]').src
      );
      const { petCollectionHTML } = await import("/src/dungeons/pet-menu.ts");
      const { petSpritePose, preloadPetArt, setupPetArt } =
        await import("/src/dungeons/pet-sprites.ts");
      const scene = game.scene.getScenes(true)[0];
      preloadPetArt(scene);
      if (scene.load.list.size)
        await new Promise((resolve) => {
          scene.load.once("complete", resolve);
          scene.load.start();
        });
      setupPetArt(scene);
      game.loop.sleep();
      const pets = [],
        icons = {};
      for (const species of ["dog", "cat"])
        for (const rare of [false, true]) {
          pets.push({
            id: `${species}-${rare}`,
            species,
            rare,
            xp: 0,
            attributes: {
              speed: 0,
              resistance: 0,
              perception: 0,
              protection: 0,
              efficiency: 0,
            },
          });
          const pose = petSpritePose(species, "idle", "south", 0, true, rare);
          icons[species + (rare ? "-rare" : "")] = scene.textures.getBase64(
            pose.texture,
            pose.frame,
          );
        }
      document.querySelector("#ui").innerHTML =
        '<div class="ui-base"><div class="hud"><aside class="journal" style="left:10px;top:45px;width:170px;height:200px"><h3>Missões</h3></aside></div></div><div class="modal-root active">' +
        petCollectionHTML({ pets, icons, selected: "dog-true", nearby: true }) +
        "</div>";
    });
    for (const width of [1000, 420]) {
      await page.setViewportSize({ width, height: 1100 });
      const result = await page.locator(".pet-collection").evaluate((el) => {
        const heading = el.querySelector("h2"),
          r = heading.getBoundingClientRect();
        const onTop = document.elementFromPoint(r.left + 15, r.top + 10);
        return {
          fits: el.scrollWidth <= el.clientWidth,
          headingVisible: heading === onTop || heading.contains(onTop),
          specials: el.querySelectorAll(".pet-sparkle").length,
          portraits: el.querySelectorAll("img").length,
        };
      });
      checks.push({
        name: `Coleção ${width}px: título acima das missões, quatro retratos e largura correta`,
        passed:
          result.fits &&
          result.headingVisible &&
          result.specials === 3 &&
          result.portraits === 4,
        details: result,
      });
      assert.ok(checks.at(-1).passed, JSON.stringify(result));
      await page.screenshot({ path: out + `/colecao-${width}.png` });
    }
  } catch (e) {
    checks.push({ name: e.message, passed: false });
    process.exitCode = 1;
  } finally {
    fs.writeFileSync(
      out + "/validacao.json",
      JSON.stringify({ checks }, null, 2),
    );
    await browser.close();
  }
})();
