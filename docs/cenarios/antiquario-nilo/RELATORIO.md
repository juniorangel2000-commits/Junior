# Antiquário do Nilo

Implementado sobre `v0.10.0-preview.8`, em `feature/nilo-antiquario`.

## Resultado

- Fachada própria inspirada na linguagem visual das lojas já ajustadas: madeira, alvenaria clara, telhado de cerâmica, venezianas e lanternas. Vitrines com antiguidades e placa com bússola.
- Interior com paredes escuras, piso de madeira, 16 objetos originais e 19 peças posicionadas. Balcão, armário, vitrine, bancada de restauração, relógio, globo, baú, estante, esfera armilar, livro, vaso, mapas, lanternas, banco, tapete e janela.
- Colisões no corpo da fachada e vasos; beiral sem bloqueio e entrada livre. Sombras e iluminação noturna das janelas; lanternas internas com o sistema de efeitos existente.
- Rotina das 08h às 18h, com intervalo das 12h às 13h30 na praça. Condução até a loja espera o jogador. Compra e venda somente no interior, durante atendimento, mantendo o catálogo de antiguidades existente.
- Editor com H em desenvolvimento, incluindo exportação `After-Rain-Antiquario-Editado.json`. O build normal de produção mantém o editor desativado.
- Saves com interior provisório intacto recebem o novo layout; layouts personalizados são preservados. Rotina, interior e posição do comerciante persistem.

## Personagem

As quatro imagens originais do Nilo em `public/assets/visual/economy/npcs/nilo-*.png` permanecem idênticas à preview.8. O usuário enviou Nilo.zip: 56 PNGs originais, com oito direções e seis passos por direção, além das poses paradas. Os bytes estão preservados em Idle/ e registrados com SHA-256 em personagem.json. O atlas centraliza apenas o padding horizontal das poses mais estreitas, mantendo a escala e a linha vertical originais. O acompanhamento e a rotina utilizam os seis passos recebidos.

## Reprodução

`python scripts/prepare-nilo-assets.py` registra o atlas em JSON preservando os bytes dos PNGs. Requer Pillow. Só use `--write-layout` para regenerar deliberadamente o layout padrão; sem esse argumento, um layout existente é preservado.

Validação lógica: `npm test` e `npm run build`.

Validação visual: inicie Vite na porta 5177 e execute `node scripts/qa-nilo-shop.cjs` com Playwright disponível. A saída padrão fica em `/workspace/after-rain-nilo`; `NILO_QA_OUTPUT` permite trocar a pasta. O script testa as poses preservadas, guia, comércio, objetos, editor/exportação, save, fachada/noite, entrada/saída, rotina e ausência de erros gráficos/JavaScript.

Produção: após `npm run build`, inicie `npm run preview -- --port 5188 --strictPort` e execute `node scripts/qa-nilo-production.cjs`. Usa um save de teste em contexto isolado do navegador; não altera saves de jogadores.

## Evidência desta execução

- 791 testes existentes passaram (85 arquivos).
- Quatro novos testes do antiquário passaram, incluindo circulação, migração, colisões e ida/volta da praça.
- TypeScript e build passaram; permanece o aviso conhecido de tamanho do bundle.
- 14 verificações Chromium de desenvolvimento passaram, sem erros JavaScript, assets ausentes ou erro WebGL.
- Capturas e resultados nesta pasta pertencem a esta implementação.

Este trabalho ainda não é uma nova release ou executável. A animação recebida está integrada localmente; a release preview.8 permanece preservada.

## Vista south refinada

A pedido do usuário, a frente recebeu fonte refinada separada em `south-refinado.png`. O arquivo original e os 56 PNGs recebidos continuam preservados. Metadados de recorte, escala única e alinhamento da cabeça ficam em `personagem.json`; a mesma escala é usada nas sete poses. As demais direções mantêm a montagem original. O loader descarta apenas texturas intermediárias após montar o atlas.
