const { chromium } = require("playwright"),
  fs = require("node:fs"),
  assert = require("node:assert/strict");
const out =
  process.env.DUNGEON_QA_OUTPUT || "/workspace/after-rain-pet-bonuses";
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
    console.log(name, !!ok);
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

    await page.evaluate(() => {
      window.d = game.scene.getScene("Dungeons");
      const p = d.state.dungeons;
      p.pets = ["dog", "cat"].flatMap((species) =>
        [false, true].map((rare) => ({
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
        })),
      );
      p.selectedPet = "dog-false";
      d.ui.menu(p, d.previews);
    });
    for (const [id, expected] of [
      ["dog-false", ["+10% de vida máxima", "+8% de redução"]],
      ["dog-true", ["+20% de vida máxima", "+16% de redução", "+15% de cura"]],
      ["cat-false", ["+20% de alcance", "+5% de velocidade"]],
      [
        "cat-true",
        ["+40% de alcance", "+10% de velocidade", "+10% de experiência"],
      ],
    ]) {
      await page.locator("[data-pet]").selectOption(id);
      const text = await page.locator("[data-pet-bonuses]").innerText();
      check(
        `Seleção atualiza bônus de ${id}`,
        expected.every((s) => text.includes(s)),
        text,
      );
    }
    await page.setViewportSize({ width: 680, height: 950 });
    check(
      "Bônus shiny cabem no menu estreito",
      await page
        .locator("[data-pet-bonuses]")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
      {},
    );
    await page.screenshot({ path: out + "/bonus-gato-shiny-menu.png" });
    await page.setViewportSize({ width: 1600, height: 1200 });
    await page.locator('[data-start="abandoned-central-square"]').click();
    const initial = await page.evaluate(() => {
      game.loop.sleep();
      d.update(1000, 0);
      return {
        species: d.run.state.pet.species,
        rare: d.run.state.pet.rare,
        texture: d.petImage.texture.key,
        speed: d.run.moveSpeed,
        text: document.querySelector(".hud-pet").textContent,
        title: document.querySelector(".hud-pet").title,
      };
    });
    check(
      "Gato shiny inicia equipado com bônus na HUD",
      initial.species === "cat" &&
        initial.rare &&
        initial.text.includes("✦") &&
        initial.texture === "dungeon-pet-cat-rare" &&
        initial.title.includes("+40%"),
      initial,
    );
    const dodge = await page.evaluate(() => {
      const r = d.run,
        s = r.state,
        p = s.pet;
      s.phase = "fighting";
      s.spawnClock = 20;
      s.eventClock = 1000;
      s.cooldowns.sword = 30;
      p.attack = p.special = 20;
      s.buffs.invulnerable = 1000;
      s.enemies = [
        {
          id: 200,
          x: p.x,
          y: p.y,
          hp: 1000,
          maxHp: 1000,
          speed: 1,
          damage: 20,
          kind: "walker",
          special: false,
          streak: 0,
          lastHit: 0,
        },
      ];
      const hp = p.hp;
      r.random = () => 0;
      r.step(1 / 30);
      r.pause();
      d.lastPhase = "";
      d.update(1001, 0);
      const before = JSON.stringify(r.snapshot());
      r.step(1);
      d.update(1002, 0);
      return {
        hp: p.hp,
        originalHp: hp,
        dodge: p.evade,
        label: d.petDodgeText?.text,
        visible: d.petDodgeText?.visible,
        alpha: d.petImage.alpha,
        paused: before === JSON.stringify(r.snapshot()),
      };
    });
    check(
      "Esquiva evita dano e mostra feedback",
      dodge.hp === dodge.originalHp &&
        dodge.visible &&
        dodge.label === "Esquiva" &&
        dodge.alpha < 1,
      dodge,
    );
    check("Pausa congela a esquiva", dodge.paused, dodge);
    await render();
    await page.screenshot({ path: out + "/gato-shiny-esquiva.png" });
    const recovery = await page.evaluate(async () => {
      const r = d.run,
        p = r.state.pet;
      const speed = r.moveSpeed;
      p.hp = 0;
      delete p.evade;
      r.state.xp = 0;
      r.grantXP(5);
      const snapshot = r.snapshot();
      const { validDungeonSnapshot } =
        await import("/src/dungeons/snapshot.ts");
      return {
        sameSpeed: r.moveSpeed === speed,
        xp: r.state.xp,
        valid: validDungeonSnapshot(snapshot),
      };
    });
    check(
      "Recuperação e save mantêm bônus do gato shiny",
      recovery.sameSpeed &&
        Math.abs(recovery.xp - 5.5) < 1e-9 &&
        recovery.valid,
      recovery,
    );
    const dog = await page.evaluate(async () => {
      const { DungeonRun } = await import("/src/dungeons/run.ts");
      const { DUNGEON_BALANCE: B } = await import("/src/dungeons/config.ts");
      const r = new DungeonRun(
        "dog-qa",
        "abandoned-central-square",
        d.state.dungeons,
        "dog-true",
      );
      d.run = r;
      r.state.spawnClock = 20;
      r.state.eventClock = 1000;
      r.state.cooldowns.sword = 30;
      r.state.player.hp = 20;
      r.state.pet.hp = 0;
      r.state.pickups = [
        {
          id: 201,
          kind: "health",
          amount: 10,
          x: r.state.player.x,
          y: r.state.player.y,
        },
      ];
      r.step(1 / 30);
      d.lastPhase = "";
      d.ui.resume();
      d.update(1003, 0);
      return {
        hp: r.state.player.hp,
        max: r.maxHealth,
        expected: B.playerHealth * 1.2,
        title: document.querySelector(".hud-pet").title,
      };
    });
    check(
      "Cachorro shiny aplica vida e cura durante recuperação",
      Math.abs(dog.hp - 31.5) < 1e-9 &&
        dog.max === dog.expected &&
        dog.title.includes("+15% de cura"),
      dog,
    );
    await render();
    await page.screenshot({ path: out + "/cachorro-shiny-hud.png" });

    const art = await page.evaluate(async () => {
      const { petPortrait } = await import("/src/dungeons/pet-sprites.ts");
      const { WorldCompanion } =
        await import("/src/dungeons/world-companion.ts");
      const result = [];
      for (const species of ["dog", "cat"]) {
        const base = d.textures.get(`dungeon-pet-${species}`).getSourceImage();
        const variant = d.textures
          .get(`dungeon-pet-${species}-rare`)
          .getSourceImage();
        const a = base
          .getContext("2d")
          .getImageData(0, 0, base.width, base.height).data;
        const b = variant
          .getContext("2d")
          .getImageData(0, 0, variant.width, variant.height).data;
        let alpha = true,
          changed = 0;
        for (let i = 0; i < a.length; i += 4) {
          if (a[i + 3] !== b[i + 3]) alpha = false;
          if (
            a[i + 3] &&
            (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2])
          )
            changed++;
        }
        d.state.dungeons.selectedPet = `${species}-true`;
        const companion = new WorldCompanion(
          d,
          d.state,
          d.run.state.player,
          () => {},
          { area: "cityForest", space: "outdoors", blockedPoint: () => false },
        );
        const texture = companion.image.texture.key;
        companion.destroy();
        result.push({
          species,
          alpha,
          changed,
          texture,
          sameSize:
            base.width === variant.width && base.height === variant.height,
          sameFrames:
            d.textures.get(`dungeon-pet-${species}`).getFrameNames().length ===
            d.textures.get(`dungeon-pet-${species}-rare`).getFrameNames()
              .length,
        });
      }
      const icons = {};
      for (const species of ["dog", "cat"])
        for (const rare of [false, true]) {
          icons[species + (rare ? "-rare" : "")] = petPortrait(
            d,
            species,
            rare,
          );
        }
      window.collectionView = {
        pets: d.state.dungeons.pets.filter(
          (p) => p.id === "dog-false" || p.id === "cat-true",
        ),
        selected: "cat-true",
        nearby: true,
        icons,
      };
      document.querySelector("#ui").style.display = "";
      document.querySelector("#dungeon-ui").style.display = "none";
      d.gameUI.showCompanions(
        () => collectionView,
        (command) => {
          if (command.kind === "select") collectionView.selected = command.id;
          return true;
        },
      );
      return result;
    });
    check(
      "Variantes preservam transparência, tamanho e todos os quadros",
      art.every(
        (p) => p.alpha && p.sameSize && p.sameFrames && p.changed > 1000,
      ),
      art,
    );
    check(
      "Paletas especiais também aparecem no mundo normal",
      art.every((p) => p.texture === `dungeon-pet-${p.species}-rare`),
      art,
    );
    await page.locator("[data-pet-collection]").click();
    check(
      "Coleção distingue desbloqueios e mantém bloqueados sem ação de equipar",
      (await page.locator('[data-unlocked="true"]').count()) === 2 &&
        (await page.locator('[data-unlocked="false"]').count()) === 2 &&
        (await page
          .locator('[data-unlocked="false"] [data-pet-select]')
          .count()) === 0,
      {},
    );
    check(
      "Nomes usam somente brilho, sem a palavra shiny",
      !(await page.locator(".pet-collection").innerText())
        .toLowerCase()
        .includes("shiny") &&
        (await page.locator(".pet-collection .pet-sparkle").count()) === 3,
      {},
    );
    await page.screenshot({ path: out + "/colecao-pets.png" });
    await page.locator('[data-pet-entry="dog"] [data-pet-select]').click();
    check(
      "Coleção permite escolher pet desbloqueado",
      (await page.evaluate(() => collectionView.selected)) === "dog-false",
      {},
    );
    await page.setViewportSize({ width: 420, height: 900 });
    check(
      "Coleção cabe em tela estreita",
      await page
        .locator(".pet-collection")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
      {},
    );
    await page.screenshot({ path: out + "/colecao-estreita.png" });
    await page.locator("[data-pet-collection-back]").click();
    check(
      "Retorno preserva seleção e comandos",
      (await page
        .locator('[data-pet-select="dog-false"][aria-pressed="true"]')
        .count()) === 1 &&
        (await page.locator("[data-pet-command]").count()) === 3,
      {},
    );
    await page.locator("[data-pet-close]").click();
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
