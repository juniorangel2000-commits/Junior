# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-14
- **Por:** Claude Code
- **Continuar a partir de:** branch `release/v0.10.0-preview.34`, HEAD do branch (revisão em `ad98016`).
- **Última versão publicada:** `v0.10.0-preview.33`.
- **Estado:** etapas 1–4 de cultivos prontas e conferidas de ponta a ponta. **Etapa 5 (doma do cavalo) ainda não implementada.** Não publicado.

## Feito nesta rodada

- O Junior pediu para verificar a doma desde o dia 1. Constatado: **não existe cocho, confiança, estábulo nem uso da cesta**; a cesta só fica guardada. A cadeia até a cesta foi verificada no jogo.
- Novo roteiro `scripts/qa-harvest-chain.cjs` (Chromium, Vite em 5190), usando a loja real da Rosa e o serviço real da Helena:
  1. Primavera 1, Ano 1 na interface.
  2. Compra de sementes de cenoura, morango e milho; a Rosa não oferece colheitas.
  3. Na Primavera: cenoura e morango plantados; milho recusado sem gastar a semente.
  4. Rega diária: cenoura colhida no dia 7, morango no dia 9.
  5. Na virada para o Verão 1, o pé de morango murcha e a colheita guardada continua na mochila.
  6. Milho plantado no Verão e colhido no dia 37 (Verão 9); o pé fica para rebrotar.
  7. A Helena preparou 1 cesta: −1 cenoura, −1 morango, −1 milho, −20 C.
  8. Nenhum erro de JavaScript.
- Revisão do trabalho do Codex (etapas 3 e 4): 1.910 testes passaram.
  - Nenhuma loja vende colheitas.
  - A Rosa vende as sementes; o Augusto continua com a de nabo e a Amélia vende ervas.
  - A Rosa, a Helena, a Celina e o Augusto compram colheitas.
  - A cesta pede exatamente 1 cenoura + 1 morango + 1 milho + 20 C.
  - Os nomes com acento estão corretos no jogo; a falha de acentos é só nos rótulos da imagem `docs/planejamento/qa-catalogo-cultivos/catalogo.png`.
- Correção: o aviso de plantio fora de estação dizia "não cresce no Primavera"; agora usa `IN_SEASON` ("na Primavera", "no Verão", "no Outono", "no Inverno").

## Em andamento e próximo passo exato

- **Etapa 5: domesticação do cavalo** (pedido original do Junior), seguindo `docs/planejamento/DOMESTICACAO-CAVALO.md`:
  - Estábulo para 1 cavalo, com madeira nobre, usando a arte do curral até haver arte própria.
  - Cocho nos Campos Abertos que recebe o item `harvestBasket` e guarda até 3 cestas.
  - Confiança: +1 por virada de dia com cesta no cocho, no máximo 1 por dia, 7 dias; dia sem cesta pausa sem perder progresso.
  - Comportamento por fase: dias 1–2 de longe; 3–4 tolera menos distância; 5–6 come com o jogador perto; dia 7 se aproxima.
  - Nome, e **corda só depois da doma completa**; condução até o estábulo na Propriedade.
  - Persistência sem duplicação.
- Pontos técnicos: a corda hoje só aceita `FOREST_ANIMALS` e transfere da Floresta para a Propriedade (`src/systems/animals.ts`, `src/animals.ts`). O cavalo (`field-horse-1`, em `FIELDS_ANIMALS`) precisa de transferência dos Campos para a Propriedade e de representação na Propriedade. `assignFarmAnimal` também só conhece `FOREST_ANIMALS`.

## Pendências e ideias para depois

- Texto da missão "Primeira colheita": diz "Plantar nabo"/"Colher o primeiro nabo", mas aceita qualquer plantação. Em saves que estejam fora da Primavera, o nabo não pode ser plantado; trocar o texto por "uma semente da estação"?
- Sementes especiais para o ano todo: etapa futura.
- Contratos de nabo da Helena e da Rosa continuam ativos.
- Clima/chuva regando, peixes por estação, árvores frutíferas e estufa: etapa 6.
- Ipês: machadinha de Ferro ou melhor, 6 golpes, Ferro 1 / Ouro 2 / Metal Negro 3. Construções de animais exigem madeira nobre.
- Quadros de deitar, descansar e levantar do cavalo preservados e ainda sem uso.
- Produção animal, variedade dos campos, caça e editor F2 pendentes; preservar ids salvos das moitas.

## Problemas conhecidos

- O pacote continua na preview.33 até a publicação autorizada da preview.34.
- Todas as sementes ficam à venda o ano todo; o plantio recusa fora de estação e explica o motivo.
- Ritmo: cenoura em 6 dias regados, morango em 8 e milho em 8. A primeira cesta só sai no Verão (dia 37 no melhor caso), por decisão do Junior.
- `src/art.ts` mantém as texturas antigas `crop-0..2`, sem uso nos canteiros.
- Repositório: `https://github.com/juniorangel2000-commits/Junior.git`.

## Testes

- `npm run check`: ok.
- `npm test`: **1.910 passaram, zero falhas, 216 arquivos** (estado deixado pelo Codex). Depois da correção, os testes de cultivo, catálogo, calendário e cesta passaram (45).
- `npm run build`: não executado (sem publicação).
- Chromium: `scripts/qa-harvest-chain.cjs` passou do início ao fim, como descrito acima.
