# Sentinela — animações recebidas

Integração local posterior à preview.13, sem publicação.

O ZIP enviado foi preservado em `sentinela-original.zip`. O atlas do jogo utiliza 16 frames de caminhada, quatro por direção, e quatro poses paradas: sul, oeste, leste e norte. As vistas diagonais recebidas continuam somente no arquivo original, conforme a orientação de usar quatro lados.

Os frames mantêm os 256 × 256 pixels originais. O empacotador copia os pixels RGBA integralmente, sem redesenho, recorte ou redimensionamento, e verifica cada região do atlas contra o PNG correspondente. O manifest registra os hashes do arquivo original, das imagens de origem e do atlas final.

A Sentinela usa uma escala fixa baseada na frente de 184 pixels, com referência vertical própria de cada direção obtida da pose parada. A caminhada roda a cinco frames por segundo. O aviso e a recuperação da investida usam as poses paradas, mantendo a direção fixada pelo golpe. As regras de combate permanecem as mesmas.

O importador passou a atender os dois chefes recebidos. O comando antigo do Demolidor continua funcionando, e a reconstrução preservou seus arquivos de execução sem alterações.

## Reprodução

`python scripts/prepare-boss-assets.py sentinel`

Para o Demolidor: `python scripts/prepare-boss-assets.py demolisher` ou o comando anterior `python scripts/prepare-demolisher-assets.py`.

Pillow é usado somente na preparação dos assets; o jogo não depende de Python.

## Validação

91 testes direcionados aprovados em quatro arquivos, incluindo caminhada e pose parada dos dois chefes nos quatro lados, escala, âncoras, hashes dos atlas e sistemas dos chefes. TypeScript e build de produção aprovados. Permanece o aviso conhecido do Vite sobre tamanho do bundle.

51 verificações integradas aprovadas no Chromium, sem erros JavaScript, HTTP ou WebGL registrados. A conferência inclui caminhada nos quatro lados, os quatro frames por ciclo, escala e âncora constantes em cada direção, pose parada durante o aviso da investida, preservação do Demolidor, salvamento dos chefes, combate e retorno.

[Sentinela durante o aviso](chefe-20-aviso.png) · [Investida ativa](chefe-20-ativo.png) · [Validação](validacao.json)
