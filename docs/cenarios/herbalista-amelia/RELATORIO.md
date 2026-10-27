# Herbalista Amélia — integração e validação

27/10/2026 · After Rain 0.10.0-preview.8

## Resultado

Fachada e interior próprios, seguindo as paredes escuras e a escala dos outros comércios. O interior utiliza piso de madeira, móveis independentes, área de preparo e decoração de herbalista. Não há cama. A loja abre dentro do estabelecimento; os outros serviços e a opção de acompanhar a comerciante continuam disponíveis.

A rotina abre às 08h, faz intervalo entre 12h e 13h30 e fecha às 18h. O deslocamento usa navegação e salvamento existentes, inclusive entrada e saída automáticas. O editor de desenvolvimento do interior permite mover objetos e exportar `After-Rain-Herbalista-Editada.json`; os interiores já finalizados de Bento, Augusto e Rosa continuam sem edição.

## Arte e arquivos

- `public/assets/visual/village/amelia/`: 72 PNGs recebidos preservados byte a byte, metadados originais, nova folha frontal, fachada, folha de objetos, janela e manifestos.
- `src/amelia-sprites.ts`: atlas de oito direções com oito passos e uma pose parada por direção; sete direções preservadas e nove poses frontais refinadas.
- `src/data/amelia-layout.json`: 20 peças posicionadas, a partir de 17 objetos independentes do catálogo.
- `src/amelia-shop.ts`, `src/data/amelia-shop.ts`: fachada, entrada, colisão, iluminação de janelas e luminárias.
- Integração em `merchant-rooms`, `merchant-interior`, `merchant-effects`, `interior-effects`, `village-world`, `VillageScene`, `merchant-routine`, `village-walk`, `economy-art`, `solar-shadows` e `control-guide`.
- `scripts/prepare-amelia-assets.py`: preparação reproduzível, sem sobrescrever layout editado por padrão.

O movimento passou a respeitar a quantidade real de quadros de cada NPC, inclusive durante o acompanhamento até a loja. Os PNGs de origem são liberados da memória após a montagem das texturas compactas. As lanternas têm chama e luz, a bacia tem ondulação e a bandeja de chá tem vapor discreto, sem criar texturas a cada quadro.

## Validação

- 791 testes automatizados passaram em 85 arquivos; TypeScript e build de produção passaram.
- `tests/amelia-sprites.test.ts` e `tests/amelia-shop.test.ts`: integridade dos arquivos recebidos, atlas, oito passos, colisão, navegação, migração e rotina.
- `scripts/qa-amelia-sprites.cjs`: 16 verificações no Chromium, incluindo oito direções, sete direções inalteradas, acompanhamento, retrato, comércio, efeitos, editor/exportação, save, fachada noturna, entrada/saída e rotina completa. Evidência em `validacao.json`.
- Capturas: `herbalista-interior.png`, `herbalista-fachada.png`; árvores ambientais ocultas na revisão externa.
- Animação: `amelia-south-andando.gif`.

O JSON exportado durante o teste apenas comprova a edição; ele não substitui o layout padrão. Os problemas de caminho curto demais na captura e de fechamento de sala inexistente foram corrigidos nos próprios testes. Nenhum exterior/interior previamente aprovado foi redesenhado por esta integração.

Uma repetição durante o empacotamento apresentou erro gráfico intermitente no Chromium e outra não concluiu a tela inicial. Após encerrar o empacotamento e validar a disponibilidade do servidor, a execução isolada passou nas 16 verificações, incluindo `glError: 0`. Não houve mudança do código do jogo para ocultar esse resultado; a evidência final registra explicitamente o código WebGL. O build de produção também passou em quatro verificações separadas.
