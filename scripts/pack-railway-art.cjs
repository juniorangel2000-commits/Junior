const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const kit = path.resolve(__dirname, '../referencias/cenarios/estacao-ferroviaria');
const assets = [];

function read(name) {
  return PNG.sync.read(fs.readFileSync(path.join(kit, 'fontes', `${name}.png`)));
}

function write(group, name, image, source, crop, anchor = 'base-centro') {
  const file = `${group}/${name}.png`;
  fs.mkdirSync(path.join(kit, group), { recursive: true });
  fs.writeFileSync(path.join(kit, file), PNG.sync.write(image));
  assets.push({ file, source: `fontes/${source}.png`, crop, width: image.width, height: image.height, anchor });
}

function cutSprite(sheet, box) {
  const [left, top, right, bottom] = box;
  let x0 = right, y0 = bottom, x1 = left, y1 = top;
  for (let y = top; y < bottom; y++) {
    for (let x = left; x < right; x++) {
      if (sheet.data[(y * sheet.width + x) * 4 + 3] < 70) continue;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  }
  if (x0 > x1 || y0 > y1) throw new Error(`Recorte vazio: ${box.join(', ')}`);
  const width = x1 - x0 + 1;
  const height = y1 - y0 + 1;
  const sprite = new PNG({ width: width + 4, height: height + 4 });
  PNG.bitblt(sheet, sprite, x0, y0, width, height, 2, 2);
  for (let i = 0; i < sprite.data.length; i += 4) {
    if (sprite.data[i + 3] < 48) sprite.data.fill(0, i, i + 4);
  }
  return sprite;
}

function cutSheet(source, group, columns, rows, names, customBoxes = {}) {
  const sheet = read(source);
  const col = index => Math.floor(index * sheet.width / columns);
  const row = index => Math.floor(index * sheet.height / rows);
  names.forEach((name, index) => {
    const x = index % columns;
    const y = Math.floor(index / columns);
    const box = customBoxes[name] || [col(x), row(y), col(x + 1), row(y + 1)];
    write(group, name, cutSprite(sheet, box), source, box);
  });
}

cutSheet('fachada', 'sprites/exterior', 1, 1, ['predio-principal']);
cutSheet('composicoes', 'sprites/exterior', 3, 2,
  ['locomotiva', 'tender', 'vagao-passageiros', 'vagao-carga', 'vagao-plataforma', 'dresina'],
  { tender: [520, 0, 997, 512], 'vagao-passageiros': [997, 0, 1536, 512] });
cutSheet('estruturas', 'sprites/exterior', 3, 2,
  ['cabine-de-sinais', 'galpao-de-carga', 'cobertura-de-plataforma', 'escada-da-plataforma', 'rampa-de-carga', 'mureta-da-plataforma'],
  {
    'cabine-de-sinais': [0, 0, 458, 512],
    'galpao-de-carga': [458, 0, 1010, 512],
    'escada-da-plataforma': [0, 512, 460, 1024],
    'rampa-de-carga': [460, 512, 975, 1024],
    'mureta-da-plataforma': [975, 512, 1536, 1024],
  });
cutSheet('sinalizacao', 'sprites/exterior', 4, 2,
  ['semaforo-ferroviario', 'batente-fim-de-via', 'alavanca-de-desvio', 'poste-de-luz',
    'coluna-dagua', 'banco-externo', 'placa-da-estacao', 'grade-de-protecao']);
cutSheet('vegetacao', 'sprites/exterior', 4, 2,
  ['capim-verde', 'capim-com-plumas', 'capim-seco', 'trepadeira',
    'silvas', 'samambaia-com-flores', 'arvore-jovem', 'pedras-com-musgo']);
cutSheet('cargas', 'sprites/exterior', 4, 2,
  ['malas', 'latoes-de-leite', 'caixotes', 'carrinho-de-bagagem',
    'telhas-caidas', 'cerca-caida', 'barril-e-caixa', 'quadro-de-avisos-externo']);
cutSheet('via', 'trilhos', 4, 2,
  ['dormente', 'trecho-envelhecido', 'trecho-quebrado', 'travessia-de-madeira',
    'eixos-e-rodas', 'pilha-de-dormentes', 'lastro-solto', 'caixa-de-desvio']);
cutSheet('estrutura-interior', 'sprites/interior', 3, 2,
  ['parede-do-fundo', 'parede-lateral', 'rodape-frontal', 'janela-do-guiche', 'porta-aberta', 'alcapao'],
  {
    'parede-do-fundo': [0, 0, 580, 496],
    'parede-lateral': [630, 0, 990, 488],
    'porta-aberta': [560, 490, 1010, 1024],
  });
cutSheet('moveis', 'sprites/interior', 4, 2,
  ['balcao-de-bilhetes', 'banco-de-espera', 'relogio', 'lamparina',
    'estante-de-papeis', 'prateleira-de-bagagem', 'quadro-de-horarios', 'balanca-de-bagagem'],
  {
    'banco-de-espera': [437, 0, 940, 443],
    relogio: [940, 0, 1330, 443],
    'prateleira-de-bagagem': [437, 443, 935, 887],
    'quadro-de-horarios': [935, 443, 1330, 887],
  });
const frontal = 'sprites/interior-frontal';
cutSheet('estrutura-frontal', frontal, 3, 2,
  ['parede-com-heras', 'parede-descascada', 'parede-com-guiche', 'porta-da-plataforma', 'lambril-frontal', 'rodape-de-pedra']);
cutSheet('moveis-frontais', frontal, 4, 2,
  ['bilheteria-fechada', 'banco-frontal', 'banco-quebrado', 'horarios-gastos',
    'estante-de-malas', 'balanca-frontal', 'relogio-de-pendulo', 'lampiao-frontal']);
cutSheet('vestigios-frontais', frontal, 4, 2,
  ['grade-de-manutencao', 'reboco-caido', 'bilhetes-rasgados', 'mala-antiga',
    'tapete-rasgado', 'balde-de-incendio', 'ripas-caidas', 'rachaduras-e-poeira']);

function sample(source, [x0, y0, x1, y1], width, height) {
  const image = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    const srcY = y0 + Math.floor((y + .5) * (y1 - y0) / height);
    for (let x = 0; x < width; x++) {
      const srcX = x0 + Math.floor((x + .5) * (x1 - x0) / width);
      const offset = (srcY * source.width + srcX) * 4;
      source.data.copy(image.data, (y * width + x) * 4, offset, offset + 4);
    }
  }
  return image;
}

function joinEdges(image, horizontal, band) {
  const length = horizontal ? image.width : image.height;
  const breadth = horizontal ? image.height : image.width;
  const offset = (along, across) => horizontal
    ? (across * image.width + along) * 4
    : (along * image.width + across) * 4;
  for (let across = 0; across < breadth; across++) {
    for (let d = 0; d < band; d++) {
      const start = offset(d, across);
      const end = offset(length - 1 - d, across);
      const weight = .5 * (1 - d / band) ** 2;
      for (let channel = 0; channel < 4; channel++) {
        const a = image.data[start + channel];
        const b = image.data[end + channel];
        image.data[start + channel] = Math.round(a + (b - a) * weight);
        image.data[end + channel] = Math.round(b + (a - b) * weight);
      }
    }
  }
}

const floorAtlas = read('materiais');
const floors = ['terra-com-musgo', 'cascalho', 'lastro', 'lajes-da-plataforma', 'tabuas-internas', 'ladrilho-antigo'];
floors.forEach((name, i) => {
  const x = (i % 3) * 512;
  const y = Math.floor(i / 3) * 512;
  const box = [x + 44, y + 44, x + 468, y + 468];
  const tile = sample(floorAtlas, box, 256, 256);
  joinEdges(tile, true, 15);
  joinEdges(tile, false, 15);
  write('pisos', name, tile, 'materiais', box, 'canto-superior-esquerdo');
});

// Center the repeat on two complete sleepers so only the steel crosses the joint.
const trackBox = [614, 108, 780, 404];
const trackAtlas = read('via');
const track = sample(trackAtlas, trackBox, 128, 128);
joinEdges(track, true, 5);
write('trilhos', 'reta-horizontal', track, 'via', trackBox, 'canto-superior-esquerdo');

const vertical = new PNG({ width: track.height, height: track.width });
for (let y = 0; y < track.height; y++) {
  for (let x = 0; x < track.width; x++) {
    const src = (y * track.width + x) * 4;
    track.data.copy(vertical.data, (x * vertical.width + track.height - y - 1) * 4, src, src + 4);
  }
}
write('trilhos', 'reta-vertical', vertical, 'via', trackBox, 'canto-superior-esquerdo');

// The plank crossing is taller than the track and shares its steel at both ends.
const crossingBox = [1344, 67, 1749, 420];
const planks = sample(trackAtlas, crossingBox, 192, 196);
const crossing = new PNG({ width: 192, height: 224 });
PNG.bitblt(planks, crossing, 0, 0, planks.width, planks.height, 0, 5);
for (let y = 0; y < crossing.height; y++) {
  for (let x = 0; x < crossing.width; x++) {
    const distance = Math.min(x, crossing.width - 1 - x);
    if (distance >= 12) continue;
    const target = (y * crossing.width + x) * 4;
    const atRail = y >= 48 && y < 176;
    const rail = (y - 48) * track.width * 4;
    const weight = (1 - distance / 12) ** 2;
    for (let channel = 0; channel < 4; channel++) {
      const edge = atRail ? track.data[rail + channel] : 0;
      crossing.data[target + channel] = Math.round(crossing.data[target + channel] * (1 - weight) + edge * weight);
    }
  }
}
write('trilhos', 'travessia-modular', crossing, 'via', crossingBox, 'canto-superior-esquerdo');

const manifest = {
  units: 'px',
  cropFormat: '[esquerda, topo, direita exclusiva, base exclusiva]',
  assets,
};
fs.writeFileSync(path.join(kit, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`${assets.length} PNGs preparados em ${kit}`);
