# Demolidor — animações recebidas

Integração local posterior à preview.13, sem publicação.

O arquivo enviado pelo usuário foi preservado em `demolidor-original.zip`. O pacote contém 16 frames de caminhada, quatro por direção cardinal, e oito vistas paradas. Conforme a orientação do usuário, o jogo utiliza somente sul, oeste, leste e norte, tanto na caminhada como em repouso. As vistas diagonais permanecem apenas no ZIP original.

O atlas de execução foi substituído por 20 frames: 16 de caminhada e quatro parados, sem o martelete. Cada frame mantém a tela original de 256 × 256. O empacotador copia os pixels RGBA sem recorte, redimensionamento ou redesenho e verifica a igualdade de cada região com o PNG recebido. O manifest registra os hashes do ZIP, dos PNGs de origem e do atlas final.

A apresentação usa uma escala corporal fixa, baseada na frente de 184 pixels de altura, para preservar a variação natural dos passos. A referência vertical de cada direção é obtida da pose parada, mantendo dois pixels de margem sob os pés. Não há ajuste de escala ou âncora entre os frames de um mesmo ciclo. Durante avisos e recuperação dos golpes, o chefe usa a pose parada da direção correspondente.

A caminhada permanece em cinco frames por segundo, usando os quatro frames fornecidos em ciclo. Os outros chefes conservam a apresentação anterior até receberem suas próprias animações.

## Reprodução

Execute `python scripts/prepare-demolisher-assets.py` para reconstruir o atlas e o manifest a partir do ZIP preservado. A execução usa Pillow, disponível no ambiente de trabalho; o jogo não depende de Python.

## Validação

86 testes direcionados aprovados em quatro arquivos, incluindo seleção das quatro direções, pose parada separada, tela dos frames, escala, hashes dos atlas e sistemas dos chefes. TypeScript e build de produção aprovados. Permanece o aviso conhecido do Vite sobre tamanho do bundle.

50 verificações integradas aprovadas no Chromium, sem erros JavaScript, HTTP ou WebGL registrados. A conferência inclui os quatro lados, os quatro frames de cada ciclo, escala e âncora constantes durante cada ciclo, pose parada sul durante o aviso, salvamento do chefe, combate e retorno.

[Demolidor parado no aviso](chefe-10-aviso.png) · [Golpe ativo](chefe-10-ativo.png) · [Validação](validacao.json)
