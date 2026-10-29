const { chromium } = require("playwright"),
  fs = require("node:fs"),
  assert = require("node:assert/strict");
const out = process.env.DUNGEON_QA_OUTPUT || "/workspace/after-rain-dungeons";
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
    const battle = await page.evaluate(() => {
      for (let i = 0; i < 380 && d.run.state.phase === "fighting"; i++)
        d.update(100000 + i * 100, 100);
      return {
        phase: d.run.state.phase,
        kills: d.run.state.kills,
        elapsed: d.run.state.elapsed,
        cards: d.run.state.cards.length,
        level: d.run.state.level,
      };
    });
    check(
      "Combate automático elimina inimigos e oferece três cartas sem comando de ataque",
      battle.kills > 0 && battle.phase === "choice" && battle.cards === 3,
      battle,
    );
    await render();
    await page.screenshot({ path: out + "/cartas.png" });
    await page.locator("[data-card]").first().click();
    const arsenal = await page.evaluate(() => {
      // Reproducible fixture: do not depend on the randomly seeded new game.
      d.run.state.seed = 1234567;
      let tries = 0;
      while (d.run.state.weapons.length < 4 && tries++ < 120) {
        if (d.run.state.phase === "fighting") d.run.grantXP(d.run.xpNeeded);
        const card =
          d.run.state.cards.find((c) => c.kind === "arsenal") ??
          d.run.state.cards[0];
        if (card) d.run.choose(card.id);
      }
      d.lastPhase = "";
      d.update(200000, 0);
      return { weapons: d.run.state.weapons, cards: d.run.state.cards };
    });
    check(
      "Arsenal limita a quatro armas e continua oferecendo melhorias",
      arsenal.weapons.length === 4,
      arsenal,
    );
    await page.locator("[data-pause]").click();
    const pause = await page.evaluate(() => {
      const before = d.run.state.elapsed;
      for (let i = 0; i < 20; i++) d.update(210000 + i * 100, 100);
      return {
        phase: d.run.state.phase,
        frozen: d.run.state.elapsed === before,
      };
    });
    check(
      "Pausa congela combate e cronômetro",
      pause.phase === "paused" && pause.frozen,
      pause,
    );
    await page.getByRole("button", { name: "Retomar", exact: true }).click();
    await page.evaluate(() => {
      for (let i = 0; i < 30; i++) d.update(220000 + i * 100, 100);
      while (d.run.state.phase === "choice")
        d.run.choose(d.run.state.cards[0].id);
      d.run.pause();
      d.lastPhase = "";
      d.update(230000, 0);
      d.cameras.main
        .stopFollow()
        .setZoom(1600 / 3072)
        .centerOn(1536, 1152);
    });
    await render();
    await page.evaluate(
      () => (document.querySelector("#dungeon-ui").style.visibility = "hidden"),
    );
    await page.screenshot({ path: out + "/praca-completa.png" });
    const squareProps = await page.evaluate(() => {
      const images = d.world.objects.filter(o => o.texture);
      return {
        unwanted: images.filter(o => o.texture.key.startsWith("asset-tree-") || ["apartment", "mall", "booth", "shop"].includes(o.frame?.name)).length,
        vertical: images.filter(o => o.frame?.name === "bench-vertical").map(o => ({ x: o.x, flipped: o.flipX })),
      };
    });
    check("Praça sem árvores ou construções, com bancos verticais voltados para a fonte", squareProps.unwanted === 0 && squareProps.vertical.length === 2 && squareProps.vertical.every(p => p.flipped === (p.x > 1536)), squareProps);

    await page.evaluate(
      () => (document.querySelector("#dungeon-ui").style.visibility = ""),
    );
    const saved = await page.evaluate(async () => {
      const { loadSave, validateSave } = await import("/src/systems/save.ts");
      const ok = d.persist();
      return {
        ok,
        valid: validateSave(loadSave()),
        snapshot: structuredClone(d.run.state),
      };
    });
    check(
      "Save guarda a partida temporária e progresso permanente em campos separados",
      saved.ok && saved.valid,
      saved.ok,
    );
    await page.reload();
    await page.locator("#continue-game").click();
    await page.waitForFunction(
      () =>
        document.querySelector("#dungeon-ui") &&
        document.querySelector("[data-resume]"),
    );
    const resumed = await page.evaluate(async () => {
      window.game = (
        await import(document.querySelector('script[src*="main.ts"]').src)
      ).game;
      window.d = game.scene.getScene("Dungeons");
      game.loop.sleep();
      return {
        weapons: d.run.state.weapons,
        elapsed: d.run.state.elapsed,
        phase: d.run.state.phase,
      };
    });
    check(
      "Continuar retoma a expedição pausada com o mesmo Arsenal e tempo",
      resumed.phase === "paused" &&
        resumed.elapsed === saved.snapshot.elapsed &&
        JSON.stringify(resumed.weapons) ===
          JSON.stringify(saved.snapshot.weapons),
      resumed,
    );
    await page.locator("[data-abandon]").click();
    await page.getByRole("button", { name: "Confirmar abandono" }).click();
    await page.waitForSelector("[data-back]");
    const result = await page.evaluate(async () => {
      const { loadSave } = await import("/src/systems/save.ts");
      return {
        settled: d.settled,
        run: loadSave()?.dungeonRun,
        x: loadSave()?.cityForestPosition?.x,
        y: loadSave()?.cityForestPosition?.y,
      };
    });
    check(
      "Abandono encerra temporários e preserva o retorno exato na estrada",
      result.settled && !result.run && result.x === 720 && result.y === 80,
      result,
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
    const returned = await page.evaluate(() => {
      const f = game.scene.getScene("AcessoCidade");
      return { x: f.player.x, y: f.player.y };
    });
    check(
      "Saída não transporta para a cabana",
      returned.x === 720 && returned.y === 80,
      returned,
    );
    // Fixture: an already-rescued companion tests selection and persistence independently of random rescue events.
    await page.evaluate(() => {
      const f = game.scene.getScene("AcessoCidade");
      f.state.dungeons.pets.push({
        id: "qa-dog",
        species: "dog",
        rare: false,
        xp: 20,
        attributes: {
          speed: 0,
          resistance: 0,
          perception: 0,
          protection: 0,
          efficiency: 0,
        },
      });
      f.persist();
    });
    await page.keyboard.press("e");
    await page.waitForSelector("[data-pet]");
    await page.locator("[data-pet]").selectOption("qa-dog");
    await page.locator('[data-start="mall-parking"]').click();
    const parking = await page.evaluate(() => {
      window.d = game.scene.getScene("Dungeons");
      game.loop.sleep();
      for (let i = 0; i < 20; i++) d.update(300000 + i * 100, 100);
      d.run.pause();
      d.lastPhase = "";
      d.update(310000, 0);
      d.cameras.main
        .stopFollow()
        .setZoom(1600 / 3072)
        .centerOn(1536, 1152);
      return {
        mode: d.run.state.dungeon,
        round: d.run.state.round,
        pet: d.run.state.pet?.id,
        weapons: d.run.state.weapons,
      };
    });
    check(
      "Estacionamento inicia em rodada um com um pet separado da espada",
      parking.mode === "mall-parking" &&
        parking.round === 1 &&
        parking.pet === "qa-dog" &&
        parking.weapons.length === 1,
      parking,
    );
    await render();
    await page.evaluate(
      () => (document.querySelector("#dungeon-ui").style.visibility = "hidden"),
    );
    await page.screenshot({ path: out + "/estacionamento-completo.png" });
    const parkingProps = await page.evaluate(() => d.world.objects.filter(o => o.texture && (o.texture.key.startsWith("asset-tree-") || ["apartment", "mall", "booth", "shop"].includes(o.frame?.name))).length);
    check("Estacionamento sem árvores ou construções", parkingProps === 0, { unwanted: parkingProps });

    await page.evaluate(
      () => (document.querySelector("#dungeon-ui").style.visibility = ""),
    );
    const rescue = await page.evaluate(() => {
      const p = d.run.state.player;
      d.run.state.pickups.push({
        id: 89999,
        x: p.x + 160,
        y: p.y,
        kind: "pet",
        amount: 0,
        species: "cat",
      });
      d.update(350000, 0);
      const visible = d.rescueImage?.visible === true;
      d.player.x = p.x + 150;
      d.player.y = p.y;
      d.run.state.player.x = d.player.x;
      d.run.resume();
      d.update(350100, 100);
      d.run.pause();
      d.lastPhase = "";
      d.update(350200, 0);
      return {
        visible,
        found: d.run.state.foundPet,
        active: d.run.state.pet?.id,
      };
    });
    check(
      "Resgate usa sprite do animal e mantém somente o companheiro escolhido ativo",
      rescue.visible && rescue.found === "cat" && rescue.active === "qa-dog",
      rescue,
    );
    const stress = await page.evaluate(() => {
      const before = d.run.snapshot();
      d.run.state.phase = "fighting";
      d.run.state.weapons = ["sword", "bow", "hammer", "rotating-blade"];
      d.run.state.buffs.invulnerable = d.run.state.elapsed + 20;
      d.run.state.enemies = Array.from({ length: 240 }, (_, i) => ({
        id: 90000 + i,
        x: 100 + (i % 20) * 140,
        y: 100 + Math.floor(i / 20) * 150,
        hp: 100000,
        maxHp: 100000,
        speed: 30,
        damage: 0,
        special: false,
        kind: "walker",
        streak: 0,
        lastHit: 0,
      }));
      const t = performance.now();
      for (let i = 0; i < 120; i++) d.update(400000 + i * 33.333, 33.333);
      const average = (performance.now() - t) / 120;
      const result = {
        averageUpdateMs: average,
        images: d.enemyImages.size + d.enemyPool.length,
        enemies: d.run.state.enemies.length,
        projectiles: d.run.state.projectiles.length,
        effects: d.run.effects.length,
      };
      d.run.restore(before);
      d.syncPlayer();
      d.lastPhase = "";
      d.update(410000, 0);
      return result;
    });
    check(
      "Carga de 240 inimigos mantém pools e efeitos limitados",
      stress.enemies <= 240 &&
        stress.images <= 240 &&
        stress.projectiles <= 160 &&
        stress.effects <= 48,
      stress,
    );
    const feedback = await page.evaluate(() => {
      const before = d.run.snapshot();
      d.run.state.phase = "fighting";
      d.run.state.spawnClock = 10;
      d.run.state.weapons = ["sword"];
      d.run.state.cooldowns.sword = 0;
      const p = d.run.state.player;
      d.run.state.enemies = [
        {
          id: 88000,
          x: p.x + 38,
          y: p.y,
          hp: 1000,
          maxHp: 1000,
          speed: 1,
          damage: 0,
          special: false,
          kind: "walker",
          streak: 0,
          lastHit: 0,
        },
      ];
      d.run.step(1 / 30);
      d.run.pause();
      d.lastPhase = "";
      d.update(415000, 0);
      const result = {
        impacts: d.run.impacts.length,
        visibleNumbers: d.damageNumbers.filter((t) => t.visible).length,
        pooledNumbers: d.damageNumbers.length,
        flashed: d.enemyImages.get(88000)?.tintFill === true,
        phaseLabel: document.querySelector(".dungeon-buffs")?.textContent,
      };
      const time = d.run.state.elapsed;
      d.update(416000, 200);
      result.frozen = time === d.run.state.elapsed;
      window.feedbackRestore = before;
      return result;
    });
    check(
      "Acertos exibem dano, lampejo e fase da horda com pools limitados e pausa estável",
      feedback.impacts > 0 &&
        feedback.visibleNumbers > 0 &&
        feedback.pooledNumbers <= 48 &&
        feedback.flashed &&
        feedback.frozen &&
        !!feedback.phaseLabel,
      feedback,
    );
    await page.evaluate(() => {
      d.ui.resume();
      d.cameras.main.stopFollow().setZoom(1.8).centerOn(d.player.x, d.player.y);
    });
    await render();
    await page.screenshot({ path: out + "/impacto-combate.png" });
    await page.evaluate(() => {
      d.run.restore(window.feedbackRestore);
      d.syncPlayer();
      d.lastPhase = "";
      d.update(417000, 0);
    });
    const evolvedWeapons = await page.evaluate(() => {
      window.weaponRestore = d.run.snapshot();
      const s = d.run.state,
        p = s.player;
      s.phase = "fighting";
      s.spawnClock = 10;
      s.waveRemaining = 0;
      s.weapons = ["sword", "bow", "boomerang"];
      s.levels = {
        "sword-speed": 2,
        "sword-wide": 2,
        "sword-dual": 1,
        "bow-double": 1,
        "bow-triple": 1,
        // Piercing keeps all three arrows visible after the prepared close target.
        "bow-piercing": 2,
        "boomerang-double": 1,
        "boomerang-cross": 1,
      };
      s.cooldowns = {};
      s.projectiles = [];
      s.pendingAttacks = [];
      s.enemies = [
        [40, 0],
        [190, 50],
        [210, -80],
        [-180, 0],
      ].map(([dx, dy], i) => ({
        id: 87000 + i,
        x: p.x + dx,
        y: p.y + dy,
        hp: 1000,
        maxHp: 1000,
        speed: 1,
        damage: 0,
        special: false,
        kind: "walker",
        streak: 0,
        lastHit: 0,
      }));
      for (let i = 0; i < 8; i++) d.run.step(1 / 30);
      d.syncPlayer();
      d.run.pause();
      d.lastPhase = "";
      d.update(418000, 0);
      d.ui.resume();
      return {
        arrows: [...d.projectileImages.values()].filter(
          (img) => img.visible && img.texture.key === "dungeon-arrow-evolved",
        ).length,
        boomerangs: s.projectiles.filter((p) => p.weapon === "boomerang")
          .length,
        goldenSlots: document.querySelectorAll(".dungeon-loadout .evolved")
          .length,
        names: [...document.querySelectorAll(".dungeon-loadout img")].map(
          (img) => img.alt,
        ),
        slots: s.weapons.length,
        secondCut: d.run.effects.some(
          (e) => e.weapon === "sword" && e.variant === 1,
        ),
      };
    });
    check(
      "Evoluções mostram três flechas próprias, dois bumerangues e corte alternado",
      evolvedWeapons.arrows === 3 &&
        evolvedWeapons.boomerangs === 2 &&
        evolvedWeapons.secondCut,
      evolvedWeapons,
    );
    check(
      "Arsenal identifica as três evoluções sem ocupar espaços extras",
      evolvedWeapons.goldenSlots === 3 &&
        evolvedWeapons.slots === 3 &&
        evolvedWeapons.names.includes("Disparo Triplo"),
      evolvedWeapons,
    );
    await render();
    await page.screenshot({ path: out + "/armas-evoluidas.png" });
    await page.evaluate(() => {
      d.run.restore(window.weaponRestore);
      d.syncPlayer();
      d.lastPhase = "";
      d.update(419000, 0);
    });
    const remaining = await page.evaluate(() => {
      window.remainingRestore = d.run.snapshot();
      const s = d.run.state,
        p = s.player;
      s.phase = "fighting";
      s.spawnClock = 10;
      s.weapons = ["sword", "spear", "hammer", "rotating-blade"];
      s.levels = {
        "spear-fan": 1,
        "spear-range": 4,
        "spear-piercing": 2,
        "hammer-double": 1,
        "hammer-area": 3,
        "blade-double": 1,
        "blade-speed": 3,
      };
      s.cooldowns = { sword: 20 };
      s.projectiles = [];
      s.pendingAttacks = [];
      s.buffs.invulnerable = s.elapsed + 10;
      s.enemies = [
        [60, 0],
        [100, 25],
        [100, -25],
        [-75, 0],
      ].map(([dx, dy], i) => ({
        id: 86000 + i,
        x: p.x + dx,
        y: p.y + dy,
        hp: 1000,
        maxHp: 1000,
        speed: 1,
        damage: 10,
        special: false,
        kind: "walker",
        streak: 0,
        lastHit: 0,
      }));
      for (let i = 0; i < 3; i++) d.run.step(1 / 30);
      d.syncPlayer();
      d.run.pause();
      d.lastPhase = "";
      d.update(420000, 0);
      d.ui.resume();
      return {
        fan: d.run.effects.filter((e) => e.weapon === "spear").length,
        hammerRadius: d.run.effects.find((e) => e.weapon === "hammer")?.radius,
        blades: d.orbitals.filter(
          (img) => img.visible && img.frame.name === "rotating-blade",
        ).length,
        gold: document.querySelectorAll(".dungeon-loadout .evolved").length,
        slots: s.weapons.length,
      };
    });
    check(
      "Lança em leque, área real do martelo e duas lâminas aparecem juntas em quatro espaços",
      remaining.fan === 3 &&
        remaining.hammerRadius > 48 &&
        remaining.blades === 2 &&
        remaining.gold === 3 &&
        remaining.slots === 4,
      remaining,
    );
    await render();
    await page.screenshot({ path: out + "/lanca-martelo-laminas.png" });
    const shield = await page.evaluate(() => {
      const s = d.run.state,
        p = s.player;
      s.phase = "fighting";
      s.weapons = ["sword", "orbiting-shield"];
      s.shield = undefined;
      s.pet = undefined;
      d.run.impacts.length = 0;
      s.levels = {
        "shield-double": 1,
        "shield-protection": 3,
        "shield-speed": 4,
      };
      s.cooldowns = { sword: 20 };
      s.pendingAttacks = [];
      s.enemies = [];
      s.player.hp = 100;
      s.player.invulnerable = 0;
      s.buffs = {};
      d.run.effects.length = 0;
      s.enemies = [
        {
          id: 85000,
          x: p.x + 10,
          y: p.y,
          hp: 1000,
          maxHp: 1000,
          speed: 1,
          damage: 10,
          special: false,
          kind: "walker",
          streak: 0,
          lastHit: 0,
        },
      ];
      for (let i = 0; i < 4; i++) d.run.step(1 / 30);
      d.syncPlayer();
      d.run.pause();
      d.lastPhase = "";
      d.update(421000, 0);
      d.ui.resume();
      return {
        hp: s.player.hp,
        stalePetVisible: d.petImage?.visible ?? false,
        charges: s.shield.charges,
        recharge: s.shield.recharge,
        pushed: s.enemies[0].x > p.x + 25,
        wave: d.run.effects.some(
          (e) => e.weapon === "orbiting-shield" && e.radius > 90,
        ),
        hud: document.querySelector(".dungeon-buffs")?.textContent,
        icons: d.orbitals.filter(
          (img) => img.visible && img.frame.name === "orbiting-shield",
        ).length,
      };
    });
    check(
      "Escudo absorve contato, emite onda, mostra cargas e recarga sem girar",
      !shield.stalePetVisible &&
        shield.hp === 100 &&
        shield.charges === 1 &&
        shield.recharge > 0 &&
        shield.pushed &&
        shield.wave &&
        shield.icons === 2 &&
        shield.hud.includes("1/2 cargas"),
      shield,
    );
    await render();
    await page.screenshot({ path: out + "/escudo-choque.png" });
    const exhausted = await page.evaluate(() => {
      d.run.resume();
      const s = d.run.state,
        p = s.player;
      for (let i = 0; i < 2; i++) {
        s.player.invulnerable = 0;
        s.enemies[0].x = p.x + 10;
        s.enemies[0].y = p.y;
        d.run.step(1 / 30);
      }
      return { hp: s.player.hp, charges: s.shield.charges };
    });
    check(
      "Barreira absorve dois golpes e permite dano quando as cargas acabam",
      exhausted.hp < 100 && exhausted.hp >= 90 && exhausted.charges === 0,
      exhausted,
    );
    await page.evaluate(() => {
      d.run.restore(window.remainingRestore);
      d.syncPlayer();
      d.lastPhase = "";
      d.update(422000, 0);
    });
    if (process.env.DUNGEON_PLAYTHROUGH_DIR) {
      await page.evaluate(() => {
        window.longSessionRestore = d.run.snapshot();
      });
      for (const name of [
        "abandoned-central-square-assault-1234567",
        "mall-parking-assault-1234567",
      ]) {
        const snapshot = JSON.parse(
          fs.readFileSync(
            process.env.DUNGEON_PLAYTHROUGH_DIR +
              "/" +
              name +
              "-late-save.json",
            "utf8",
          ),
        );
        const observed = await page.evaluate(async (snapshot) => {
          const { DungeonWorld } = await import("/src/dungeons/world.ts");
          const { loadSave } = await import("/src/systems/save.ts");
          d.world.destroy();
          d.world = new DungeonWorld(d, snapshot.dungeon);
          d.run.restore(snapshot);
          d.run.pause();
          d.syncPlayer();
          d.lastPhase = "";
          d.update(430000, 0);
          d.ui.resume();
          d.cameras.main
            .stopFollow()
            .setZoom(1.3)
            .centerOn(d.player.x, d.player.y);
          const frozen = d.run.state.elapsed;
          d.update(431000, 200);
          const saved = d.persist(),
            loaded = loadSave();
          return {
            elapsed: d.run.state.elapsed,
            round: d.run.state.round,
            level: d.run.state.level,
            enemies: d.run.state.enemies.length,
            weapons: d.run.state.weapons,
            paused: d.run.state.elapsed === frozen,
            saved,
            restored:
              loaded?.dungeonRun?.elapsed === frozen &&
              loaded?.dungeonRun?.id === snapshot.id,
          };
        }, snapshot);
        check(
          "Estado avançado real renderiza, pausa e salva: " + name,
          observed.paused &&
            observed.saved &&
            observed.restored &&
            observed.level > 20,
          observed,
        );
        await render();
        await page.screenshot({ path: out + "/" + name + "-real.png" });
      }
      await page.evaluate(async () => {
        const { DungeonWorld } = await import("/src/dungeons/world.ts");
        d.world.destroy();
        d.world = new DungeonWorld(d, window.longSessionRestore.dungeon);
        d.run.restore(window.longSessionRestore);
        d.syncPlayer();
        d.lastPhase = "";
        d.update(432000, 0);
      });
    }
    const weaponChoice = await page.evaluate(() => {
      window.cardFeatureRestore = d.run.snapshot();
      window.originalRunRandom = d.run.random;
      const s = d.run.state;
      s.phase = "fighting";
      s.level = 9;
      s.xp = 0;
      s.weapons = ["sword"];
      s.levels = {};
      s.cards = [];
      d.run.grantXP(d.run.xpNeeded);
      d.lastPhase = "";
      d.update(440000, 0);
      return {
        level: s.level,
        kinds: s.cards.map((c) => c.kind),
        ids: s.cards.map((c) => c.id),
      };
    });
    check(
      "Nível 10 oferece três armas aleatórias distintas, sem melhorias misturadas",
      weaponChoice.level === 10 &&
        weaponChoice.kinds.every((k) => k === "arsenal") &&
        new Set(weaponChoice.ids).size === 3 &&
        !weaponChoice.ids.includes("sword"),
      weaponChoice,
    );
    await page.screenshot({ path: out + "/armas-nivel-10.png" });
    const descriptions = await page.locator(".dungeon-cards button p").allTextContents();
    check("Cartas de armas mostram três descrições próprias de funcionamento", descriptions.length === 3 && new Set(descriptions).size === 3 && descriptions.every(t => t.length > 30 && !t.includes("Desbloqueia uma arma")), descriptions);
    const newCards = await page.evaluate(async () => {
      const { UPGRADES } = await import("/src/dungeons/upgrades.ts");
      const s = d.run.state;
      s.phase = "choice";
      s.cards = ["advanced-xp", "advanced-attack", "boss-damage"].map((id) => {
        const u = UPGRADES.find((u) => u.id === id);
        return {
          kind: "upgrade",
          id,
          name: u.name,
          effect: u.effect,
          rarity: u.rarity,
          level: 0,
          max: u.max,
        };
      });
      d.lastPhase = "";
      d.update(441000, 0);
      return s.cards.map((c) => ({ id: c.id, rarity: c.rarity, max: c.max }));
    });
    check(
      "Três novas cartas mostram raridade super-rara e quatro melhorias",
      newCards.length === 3 &&
        newCards.every((c) => c.rarity === "super-rare" && c.max === 4),
      newCards,
    );
    await page.screenshot({ path: out + "/novas-cartas-super-raras.png" });
    await page.locator('[data-card="advanced-xp"]').click();
    check(
      "Escolher experiência super-rara aplica somente um nível",
      await page.evaluate(() => d.run.level("advanced-xp") === 1),
    );
    await page.evaluate(() => {
      d.ui.resume();
      const s = d.run.state,
        p = s.player;
      s.phase = "paused";
      s.cards = [];
      s.weapons = ["sword"];
      s.levels = { "advanced-attack": 4 };
      s.enemies = [];
      s.pet = undefined;
      s.projectiles = [];
      s.pendingAttacks = [];
      s.buffs = {};
      d.run.impacts.length = 0;
      d.run.effects.length = 0;
      s.pickups = [
        { id: 81000, x: p.x + 90, y: p.y - 30, kind: "critical", amount: 0 },
        { id: 81001, x: p.x + 140, y: p.y + 30, kind: "magnet", amount: 0 },
        { id: 81002, x: p.x + 500, y: p.y, kind: "xp", amount: 4 },
      ];
      d.syncPlayer();
      d.lastPhase = "";
      d.update(442000, 0);
      d.ui.resume();
    });
    await render();
    await page.screenshot({ path: out + "/bonus-no-mapa.png" });
    const bonuses = await page.evaluate(async () => {
      const s = d.run.state,
        p = s.player;
      for (const pickup of s.pickups)
        if (pickup.kind !== "xp") {
          pickup.x = p.x;
          pickup.y = p.y;
        }
      s.cooldowns.sword = 1;
      d.run.resume();
      d.run.step(1 / 30);
      s.cooldowns.sword = 0;
      s.enemies = [
        {
          id: 82000,
          x: p.x + 30,
          y: p.y,
          hp: 1000,
          maxHp: 1000,
          speed: 1,
          damage: 0,
          special: false,
          kind: "walker",
          streak: 0,
          lastHit: 0,
        },
      ];
      d.run.random = () => 0.1;
      d.run.step(1 / 30);
      d.run.pause();
      d.syncPlayer();
      d.lastPhase = "";
      d.update(443000, 0);
      d.ui.resume();
      const { loadSave } = await import("/src/systems/save.ts");
      const saved = d.persist(),
        loaded = loadSave();
      return {
        critical: s.buffs.critical > s.elapsed,
        hit: d.run.impacts.some((h) => h.critical),
        magnet: s.pickups.some((p) => p.kind === "xp" && p.attracted),
        hud: document.querySelector(".dungeon-buffs")?.textContent,
        saved:
          saved &&
          loaded?.dungeonRun?.buffs.critical === s.buffs.critical &&
          loaded.dungeonRun.pickups.some((p) => p.attracted),
      };
    });
    check(
      "Bônus de crítico e ímã são coletados, identificados e salvos",
      bonuses.critical &&
        bonuses.hit &&
        bonuses.magnet &&
        bonuses.saved &&
        bonuses.hud.includes("Crítico 20%"),
      bonuses,
    );
    await render();
    await page.screenshot({ path: out + "/bonus-ativos.png" });
    await page.evaluate(() => {
      d.run.restore(window.cardFeatureRestore);
      d.run.random = window.originalRunRandom;
      d.syncPlayer();
      d.lastPhase = "";
      d.update(444000, 0);
    });
    const bosses = await page.evaluate(() => {
      window.bossFixtureRestore = d.run.snapshot();
      const rows = [];
      for (const round of [10, 20, 30, 40, 50]) {
        const s = d.run.state;
        s.phase = "fighting";
        s.round = round;
        s.bossRound = undefined;
        s.waveRemaining = 5 + round * 2;
        s.spawnClock = 0;
        s.intermission = 0;
        s.enemies = [];
        s.player.invulnerable = 1;
        d.run.step(1 / 30);
        const boss = s.enemies.find((e) => e.kind === "boss");
        rows.push({
          round,
          hp: boss?.maxHp,
          damage: boss?.damage,
          count: s.enemies.filter((e) => e.kind === "boss").length,
        });
      }
      d.run.pause();
      d.syncPlayer();
      d.lastPhase = "";
      d.update(450000, 0);
      d.ui.resume();
      const p = d.run.state.player,
        b = d.run.state.enemies.find((e) => e.kind === "boss");
      d.cameras.main
        .stopFollow()
        .setZoom(1.1)
        .centerOn((p.x + b.x) / 2, (p.y + b.y) / 2);
      return {
        rows,
        label: document.querySelector(".dungeon-boss")?.textContent,
      };
    });
    check(
      "Chefes aparecem uma vez nas rodadas 10/20/30/40/50 com força crescente",
      bosses.rows.every(
        (r, i) =>
          r.count === 1 &&
          (!i ||
            (r.hp > bosses.rows[i - 1].hp &&
              r.damage > bosses.rows[i - 1].damage)),
      ),
      bosses,
    );
    check(
      "Chefe final tem salto de vida e dano e barra identificada",
      bosses.rows[4].hp > bosses.rows[3].hp * 1.9 &&
        bosses.rows[4].damage > bosses.rows[3].damage * 1.9 &&
        bosses.label.includes("O Devorador"),
      bosses.rows,
    );
    await render();
    await page.screenshot({ path: out + "/chefe-final-rodada-50.png" });
    const bossSaved = await page.evaluate(async () => {
      const { loadSave } = await import("/src/systems/save.ts");
      const saved = d.persist(),
        loaded = loadSave();
      const before = d.run.state.enemies.find((e) => e.kind === "boss").hp;
      d.run.restore(loaded.dungeonRun);
      d.run.resume();
      d.run.step(1 / 30);
      d.run.pause();
      return {
        saved,
        count: d.run.state.enemies.filter((e) => e.kind === "boss").length,
        hp: d.run.state.enemies.find((e) => e.kind === "boss").hp,
        before,
        round: d.run.state.bossRound,
      };
    });
    check(
      "Salvar e retomar preserva o chefe da rodada 50 sem duplicação",
      bossSaved.saved &&
        bossSaved.count === 1 &&
        bossSaved.round === 50 &&
        bossSaved.hp === bossSaved.before,
      bossSaved,
    );
    await page.evaluate(() => {
      d.run.restore(window.bossFixtureRestore);
      d.syncPlayer();
      d.lastPhase = "";
      d.update(451000, 0);
    });
    await page.evaluate(() => { window.bossArtRestore = d.run.snapshot(); });
    for (const [round, art, kind] of [
      [10, "demolisher", "slam"], [20, "sentinel", "charge"],
      [30, "chained", "chains"], [40, "contaminated", "plague"],
      [50, "devourer", "charge"],
    ]) {
      const identity = await page.evaluate(async ({round, art}) => {
        const { validDungeonSnapshot } = await import("/src/dungeons/snapshot.ts");
        d.run.restore(window.bossArtRestore);
        const s = d.run.state;
        s.round = round; s.bossRound = round; s.waveRemaining = 0;
        s.weapons = ["sword"]; s.levels = {}; s.cooldowns = { sword: 30 };
        s.player = {x: 1536, y: 1240, hp: 100, invulnerable: 0};
        s.pet = undefined; s.buffs = {}; s.pickups = []; s.projectiles = [];
        s.phase = "fighting"; s.cards = []; s.pendingAttacks = [];
        s.enemies = [{id: 999999, x: 1536, y: 1152, hp: 3000, maxHp: 3000,
          speed: 30, damage: 20, kind: "boss", special: true, streak: 0,
          lastHit: 0, boss: {cooldown: 0, sequence: 0}}];
        d.run.step(1 / 30); d.run.pause(); d.lastPhase = "paused";
        d.syncPlayer(); d.renderRun(); d.ui.resume(); d.ui.update(d.run);
        d.cameras.main.stopFollow().setZoom(2.2).centerOn(1536, 1180);
        return { texture: d.enemyImages.get(999999).texture.key,
          frames: game.textures.get("dungeon-boss-" + art).getFrameNames().length,
          frame: d.enemyImages.get(999999).frame.name,
          action: s.enemies[0].boss.action, hp: s.player.hp,
          label: document.querySelector(".dungeon-boss").textContent,
          valid: validDungeonSnapshot(d.run.snapshot()) };
      }, {round, art});
      check("Chefe " + round + " usa arte própria, caminhada e aviso inofensivo", identity.texture === "dungeon-boss-" + art && identity.frames === (round === 50 ? 28 : 20) && identity.frame === "idle-south" && identity.action.kind === kind && identity.action.stage === "warning" && identity.hp === 100 && identity.valid, identity);
      await render();
      await page.screenshot({path: out + "/chefe-" + round + "-aviso.png"});
      const active = await page.evaluate(async () => {
        const { validDungeonSnapshot } = await import("/src/dungeons/snapshot.ts");
        d.run.resume();
        for (let i = 0; i < 70 && d.run.state.enemies[0].boss.action.stage === "warning"; i++) d.run.step(1 / 30);
        d.run.pause();
        const before = d.run.snapshot(); d.run.restore(before);
        const preserved = JSON.stringify(d.run.snapshot()) === JSON.stringify(before);
        d.syncPlayer(); d.renderRun(); d.ui.update(d.run);
        return {stage: d.run.state.enemies[0].boss.action.stage, preserved, valid: validDungeonSnapshot(d.run.snapshot())};
      });
      check("Golpe ativo do chefe " + round + " preserva estado ao retomar", active.stage === "active" && active.preserved && active.valid, active);
      await render();
      await page.screenshot({path: out + "/chefe-" + round + "-ativo.png"});
      if (round <= 50) {
        const directions = await page.evaluate(async (art) => {
          const {DUNGEON_ART} = await import("/src/dungeons/art.ts");
          const animation = DUNGEON_ART["boss-" + art].animation;
          const s = d.run.state, e = s.enemies[0], elapsed = s.elapsed;
          e.boss = {cooldown: 10, sequence: 0};
          return [["south",0,160],["west",-160,0],["east",160,0],["north",0,-160]].map(([direction,dx,dy]) => {
            s.player.x = e.x + dx; s.player.y = e.y + dy;
            const frames = [];
            for (let i = 0; i < animation.walkFrames; i++) {
              s.elapsed = i / animation.frameRate; d.renderRun();
              const image = d.enemyImages.get(e.id);
              frames.push({frame:image.frame.name, scale:image.scaleY, originX:image.originX, originY:image.originY});
            }
            s.elapsed = elapsed;
            return {direction,frames,count:animation.walkFrames};
          });
        }, art);
        check(({10:"Demolidor",20:"Sentinela",30:"Acorrentado",40:"Contaminado",50:"Devorador"}[round]) + " usa quatro lados, os frames recebidos e escala fixa na caminhada", directions.every(d => new Set(d.frames.map(f => f.frame)).size === d.count && d.frames.every(f => f.frame.startsWith(d.direction + "-") && Math.abs(f.scale - (round === 50 ? 112 : 94)/184) < 0.0001 && f.originX === 0.5 && f.originY > 0.85) && new Set(d.frames.map(f => f.originY)).size === 1), directions);
      }
    }
    await page.evaluate(() => {
      d.run.restore(window.bossArtRestore); d.syncPlayer();
      d.lastPhase = ""; d.update(459000, 0);
    });
    const xpDrops = await page.evaluate(() => {
      window.xpDropRestore=d.run.snapshot();const s=d.run.state,p=s.player;
      s.pickups=[{id:900001,x:p.x-90,y:p.y-50,kind:"xp",amount:4,xpTier:"normal"},
       {id:900002,x:p.x-30,y:p.y-50,kind:"xp",amount:6,xpTier:"elite"},
       {id:900003,x:p.x+30,y:p.y-50,kind:"xp",amount:8,xpTier:"boss"},
       {id:900004,x:p.x+90,y:p.y-50,kind:"level",amount:1}];
      d.renderRun();d.cameras.main.stopFollow().setZoom(2).centerOn(p.x,p.y);
      return s.pickups.map(q=>({kind:q.kind,tier:q.xpTier,amount:q.amount}));
    });
    check("Drops de XP por categoria e item de um nível renderizam",xpDrops.length===4 && xpDrops[3].kind==="level" && xpDrops[3].amount===1,xpDrops);
    await page.evaluate(()=>d.ui.resume());
    await render();await page.screenshot({path:out+"/drops-xp-e-nivel.png"});
    await page.evaluate(()=>{d.run.restore(window.xpDropRestore);d.renderRun();});
    const zombieArt = await page.evaluate(() => {
      window.zombieArtRestore=d.run.snapshot();const s=d.run.state;
      s.enemies=[0,1,2].map(i=>({id:120003+i,x:1456+i*80,y:1152,hp:100,maxHp:100,speed:30,damage:8,kind:"walker",special:false,streak:0,lastHit:0}));
      s.pickups=[];s.projectiles=[];s.player.x=1536;s.player.y=1320;
      const rows=[];
      for(const e of s.enemies) {
        for(const [direction,dx,dy] of [["south",0,160],["west",-160,0],["east",160,0],["north",0,-160]]) {
          s.player.x=e.x+dx;s.player.y=e.y+dy;const frames=[];
          for(let i=0;i<4;i++){s.elapsed=i/5;d.renderRun();const img=d.enemyImages.get(e.id);frames.push({frame:img.frame.name,scale:img.scaleY,origin:img.originY,texture:img.texture.key});}
          rows.push({id:e.id,direction,frames});
        }
      }
      s.player.x=1536;s.player.y=1320;s.elapsed=0;d.renderRun();d.ui.resume();d.ui.update(d.run);
      d.cameras.main.stopFollow().setZoom(2.2).centerOn(1536,1200);return rows;
    });
    check("Três aparências de zumbi caminham nos quatro lados com escala e âncora estáveis",zombieArt.every(r=>new Set(r.frames.map(f=>f.frame)).size===4 && r.frames.every(f=>f.frame.startsWith(r.direction+"-")) && new Set(r.frames.map(f=>f.scale)).size===1 && new Set(r.frames.map(f=>f.origin)).size===1) && new Set(zombieArt.flatMap(r=>r.frames.map(f=>f.texture))).size===3,zombieArt);
    await render();await page.screenshot({path:out+"/zumbis-variados.png"});
    await page.evaluate(()=>{d.run.restore(window.zombieArtRestore);d.renderRun();d.ui.update(d.run);});
    const timedBosses = await page.evaluate(async () => {
      const {TIMED_BOSS_SCHEDULE} = await import("/src/dungeons/bosses.ts");
      const {validDungeonSnapshot} = await import("/src/dungeons/snapshot.ts");
      const before=d.run.snapshot(), rows=[];
      for(const [i,b] of TIMED_BOSS_SCHEDULE.entries()) {
        d.run.restore(before); const s=d.run.state;
        s.dungeon="abandoned-central-square";s.phase="fighting";s.elapsed=b.at;
        s.timedBossCount=i;s.enemies=[];s.spawnClock=20;
        d.run.step(1/30);d.run.pause();d.renderRun();d.ui.update(d.run);
        const boss=s.enemies.find(e=>e.kind==="boss");
        rows.push({tier:boss?.bossTier,count:s.timedBossCount,valid:validDungeonSnapshot(d.run.snapshot()),
          texture:boss?d.enemyImages.get(boss.id).texture.key:null,label:document.querySelector(".dungeon-boss")?.textContent});
      }
      d.run.restore(before);d.renderRun();d.ui.update(d.run);return rows;
    });
    check("Chefes distintos aparecem aos 3/6/9/12/14 minutos com identidade e checkpoint",timedBosses.every((r,i)=>r.tier===(i+1)*10 && r.count===i+1 && r.valid && r.texture?.startsWith("dungeon-boss-") && r.label?.length>0),timedBosses);
    const postCards = await page.evaluate(async () => {
      const {UPGRADES} = await import("/src/dungeons/upgrades.ts");
      const {validDungeonSnapshot} = await import("/src/dungeons/snapshot.ts");
      const before = d.run.snapshot(), s = d.run.state;
      s.weapons=["sword","bow","hammer","spear"]; s.pet=undefined; s.levels={};
      for(const u of UPGRADES) if(!u.pet && (!u.weapon || s.weapons.includes(u.weapon))) s.levels[u.id]=u.max;
      s.level=500; s.xp=0; s.player.hp=50; s.phase="fighting";s.cards=[];
      d.run.grantXP(d.run.xpNeeded*3+7);
      d.ui.update(d.run);
      const result={level:s.level,hp:s.player.hp,cards:s.cards.length,phase:s.phase,xp:s.xp,
        valid:validDungeonSnapshot(d.run.snapshot()),hud:document.querySelector(".hud-experience").textContent};
      d.run.restore(before);d.ui.update(d.run);return result;
    });
    check("Níveis continuam após concluir as cartas, sem cura ou escolhas vazias",postCards.level>500 && postCards.hp===50 && postCards.cards===0 && postCards.phase==="fighting" && postCards.valid && postCards.hud.includes(String(postCards.level)),postCards);
    const hudLayout = await page.evaluate(() => {
      window.hudLayoutRestore = d.run.snapshot();
      d.run.state.phase = "paused";
      d.lastPhase = "";
      d.update(460000, 0);
      d.ui.resume();
      const nodes = [
        ".hud-experience",
        ".hud-clock",
        ".hud-health",
        ".hud-arsenal",
        ".hud-pet",
      ].map((selector) => {
        const r = document.querySelector(selector).getBoundingClientRect();
        return { selector, x: r.x, y: r.y, w: r.width, h: r.height };
      });
      const center = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      return {
        nodes,
        centerClear: !center?.closest(".dungeon-hud"),
        viewport: { w: innerWidth, h: innerHeight },
      };
    });
    check(
      "HUD mantém experiência, relógio, vida, Arsenal e pet nas bordas sem bloquear o centro",
      hudLayout.centerClear &&
        hudLayout.nodes.every(
          (r) =>
            r.x >= 0 &&
            r.y >= 0 &&
            r.x + r.w <= hudLayout.viewport.w &&
            r.y + r.h <= hudLayout.viewport.h,
        ),
      hudLayout,
    );
    await render();
    await page.screenshot({ path: out + "/hud-ampla.png" });
    const xpBesideHealth = await page.evaluate(() => {
      const xp = document.querySelector(".hud-experience").getBoundingClientRect();
      const hp = document.querySelector(".hud-health").getBoundingClientRect();
      return { beside: xp.x >= hp.right && Math.abs(xp.bottom - hp.bottom) < 1, bottom: xp.y > innerHeight / 2, level: document.querySelector(".hud-experience").textContent.includes("NÍVEL") };
    });
    check("Experiência e nível ao lado da vida na parte inferior", xpBesideHealth.beside && xpBesideHealth.bottom && xpBesideHealth.level, xpBesideHealth);

    for (const [width, height] of [
      [680, 950],
      [521, 900],
      [390, 844],
    ]) {
      await page.setViewportSize({ width, height });
      const narrow = await page.evaluate(() => {
        const selectors = [
          ".hud-health",
          ".hud-experience",
          ".hud-arsenal",
          ".hud-pet",
          ".hud-clock",
          ".hud-pause",
        ];
        return selectors.map((selector) => {
          const r = document.querySelector(selector).getBoundingClientRect();
          return {
            selector,
            x: r.x,
            y: r.y,
            right: r.right,
            bottom: r.bottom,
            w: innerWidth,
            h: innerHeight,
          };
        });
      });
      check(
        "HUD cabe na tela de " + width + " pixels",
        narrow.every(
          (r) =>
            r.x >= 0 &&
            r.y >= 0 &&
            r.right <= r.w + 0.5 &&
            r.bottom <= r.h + 0.5,
        ),
        narrow,
      );
      await render();
      await page.screenshot({ path: out + "/hud-" + width + ".png" });
    }
    await page.setViewportSize({ width: 1600, height: 1200 });
    await page.evaluate(() => {
      d.run.restore(window.hudLayoutRestore);
      d.syncPlayer();
      d.lastPhase = "";
      d.update(461000, 0);
    });
    const victory = await page.evaluate(() => {
      window.realSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function () {
        throw new Error("QA storage full");
      };
      d.run.resume();
      d.run.state.round = 50;
      d.run.state.bossRound = 50; // Cleared-boss fixture; boss lifecycle is checked separately.
      d.run.state.waveRemaining = 0;
      d.run.state.enemies = [];
      d.run.state.intermission = 0;
      d.run.state.pickups = []; // Isolate result-storage failure from final loot collection.
      d.run.step(1 / 30);
      d.lastPhase = "";
      d.update(320000, 0);
      return { phase: d.run.state.phase, settled: d.settled };
    });
    check(
      "Falha de armazenamento mantém o resultado disponível para tentar novamente",
      victory.phase === "victory" && !victory.settled,
      victory,
    );
    await page.evaluate(() => {
      Storage.prototype.setItem = window.realSetItem;
    });
    await page.locator("[data-retry]").click();
    check(
      "Repetir o salvamento entrega o resultado uma vez",
      await page.evaluate(
        () =>
          d.settled &&
          d.state.dungeons.recentResults.filter((id) => id === d.run.state.id)
            .length === 1,
      ),
    );
    await page.screenshot({ path: out + "/resultado.png" });
    await page
      .getByRole("button", { name: "Voltar ao ponto de acesso" })
      .click();
    await page.evaluate(() => game.loop.wake());
    await page.waitForFunction(
      () =>
        game.scene.isActive("AcessoCidade") &&
        document.querySelector("#ui")?.dataset.area === "cityForest",
    );
    const forage = await page.evaluate(() => {
      const f = game.scene.getScene("AcessoCidade");
      game.loop.sleep();
      const c = f.companion;
      f.player.x = 28.5 * 32;
      f.player.y = 56.5 * 32;
      f.player.update(
        0,
        () => false,
        () => false,
        false,
      );
      c.update(0.01, f.player);
      c.image.setPosition(f.player.x, f.player.y);
      const before = f.state.inventory.branch;
      c.update(0.01, f.player);
      const gained = f.state.inventory.branch - before;
      c.update(0.01, f.player);
      return {
        companion: !!c,
        gained,
        once: f.state.inventory.branch - before === 1,
        day: f.state.dungeons.petForageDay === f.state.day,
      };
    });
    check(
      "Pet segue para a floresta e auxilia na coleta uma vez por dia",
      forage.companion && forage.gained === 1 && forage.once && forage.day,
      forage,
    );
    await page.evaluate(() => {
      const f = game.scene.getScene("AcessoCidade");
      f.paused = true;
      f.cameras.main
        .removeBounds()
        .stopFollow()
        .setZoom(1.8)
        .centerOn(f.player.x, f.player.y - 80);
      game.step(900000, 0);
      game.step(900001, 0);
    });
    await page.screenshot({ path: out + "/pet-na-floresta.png" });
    await page.evaluate(() => {
      const f = game.scene.getScene("AcessoCidade");
      f.player.x = 720;
      f.player.y = 80;
      f.player.update(
        0,
        () => false,
        () => false,
        false,
      );
      f.paused = false;
      game.loop.wake();
    });
    await page.keyboard.press("e");
    await page.waitForSelector("[data-evolution]");
    await page.locator("[data-evolution]").click();
    await page.locator('[data-attribute="strength"]').click();
    await page
      .locator('[data-pet-id="qa-dog"][data-pet-attribute="speed"]')
      .click();
    const permanent = await page.evaluate(async () => {
      const { loadSave } = await import("/src/systems/save.ts");
      const s = loadSave();
      return {
        strength: s.dungeons.attributes.strength,
        petSpeed: s.dungeons.pets.find((p) => p.id === "qa-dog").attributes
          .speed,
      };
    });
    check(
      "Árvores permanentes do personagem e pet são salvas pela interface",
      permanent.strength === 1 && permanent.petSpeed === 1,
      permanent,
    );
    await page.screenshot({ path: out + "/evolucao-permanente.png" });
    await page.getByRole("button", { name: "Voltar às expedições" }).click();
    await page.locator('[data-start="abandoned-central-square"]').click();
    const defeat = await page.evaluate(() => {
      window.d = game.scene.getScene("Dungeons");
      game.loop.sleep();
      const p = d.run.state.player;
      p.hp = 1;
      d.run.state.enemies = [
        {
          id: 90000,
          x: p.x + 5,
          y: p.y,
          hp: 20,
          maxHp: 20,
          speed: 1,
          damage: 20,
          special: false,
          kind: "walker",
          streak: 0,
          lastHit: 0,
        },
      ];
      d.update(1000000, 100);
      return { phase: d.run.state.phase, settled: d.settled };
    });
    check(
      "Derrota encerra o combate e registra o resultado",
      defeat.phase === "defeat" && defeat.settled,
      defeat,
    );
    await page.screenshot({ path: out + "/derrota.png" });
    await page
      .getByRole("button", { name: "Voltar ao ponto de acesso" })
      .click();
    await page.evaluate(() => game.loop.wake());
    await page.waitForFunction(
      () =>
        game.scene.isActive("AcessoCidade") &&
        document.querySelector("#ui")?.dataset.area === "cityForest",
    );
    check(
      "Retorno após derrota preserva a posição da estrada",
      await page.evaluate(() => {
        const f = game.scene.getScene("AcessoCidade");
        return f.player.x === 720 && f.player.y === 80;
      }),
    );
    check(
      "Sem erros JavaScript, HTTP ou WebGL",
      errors.length === 0 &&
        (await page.evaluate(() => game.renderer.gl.getError())) === 0,
      errors,
    );
    console.log("PASS", checks.length, "checks");
  } catch (e) {
    await page.screenshot({ path: out + "/falha.png" });
    throw e;
  } finally {
    fs.writeFileSync(
      out + "/validacao.json",
      JSON.stringify({ checks, errors }, null, 2),
    );
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
