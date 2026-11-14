// Comparação em escala real dos animais novos (porco, pato, coelho, cervo e abelha) com o
// jogador e os animais que já existem, na Propriedade, com o zoom normal do jogo.
// Gera uma imagem parada (de frente) e quadros andando para o GIF (Vite em 127.0.0.1:5190).
// Uso: node scripts/capture-new-animals.cjs [pasta de saída]
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const out = process.argv[2] || 'docs/planejamento/qa-animais-novos';
fs.mkdirSync(out, { recursive: true });
// Quadros soltos ficam fora do repositório; só o GIF montado vai para `out`.
const frames = fs.mkdtempSync(path.join(os.tmpdir(), 'after-rain-animais-'));
/** Espaço de cada animal na fileira, em px do mundo, para não se encostarem de lado. */
const SPACE = { chicken: 46, duck: 46, rabbit: 46, bee: 44, pig: 58, sheep: 52, goat: 52, cow: 78, deer: 54, horse: 96 };
const LINEUP = ['chicken', 'duck', 'rabbit', 'bee', 'pig', 'sheep', 'goat', 'cow', 'deer', 'horse'];
const NAMES = { chicken: 'Galinha', duck: 'Pato', rabbit: 'Coelho', bee: 'Abelha', pig: 'Porco', sheep: 'Ovelha', goat: 'Cabra', cow: 'Vaca', deer: 'Cervo', horse: 'Cavalo' };
(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.setDefaultTimeout(120000); page.on('pageerror', (e) => { errors.push(e.message); console.log('JSERROR', e.message); });
    await page.goto('http://127.0.0.1:5190');
    await page.locator('#new-game').click(); await page.locator('#character-name').fill('Escala');
    await page.getByRole('button', { name: 'Começar minha história' }).click();
    await page.waitForFunction(() => { document.querySelector('[data-skip-intro]:not([hidden]):not([disabled])')?.click(); return document.querySelector('#ui')?.dataset.area === 'property'; });
    await page.evaluate(async ({ LINEUP, NAMES, SPACE }) => {
      const { game } = await import(document.querySelector('script[src*="main.ts"]').src); window.game = game;
      const v = game.scene.getScene('Vale'); window.v = v; v.state.time = 600;
      const sprites = await import('/src/animal-sprites.ts'), art = await import('/src/forest-art.ts');
      // Porco e abelha não são carregados por padrão: carga explícita, como o jogo fará ao criá-los.
      sprites.preloadAnimalSprites(v, ['pig', 'bee']); await new Promise((r) => { v.load.once('complete', r); v.load.start(); });
      v.setPaused(true); document.querySelector('#ui').style.display = 'none';
      const total = LINEUP.reduce((n, k) => n + SPACE[k], 0), y = v.player.y + 4, x0 = v.player.x - total / 2 + 170;
      let cursor = x0;
      v.player.x = x0 - 30; v.player.y = y; v.player.facing = { x: 0, y: 1 }; v.player.sprite.setPosition(v.player.x, v.player.y).setDepth(y);
      window.lineup = LINEUP.map((kind, i) => {
        const x = cursor + SPACE[kind] / 2; cursor += SPACE[kind];
        const sprite = art.animalSprite(v, kind, x, y);
        const brain = { kind, x, y, direction: 'down', moving: false, distanceMoved: 0, mode: 'wander' };
        const label = v.add.text(x, y + 10, NAMES[kind], { fontFamily: 'Georgia, serif', fontSize: '9px', color: '#fff4d6', stroke: '#2d2418', strokeThickness: 3 }).setOrigin(.5, 0).setDepth(99999);
        sprites.updateAnimalSprite(sprite, brain, 0);
        return { kind, sprite, brain, label, h: Math.round(sprite.displayHeight) };
      });
      v.add.text(v.player.x, y + 10, 'Jogador', { fontFamily: 'Georgia, serif', fontSize: '9px', color: '#fff4d6', stroke: '#2d2418', strokeThickness: 3 }).setOrigin(.5, 0).setDepth(99999);
      v.cameras.main.stopFollow(); v.cameras.main.centerOn(x0 + (total - 40) / 2, y - 14);
      const { beeFlightFrame } = await import('/src/data/animal-art.ts');
      // Avança a caminhada no lugar: só a animação muda, não a posição.
      window.step = (dir, seconds) => { for (const a of lineup) { a.brain.direction = dir; a.brain.moving = true; a.brain.distanceMoved += 5; sprites.updateAnimalSprite(a.sprite, a.brain, 1 / 12);
        if (a.kind === 'bee') a.sprite.setFrame(beeFlightFrame(dir, seconds)); } };
      window.still = () => { for (const a of lineup) { a.brain.direction = 'down'; a.brain.moving = false; sprites.updateAnimalSprite(a.sprite, a.brain, .2); } };
    }, { LINEUP, NAMES, SPACE });
    await page.waitForTimeout(500);
    await page.evaluate(() => still()); await page.waitForTimeout(200);
    await page.screenshot({ path: `${out}/escala-parados.png` });
    const sizes = await page.evaluate(() => Object.fromEntries(lineup.map((a) => [a.kind, { altura: Math.round(a.sprite.displayHeight), largura: Math.round(a.sprite.displayWidth) }])));
    for (let f = 0; f < 24; f++) {
      await page.evaluate(({ f }) => step(f < 12 ? 'right' : 'down-left', f / 12), { f });
      await page.waitForTimeout(60); await page.screenshot({ path: `${frames}/${String(f).padStart(2, '0')}.png` });
    }
    // GIF recortado na fileira, sem pontilhado, com as cores originais (Pillow).
    const gif = `import glob,sys\nfrom PIL import Image\nfr=[Image.open(f).convert('RGB').crop((0,250,1280,440)) for f in sorted(glob.glob(sys.argv[1]+'/*.png'))]\nq=[f.quantize(colors=256,method=Image.MEDIANCUT,dither=Image.Dither.NONE) for f in fr]\nq[0].save(sys.argv[2],save_all=True,append_images=q[1:],duration=90,loop=0,optimize=True)`;
    execFileSync('python3', ['-I', '-c', gif, frames, `${out}/escala-andando.gif`]);
    fs.rmSync(frames, { recursive: true, force: true });
    fs.writeFileSync(`${out}/tamanhos.json`, JSON.stringify(sizes, null, 1));
    console.log(JSON.stringify(sizes));
    assert.deepEqual(errors, []); console.log('Captura dos animais novos: OK');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
