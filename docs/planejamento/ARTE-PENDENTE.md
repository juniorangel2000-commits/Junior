# Pixel arts que faltam

> **Lote 01 recebido em 16/11/2026** (`docs/arte-recebida/lote01-fazenda/`, importado por
> `scripts/import_art_lote01.py`). Já no jogo: esterco, adubo, méis de margarida e girassol, tecido de lã e os
> ícones de cavilhas, ervas, ervas raras, mapa antigo, mochila, botas e peças metálicas.
> O lamaçal do lote ficou guardado (`farm/interior/mud.png`); o Junior preferiu o chiqueiro só
> com palha, sem a mancha de lama.
>
> **Fase 02 recebida em 16/11/2026** (`docs/arte-recebida/fase02-fogueira-abelhas/`): fogueira
> acesa (3 quadros, aparece no chão enquanto o caderno da fogueira está aberto). A colmeia e
> a abelha dos lotes ficaram só guardadas: o Junior preferiu a colmeia antiga com três
> abelhinhas desenhadas por código (`MachineView.bees`), de dia e fora do inverno. A franja branca do contorno foi
> tirada de todas as sprites recebidas (`scripts/clean_white_fringe.py`). Ainda não usados: a porteira do lote (a do chiqueiro faz parte da arte da construção e
> precisa ser encaixada nela) e os ícones extras sem item no jogo (pregos, dobradiça,
> engrenagem, roda dentada, molas, frasco de óleo, alecrim, folhas, flores e cera bruta).

Lista histórica criada depois da preview.35 (pedido do Junior). As tabelas de 14/11 abaixo devem ser lidas junto às entregas posteriores registradas neste arquivo. Marque cada item ao trocar a arte.
Todas as artes novas seguem o estilo do jogo: pixel art detalhado, paleta quente,
contorno marrom-escuro. Os objetos são vistos de cima em 3/4, de frente, alinhados e
**sem isometria**. Peça ao gerador fundo branco liso; o recorte é feito por script,
**sem reduzir os PNGs** (o jogo só reduz na exibição).

Boas referências para anexar ao gerador:
- objetos e máquinas: `public/assets/visual/machines/clayOven-icon.png`;
- ícones de item: `public/assets/visual/kitchen/honey.png` ou `public/assets/visual/farm/products/egg.png`;
- casa: `public/assets/visual/home-furniture/` (móveis do Codex).

## 0. Bancadas (pedido de 16/11/2026)

Bancada de trabalho refeita e bancada de construção nova, as duas com **2 blocos de largura**.
✅ Recebidas e no jogo em 16/11/2026 (`docs/arte-recebida/bancadas/`).

## 0b. Chiqueiro fechado e aberto a 90 graus — integrado em 20/11/2026

O Junior retomou a revisão e pediu dois estados da mesma construção. A primeira
proposta aberta a 45 graus foi rejeitada; foi gerada uma folha perpendicular à cerca,
vista de lado, com o vão livre. A textura fechada original continua como base.

A fonte aberta está em `public/assets/visual/farm/pigsty-open-source.png`. O renderer
aplica só o recorte da porteira sobre a textura original, mantendo todo o resto idêntico.
As duas sprites exportadas e a conferência de identidade fora da porteira estão em
`docs/planejamento/qa-arte-preview44/`.

Marina/Rui, ferramentas e montaria também foram revistos nessa pasta. Os sobreviventes
têm passadas novas nas quatro vistas principais; diagonais próprias continuam pendentes.

## 1. Provisórias feitas por script na preview.35 (trocar primeiro)

| Arte | Arquivo atual | Como está hoje |
| --- | --- | --- |
| Esterco (ícone e chão do chiqueiro) | `public/assets/visual/kitchen/manure.png` | pixel art simples desenhada por script |
| Adubo / fertilizante | `public/assets/visual/kitchen/fertilizer.png` | saquinho com broto desenhado por script |
| Lamaçal do chiqueiro | desenhado em código (`mudTexture` em `src/farm-interior-art.ts`) | manchas de terra molhada |
| Abelhas na colmeia | `public/assets/visual/machines/beehive.png` (quadros 2 e 3) | pontinhos pintados por script |
| Colmeia vazia | `public/assets/visual/kitchen/empty-hive.png` | colmeia povoada desbotada |
| Mel de margarida e mel de girassol | `daisy-honey.png` e `sunflower-honey.png` em `kitchen/` | ícone do mel com outro tom |
| Tecido de lã (preview.36) | `public/assets/visual/machines/woolCloth.png` | cópia do ícone dos tecidos simples |
| Porteira aberta do chiqueiro | montada em código (`pigstyGate` em `src/farm-construction-view.ts`) | folha "de lado" feita da borda da porteira |

Sugestões para o próximo pacote:
- **Esterco:** montinho de esterco marrom com palha, ícone de item.
- **Adubo:** saco de juta aberto com adubo escuro e um broto, ícone de item.
- **Lamaçal:** poça de lama vista de cima, larga (3×2 blocos), bordas irregulares.
- **Colmeia:** a mesma colmeia em 3 versões lado a lado (parada, abelhas à esquerda, abelhas à direita), mais uma versão vazia, com a madeira desbotada e sem abelhas.
- **Méis de flor:** o mesmo pote aberto do mel, um com margaridas na etiqueta e outro com girassol.
- **Tecido de lã:** rolo de tecido de lã macio, creme com listras marrons, diferente do tecido simples.
- **Chiqueiro:** a mesma arte em duas versões, porteira fechada e porteira aberta (folha encostada por dentro da cerca).

## 2. Itens que usam o ícone de outro item

Conferido no jogo (`itemIconUrl`) em 14/11/2026. Hoje estes itens aparecem com o ícone
emprestado indicado:

| Item | Nome | Ícone emprestado de |
| --- | --- | --- |
| `peg` | Cavilhas | nenhum (aparece vazio) |
| `herb` | Ervas | fibra |
| `rareHerb` | Ervas raras | sementes |
| `fungalInfusion` | Infusão de cogumelos | água |
| `herbalTonic` | Tônico de ervas | água |
| `bandage` | Curativos | corda |
| `meal` | Refeições | sementes |
| `oakSeed` | Bolotas de frondosa | sementes |
| `pineSeed` | Sementes de pinheiro | sementes |
| `oldMap` | Mapa antigo | tábua |
| `lantern` | Lanterna | martelo |
| `lamp` | Luminárias | martelo |
| `waterPump` | Bomba de água | água |
| `metalPart` | Peças metálicas | sucata |
| `electronicPart` | Componentes eletrônicos | lâmina |
| `backpack` | Mochila reforçada | corda |
| `boots` | Botas | cabo |
| `clothing` | Roupas | fibra |
| `accessory` | Acessórios | corda |
| `sword` | Espada improvisada (no inventário) | lâmina |

Prioridade sugerida: cavilhas (aparece vazio), ervas, mapa antigo, refeições, mochila e
botas, que aparecem cedo no jogo.

## 3. Artes que o plano previa e ainda não existem

- **Fogueira acesa no chão:** hoje a fogueira portátil só abre o caderno, sem nada no cenário. Fazer uma pequena fogueira com chamas em 3 quadros.
- **Abelhas voando perto da colmeia:** o atlas das abelhas existe (`public/assets/animals/bee/`), mas ainda não é usado no mundo.
- **Iluminação dos interiores à noite:** os interiores dos abrigos ficam claros o tempo todo (problema conhecido).

## Como entregar

Mande os PNGs (ou um .zip) no chat, como o pacote de conservas e cera. Para cada
máquina, as versões ficam lado a lado na mesma escala; para cada ícone, um objeto por
imagem ou vários lado a lado com espaço entre eles. Os originais ficam guardados em
`docs/arte-recebida/`.

## Recebidas em 17/11/2026 (preview.41)

Arte do Junior em `docs/arte-recebida/faltantes/`, importada por `scripts/import_art_faltantes.py`:

- [x] Infusão de cogumelos (`items/fungalInfusion.png`)
- [x] Tônico de ervas (`items/herbalTonic.png`)
- [x] Rede de pesca (`items/net.png`)
- [x] Enxada de pedra (`tools/hoe/stone.png`; mesma posição da antiga, o cabo fica em 80, 220)
- [x] Luminária instalada, apagada de dia e acesa à noite (`equipment/lamp-off.png`, `lamp-on.png`); também é o ícone do item
- [x] Marina e Rui, 4 vistas cada (`characters/survivors/`)

- [x] Curativos, refeições, lanterna, componentes eletrônicos, roupas e acessórios (segundo envio,
  `docs/arte-recebida/faltantes/icones-2/`; `import_art_faltantes.py --icones`)

Todos os itens do jogo têm ícone próprio desde a preview.41.

## Ferramentas no estilo das espadas (preview.41)

Arte do Junior em `docs/arte-recebida/ferramentas/`, importada por `scripts/import_tools.py`
(quadro de 128 px e ponto de pegada medido de novo em `src/data/tool-art-anchors.json`):

- [x] Machadinha, picareta e enxada: pedra, ferro, ouro e metal negro
- [x] Foice e pá: ferro, ouro e metal negro. **Não existem em pedra**: a primeira se compra
  com o Bento (80 C e 90 C), que ensina a receita da bancada de trabalho (3 lingotes de ferro
  + 2 madeiras). Saves antigos: a foice e a pá de pedra viram de ferro.
- [x] Telhado de tábuas (antiga porta pronta) e Ninho e baias (antiga janela pronta, usa o ninho do galinheiro)
