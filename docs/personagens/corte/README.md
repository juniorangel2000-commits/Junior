# Corte com machadinha

As duas folhas `work-chopping.png` têm 1536 × 1024 pixels: seis quadros por
quatro direções, em células de 256 × 256. Linhas: frente, costas, direita e esquerda.
A sequência acompanha o relógio de nove etapas da mineração, com contato no mesmo
quadro de impacto. As diagonais usam frente/costas como na mineração.

`player-mining-art.ts` prepara ambas as atividades, mantendo texturas independentes.
As cabeças de metal usam regiões delimitadas, ajustadas nos levantamentos laterais, e a
mesma conversão de cores por nível. Madeira, corpo, roupas e cabelo são preservados.
`ToolVisual.show` troca temporariamente o corpo e o restaura no término/cancelamento.
`playGather` recebe o corpo nos Campos Abertos; Floresta e Propriedade já o fornecem.

Originais gerados: `referencias/personagens/corte`. Rode
`node scripts/prepare-player-chopping.cjs` para reproduzir as folhas e os encaixes.
O preparo normaliza o alfa e mede os pés por direção, sem reescrever a mineração.

Validação nativa: `node scripts/qa-player-chopping.cjs`, com Vite na porta 5190.
O relatório acompanha 32 combinações de personagem, direção e metal, verificando
todos os quadros e a restauração do corpo, sem erros JavaScript.

Após revisão do Junior, somente os dois quadros de levantamento lateral foram
corrigidos em cada folha. Os demais 22 quadros, incluindo toda a vista traseira,
foram preservados pixel a pixel. O preparo aplica essas duas células dos originais
`*-laterais.png`, mantendo a folha base.
