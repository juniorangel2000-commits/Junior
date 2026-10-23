const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

const outputDirectory = path.resolve(__dirname, '../docs/previa-personagem');
const labels = {
  down: 'Frente', left: 'Esquerda', right: 'Direita', up: 'Costas',
  'down-left': 'Frente à esquerda', 'down-right': 'Frente à direita',
  'up-left': 'Costas à esquerda', 'up-right': 'Costas à direita',
};
const pngBytes = dataUrl => Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');

function reviewHtml(art, zoomPictures, homePictures) {
  const data = JSON.stringify({ ...art, zoomPictures, homePictures }).replace(/</g, '\\u003c');
  const cards = art.directions.map(direction => `<figure class="angle-card"><figcaption>${labels[direction]}</figcaption><div class="sprite-stage"><span class="ground" aria-hidden="true"></span><canvas width="144" height="192" data-direction="${direction}" aria-label="Animação: ${labels[direction].toLowerCase()}"></canvas></div></figure>`).join('');
  const photos = (pictures, id, title, description) => pictures.length ? `
    <section class="review-section" aria-labelledby="${id}-title">
      <div class="section-heading"><div><span class="eyebrow">PERSPECTIVAS NO JOGO</span><h2 id="${id}-title">${title}</h2></div></div>
      <p class="section-copy">${description}</p>
      <div class="photo-controls" role="group" aria-label="${title}">${pictures.map((picture, index) => `<button type="button" data-photo-group="${id}" data-photo-index="${index}" aria-pressed="${index === 0}">${picture.label}</button>`).join('')}</div>
      <figure class="photo-frame"><img id="${id}-image" src="${pictures[0].dataUrl}" alt="${pictures[0].alt}" width="1280" height="800"/><figcaption id="${id}-caption">${pictures[0].caption}</figcaption></figure>
    </section>` : '';
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>After Rain — prévia da personagem e da câmera</title>
<style>
:root{color-scheme:light;--paper:#f5e6c5;--ink:#513c26;--olive:#65754a;--line:#b9945c;--wood:repeating-linear-gradient(0deg,#85522d 0 3px,#8d5931 3px 6px,#7b4928 6px 7px,#925e34 7px 11px)}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 50% 0,#718060,#384c39 75%);color:var(--ink);font:15px/1.55 Arial,sans-serif;min-height:100vh}button,a{touch-action:manipulation}button{cursor:pointer}button:disabled{opacity:.5;cursor:default}button,a:focus-visible{outline:3px solid #b47d2a;outline-offset:4px}button{border:1px solid #9d763f;border-radius:3px;background:linear-gradient(#fff4da,#e9d3ac);box-shadow:inset 0 0 0 1px #fff6e1,0 2px #c5a474;color:var(--ink);padding:9px 13px;font:inherit;font-size:13px;min-height:38px}button:hover:not(:disabled){filter:brightness(1.04)}button[aria-pressed=true]{background:#71814d;color:#fff7df;border-color:#526336;box-shadow:inset 0 1px #a9b27a,0 2px #3c4b2a}.page{width:min(1090px,calc(100% - 32px));margin:32px auto 44px;background:linear-gradient(110deg,#fff2d6,var(--paper));border:8px solid #73502d;box-shadow:0 0 0 2px #d2ab6c,inset 0 0 0 2px #d6bc87,0 16px 45px #14231666;padding:25px}.brand{font:22px Georgia,serif;letter-spacing:1px;margin:0 0 12px;color:#6a4c2d}.notice{display:inline-block;padding:6px 10px;border:1px solid #b9bd8c;background:#e5e6c9;border-radius:3px;font-size:12px;color:#53613d}.hero{margin:0 0 24px}.hero h1{font:40px/1.15 Georgia,serif;margin:17px 0 10px;color:#5b3d22}.hero p{max-width:740px;margin:0;color:#796142}.review-section{margin-top:30px}.section-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.section-heading h2{font:25px Georgia,serif;margin:5px 0 12px}.eyebrow{font-size:10px;letter-spacing:1.5px;color:#7c8555}.section-copy{font-size:14px;color:#7a6545;margin:0 0 16px}.control-board{display:flex;flex-wrap:wrap;gap:15px 22px;border:1px solid #c8aa73;padding:14px;background:#ead9b5;margin:12px 0 16px}.control-group{border:0;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:6px;align-items:center}.control-group legend{font-size:11px;font-weight:bold;margin-bottom:7px;color:#705837}.control-group legend+button{margin-left:0}.animation-info{display:flex;gap:14px;flex-wrap:wrap;justify-content:space-between;font-size:12px;color:#74804d;margin:0 0 17px}.angle-grid{display:grid;grid-template-columns:repeat(4,220px);gap:16px;justify-content:center}.angle-card{width:220px;height:250px;margin:0;padding:8px;background:#fbefd2;border:2px solid #b89c67;border-radius:3px;box-shadow:inset 0 0 0 2px #fff8e6}.angle-card figcaption{text-align:center;color:#665035;font:15px Georgia,serif;line-height:20px;white-space:nowrap}.sprite-stage{height:204px;display:grid;place-items:end center;position:relative;overflow:hidden;background:linear-gradient(180deg,#e5e7c7,#d6dfb7);margin-top:6px}.sprite-stage:before{content:'';position:absolute;bottom:0;height:19px;width:100%;background:#b4c18b}.ground{position:absolute;bottom:7px;left:50%;transform:translateX(-50%);width:78px;height:12px;border-radius:50%;background:#68804d33}.sprite-stage canvas{position:relative;z-index:1;width:144px;height:192px;image-rendering:pixelated;image-rendering:crisp-edges;align-self:end;margin-bottom:8px}.download-link{display:inline-block;color:#6b7748;font-size:12px;margin-top:14px;text-underline-offset:3px}.photo-controls{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 12px}.photo-frame{margin:0;border:5px solid #8d6539;background:#302d20;padding:3px}.photo-frame img{display:block;width:100%;height:auto;aspect-ratio:8/5;object-fit:contain}.photo-frame figcaption{background:#f2e3c1;padding:9px 12px;font-size:12px;color:#755b3b}.footer{margin-top:30px;padding-top:18px;border-top:1px solid #c6ae7f;font-size:12px;color:#7a6949}.loading{color:#6b7748;font-size:12px}noscript img{max-width:100%}kbd{font:12px monospace;padding:1px 5px;border:1px solid #baa376;background:#fff5d7;border-radius:3px}
@media(max-width:1030px){.angle-grid{grid-template-columns:repeat(2,220px)}.hero h1{font-size:34px}}
@media(max-width:560px){.page{width:calc(100% - 18px);padding:16px;margin-top:15px;border-width:6px}.angle-grid{grid-template-columns:220px}.hero h1{font-size:29px}.notice{font-size:11px}.control-board{gap:14px}.control-group{flex:1 1 100%}.section-heading h2{font-size:22px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
</style>
</head>
<body>
<main class="page">
  <header class="hero"><div class="brand">After Rain</div><span class="notice">Prévia para avaliação — ainda não publicada</span><h1>Personagem, movimento e perspectiva</h1><p>Veja a personagem nas oito direções, compare os penteados e acompanhe cada fase da caminhada. As imagens abaixo vêm do renderizador real do jogo.</p></header>
  <section class="review-section" aria-labelledby="character-title">
    <div class="section-heading"><div><span class="eyebrow">OITO DIREÇÕES</span><h2 id="character-title">Uma volta completa</h2></div></div>
    <div class="control-board">
      <fieldset class="control-group"><legend>Cabelo</legend><button type="button" data-hair="preso" aria-pressed="true" disabled>Preso</button><button type="button" data-hair="curto" aria-pressed="false" disabled>Curto</button></fieldset>
      <fieldset class="control-group"><legend>Movimento</legend><button type="button" data-mode="walk" aria-pressed="true" disabled>Caminhada</button><button type="button" data-mode="idle" aria-pressed="false" disabled>Parada</button></fieldset>
      <fieldset class="control-group"><legend>Reprodução</legend><button type="button" data-speed="1" aria-pressed="true" disabled>Normal</button><button type="button" data-speed="0.5" aria-pressed="false" disabled>Lento</button><button type="button" id="pause-animation" aria-pressed="false" disabled>Pausar</button><button type="button" id="next-frame" disabled>Próximo quadro</button></fieldset>
    </div>
    <div class="animation-info"><span>${art.walkFrames} quadros por ciclo · ${String(art.fps).replace('.', ',')} fps no ritmo normal</span><span id="frame-status" aria-live="off">Carregando a prévia…</span></div>
    <div class="angle-grid">${cards}</div>
    <a class="download-link" href="${art.idleGrid}" download="after-rain-oito-direcoes.png">Salvar imagem das oito direções</a>
    <noscript><p>Ative JavaScript para ver a caminhada. A personagem parada aparece abaixo.</p><img src="${art.idleGrid}" alt="Personagem parada nas oito direções"/></noscript>
  </section>
  ${photos(zoomPictures, 'outside', 'Mais perto, mais longe', 'Mesma posição no cenário em 50%, 100% e 200%. Em 50%, a câmera mostra o dobro da largura e da altura do enquadramento padrão. Durante o jogo: roda do mouse ou + / −; Home volta a 100%.')}
  ${photos(homePictures, 'inside', 'Dentro da casa', 'Ao afastar, a câmera enquadra o cômodo inteiro. Ao aproximar, ela acompanha a personagem para manter a movimentação visível.')}
  <footer class="footer">Prévia local de avaliação. A versão publicada do jogo permanece intacta. Os controles desta página servem para examinar a animação; no jogo, use <kbd>WASD</kbd> ou as setas para andar.</footer>
</main>
<script type="application/json" id="review-data">${data}</script>
<script>
(() => {
  const data = JSON.parse(document.getElementById('review-data').textContent);
  const images = {};
  const views = [...document.querySelectorAll('canvas[data-direction]')].map(canvas => ({ canvas, context: canvas.getContext('2d'), row: data.directions.indexOf(canvas.dataset.direction) }));
  let hair = 'preso', mode = 'walk', speed = 1, paused = false, progress = 0, previous = 0, lastDrawn = '';
  function draw() {
    const phase = mode === 'idle' ? 0 : 1 + Math.floor(progress) % data.walkFrames;
    const signature = hair + ':' + phase;
    if (signature !== lastDrawn) {
      for (const view of views) {
        const c = view.context;
        c.clearRect(0, 0, view.canvas.width, view.canvas.height);
        c.imageSmoothingEnabled = false;
        c.drawImage(images[hair], phase * data.width, view.row * data.height, data.width, data.height, 0, 0, view.canvas.width, view.canvas.height);
      }
      lastDrawn = signature;
    }
    document.getElementById('frame-status').textContent = mode === 'idle' ? 'Pose parada' : (paused ? 'Pausada · ' : '') + 'Quadro ' + phase + ' de ' + data.walkFrames;
  }
  function tick(now) {
    if (previous && !paused && mode === 'walk') progress += Math.min(now - previous, 100) * data.fps * speed / 1000;
    previous = now;
    draw();
    requestAnimationFrame(tick);
  }
  function selected(selector, selectedValue, attribute) {
    document.querySelectorAll(selector).forEach(button => button.setAttribute('aria-pressed', String(button.dataset[attribute] === selectedValue)));
  }
  document.querySelectorAll('[data-hair]').forEach(button => button.addEventListener('click', () => { hair = button.dataset.hair; selected('[data-hair]', hair, 'hair'); draw(); }));
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.mode; progress = 0; selected('[data-mode]', mode, 'mode');
    document.getElementById('pause-animation').disabled = mode === 'idle';
    document.getElementById('next-frame').disabled = mode === 'idle'; draw();
  }));
  document.querySelectorAll('[data-speed]').forEach(button => button.addEventListener('click', () => { speed = Number(button.dataset.speed); selected('[data-speed]', button.dataset.speed, 'speed'); }));
  document.getElementById('pause-animation').addEventListener('click', event => { paused = !paused; event.currentTarget.textContent = paused ? 'Retomar' : 'Pausar'; event.currentTarget.setAttribute('aria-pressed', String(paused)); draw(); });
  document.getElementById('next-frame').addEventListener('click', () => {
    paused = true; progress = Math.floor(progress) + 1;
    const pause = document.getElementById('pause-animation'); pause.textContent = 'Retomar'; pause.setAttribute('aria-pressed', 'true'); draw();
  });
  document.querySelectorAll('[data-photo-group]').forEach(button => button.addEventListener('click', () => {
    const group = button.dataset.photoGroup, index = Number(button.dataset.photoIndex);
    const photo = (group === 'outside' ? data.zoomPictures : data.homePictures)[index];
    const image = document.getElementById(group + '-image'); image.src = photo.dataUrl; image.alt = photo.alt;
    document.getElementById(group + '-caption').textContent = photo.caption;
    document.querySelectorAll('[data-photo-group="' + group + '"]').forEach(control => control.setAttribute('aria-pressed', String(control === button)));
  }));
  Promise.all(Object.entries(data.atlases).map(([style, url]) => new Promise((resolve, reject) => { const image = new Image(); image.onload = () => { images[style] = image; resolve(); }; image.onerror = reject; image.src = url; }))).then(() => {
    document.querySelectorAll('.control-board button').forEach(button => button.disabled = false);
    draw(); requestAnimationFrame(tick);
  }).catch(() => { document.getElementById('frame-status').textContent = 'Não foi possível abrir a animação.'; });
})();
</script>
</body>
</html>`;
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  let art;
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto(process.env.QA_URL || 'http://127.0.0.1:5173');
    // The title only exists once createArt has prepared the actual game textures.
    await page.locator('#new-game').waitFor();
    art = await page.evaluate(async labels => {
      const { drawCharacter, CHARACTER_WIDTH, CHARACTER_HEIGHT } = await import('/src/art.ts');
      const { CHARACTER_DIRECTIONS, CHARACTER_WALK_FRAMES, CHARACTER_FRAMES_PER_DIRECTION, CHARACTER_WALK_FPS } = await import('/src/character-directions.ts');
      const width = CHARACTER_WIDTH, height = CHARACTER_HEIGHT;
      const profile = { name: 'Clara', skin: '#d9a276', hairColor: '#754323', outfit: '#638a9d', shirtColor: '#f0e4c9', accessory: 'nenhum' };
      const sprite = document.createElement('canvas');
      const atlases = {};
      for (const hairStyle of ['preso', 'curto']) {
        const atlas = document.createElement('canvas'); atlas.width = width * CHARACTER_FRAMES_PER_DIRECTION; atlas.height = height * CHARACTER_DIRECTIONS.length;
        const context = atlas.getContext('2d'); context.imageSmoothingEnabled = false;
        for (const [row, direction] of CHARACTER_DIRECTIONS.entries()) {
          const walkingPoses = new Set();
          for (let phase = 0; phase < CHARACTER_FRAMES_PER_DIRECTION; phase++) {
          drawCharacter(sprite, { ...profile, hairStyle }, direction, phase);
          const pixels = sprite.getContext('2d').getImageData(0, 0, width, height).data;
          let opaque = 0;
          for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) opaque++;
          if (opaque < 100) throw Error(`Empty game sprite: ${hairStyle}/${direction}/${phase}`);
          for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
            if ((x === 0 || y === 0 || x === width - 1 || y === height - 1) && pixels[(y * width + x) * 4 + 3]) {
              throw Error(`Sprite touches clipping boundary: ${hairStyle}/${direction}/${phase}`);
            }
          }
          if (phase) walkingPoses.add(sprite.toDataURL());
          context.drawImage(sprite, phase * width, row * height);
          }
          if (walkingPoses.size !== CHARACTER_WALK_FRAMES) throw Error(`Repeated walk pose: ${hairStyle}/${direction}`);
        }
        atlases[hairStyle] = atlas.toDataURL('image/png');
      }
      const grid = phase => {
        const canvas = document.createElement('canvas'); canvas.width = 976; canvas.height = 664;
        const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false;
        c.fillStyle = '#f3e4c2'; c.fillRect(0, 0, canvas.width, canvas.height);
        c.fillStyle = '#855b33'; c.fillRect(0, 0, canvas.width, 6);
        c.fillStyle = '#5b4228'; c.font = 'bold 27px Georgia, serif'; c.fillText('After Rain · Personagem em oito direções', 24, 43);
        c.fillStyle = '#6c774b'; c.font = '14px Arial, sans-serif';
        c.fillText(phase === 0 ? 'Pose parada · captura do renderizador do jogo' : `Caminhada · quadro ${phase} de ${CHARACTER_WALK_FRAMES} · ${CHARACTER_WALK_FPS} fps`, 24, 70);
        for (const [index, direction] of CHARACTER_DIRECTIONS.entries()) {
          const x = 24 + index % 4 * 236, y = 100 + Math.floor(index / 4) * 266;
          c.fillStyle = '#fbefd2'; c.fillRect(x, y, 220, 250);
          c.strokeStyle = '#b89c67'; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, 218, 248);
          c.fillStyle = '#e0e5c0'; c.fillRect(x + 10, y + 34, 200, 203);
          c.fillStyle = '#b5c28e'; c.fillRect(x + 10, y + 221, 200, 16);
          c.fillStyle = '#91a471'; c.beginPath(); c.ellipse(x + 110, y + 229, 35, 5, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#665035'; c.font = '15px Georgia, serif'; c.textAlign = 'center'; c.fillText(labels[direction], x + 110, y + 23); c.textAlign = 'left';
          drawCharacter(sprite, { ...profile, hairStyle: 'preso' }, direction, phase);
          c.drawImage(sprite, x + Math.floor((220 - width * 3) / 2), y + 230 - height * 3, width * 3, height * 3);
        }
        c.fillStyle = '#7c6947'; c.font = '12px Arial, sans-serif'; c.fillText('Prévia para avaliação — ainda não publicada', 24, 649);
        return canvas.toDataURL('image/png');
      };
      return { width, height, directions: CHARACTER_DIRECTIONS, walkFrames: CHARACTER_WALK_FRAMES,
        columns: CHARACTER_FRAMES_PER_DIRECTION, fps: CHARACTER_WALK_FPS, atlases,
        idleGrid: grid(0), walkGrids: Array.from({ length: CHARACTER_WALK_FRAMES }, (_, index) => grid(index + 1)) };
    }, labels);
    assert.deepEqual(errors, [], 'game renderer must load without errors before review export');
    assert.equal(art.directions.length, 8);
    assert.equal(art.width, 48); assert.equal(art.height, 64);
    assert.equal(art.columns, art.walkFrames + 1);
  } finally { await browser.close(); }

  await fs.mkdir(outputDirectory, { recursive: true });
  await fs.writeFile(path.join(outputDirectory, 'direcoes-parada.png'), pngBytes(art.idleGrid));
  for (const [index, dataUrl] of art.walkGrids.entries()) {
    await fs.writeFile(path.join(outputDirectory, `caminhada-${String(index + 1).padStart(2, '0')}.png`), pngBytes(dataUrl));
  }
  for (const [style, dataUrl] of Object.entries(art.atlases)) await fs.writeFile(path.join(outputDirectory, `atlas-${style}.png`), pngBytes(dataUrl));

  const zoomPictures = [], homePictures = [];
  for (const [group, percentages] of [['outside', [50, 100, 200]], ['inside', [50, 200]]]) {
    for (const percent of percentages) {
      const source = `/tmp/after-rain-zoom-${group === 'inside' ? 'home-' : ''}${percent}.png`;
      let bytes;
      try { bytes = await fs.readFile(source); }
      catch (error) { if (error.code === 'ENOENT') continue; throw error; }
      const filename = `zoom-${group === 'inside' ? 'casa-' : ''}${percent}.png`;
      await fs.writeFile(path.join(outputDirectory, filename), bytes);
      const picture = { label: `${percent}%`, alt: `${group === 'inside' ? 'Interior da casa' : 'Cenário externo'} com zoom de ${percent}%`,
        caption: group === 'inside' ? percent === 50 ? '50% · o cômodo inteiro em uma vista centralizada' : '200% · câmera próxima acompanhando a personagem'
          : percent === 50 ? '50% · dobro da largura e da altura visíveis' : percent === 100 ? '100% · enquadramento padrão' : '200% · aproximação para observar os detalhes',
        dataUrl: `data:image/png;base64,${bytes.toString('base64')}` };
      (group === 'inside' ? homePictures : zoomPictures).push(picture);
    }
  }
  // The HTML embeds every required atlas and photo. Opening this file alone is enough.
  await fs.writeFile(path.join(outputDirectory, 'index.html'), reviewHtml({ ...art, walkGrids: undefined }, zoomPictures, homePictures));
  console.log(`Review exported to ${outputDirectory}`);
  console.log(`Eight idle views, ${art.walkFrames} walking grids, two ${art.directions.length * art.columns}-pose atlases, ${zoomPictures.length + homePictures.length} zoom pictures, self-contained animated HTML.`);
  console.log(`Optional GIF input: ${path.join(outputDirectory, 'caminhada-%02d.png')} at ${art.fps} fps.`);
})().catch(error => { console.error(error); process.exit(1); });
