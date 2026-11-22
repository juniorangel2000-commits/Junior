# Mapa do vale

![Mapa do vale](mapa-do-vale.jpg)

O mapa junta todos os cenários externos. Cada um aparece na posição em que as saídas se encontram, e os pontos dourados marcam as passagens entre mapas.

Ele foi gerado em 2026-11-22 a partir do `captureMap()` de cada cena, numa partida nova ao meio-dia, já com o chão compartilhado das divisas, a curva da Estação, a foz arredondada da Costa e o Pomar Abandonado. Cada mapa foi capturado com 160 px de margem. Interiores, Mina, Cidade e dungeons ficam fora. O atlas do Codex, em `/workspace/afterrain-costa/`, inclui também a Mina Antiga, as Galerias, dungeons e interiores.

## Posição de cada mapa

Coordenadas em pixels, com a Propriedade em (0, 0). Cada mapa tem 3072 × 2304 px (96 × 72 ladrilhos), exceto o Platô, que tem 1536 × 1024.

| Mapa | Origem (x, y) | Como se encaixa |
| --- | --- | --- |
| Propriedade Abandonada | (0, 0) | Referência. |
| Vila | (3072, 0) | Saída leste da Propriedade (94, 52) ↔ borda oeste da Vila (1, 52). |
| Pomar Abandonado | (6144, 192) | Saída leste da Vila (94, 62) ↔ borda oeste do Pomar (1, 56). |
| Floresta Antiga | (−3072, 0) | Saída oeste da Propriedade (1, 52) ↔ borda leste da Floresta (94, 52). |
| Lago da Cachoeira | (0, −2304) | Saída norte da Propriedade (75, 1) ↔ base do Lago (75, 70). O rio do Lago entra na Propriedade em x≈1373–1532. |
| Estrada da Cidade | (3072, −2304) | Borda leste do Lago (94, 33) ↔ borda oeste da Estrada (1, 33). O portão norte da Vila fica em x=50 e a base da Estrada em x=48: diferença de 2 ladrilhos. |
| Ruínas | (6144, −2112) | A estrada passa por y=10 na Estrada da Cidade e por y=4 nas Ruínas. Por isso as Ruínas ficam 6 ladrilhos abaixo. |
| Estação Ferroviária | (9216, −2112) | Mesma estrada das Ruínas, y=4. |
| Platô da Nascente | (537, −3328) | Alinhado pelo rio: a água sai da base do Platô em x≈832–1019 e cai na cachoeira do Lago em x≈1440–1485. A escadaria do Lago fica em (34, 18), dentro do mapa. |
| Acampamento dos Sobreviventes | (−3488, −2304) | Saída norte da Floresta (35, 2) ↔ base do Acampamento (48, 70). Por isso ele fica 13 ladrilhos a oeste. |
| Pântano | (−3072, 2304) | Saída sul da Floresta (18, 70) ↔ topo do Pântano (18, 2). |
| Campos Abertos | (0, 2304) | Saída sul da Propriedade x=816 ↔ chegada norte dos Campos x=816. O rio da Propriedade (x≈1329–1475) continua nos Campos. |
| Costa das Marés | (0, 4608) | Saída sul dos Campos x=912 ↔ chegada norte da Costa x=912. O rio passa em x≈460–567 e deságua no mar. |

## Ajustes feitos para as junções

- **Campos:** a chegada norte foi de x=1536 para x=816, a mesma coluna da saída sul da Propriedade. Com a chegada antiga, os Campos teriam de ficar 720 px a oeste e cobririam parte do Pântano.
  - O rio entra nos Campos com a posição e a largura do rio da Propriedade.
  - A ponte norte fica na trilha principal.
  - O trecho antigo da trilha, que só levava à borda, voltou a ter capim e árvores.
- **Pântano:** agora tem só lagos, sem rio (`swampWaterDistance`). O canal central virou a lagoa da passarela e ganhou uma lagoa nova ao sul. Nenhuma água encosta nas bordas. O jacaré do canal foi para a lagoa da passarela, em (49, 45).
- **Chão compartilhado nas divisas** (`src/valley-seams.ts` e `src/data/valley-seams.ts`). É a mesma técnica da divisa Floresta ↔ Propriedade (`map-seam-ground`).
  - Numa faixa de 256 px de cada lado, o chão vai virando uma mistura das texturas de floresta, grama, prado e musgo, calculada em coordenadas do vale. Junto à linha, os dois mapas mostram exatamente os mesmos pixels.
  - Perto do Pântano a paleta é `marsh`, com mais musgo e lama.
  - Ficam de fora a água de cada mapa e os trechos `open`, onde trilha, estrada ou rio atravessam e cada lado já está alinhado.
  - A faixa fica em −89, acima do terreno pintado no F2 (−90) e abaixo de objetos e personagens. No Platô fica em −69.
  - `VALLEY_LAYOUT` guarda a posição de cada mapa no vale, e `VALLEY_SEAMS` guarda as divisas.
- **Copas nas bordas:** as árvores junto à borda passam da linha do mapa. Por isso o mapa do vale é capturado com 160 px de margem e as copas cobrem a divisa, como no jogo.
- **Sem ajuste:** a diferença de 2 ladrilhos entre a Vila e a Estrada da Cidade não muda nada visível. Mexer na trilha da Estrada deslocaria árvores com edições do F2.

## Pontos abertos

- A estrada da Estação continua até a borda leste, à espera de um destino. A linha principal curva para o sul junto à borda oeste e termina entre as árvores, dentro da Estação.
- O rio do Platô também chega pela borda norte. A nascente fica fora do mapa.
