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
      const { petPortrait, preloadPetArt, setupPetArt } =
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
          icons[species + (rare ? "-rare" : "")] = petPortrait(
            scene,
            species,
            rare,
          );
        }
      document.querySelector("#ui").innerHTML =
        '<div class="ui-base"><div class="hud"><aside class="journal" style="left:10px;top:45px;width:170px;height:200px"><h3>Missões</h3></aside></div></div><div class="modal-root active">' +
        petCollectionHTML({ pets, icons, selected: "dog-true", nearby: true }) +
        "</div>";
    });
    const sizes = await page.evaluate(async () => {
      const sizes = [];
      for (const img of document.querySelectorAll(".pet-collection img")) {
        await img.decode();
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 96;
        const context = canvas.getContext("2d");
        context.drawImage(img, 0, 0);
        const pixels = context.getImageData(0, 0, 96, 96).data;
        let left = 96,
          top = 96,
          right = 0,
          bottom = 0;
        for (let y = 0; y < 96; y++)
          for (let x = 0; x < 96; x++)
            if (pixels[(y * 96 + x) * 4 + 3]) {
              left = Math.min(left, x);
              right = Math.max(right, x);
              top = Math.min(top, y);
              bottom = Math.max(bottom, y);
            }
        sizes.push({ width: right - left + 1, height: bottom - top + 1 });
      }
      return sizes;
    });
    checks.push({
      name: "Cachorro visivelmente maior que o gato, com a mesma escala nas variantes",
      passed:
        sizes[0].height > sizes[2].height * 1.25 &&
        sizes[0].height < sizes[2].height * 1.6 &&
        sizes[0].width >= sizes[2].width &&
        JSON.stringify(sizes[0]) === JSON.stringify(sizes[1]) &&
        JSON.stringify(sizes[2]) === JSON.stringify(sizes[3]),
      details: sizes,
    });
    assert.ok(checks.at(-1).passed, JSON.stringify(sizes));
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
    await page.setViewportSize({ width: 1000, height: 750 });
    const directions = await page.evaluate(async () => {
      const { game } = await import(
        document.querySelector('script[src*="main.ts"]').src
      );
      const { petSpritePose, PET_ART } =
        await import("/src/dungeons/pet-sprites.ts");
      const { PET_DIRECTIONS } =
        await import("/src/dungeons/pet-directions.ts");
      const scene = game.scene.getScenes(true)[0];
      const canvas = document.createElement("canvas");
      canvas.id = "pet-walk-review";
      canvas.width = 1000;
      canvas.height = 700;
      canvas.style.cssText = "position:fixed;inset:0;z-index:99999";
      document.body.append(canvas);
      const c = canvas.getContext("2d");
      c.imageSmoothingEnabled = false;
      c.fillStyle = "#f2e3c7";
      c.fillRect(0, 0, 1000, 700);
      c.fillStyle = "#5b432a";
      c.font = "14px Arial";
      PET_DIRECTIONS.forEach((dir, col) => c.fillText(dir, 80 + col * 112, 30));
      let valid = true,
        row = 0;
      for (const species of ["dog", "cat"])
        for (const rare of [false, true]) {
          c.fillStyle = "#5b432a";
          c.fillText(species + (rare ? " ✦" : ""), 10, 90 + row * 155);
          PET_DIRECTIONS.forEach((dir, col) => {
            const pose = petSpritePose(species, "walk", dir, 0.3, true, rare);
            const texture = scene.textures.get(pose.texture),
              r = PET_ART[species].frames[pose.frame];
            valid =
              valid &&
              texture.has(pose.frame) &&
              pose.frame.startsWith("walk-" + dir + "-");
            const scale = pose.scale * 3;
            c.drawImage(
              texture.getSourceImage(),
              r.x,
              r.y,
              r.width,
              r.height,
              125 + col * 112 - pose.originX * r.width * scale,
              160 + row * 155 - pose.originY * r.height * scale,
              r.width * scale,
              r.height * scale,
            );
          });
          row++;
        }
      return valid;
    });
    checks.push({
      name: "Oito direções de caminhada nas quatro variações",
      passed: directions,
    });
    assert.ok(directions);
    await page
      .locator("#pet-walk-review")
      .screenshot({ path: out + "/caminhada-oito-direcoes.png" });
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
