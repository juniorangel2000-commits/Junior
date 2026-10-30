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

O limite simultâneo foi dobrado de 240 para 480 nos dois modos. O orçamento da rodada 50 continua em 311 inimigos; o limite é a capacidade máxima, não uma quantidade obrigatória por rodada. Ao atingir o limite, novas chegadas aguardam espaço.

## Ritmo compartilhado

No começo, são dois inimigos por grupo a cada 1,5 segundo. No fim, são quinze por grupo a cada 0,6 segundo, fora dos respiros. A velocidade base cresce continuamente em até 50%, mantendo o bônus limitado por nível. Novos inimigos recebem o perfil atual; os existentes conservam seus atributos. Zumbis comuns continuam mais lentos que a velocidade base do jogador, mesmo com o maior bônus de nível.

## Validação

A suíte verifica que todas as rodadas superam duas vezes a contagem do primeiro ajuste, que uma nova partida começa com 16 inimigos previstos, que o orçamento é aplicado ao avançar e que os atributos dos dois modos coincidem no mesmo progresso e nível. Também verifica que o tempo gasto na mesma rodada não aumenta a dificuldade.

O resumo das simulações está em SIMULACOES.json. São simulações determinísticas do motor, com atributos permanentes no nível 5, e não uma taxa de vitória humana ou medição da renderização. Os resultados do modo de tempo incluem pets; a simulação atualizada das rodadas usa a combinação control sem pet.

Na simulação atualizada das rodadas, o robô concluiu 50 rodadas com 8.163 eliminações, nível 230 e pico de 247 inimigos. O tempo foi de 2.696 segundos de jogo. O alinhamento é por progresso e pressão de combate; a duração real das rodadas depende da eliminação da horda.

As outras correções desta revisão foram verificadas no Chromium: vídeo imediato na confirmação com imagens da dungeon bloqueadas, Pular bloqueado até preparar os recursos, retorno ao menu sem repetir a viagem, ausência de rolagem horizontal no maior zoom e chuva contínua nas emendas de 12 e 24 segundos.


## Testes do limite de 480

A suíte completa passou: 1.248 testes em 141 arquivos, além do build de produção. Os novos testes geram 480 inimigos reais nos dois mapas, recusam o próximo spawn, validam o snapshot e restauram a horda completa.

As cinco simulações com atributos permanentes de nível 5 terminaram com três vitórias e duas derrotas. O modo de tempo chegou a 480 inimigos simultâneos. O P95 do tempo de atualização do motor ficou entre 0,109 e 0,807 ms nesta execução; isso exclui direção do robô, renderização e GPU. Os resultados não representam uma taxa de vitória humana.

O teste de navegador cria uma situação sintética com 480 inimigos de alta vida e jogador protegido, para testar atualização, renderização e saída ao menu sem confundir o resultado com sobrevivência real. Os dois mapas renderizaram 480 sprites, recusaram excedentes e retornaram ao menu sem erros de JavaScript. A renderização usa Chromium com SwiftShader; não mede o desempenho do executável no Windows nem garante FPS no computador do jogador.

A comparação sintética com 30 quadros por amostra apresentou os seguintes intervalos medianos entre quadros:

| Mapa | 240 inimigos | 480 inimigos |
| --- | --- | --- |
| Praça | 168,1 ms | 254,9 ms |
| Estacionamento | 159,5 ms | 229,2 ms |

O custo aumentou cerca de 44% a 52% no renderizador por software. São amostras curtas, com 240 medidos após 480, e não um benchmark controlado de GPU. Os dados brutos estão em RENDERIZACAO-480.json. Não houve confirmação de FPS no Windows.
