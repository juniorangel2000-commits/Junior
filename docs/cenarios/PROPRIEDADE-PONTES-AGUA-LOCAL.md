# Propriedade, pontes, água e canteiros — trabalho local

Continuação do trabalho preservado sobre a 0.9.4, incluindo a enxada e a horta
removível. Ainda não há nova publicação nem mudança de versão do executável.

## Aparência da propriedade

A propriedade reutiliza as seis árvores recortadas do atlas da Floresta Antiga,
com tamanho e orientação variados por posição, de forma estável. As rochas
mineráveis usam as seis novas rochas do lago e continuam quebráveis. O piso
próximo às áreas arborizadas recebe mais da paleta de chão da floresta.

Os IDs, posições, remoções, recompensa dos recursos e edições do autor são
preservados. O teste no navegador comparou os dois mapas completos e confirmou
que terrenos, objetos e pontos de entrada/saída não foram reescritos.

## Pontes

As duas travessias permanecem nos mesmos lugares: 42–48/18–19 e 41–49/52–53.
O tabuleiro novo usa madeira texturizada, pregos, musgo discreto e encontros de
pedra. Corrimãos dianteiros e traseiros são desenhados em camadas separadas,
com a profundidade correta em relação ao personagem.

Os corrimãos têm colisão por pixel. A guarda de movimento também recusa passar
diretamente entre água e tabuleiro, incluindo água rasa e uma cabeceira que tenha
sido pintada de água. As cabeceiras em terra continuam abertas nos dois sentidos.
A água rasa não depende da animação de nado para ser reconhecida nessa regra.

## Água

Ondas e reflexos percorrem um ciclo contínuo de quatro segundos, com 64 quadros
em 16 FPS. A leitura em coordenadas do mundo mantém o desenho contínuo entre
quadrados. Máscaras de margem impedem que a animação cubra terra ou pontes.
Os quadros são preparados e reutilizados; não se repinta o mapa a cada frame.
A propriedade e a floresta usam a mesma animação.

## Solo seco e molhado

Os canteiros agora têm canais rasos irregulares, torrões e grãos de terra. Os
quadrados vizinhos continuam unidos e as bordas externas são quebradas.

A versão regada preserva a forma do canteiro, escurece o marrom e adiciona
pequenos reflexos discretos. Substitui o antigo quadrado escuro desenhado sobre
as plantas. O estado vem da rega real e persiste com o save, inclusive ao trocar
de cenário; não muda consumo de água nem duração de crescimento.

O editor também mostra os canteiros secos e molhados da partida.

## Validação

- `npm run check`, `npm test` e `npm run build`: aprovados.
- 423 testes em 40 arquivos, incluindo geometria das pontes, travessia nos dois
  sentidos, bloqueios laterais em taxas de quadros diferentes e continuidade das
  ondas na virada do ciclo e nas bordas entre quadrados.
- `scripts/qa-property-bridges-water.cjs`: aprovado em Chromium.
- Duas pontes atravessadas a leste/oeste; aproximações pelos dois lados da água
  bloqueadas e personagem mantido no tabuleiro ao tentar sair pelo corrimão.
- 180.602 amostras visíveis de água: nenhum pixel sobre terra ou pontes.
- Quatro plantas criadas, duas regadas; exatamente duas cargas consumidas.
  Luminosidade média: 84,86 no solo seco e 53,94 no molhado.
- Recarregar restaura a terra molhada e as seis cargas restantes do regador.
- A passagem para a floresta preserva a rega e mantém a água animada.
- Nenhum erro de página.

Prévia e relatório: `propriedade-pontes-agua/`. Os PNGs secos/molhados são
exportações dos sprites reais do jogo, não montagens conceituais. O GIF/MP4 da
água registra o ciclo de renderização real, sem HUD.
