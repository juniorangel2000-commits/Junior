# Ferramentas exclusivas da animação

Fonte `source.png` gerada por imagegen a pedido do Junior; enxada, pá e foice
simples, separadas dos ícones do inventário. `scripts/prepare-work-tools.cjs`
recorta três células nativas de 724 px, sem reduzir os PNGs. Empunhadura e escala
de exibição em `art.json`. O cabo não muda entre quadros; gira em torno da mão.
`work-tool-art.ts` troca somente os tons neutros da cabeça metálica conforme o
nível. Nenhum ícone foi substituído.

O corpo vem de `referencias/personagens/ferramentas-corpo/`, fontes nativas de
1536×1024 geradas com os personagens existentes como referência. Preparar com
`node scripts/prepare-player-tool-body.cjs`. As folhas conservam quatro linhas
na fonte, mas a animação nova usa **somente leste/oeste**, conforme o pedido.

- Enxada: levantar, golpe no chão, recuperação (arco da mineração/machadinha).
- Pá: inserir no chão e fazer alavanca, sem a pose acima da cabeça.
- Foice: varredura baixa, sem levantar ao ombro ou acima da cabeça.
- Regador: corpo acompanha o regador e o jato autoral já existente.

`src/data/player-tool-motion.ts` define poses, mãos e arcos. A direção lógica da
interação não muda: norte/sul usam a vista direita apenas para desenhar a ação;
diagonais esquerdas usam a esquerda. Picareta/machadinha preservam suas folhas
anteriores em quatro vistas. Não usar os primeiros rascunhos com ferramentas
embutidas e variáveis, rejeitados pelo Junior.
