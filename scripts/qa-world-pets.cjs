const { chromium } = require("playwright"),
  fs = require("node:fs"),
  assert = require("node:assert/strict");
const out = process.env.DUNGEON_QA_OUTPUT || "/workspace/after-rain-pets-world";
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
      window.petAPI = await import("/src/dungeons/world-pet-controller.ts");
      window.active = game.scene.getScene("Vale");
      game.loop.sleep();
    });
    const openMenu = async () => {
      await page.locator(".toolbar-handle").click();
      await page.locator('[data-toolbar-action="pets"]').click();
      await page.waitForSelector(".pet-menu");
    };
    const closeMenu = () => page.locator("[data-pet-close]").click();
    const sync = () =>
      page.evaluate(() => {
        window.controller = petAPI.getWorldPetController(active);
        controller.update(0);
      });
    const presence = () =>
      page.evaluate(() => {
        const c = petAPI.getWorldPetController(active),
          s = active.state;
        return {
          selected: s.dungeons?.selectedPet,
          visible: c?.companion?.image.visible ?? false,
          texture: c?.companion?.image.texture.key,
          frame: c?.companion?.image.frame.name,
          alpha: c?.companion?.image.texture.getSourceImage().getContext("2d").getImageData(0,0,1,1).data[3],
          world: structuredClone(
            s.dungeons?.pets.find((p) => p.id === s.dungeons.selectedPet)
              ?.world,
          ),
          count: active.children.list.filter(
            (o) => o.getData?.("world-companion") && o.visible,
          ).length,
        };
      });
    const selectScene = async (key, area) => {
      await page.waitForFunction(
        ({ key, area }) =>
          game.scene.isActive(key) &&
          document.querySelector("#ui")?.dataset.area === area,
        { key, area },
      );
      await page.evaluate((key) => {
        window.active = game.scene.getScene(key);
        game.loop.sleep();
      }, key);
      await sync();
    };
    await openMenu();
    check(
      "Menu explica como resgatar o primeiro pet",
      (await page.locator(".pet-menu").innerText()).includes(
        "ainda não resgatou",
      ),
    );
    await closeMenu();
    await page.evaluate(async () => {
      const { createDungeonProgress } =
        await import("/src/dungeons/progression.ts");
      const p = createDungeonProgress();
      for (const species of ["cat", "dog"])
        p.pets.push({
          id: "qa-" + species,
          species,
          rare: false,
          xp: 0,
          attributes: {
            speed: 0,
            resistance: 0,
            perception: 0,
            protection: 0,
            efficiency: 0,
          },
        });
      p.selectedPet = "qa-cat";
      active.state.dungeons = p;
      active.persist();
      petAPI.getWorldPetController(active).update(0);
    });
    let pet = await presence();
    check(
      "Gato usa a nova sprite na propriedade",
      pet.visible &&
        pet.texture === "dungeon-pet-cat" && pet.alpha === 0 &&
        pet.world.area === "property" &&
        pet.count === 1,
      pet,
    );
    await openMenu();
    await page.screenshot({ path: out + "/menu-companheiros.png" });
    await page.locator('[data-pet-select="qa-dog"]').click();
    await closeMenu();
    pet = await presence();
    check(
      "Selecionar cachorro troca o companheiro sem duplicar sprites",
      pet.visible && pet.texture === "dungeon-pet-dog" && pet.count === 1,
      pet,
    );
    const followed = await page.evaluate(() => {
      const c = petAPI.getWorldPetController(active),
        ctx = c.context(),
        image = c.companion.image,
        before = { x: image.x, y: image.y };
      let goal;
      for (let i = 0; i < 16 && !goal; i++) {
        const angle = (i * Math.PI) / 8,
          x = before.x + Math.cos(angle) * 112,
          y = before.y + Math.sin(angle) * 112;
        let clear = true;
        for (let j = 0; j <= 16; j++)
          if (
            ctx.blockedPoint(
              before.x + ((x - before.x) * j) / 16,
              before.y + ((y - before.y) * j) / 16,
            )
          )
            clear = false;
        if (clear) goal = { x, y };
      }
      if (!goal) throw new Error("Fixture has no clear walking corridor");
      active.player.x = goal.x;
      active.player.y = goal.y;
      let collision = false;
      for (let i = 0; i < 30; i++) {
        c.update(0.1);
        collision ||= ctx.blockedPoint(image.x, image.y);
      }
      return {
        moved: Math.hypot(image.x - before.x, image.y - before.y),
        distance: Math.hypot(image.x - goal.x, image.y - goal.y),
        collision,
      };
    });
    check(
      "Pet circula perto do jogador respeitando o chão do mapa",
      followed.moved > 20 && followed.distance < 160 && !followed.collision,
      followed,
    );
    await openMenu();
    await page.locator('[data-pet-command="stay"]').click();
    await closeMenu();
    const waited = await page.evaluate(async () => {
      const c = petAPI.getWorldPetController(active),
        image = c.companion.image,
        before = { x: image.x, y: image.y };
      active.player.x += 50;
      for (let i = 0; i < 20; i++) c.update(0.1);
      const { loadSave } = await import("/src/systems/save.ts");
      return {
        same: image.x === before.x && image.y === before.y,
        mode: active.state.dungeons.pets[1].world.mode,
        stored: loadSave().dungeons.pets[1].world.mode,
      };
    });
    check(
      "Esperar mantém a posição e salva o comando",
      waited.same && waited.mode === "stay" && waited.stored === "stay",
      waited,
    );
    await page.evaluate(() => {
      active.enterVillage(active.snapshotState());
      game.loop.wake();
    });
    await selectScene("Vila", "village");
    pet = await presence();
    check(
      "Pet esperando na propriedade não é transportado para a vila",
      !pet.visible && pet.world.area === "property",
      pet,
    );
    await openMenu();
    check(
      "Menu mostra onde o pet ficou e bloqueia espera remota",
      (await page.locator('[data-pet-command="stay"]').isDisabled()) &&
        (await page.locator(".pet-menu").innerText()).includes("Propriedade"),
    );
    await page.locator('[data-pet-command="recall"]').click();
    await closeMenu();
    pet = await presence();
    check(
      "Chamar traz o pet para perto na vila",
      pet.visible &&
        pet.world.area === "village" &&
        pet.world.mode === "follow",
      pet,
    );
    await page.evaluate(()=>{active.cameras.main.stopFollow().setZoom(1.7).centerOn(1536,260);});
    await render();await page.screenshot({path:out+'/caminho-norte-pedra-terra.png'});
    await page.evaluate(()=>active.applyCamera());
    const rooms=await page.evaluate(()=>{
      const results=[];
      for(const id of ['augusto','rosa','tobias','amelia','nilo','celina','damiao','helena','icaro']){
        active.setMerchantRoom(id);const c=petAPI.getWorldPetController(active);c.update(0);
        results.push({id,visible:c.companion?.image.visible,space:active.state.dungeons.pets[1].world.space});
      }
      return results;
    });
    check('Pet acompanha em todos os nove comércios além da ferraria',rooms.every(r=>r.visible&&r.space==='shop:'+r.id),rooms);
    await page.evaluate(() => {
      active.setMerchantRoom("helena");
      petAPI.getWorldPetController(active).update(0);
    });
    pet = await presence();
    check(
      "Companheiro entra no interior de comércio",
      pet.visible && pet.world.space === "shop:helena" && pet.count === 1,
      pet,
    );
    await render();
    await page.screenshot({ path: out + "/pet-comercio.png" });
    await page.evaluate(() => {
      active.setMerchantRoom(undefined);
      active.setBlacksmithRoom(true);
      petAPI.getWorldPetController(active).update(0);
    });
    pet = await presence();
    check(
      "Companheiro também aparece na ferraria",
      pet.visible && pet.world.space === "blacksmith",
      pet,
    );
    await page.evaluate(() => {
      active.setBlacksmithRoom(false);
      active.leave();
      game.loop.wake();
    });
    await selectScene("Vale", "property");
    pet = await presence();
    check(
      "Companheiro retorna para a propriedade sem duplicação",
      pet.visible && pet.world.area === "property" && pet.count === 1,
      pet,
    );
    await page.evaluate(() => {
      active.enterHome();
      petAPI.getWorldPetController(active).update(0);
    });
    pet = await presence();
    check(
      "Companheiro acompanha o jogador dentro de casa",
      pet.visible && pet.world.space === "home",
      pet,
    );
    await openMenu();
    await page.locator('[data-pet-select="qa-cat"]').click();
    await page.locator('[data-pet-command="stay"]').click();
    await closeMenu();
    await page.evaluate(() => {
      const c = petAPI.getWorldPetController(active);
      for (let i = 0; i < 25; i++) c.update(0.1);
    });
    pet = await presence();
    check(
      "Gato usa a animação sentada ao esperar",
      pet.visible &&
        pet.world.mode === "stay" &&
        String(pet.frame).startsWith("rest-"),
      pet,
    );
    await render();
    await page.screenshot({ path: out + "/gato-esperando-em-casa.png" });
    await page.evaluate(() => {
      active.leaveHome();
      petAPI.getWorldPetController(active).update(0);
    });
    pet = await presence();
    check(
      "Gato deixado em casa permanece lá ao sair",
      !pet.visible && pet.world.space === "home",
      pet,
    );
    await openMenu();
    await page.locator('[data-pet-command="recall"]').click();
    await closeMenu();
    await page.evaluate(() => {
      active.enterForest(active.snapshotState());
      game.loop.wake();
    });
    await selectScene("Floresta", "forest");
    pet = await presence();
    check(
      "Pet segue para a Floresta Antiga com a nova arte",
      pet.visible &&
        pet.world.area === "forest" &&
        pet.texture === "dungeon-pet-cat",
      pet,
    );
    await page.evaluate(() => {
      active.leave();
      game.loop.wake();
    });
    await selectScene("Vale", "property");
    await page.evaluate(() => {
      active.enterVillage(active.snapshotState());
      game.loop.wake();
    });
    await selectScene("Vila", "village");
    await page.evaluate(() => {
      active.state.cityForestPosition = { x: 720, y: 80, direction: "up" };
      active.enterCityForest(true);
      game.loop.wake();
    });
    await selectScene("AcessoCidade", "cityForest");
    pet = await presence();
    check(
      "Pet acompanha na floresta de acesso",
      pet.visible && pet.world.area === "cityForest" && pet.count === 1,
      pet,
    );
    await openMenu();
    const rollback = await page.evaluate(() => {
      window.originalSetItem = Storage.prototype.setItem;
      window.petBeforeFailure = structuredClone(active.state.dungeons);
      Storage.prototype.setItem = function () {
        throw new Error("QA pet save failure");
      };
      return true;
    });
    await page.locator('[data-pet-command="stay"]').click();
    const rolledBack = await page.evaluate(() => {
      Storage.prototype.setItem = window.originalSetItem;
      return (
        JSON.stringify(active.state.dungeons) ===
        JSON.stringify(window.petBeforeFailure)
      );
    });
    check("Falha ao salvar desfaz o comando do pet", rollback && rolledBack);
    await closeMenu();
    await openMenu();
    await page.setViewportSize({ width: 360, height: 780 });
    const mobile = await page.locator(".pet-menu").evaluate((el) => {
      const r = el.getBoundingClientRect();
      return {
        left: r.left,
        right: r.right,
        width: innerWidth,
        overflow: el.scrollWidth > el.clientWidth + 1,
      };
    });
    check(
      "Menu de companheiros cabe na tela estreita",
      mobile.left >= 0 && mobile.right <= mobile.width + 1 && !mobile.overflow,
      mobile,
    );
    await page.screenshot({ path: out + "/menu-companheiros-estreito.png" });
    await page.setViewportSize({ width: 1600, height: 1200 });
    await closeMenu();
    await openMenu();
    await page.locator('[data-pet-select=""]').click();
    await closeMenu();
    pet = await presence();
    check(
      "Ficar sem companheiro remove a sprite",
      !pet.selected && !pet.visible && pet.count === 0,
      pet,
    );
    await openMenu();
    await page.locator('[data-pet-select="qa-cat"]').click();
    await closeMenu();
    await page.evaluate(() => {
      active.enterDungeons();
      game.loop.wake();
    });
    await page.waitForSelector('[data-start="abandoned-central-square"]');
    await page.locator('[data-start="abandoned-central-square"]').click();
    await page.evaluate(() => {
      window.d = game.scene.getScene("Dungeons");
      game.loop.sleep();
    });
    for (const species of ["cat", "dog"])
      for (const kind of ["basic", "special"]) {
        const result = await page.evaluate(
          async ({ species, kind }) => {
            const { DungeonRun } = await import("/src/dungeons/run.ts");
            const { validDungeonSnapshot } =
              await import("/src/dungeons/snapshot.ts");
            const r = new DungeonRun(
              "qa-pet-" + species + "-" + kind,
              "abandoned-central-square",
              d.state.dungeons,
              "qa-" + species,
            );
            d.run = r;
            const s = r.state,
              p = s.pet;
            s.spawnClock = 20;
            s.eventClock = 1000;
            s.cooldowns.sword = 30;
            p.attack = kind === "basic" ? 0 : 10;
            p.special = kind === "special" ? 0 : 10;
            s.enemies = [
              {
                id: 999999,
                x: p.x + 60,
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
            for (let i = 0; i < 17; i++) r.step(1 / 30);
            d.syncPlayer();
            d.renderRun();
            d.ui.resume();
            d.lastPhase = "fighting";
            d.ui.update(r);
            const frameBefore = d.petImage.frame.name,
              hpBefore = s.enemies[0].hp,
              snapshot = r.snapshot();
            r.pause();
            r.step(0.25);
            const frozen = r.state.pet.action.age === snapshot.pet.action.age;
            r.resume();
            r.restore(snapshot);
            r.step(1 / 30);
            d.renderRun();
            const hpAfter = s.enemies[0].hp;
            const actualAfter = r.state.enemies[0].hp,
              frameAfter = d.petImage.frame.name;
            const after = r.snapshot();
            r.restore(after);
            for (let i = 0; i < 3; i++) r.step(1 / 30);
            d.renderRun();
            return {
              texture: d.petImage.texture.key,
              frameBefore,
              frameAfter,
              hpBefore,
              hpAfter: actualAfter,
              once: r.state.enemies[0].hp === actualAfter,
              valid:
                validDungeonSnapshot(snapshot) && validDungeonSnapshot(after),
              frozen,
            };
          },
          { species, kind },
        );
        check(
          `${species} ${kind}: salto, dano no frame de contato, pausa e restauração`,
          result.texture === "dungeon-pet-" + species &&
            /-5$/.test(result.frameBefore) &&
            /-6$/.test(result.frameAfter) &&
            result.hpBefore === 1000 &&
            result.hpAfter < 1000 &&
            result.once &&
            result.valid &&
            result.frozen,
          result,
        );
        await render();
        await page.screenshot({ path: out + `/ataque-${species}-${kind}.png` });
      }
    for (const species of ["cat", "dog"]) {
      const rescued = await page.evaluate((species) => {
        d.run.state.pickups = [
          {
            id: 999998,
            x: d.run.state.player.x + 80,
            y: d.run.state.player.y,
            kind: "pet",
            amount: 0,
            species,
          },
        ];
        d.renderRun();
        return {
          texture: d.rescueImage.texture.key,
          visible: d.rescueImage.visible,
        };
      }, species);
      check(
        `${species}: pet para resgatar usa a arte enviada`,
        rescued.visible && rescued.texture === "dungeon-pet-" + species,
        rescued,
      );
    }
    check(
      "Sem erros JavaScript ou requisições falhas",
      errors.length === 0,
      errors,
    );
  } catch (e) {
    errors.push(e.stack || String(e));
    try {
      await page.screenshot({ path: out + "/falha.png" });
    } catch {}
  } finally {
    fs.writeFileSync(
      out + "/validacao.json",
      JSON.stringify({ checks, errors }, null, 2),
    );
    await browser.close();
    if (errors.length) process.exitCode = 1;
  }
})();
