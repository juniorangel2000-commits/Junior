const { chromium } = require("playwright"),
  fs = require("node:fs"),
  assert = require("node:assert/strict");
const out =
  process.env.DUNGEON_QA_OUTPUT || "/workspace/after-rain-city-forest-zoom";
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
      const s = game.scene.getScene("Vale");
      window.propertyZoom = s.cameras.main.zoom;
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
      window.villageZoom = v.cameras.main.zoom;
      v.enterCityForest(true);
    });
    await page.waitForFunction(
      () =>
        game.scene.isActive("AcessoCidade") &&
        document.querySelector("#ui")?.dataset.area === "cityForest",
    );
    await page.evaluate(() => {
      window.f = game.scene.getScene("AcessoCidade");
      game.loop.sleep();
    });
    const state = () =>
      page.evaluate(() => ({
        factor: f.zoom,
        camera: f.cameras.main.zoom,
        saved: localStorage.getItem("after-rain-camera-zoom"),
        visible: !document.querySelector(".camera-zoom").hidden,
        label: document.querySelector(".camera-zoom-value").textContent,
        x: f.player.x,
        y: f.player.y,
      }));
    const wheel = (dy, options = {}) =>
      page.evaluate(
        ({ dy, options }) => {
          const e = new WheelEvent("wheel", {
            deltaY: dy,
            cancelable: true,
            ...options,
          });
          game.canvas.dispatchEvent(e);
          return e.defaultPrevented;
        },
        { dy, options },
      );
    const initial = await page.evaluate(() => ({
      property: propertyZoom,
      village: villageZoom,
      forest: f.cameras.main.zoom,
    }));
    check(
      "Enquadramento padrão igual à propriedade e à vila",
      initial.forest === initial.village &&
        initial.forest === initial.property &&
        initial.forest === 2,
      initial,
    );
    check("Controle de zoom começa oculto", !(await state()).visible);
    await page.mouse.move(800, 600);
    await page.mouse.wheel(0, -120);
    await page.waitForFunction(() => f.zoom === 1.25);
    let a = await state();
    check(
      "Scroll aproxima, salva a preferência e revela o controle",
      a.factor === 1.25 &&
        a.camera === 2.5 &&
        a.saved === "1.25" &&
        a.visible &&
        a.label === "125%",
      a,
    );
    await render();
    await page.screenshot({ path: out + "/zoom-125.png" });
    await wheel(-10);
    await wheel(-10);
    a = await state();
    check(
      "Trackpad acumula movimentos pequenos sem saltos",
      a.factor === 1.25,
      a,
    );
    await wheel(-20);
    a = await state();
    check("Trackpad faz um passo ao atingir o limiar", a.factor === 1.5, a);
    const modified = [];
    for (const key of ["ctrlKey", "metaKey", "altKey"])
      modified.push(await wheel(-100, { [key]: true }));
    check(
      "Atalhos do navegador não são capturados",
      modified.every((v) => !v) && (await state()).factor === 1.5,
      modified,
    );
    await wheel(0);
    check(
      "Scroll sem deslocamento não afasta a câmera",
      (await state()).factor === 1.5,
    );
    await page.keyboard.press("Home");
    await render();
    a = await state();
    check(
      "Home restaura 100% e enquadramento padrão",
      a.factor === 1 && a.camera === 2 && a.label === "100%",
      a,
    );
    await page.keyboard.press("_");
    await render();
    check("Atalho _ afasta a câmera", (await state()).factor === 0.75);
    await page.keyboard.press("=");
    await render();
    check("Atalho = aproxima a câmera", (await state()).factor === 1);
    await page.evaluate(() => f.setPaused(true));
    await wheel(-120);
    await page.evaluate(() => f.changeCameraZoom(1));
    a = await state();
    check(
      "Pausa bloqueia mudanças e oculta o controle",
      a.factor === 1 && !a.visible,
      a,
    );
    await page.evaluate(() => f.setPaused(false));
    await page.evaluate(() => f.ui.toggleInventory(f.state.inventory));
    await wheel(-120);
    check(
      "Painéis mantêm a própria rolagem sem alterar o zoom",
      (await state()).factor === 1,
    );
    await page.evaluate(() => f.ui.closeModal());
    await page.evaluate(() => {
      for (let i = 0; i < 12; i++) f.changeCameraZoom(1);
    });
    a = await state();
    check(
      "Limite máximo 200% com botão de aproximação desativado",
      a.factor === 2 &&
        a.camera === 4 &&
        (await page.locator('[data-zoom="1"]').isDisabled()),
      a,
    );
    await page.evaluate(() => {
      for (let i = 0; i < 12; i++) f.changeCameraZoom(-1);
    });
    a = await state();
    check(
      "Limite mínimo 50% com botão de afastamento desativado",
      a.factor === 0.5 &&
        a.camera === 1 &&
        (await page.locator('[data-zoom="-1"]').isDisabled()),
      a,
    );
    await page.locator('[data-zoom="0"]').click();
    a = await state();
    check("Botão restaura o zoom padrão", a.factor === 1 && a.camera === 2, a);
    await page.waitForFunction(
      () => document.querySelector(".camera-zoom").hidden,
      { timeout: 6000 },
    );
    check("Controle desaparece após alguns segundos", !(await state()).visible);
    const point = await state();
    await wheel(-120);
    a = await state();
    check(
      "Alterar zoom mantém a posição do jogador",
      a.x === point.x && a.y === point.y && a.factor === 1.25,
      a,
    );
    await page.evaluate(() =>
      f.scale.emit(
        "resize",
        f.scale.gameSize,
        f.scale.baseSize,
        f.scale.displaySize,
        f.scale.width,
        f.scale.height,
      ),
    );
    check(
      "Redimensionamento preserva zoom escolhido",
      (await state()).camera === 2.5,
    );
    await page.evaluate(() => {
      f.leave();
      game.loop.wake();
    });
    await page.waitForFunction(
      () =>
        game.scene.isActive("Vila") &&
        document.querySelector("#ui")?.dataset.area === "village",
    );
    const village = await page.evaluate(() => {
      const v = game.scene.getScene("Vila");
      game.loop.sleep();
      return {
        factor: v.zoom,
        camera: v.cameras.main.zoom,
        wheelDefault: v.input.mouse.preventDefaultWheel,
      };
    });
    check(
      "Preferência acompanha o jogador ao voltar à vila",
      village.factor === 1.25 &&
        village.camera === 2.5 &&
        village.wheelDefault === true,
      village,
    );
    await page.evaluate(() => {
      game.scene.getScene("Vila").enterCityForest(true);
      game.loop.wake();
    });
    await page.waitForFunction(
      () =>
        game.scene.isActive("AcessoCidade") &&
        document.querySelector("#ui")?.dataset.area === "cityForest",
    );
    await page.evaluate(() => {
      window.f = game.scene.getScene("AcessoCidade");
      game.loop.sleep();
    });
    await wheel(-120);
    a = await state();
    check(
      "Reentrar na floresta mantém preferência e não duplica o scroll",
      a.factor === 1.5 && a.camera === 3,
      a,
    );
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
