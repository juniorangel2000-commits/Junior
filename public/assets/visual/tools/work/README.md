# Ferramentas exclusivas da animação

Fonte `source.png` gerada por imagegen a pedido do Junior; enxada, pá e foice
simples, separadas dos ícones do inventário. `scripts/prepare-work-tools.cjs`
recorta três células nativas de 724 px, sem reduzir os PNGs. Empunhadura e escala
de exibição em `art.json`. O cabo não muda entre quadros; gira em torno da mão.
`work-tool-art.ts` troca somente os tons neutros da cabeça metálica conforme o
nível. Nenhum ícone foi substituído. Enxada/pá têm cerca de 30 px de altura no
mundo, foice cerca de 22 px, proporcionais à picareta/machadinha.

O corpo vem de `referencias/personagens/ferramentas-corpo/`: fontes nativas de
2172×724, seis poses em duas vistas, editadas por imagegen **diretamente das
laterais de work-chopping.png** para remover somente a ferramenta. O masculino
preserva a postura e o cabelo da machadinha; a feminina mantém o corpo esguio e
o coque próprios dela. A primeira base de corpo gerada a partir da mineração
foi substituída após o Junior apontar aparência distinta e pegadas deslocadas.

Preparar com `node scripts/prepare-player-tool-body.cjs`. O script conserva os
pixels nativos, limpa alfa/resíduos soltos, usa a escala/origem da machadinha e
guarda a pegada **por personagem, direção e pose** em `player-tool-body.json`.
Não voltar a um único mapa de mãos para os dois personagens. Os testes conferem
que cada pegada é um pixel de pele opaco da mão correspondente.

- Enxada: levantar **à frente**, golpe no chão, recuperação (arco da machadinha).
- Pá: inserir no chão e fazer alavanca, sem a pose acima da cabeça.
- Foice: varredura baixa, sem levantar ao ombro ou acima da cabeça.
- Regador: corpo acompanha o regador e o jato autoral já existente.

`src/data/player-tool-motion.ts` define as poses e os arcos. A direção lógica da
interação não muda: norte/sul usam a vista direita apenas para desenhar a ação;
diagonais esquerdas usam a esquerda. Picareta/machadinha preservam suas folhas
anteriores em quatro vistas. Não usar os primeiros rascunhos com ferramentas
embutidas e variáveis, rejeitados pelo Junior.
