const { chromium } = require("playwright"), fs = require("node:fs"), assert = require("node:assert/strict");
const out = process.env.CINEMATIC_QA_OUTPUT || "/workspace/expedition-cinematic";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const checks = [], errors = [];
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(120000);
  page.on("pageerror", e => errors.push(e.message));
  const check = (name, value, details) => {
    checks.push({ name, passed: !!value, details });
    console.log(name, !!value); assert.ok(value, name + " " + JSON.stringify(details));
  };
  try {
    await page.goto(process.env.QA_URL || "http://127.0.0.1:5186");
    await page.waitForSelector("#new-game");
    await page.mouse.click(5, 5);
    await page.evaluate(async () => {
      const { game } = await import(document.querySelector('script[src*="main.ts"]').src);
      game.loop.sleep();
      window.introAPI = await import("/src/dungeons/expedition-intro.ts");
      window.sound = (await import("/src/audio.ts")).gameAudio;
      window.host = document.createElement("div"); host.id = "dungeon-ui";
      document.body.append(host);
      window.completed = 0;
      window.ready = new Promise(resolve => window.release = resolve);
      window.intro = new introAPI.ExpeditionIntro(host, { characterId: "farmer-male" }, ready, () => completed++, () => {});
    });
    await page.waitForFunction(() => document.querySelector("#dungeon-ui video").videoWidth === 1920);
    const before = await page.evaluate(() => {
      const skip = document.querySelector("[data-skip-intro]"), v = host.querySelector("video");
      skip.onclick();
      return { hidden: skip.hidden, disabled: skip.disabled, completed, source: v.src, duration: v.duration, muted: v.muted };
    });
    check("Vídeo masculino real decodifica em 1080p, sem trilha nativa duplicada", before.source.endsWith("road-male.mp4") && before.muted && before.duration >= 7, before);
    check("Pular oculto e bloqueado antes de preparar recursos", before.hidden && before.disabled && before.completed === 0, before);
    await page.evaluate(() => host.querySelector("video").dispatchEvent(new Event("ended")));
    check("Fim do vídeo aguarda os recursos antes de abrir menu", await page.evaluate(() => completed === 0), {});
    await page.evaluate(() => release());
    await page.waitForFunction(() => completed === 1);
    check("Conclusão após carregar remove vídeo e abre uma única vez", await page.evaluate(() => !host.querySelector("video") && completed === 1), {});

    await page.evaluate(() => {
      window.ready = new Promise(resolve => window.release = resolve);
      window.intro = new introAPI.ExpeditionIntro(host, { characterId: "farmer-female" }, ready, () => completed++, () => {});
      host.querySelector("video").loop = true; // Keep this fixture alive during a slow software-rendered screenshot.
    });
    await page.waitForFunction(() => host.querySelector("video").currentTime > .5);
    check("Vídeo feminino reproduz de verdade", await page.evaluate(() => host.querySelector("video").src.endsWith("road-female.mp4") && host.querySelector("video").videoHeight === 1080), {});
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    check("Perda de foco pausa o vídeo", await page.evaluate(() => host.querySelector("video").paused), {});
    await page.evaluate(() => host.querySelector("video").dispatchEvent(new Event("timeupdate")));
    check("Atualização tardia de mídia não rearma timeout fora de foco", await page.evaluate(() => intro.timer === undefined), {});
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await page.waitForFunction(() => !host.querySelector("video").paused);
    await page.evaluate(() => release());
    await page.locator("[data-skip-intro]").waitFor({ state: "visible" });
    await page.screenshot({ path: out + "/video-feminino.png" });
    check("Carregamento libera Pular", await page.locator("[data-skip-intro]").isEnabled(), {});
    await page.locator("[data-skip-intro]").click();
    check("Pular conclui uma vez e limpa o elemento", await page.evaluate(() => completed === 2 && !host.querySelector("video")), {});

    await page.evaluate(() => {
      window.ready = new Promise(resolve => window.release = resolve);
      window.intro = new introAPI.ExpeditionIntro(host, {}, ready, () => completed++, () => {});
      host.querySelector("video").dispatchEvent(new Event("error"));
    });
    check("Falha de vídeo não contorna o bloqueio de carregamento", await page.evaluate(() => completed === 2), {});
    await page.evaluate(() => release());
    await page.locator('[data-skip-intro]').waitFor({state:'visible'});
    check("Falha de vídeo não fecha a cena silenciosamente", await page.evaluate(() => completed === 2 && !!host.querySelector('video')), {});
    await page.getByRole('button',{name:'Tentar novamente',exact:true}).click();
    await page.waitForFunction(()=>host.querySelector('video').currentTime > .2 && !host.querySelector('video').paused);
    check("Tentar novamente recupera a reprodução real", await page.evaluate(()=>completed===2), {});
    await page.locator('[data-skip-intro]').click();
    await page.waitForFunction(() => completed === 3);
    check("Pular após falha e carregamento permite continuar", await page.evaluate(() => !host.querySelector('video')), {});

    await page.evaluate(async () => {
      host.remove();
      await sound.unlock();
      sound.setSettings({ music: .4, effects: .5, muted: false });
      sound.setScene("expedition");
    });
    await page.waitForFunction(() => sound.musicMode === "expedition" && !!sound.music);
    const theme = await page.evaluate(() => {
      window.originalTheme = sound.music;
      const samples = sound.music.buffer.getChannelData(0);
      let peak = 0, power = 0;
      for (const s of samples) { assertFinite(s); peak = Math.max(peak, Math.abs(s)); power += s * s; }
      function assertFinite(s) { if (!Number.isFinite(s)) throw Error("Nonfinite audio"); }
      return { peak, rms: Math.sqrt(power / samples.length), duration: sound.music.buffer.duration };
    });
    check("Trilha original renderiza sem clipping ou valores inválidos", theme.peak < 1 && theme.rms > .001 && theme.duration === 48, theme);
    await page.waitForTimeout(400);
    check("Trilha fica em 25% do volume musical escolhido", await page.evaluate(() => Math.abs(sound.musicGain.gain.value - .1) < .001), {});
    await page.evaluate(() => sound.setScene("expedition"));
    check("Vídeo e menu usam a mesma fonte sem reiniciar a trilha", await page.evaluate(() => sound.music === originalTheme), {});
    const suspense = await page.evaluate(async () => {
      const { synthesizeEffect } = await import("/src/audio.ts");
      const ctx = new OfflineAudioContext(1, 44100 * 2, 44100);
      synthesizeEffect(ctx, ctx.destination, "dungeon-start");
      const audio = await ctx.startRendering();
      return Math.max(...audio.getChannelData(0).subarray(0, 44100).map(Math.abs));
    });
    check("Efeito curto de suspense tem áudio válido", suspense > .001 && suspense < 1, suspense);
    await page.evaluate(() => sound.setScene("combat"));
    await page.waitForFunction(() => sound.musicMode === "combat" && !sound.music && !sound.fadingMusic);
    check("Combate encerra a música e deixa os efeitos ativos", await page.evaluate(() => sound.settings.effects === .5 && !sound.music), {});
    await page.evaluate(() => sound.setSettings({ muted: true }));
    await page.waitForTimeout(400);
    check("Silêncio geral continua respeitado", await page.evaluate(() => sound.master.gain.value < .0001), {});
    check("Sem erros JavaScript", errors.length === 0, errors);
  } catch (error) {
    errors.push(error.stack || String(error)); process.exitCode = 1;
    await page.screenshot({ path: out + "/falha.png" });
  } finally {
    fs.writeFileSync(out + "/validacao.json", JSON.stringify({ checks, errors }, null, 2));
    await browser.close();
  }
})();
