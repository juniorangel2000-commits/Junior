# Passadas de Marina e Rui

Fontes de imagegen preservadas sem redimensionamento. Movimento guiado pelas folhas
originais da fazendeira (6 quadros) e fazendeiro (8 quadros), com a identidade das poses
paradas fornecidas pelo Junior. Quatro linhas: sul, norte, leste, oeste.

`node scripts/pack-survivor-walk.cjs` gera atlas com células de 256 px, alinhamento fixo
por linha, alfa mínimo 200 e metadados em `walk.json`. O deslocamento não recentraliza
cada quadro individualmente. A escala é aplicada apenas pelo jogo. O ciclo corresponde
a 48 px percorridos e as poses paradas originais continuam em uso.

As vistas diagonais ainda usam a lateral dominante. Evidências e comparação animada:
`docs/planejamento/qa-arte-preview44/`.
