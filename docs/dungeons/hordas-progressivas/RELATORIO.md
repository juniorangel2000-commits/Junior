# Hordas progressivas

A dificuldade dos dois modos usa o mesmo progresso relativo. A rodada 1 corresponde ao início do modo de 15 minutos, a rodada 25 a aproximadamente 49% e a rodada 50 à reta final. Vida, dano, velocidade, chance de especiais e corredores e ritmo de chegada usam os mesmos perfis no mesmo progresso e nível do jogador.

O modo de tempo mantém suas janelas breves de respiro. O modo de rodadas mantém os intervalos entre rodadas, sem inserir uma pausa no meio da horda por tempo transcorrido. Demorar na mesma rodada não aumenta seu perfil de dificuldade.

## Quantidade no modo de rodadas

Cada rodada usa 2,2 vezes o orçamento do primeiro ajuste de hordas, com arredondamento para cima. A primeira rodada também recebe a nova contagem; uma rodada já salva conserva o restante registrado até avançar para a próxima.

| Rodada | Primeiro ajuste | Atual |
| --- | --- | --- |
| 1 | 7 | 16 |
| 10 | 31 | 69 |
| 25 | 73 | 161 |
| 50 | 141 | 311 |

O limite de inimigos simultâneos continua em 240. Uma rodada pode ter mais inimigos no total: novos grupos entram conforme há espaço, sem ultrapassar o limite. Isso preserva a capacidade de renderização enquanto aumenta a horda total.

## Ritmo compartilhado

No começo, são dois inimigos por grupo a cada 1,5 segundo. No fim, são quinze por grupo a cada 0,6 segundo, fora dos respiros. A velocidade base cresce continuamente em até 50%, mantendo o bônus limitado por nível. Novos inimigos recebem o perfil atual; os existentes conservam seus atributos. Zumbis comuns continuam mais lentos que a velocidade base do jogador, mesmo com o maior bônus de nível.

## Validação

A suíte verifica que todas as rodadas superam duas vezes a contagem do primeiro ajuste, que uma nova partida começa com 16 inimigos previstos, que o orçamento é aplicado ao avançar e que os atributos dos dois modos coincidem no mesmo progresso e nível. Também verifica que o tempo gasto na mesma rodada não aumenta a dificuldade.

O resumo das simulações está em SIMULACOES.json. São simulações determinísticas do motor, com atributos permanentes no nível 5, e não uma taxa de vitória humana ou medição da renderização. Os resultados do modo de tempo incluem pets; a simulação atualizada das rodadas usa a combinação control sem pet.

Na simulação atualizada das rodadas, o robô concluiu 50 rodadas com 8.163 eliminações, nível 230 e pico de 240 inimigos. O tempo foi de 2.685 segundos de jogo. O alinhamento é por progresso e pressão de combate; a duração real das rodadas depende da eliminação da horda.

As outras correções desta revisão foram verificadas no Chromium: vídeo imediato na confirmação com imagens da dungeon bloqueadas, Pular bloqueado até preparar os recursos, retorno ao menu sem repetir a viagem, ausência de rolagem horizontal no maior zoom e chuva contínua nas emendas de 12 e 24 segundos.
