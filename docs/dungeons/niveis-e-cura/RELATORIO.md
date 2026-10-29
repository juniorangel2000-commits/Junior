# Níveis contínuos, dificuldade e cura no chão

Revisão local posterior à preview.13. Sem publicação.

Depois de maximizar todas as cartas compatíveis, a experiência continua aumentando os níveis e a HUD mostra o progresso real. Não há escolhas vazias, novas melhorias além dos limites ou cura automática ao subir esses níveis. A contagem usa uma operação em lote quando o custo já atingiu o teto, evitando recursão para grandes quantidades de XP. Saves aceitam níveis acima de 500 e preservam seu progresso.

Completar as cartas continua exigindo níveis 144–152 sem pet ou 160–168 com pet, conforme as quatro armas escolhidas. O pet adiciona 16 melhorias. Esses totais incluem os três desbloqueios de armas e o nível inicial.

## Dificuldade por nível

Além do crescimento por tempo ou rodada, cada nível acima do primeiro acrescenta 0,2% à vida, 0,06% ao dano e 0,02% à velocidade dos novos inimigos. O bônus de velocidade para em +20%; vida e dano continuam crescendo. Os multiplicadores de nível são combinados com os do estágio e com os atributos próprios dos chefes. Inimigos já presentes mantêm os atributos recebidos ao nascer.

## Cura

- Até três itens de cura no chão.
- Intervalo compartilhado de pelo menos 12 segundos entre drops e eventos de cura, preservado no save.
- Inimigos comuns: 1% de chance, recuperação de 10 pontos.
- Especiais: 8% de chance, recuperação de 15 pontos; com Instinto de Sobrevivência, chance de 18%.
- Chefes tentam deixar cura de 25 pontos, respeitando os limites de espaço e intervalo.
- Eventos de cura recuperam 20 pontos e seguem os mesmos limites.
- Itens de cura permanecem no chão enquanto o jogador está com a vida cheia.

Os limites controlam novas aparições. Curas já presentes em saves antigos não são apagadas.

## Validação

1.110 testes aprovados em 119 arquivos. TypeScript e build de produção aprovados; permanece o aviso conhecido do Vite sobre tamanho do bundle.

Dez simulações completas do motor real: três de cinco partidas da praça sobreviveram e completaram todas as melhorias. Uma partida com pet completou as melhorias e morreu depois. As cinco partidas do estacionamento concluíram a rodada 50; duas maximizaram as cartas e três terminaram com melhorias faltando. Foram observados níveis acima de 500 e snapshots válidos. O bot utiliza escolhas legais e coleta real, sem XP concedido por fora; não substitui avaliação humana de dificuldade ou desempenho no Windows.

[Simulações](simulacoes.json)

58 verificações integradas aprovadas no Chromium, sem erros JavaScript, HTTP ou WebGL registrados. Incluem descrições nas cartas de armas, drops por categoria, chefes nos cinco horários, níveis acima de 500 após todas as cartas, HUD, salvamento e retorno. [Validação](validacao.json).

## Descrições nas cartas de armas

As sete armas possuem descrições próprias de funcionamento nas ofertas do Arsenal. As mesmas descrições são aplicadas ao retomar uma escolha salva, substituindo o texto genérico antigo. Foram aprovados mais 67 testes direcionados e um novo build após essa alteração de texto.
