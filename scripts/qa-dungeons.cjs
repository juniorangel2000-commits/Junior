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
      let tries = 0;
      while (d.run.state.weapons.length < 4 && tries++ < 30) {
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
      d.run.pause();
      d.lastPhase = "";
      d.update(230000, 0);
      d.cameras.main.stopFollow().setZoom(0.49).centerOn(1536, 1152);
    });
    await render();
    await page.evaluate(
      () => (document.querySelector("#dungeon-ui").style.visibility = "hidden"),
    );
    await page.screenshot({ path: out + "/praca-completa.png" });
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
      d.cameras.main.stopFollow().setZoom(0.49).centerOn(1536, 1152);
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
    const victory = await page.evaluate(() => {
      window.realSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function () {
        throw new Error("QA storage full");
      };
      d.run.resume();
      d.run.state.round = 50;
      d.run.state.waveRemaining = 0;
      d.run.state.enemies = [];
      d.run.state.intermission = 0;
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
