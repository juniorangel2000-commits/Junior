# Devorador — animações recebidas

Integração local posterior à preview.13, sem publicação.

O ZIP recebido foi preservado em `devorador-original.zip`. O pacote contém seis frames de caminhada por direção. Todos foram aproveitados: o atlas usa 24 frames de caminhada e quatro poses paradas, somente para sul, oeste, leste e norte. As vistas diagonais recebidas permanecem somente no ZIP original.

Os 28 frames preservam a tela original de 256 × 256 e os pixels RGBA dos PNGs recebidos. O empacotador verifica cada região contra a imagem de origem e registra os hashes do ZIP, das fontes e do atlas. A preparação aceita agora a quantidade de frames fornecida por direção, exigindo ciclos completos de igual tamanho nos quatro lados.

A escala permanece fixa, com referência corporal de 184 pixels e tamanho de exibição de 112 pixels para o chefe final, maior que os 94 pixels dos outros chefes. A âncora é obtida da pose parada de cada direção e permanece constante durante o ciclo. A caminhada usa cinco frames por segundo; os seis frames formam um ciclo de 1,2 segundo. Avisos e recuperação usam a pose parada correspondente. As regras e os atributos de combate permanecem os mesmos.

Para reconstruir: `python scripts/prepare-boss-assets.py devourer`. Pillow é usado somente na preparação; o jogo não depende de Python.

## Validação

106 testes direcionados aprovados em quatro arquivos, incluindo os cinco chefes, seleção de todos os frames, quatro lados, poses paradas, escala, âncoras, hashes e sistemas de combate.

TypeScript e build de produção aprovados. Permanece o aviso conhecido do Vite sobre tamanho do bundle.

54 verificações integradas aprovadas no Chromium, sem erros JavaScript, HTTP ou WebGL registrados. Incluem os seis frames por lado do Devorador, quatro direções, escala maior e fixa, pose parada, golpes, salvamento e a apresentação dos outros quatro chefes.

[Devorador durante o aviso](chefe-50-aviso.png) · [Golpe ativo](chefe-50-ativo.png) · [Validação](validacao.json)
