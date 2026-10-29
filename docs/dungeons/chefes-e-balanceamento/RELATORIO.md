# Chefes com identidade e revisão de balanceamento

Etapa local posterior à preview.13. Sem publicação. As novas animações de caminhada são provisórias; foram fornecidas frentes para o usuário preparar as animações definitivas.

## Chefes

| Rodada | Chefe | Comportamento |
| --- | --- | --- |
| 10 | O Demolidor | Impacto circular no chão após um aviso de 1,6 s. |
| 20 | A Sentinela | Investida de 260 pixels numa faixa fixada antes do movimento. |
| 30 | O Acorrentado | Varredura de correntes num arco à frente, com direção fixada no aviso. |
| 40 | O Contaminado | Marca a posição do jogador e deixa uma área contaminada por 3,2 s. |
| 50 | O Devorador | Alterna investida, impacto, correntes e contaminação. Abaixo de metade da vida, reduz o intervalo entre golpes. |

Foram criados cinco atlas exclusivos com quatro direções e quatro frames por direção. Os arquivos originais permanecem intactos; manifests descrevem os recortes e hashes. A escala do Devorador é maior no jogo. Não foram alterados os aumentos de vida e dano definidos anteriormente para as rodadas 10/20/30/40/50.

Os avisos usam contornos e formas distintas, além de cor e descrição na HUD. O alvo é fixado quando o aviso começa. Investidas respeitam obstáculos e mantêm sua trajetória durante empurrões. Os ataques compartilham defesa, proteção do pet, escudo e intervalo de invulnerabilidade do contato comum. A contaminação não aplica dano a cada frame. Durante avisos e recuperação, o chefe para de andar e usa uma pose fixa.

Timers, alvo, direção, sequência e estado de impacto são preservados no save. Saves antigos sem esse estado recebem uma recarga inicial segura. Se uma alteração de mapa exigir mover o chefe ao carregar, o golpe pendente é cancelado para evitar uma trajetória diferente do aviso.

## Progressão e navegação

O teto de custo por nível foi reduzido de 90 para 89 XP. Na praça, a experiência obtida ao derrotar inimigos cresce progressivamente até +25% nos minutos finais, acompanhando o aumento da pressão. Não há experiência concedida apenas por tempo decorrido. As ofertas de armas continuam nos níveis 10/30/50 e as melhorias continuam limitadas à combinação escolhida.

Uma simulação revelou um perseguidor preso junto a um carro na rodada 46. O desvio salvo deixara de ser alcançável. A navegação agora verifica o segmento até o desvio e recalcula a rota quando necessário. O caso capturado foi incluído nos testes de regressão.

## Partidas completas simuladas

O bot utiliza o motor real, movimentação sujeita a colisões e escolhas legais das cartas aleatórias. Não recebe armas ou XP por fora do jogo. Ele reage às mesmas áreas de aviso visíveis ao jogador. São duas preferências de Arsenal, duas sementes e uma partida adicional com cão por mapa. São apenas dez partidas; estes resultados não medem a chance de vitória de jogadores humanos.

- Antes: três de cinco partidas da praça sobreviveram; duas completaram todas as melhorias. Cinco de cinco partidas do estacionamento terminaram.
- Depois: cinco de cinco partidas da praça sobreviveram e completaram todas as melhorias compatíveis entre 8:29 e 13:25, antes do limite de 15 minutos.
- Na repetição final do estacionamento, cinco de cinco partidas terminaram a rodada 50, em aproximadamente 23 a 36 minutos. Quatro completaram todas as melhorias; uma terminou com um nível de melhoria faltando.

A melhoria de sobrevivência nesta amostra não deve ser interpretada como medida estatística de dificuldade. Ainda é necessária avaliação humana da pressão das hordas, leitura dos golpes e prazer de jogar. Não foi medido FPS em computadores Windows.

[Simulações anteriores](simulacoes-antes.json) · [Simulações finais](simulacoes-finais.json)

## Validação

A suíte completa passou em 1.080 testes, em 117 arquivos. TypeScript e build de produção aprovados. Permanece o aviso conhecido do Vite sobre tamanho do bundle.

49 verificações integradas aprovadas no Chromium, sem erros JavaScript, HTTP ou WebGL registrados. Foram verificadas as cinco artes com 16 frames, avisos inofensivos, habilidades ativas, salvamento dos golpes, cartas, chefe final, HUD em telas de 1600/680/521/390 pixels e retorno da expedição. Os encontros individuais usam estados controlados para inspeção; as partidas completas estão registradas separadamente nas simulações.

[Demolidor](chefe-10-aviso.png) · [Sentinela](chefe-20-aviso.png) · [Acorrentado](chefe-30-aviso.png) · [Contaminado](chefe-40-ativo.png) · [Devorador](chefe-50-aviso.png) · [Validação](validacao.json)

## Frentes para animação

Os cinco chefes foram exportados em PNG RGBA de 256 × 256 pixels, com o mesmo alinhamento. Os arquivos estão em [frentes-256](frentes-256/LEIA.md). Também foram criados um zumbi entregador e uma zumbi moradora, ambos frontais, em PNG RGBA de 256 × 256. São fontes para o usuário animar; a caminhada dos inimigos no jogo permanece com os atlas existentes até a integração das animações definitivas.

### Revisão da frente do Demolidor

A pedido do usuário, a frente de referência foi redesenhada sem equipamento, com mãos vazias e os pés apoiados, para simplificar a geração da caminhada. O PNG continua em 256 × 256. O atlas de caminhada do jogo permanece provisório até a integração das animações definitivas. [Prompt atualizado](frentes-256/PROMPT-DEMOLIDOR.md).

### Referências em pose neutra

As frentes da Sentinela, do Acorrentado, do Contaminado e do Devorador foram redesenhadas com os dois pés apoiados, pernas em repouso e braços relaxados. O Demolidor sem equipamento e os dois zumbis já estavam neutros e foram preservados. Os sete PNGs foram conferidos em 256 × 256, com transparência e a mesma referência de origem (128, 235). Esta revisão se limita às fontes de animação.
