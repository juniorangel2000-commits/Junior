# Revisão de arte — preview.44 (20/11/2026)

## Caminhada dos sobreviventes

`survivors.gif` compara fazendeira / Marina / fazendeiro / Rui nas quatro vistas principais.
As caminhadas originais dos jogadores foram preservadas e usadas como referência direta.
Marina tem seis quadros por direção; Rui, oito. Ambos completam a passada em 48 px,
como os jogadores. Só animam ao caminhar; parados usam as poses originais.

A primeira proposta foi descartada por repetir poses muito semelhantes. A segunda
foi gerada usando folhas dos quadros originais como referência. Fontes preservadas em
`public/assets/visual/characters/survivors/*-walk-source.png`; `pack-survivor-walk.cjs`
recorta sem reduzir pixels e alinha cada linha por um deslocamento fixo. A escala de
exibição mantém a altura das poses paradas. `walk.json` registra fontes, hashes e recortes.
As diagonais dos sobreviventes ainda usam a vista lateral dominante, como antes;
não são oito vistas novas. Não confundir os 6/8 quadros com o número de direções.

`qa-village-schedule.cjs --survivors` confere as imagens reais da propriedade: bloqueio
por 12 segundos, retomada, quadros mudando ao caminhar e chegada sem saltos.
O teleporte após seis segundos bloqueados foi removido também de Marina e Rui.

## Chiqueiro

- `chiqueiro-fechado.png`: textura original fechada.
- `chiqueiro-aberto.png`: mesma textura, com a folha perpendicular à cerca, a 90 graus.
- `pigsty.png`: comparação renderizada no jogo.

A primeira geração aberta a 45 graus foi rejeitada pelo Junior. A segunda é vista de
lado, com o vão livre. A fonte completa gerada permanece em
`public/assets/visual/farm/pigsty-open-source.png`. O jogo aplica somente o recorte da
porteira à textura original; a resolução original não foi reduzida. `pigsty.json`
confirma **zero pixels diferentes fora da região da porteira**. Colisões e área da
construção mantêm as regras existentes de `gateOpen`.

## Ferramentas

`tools-male.gif` e `tools-female.gif`: machadinha, picareta, enxada e regador nas vistas
principais, pelos adaptadores reais de `ToolVisual`. A direção real agora define a mão
(eight direções) e a profundidade; só a imagem é espelhada pela lateral. Antes a direção
era reduzida para esquerda/direita, deslocando a pegada e colocando ferramentas à frente
do corpo nas vistas de costas. As artes de mineração/corte completas foram preservadas.

## Montaria e demais artes

`horse.gif` e `horse-diagonals.gif` conferem os dois personagens, nas oito direções,
andando e galopando. Sem erros de carregamento ou quadros ausentes nas capturas.
As artes da montaria não foram substituídas: continuam com oito poses de cavaleiro
sobre o cavalo animado, acompanhando o lombo por quadro. Não foi criada uma nova
animação independente do corpo do cavaleiro.

Os testes existentes dos atlas de animais, personagens e ferramentas passaram junto
à suíte completa. Isso verifica arquivos, recortes e referências; não representa uma
aprovação visual de cada sprite de todos os cenários.

## Reprodução

Com Vite em 5190 e Chromium instalado:

- `node scripts/capture-art-review.cjs <pasta> survivors`
- Modos adicionais: `horse`, `horse-diagonals`, `tools-male`, `tools-female`, `pigsty`.
- `CHROMIUM_PATH` opcional; ffmpeg gera os GIFs a partir dos quadros do navegador.
- `node scripts/qa-village-schedule.cjs [--survivors|--property-visit]`

Validação final: `npm run check`, 2.199 testes (262 arquivos) e build passaram.
