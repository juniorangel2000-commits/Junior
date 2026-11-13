# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-13
- **Por:** Codex
- **Continuar a partir de:** branch `release/v0.10.0-preview.34`, implementação `881ab9f`; usar o HEAD com esta passagem e ajuste do QA.
- **Última versão publicada:** `v0.10.0-preview.33`.
- **Estado:** concluído e validado; não publicado nesta rodada.

## Feito nesta rodada

- Integrado o segundo ZIP do cavalo enviado pelo Junior, preservado em `referencias/animais/create_a_horse_with_medium_details-v2.zip`.
- 308 quadros originais preservados; os 180 anteriores são idênticos. Atlas reorganizado em 16 colunas, 3.072 × 3.840 pixels, abaixo de 4.096 por eixo. Índices anteriores preservados.
- `HorseIdleCycle`: ações especiais finitas com intervalos individuais de 8–15 segundos; começar a comer → comer por 4–7 segundos → terminar. Movimento de cabeça toca uma vez e retorna ao repouso. Pausa congela o ciclo.
- Alimentação inicia perto de capim crescido e com jogador afastado; transições completam antes de fugir quando o jogador se aproxima. Corpo físico permanece parado.
- Fuga do cavalo agora é 2,2 vezes a velocidade básica, superior ao jogador correndo com botas. Outros animais preservam sua velocidade.
- Intervalo inicial das vacas ajustado para 8–15 segundos; descanso já era finito. Demais animais têm poses estáticas no repouso.
- GIF e validação em `docs/cenarios/cavalo-campos-abertos/alimentacao/`.
- Atualizado o plano de doma com as ideias aceitas e a regra expressa do Junior: corda SOMENTE depois de domado.

## Em andamento e próximo passo exato

- Implementar a cadeia de domesticação em uma etapa própria, seguindo `docs/planejamento/DOMESTICACAO-CAVALO.md`: estábulo pronto, comida de NPC exigindo vegetais da colheita, cocho nos campos e confiança por sete dias alimentados, no máximo um avanço por dia; dia sem comida pausa sem perda.
- Helena foi sugerida para preparar a mistura. Definir vegetais, quantidades, preço e estábulo; hoje o cultivo disponível é nabo.
- Dias 1–2 afastado, 3–4 tolerância menor à distância, 5–6 come na presença do jogador, dia 7 aproximação voluntária, nome e corda para conduzir ao estábulo. Captura direta antes da doma é proibida.
- Pastar nesta versão é visual e NÃO concede confiança. Cocho, comida especial, barra de confiança, estábulo de cavalo, corda para cavalo e montaria ainda não estão implementados.
- Publicar preview.34 somente quando solicitado; main e tags continuam na preview.33.
- Junior alternará para Claude quando seus créditos chegarem perto de 10%; ao receber “limite”, encerrar imediatamente com WIP e passagem. Não temos leitura do saldo de créditos.

## Pendências e ideias para depois

- Quadros de deitar, descansar e levantar do cavalo estão preservados, mas ainda não usados.
- Ipês exigem machadinha de Ferro ou melhor e seis golpes; madeira nobre: Ferro 1, Ouro 2, Metal Negro 3, mais dois galhos; rebrota em sete dias.
- Galinheiro exige seis madeiras nobres, curral dez; novas construções de animais também exigem madeira nobre.
- Refinamento anterior dos personagens trabalhando permanece em `docs/personagens/trabalho-refinado/`.
- Produção animal, variedade visual dos campos, caça e editor F2 continuam pendentes; preservar IDs salvos das moitas.
- Calendário sazonal adiado até concluir os cenários.

## Problemas conhecidos

- Pacote ainda usa preview.33 até publicação autorizada da preview.34.
- A primeira execução do QA importou uma segunda instância do renderer e perdeu o WeakMap de sprites. O QA foi corrigido para usar `world.update` do próprio cenário; a execução final passou. Não confundir com erro na execução normal do jogo.

## Testes

- `npm ci`: ok.
- `npm run check`: ok antes e depois.
- `npm test`: baseline 1.856 passaram; final **1.861 passaram, zero falhas, 211 arquivos**.
- Testes específicos: 16 passaram, cobrindo ordem, duração, cooldown, pausa, interrupção, quadros, colisão, persistência e fuga mais rápida que corrida.
- `npm run build`: não executado (sem publicação nesta rodada).
- Chromium: sequência completa e movimento de cabeça com intervalos, 31 quadros distintos, posição física estável, atlas dentro do limite, nenhum erro JavaScript.
