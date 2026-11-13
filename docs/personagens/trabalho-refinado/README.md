# Refinamento dos personagens trabalhando

Rosto, cabelo, roupa e proporções das quatro folhas foram refinados usando as
quatro vistas originais de cada personagem como referência. A estrutura segue
seis quadros por quatro direções, com ferramentas e relógio de impacto existentes.
A pose traseira da machadinha continua lateral, conforme preferência do Junior;
não foi usada a tentativa de levantamento centralizado. Os levantamentos laterais
continuam à frente do rosto, conforme a revisão anterior.

`referencias/personagens/trabalho-refinado/` contém os quatro novos originais.
`prepare-player-work.cjs` prepara ambas as atividades. Os comandos anteriores
`prepare-player-mining.cjs` e `prepare-player-chopping.cjs` continuam disponíveis.
O preparo normaliza alfa, alinha pés por direção, ajusta a escala e repete exatamente
o repouso no quadro de retorno. Fontes anteriores continuam preservadas.

A geração aproxima o desenho original, mas não copia a cabeça pixel a pixel;
a comparação visual dos GIFs com a sprite normal continua relevante para revisão.
A validação no Chromium cobre 64 combinações de personagem, ferramenta, direção
e metal, todos os quadros e a restauração do corpo, sem erro JavaScript.

- [Machadinha](machadinha.gif)
- [Picareta](picareta.gif)
