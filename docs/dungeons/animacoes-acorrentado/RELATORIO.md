# Acorrentado — animações recebidas

Integração local posterior à preview.13, sem publicação.

O ZIP recebido foi preservado em `acorrentado-original.zip`. Foram integrados os 16 frames de caminhada e as quatro poses paradas para sul, oeste, leste e norte. As vistas diagonais recebidas permanecem somente no ZIP original.

Os 20 frames do atlas preservam a tela original de 256 × 256 e os pixels RGBA dos PNGs fornecidos. O empacotador verifica a igualdade de cada região e registra os hashes do ZIP, das fontes e do atlas.

A apresentação usa escala fixa com referência corporal de 184 pixels, cinco frames por segundo e uma âncora por direção, obtida da pose parada. A escala e a âncora permanecem constantes dentro de cada ciclo. O chefe da rodada 30 utiliza a pose parada durante o aviso e a recuperação do golpe. As regras de combate permanecem as mesmas.

Para reconstruir: `python scripts/prepare-boss-assets.py chained`. O jogo não depende de Python; Pillow é usado somente na preparação dos assets.

## Validação

101 testes direcionados aprovados em quatro arquivos. TypeScript e build de produção aprovados; permanece o aviso conhecido do Vite sobre tamanho do bundle.

53 verificações integradas aprovadas no Chromium, sem erros JavaScript, HTTP ou WebGL registrados. Incluem caminhada e poses paradas dos quatro chefes já recebidos, quatro frames por lado, escala e âncora constantes em cada ciclo, golpes, salvamento e retorno.

[Aviso do golpe](chefe-30-aviso.png) · [Golpe ativo](chefe-30-ativo.png) · [Validação](validacao.json)
