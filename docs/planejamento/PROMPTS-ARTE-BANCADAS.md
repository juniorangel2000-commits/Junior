# Prompts para o ChatGPT: bancadas (2 blocos de largura)

Pedido do Junior (16/11/2026): refazer a bancada de trabalho e criar a bancada de construção,
as duas ocupando **2 blocos de largura** no mapa (64 × 32 px de base no jogo).

Anexe junto, como referência de estilo:

- `public/assets/visual/world/workbench.png` (bancada atual);
- uma captura do jogo com a casa e as cercas (por exemplo, `docs/planejamento/luz-depois/casa-12h.png`).

Depois de gerar, mande os PNGs (ou um .zip) aqui no chat. O fundo branco é retirado por
script, e a franja branca do contorno também.

## 1. Bancada de trabalho (refeita)

```
Pixel art detalhado de uma BANCADA DE TRABALHO de madeira para um jogo de fazenda aconchegante,
no mesmo estilo da imagem de referência anexada (bancada atual do jogo): paleta quente, madeira
castanha com veios, contorno marrom-escuro, sombreamento suave, sem antialias borrado.

Vista de cima em 3/4, de frente (a mesma vista das casas e cercas do jogo), alinhada, SEM
isometria e sem perspectiva inclinada.

Formato: a bancada é LARGA, ocupando exatamente 2 blocos de largura por 1 bloco de
profundidade no chão (proporção da base 2:1). A altura total do desenho, com os objetos em cima,
é de cerca de 1,5 bloco. Quatro pés robustos, uma prateleira embaixo.

Em cima: martelo, serrote, plaina, caixa de ferramentas com cabos aparecendo, uma tábua sendo
trabalhada e uma morsa de ferro presa na ponta direita. Embaixo, na prateleira: caixa de madeira,
pote de pregos e um pano. Um lampião de ferro pendurado na lateral direita.

Um único objeto, centralizado, sem sombra no chão, sem texto, sem moldura. Fundo branco liso
(#FFFFFF) em volta de todo o objeto, sem cenário e sem grama.
Resolução alta (por exemplo 1024 × 768), pixels nítidos.
```

## 2. Bancada de construção (nova)

```
Pixel art detalhado de uma BANCADA DE CONSTRUÇÃO de madeira para um jogo de fazenda aconchegante,
no mesmo estilo da imagem de referência anexada (bancada de trabalho do jogo): paleta quente,
madeira castanha com veios, contorno marrom-escuro, sombreamento suave, sem antialias borrado.

Vista de cima em 3/4, de frente (a mesma vista das casas e cercas do jogo), alinhada, SEM
isometria e sem perspectiva inclinada.

Formato: a bancada é LARGA e mais pesada que a bancada de trabalho, ocupando exatamente 2 blocos de
largura por 1 bloco de profundidade no chão (proporção da base 2:1). A altura total do desenho,
com os objetos em cima, é de cerca de 1,5 bloco. Tampo grosso de pranchas, pés reforçados com
travessas, ferragens de ferro nos cantos.

Ela deve parecer de CARPINTARIA E OBRA, diferente da bancada de trabalho: em cima, uma pilha de
tábuas serradas, um esquadro de ferro, uma régua dobrável, um prumo pendurado, um serrote grande,
um balde com cavilhas e um maço de madeira. Encostados na lateral esquerda, alguns tijolos e uma
pedra cortada. Embaixo, uma prateleira com rolos de corda e uma caixa de pregos. Uma folha de
projeto (planta da casa) presa no tampo com pregos.

Um único objeto, centralizado, sem sombra no chão, sem texto, sem moldura. Fundo branco liso
(#FFFFFF) em volta de todo o objeto, sem cenário e sem grama.
Resolução alta (por exemplo 1024 × 768), pixels nítidos.
```

## Dicas

- Peça as duas na **mesma conversa**, uma depois da outra, para manter o mesmo estilo e a mesma
  escala. Se vierem em escalas diferentes, peça: "refaça a segunda com a mesma escala e a mesma
  altura de tampo da primeira".
- Se o ChatGPT desenhar em perspectiva isométrica, repita: "vista de frente em 3/4, como em
  jogos de fazenda vistos de cima, sem isometria".
- Quando as artes chegarem, as duas bancadas passam a ocupar 2 blocos no mapa. As bancadas já
  colocadas em saves antigos continuam no mesmo lugar.
