# Hordas progressivas

O começo permanece com dois inimigos por grupo no modo de 15 minutos e sete inimigos na primeira rodada. A pressão aumenta pelos grupos, pela frequência de chegada e pela velocidade. Vida, dano e bônus de experiência mantêm as regras anteriores.

| Medida | Antes | Agora |
| --- | --- | --- |
| Grupo final no modo de 15 minutos | 12 | 15 |
| Intervalo final, fora dos respiros | 0,65 s | 0,60 s |
| Grupo final no modo de rodadas | 6 | 8 |
| Inimigos previstos para a rodada 50 | 105 | 141 |
| Velocidade ao fim, sem fator de nível | +30% | +50% |
| Limite simultâneo | 240 | 240 |

No modo de 15 minutos, os intervalos diminuem continuamente entre as fases e os grupos aumentam nas transições. As janelas breves de respiro continuam existindo. No modo de rodadas, cada rodada acrescenta dois ou três inimigos e o intervalo entre grupos diminui gradualmente. Uma rodada já salva mantém o restante registrado; a nova contagem vale ao começar a próxima.

A velocidade aumenta continuamente conforme o tempo ou a rodada e conserva o bônus limitado por nível. Novos inimigos recebem o perfil atual; os já existentes mantêm seus atributos. Zumbis comuns continuam mais lentos que a velocidade base do jogador, mesmo com o maior bônus de nível. Corredores continuam sendo a ameaça mais rápida.

## Validação

- 1.244 testes em 141 arquivos, incluindo pressão crescente, velocidade, limites e avanço real para a próxima rodada.
- Build de produção.
- Simulações determinísticas dos dois modos e de variações de pets, com os atributos permanentes no nível 5. São testes do motor e não uma taxa de vitória humana ou medição da renderização.
- O fluxo da viagem foi testado com as imagens da dungeon bloqueadas: o vídeo entra imediatamente no DOM, começa a reproduzir antes da liberação dos recursos e mantém Pular bloqueado. Após carregar, o mesmo vídeo continua até a conclusão ou escolha de pular.
- A tela inicial foi verificada em três tamanhos, inclusive no maior zoom, sem rolagem horizontal. Web Audio renderizou duas emendas da chuva sem redução perceptível de energia.

Nas cinco simulações com a mesma seed e atributos de nível 5, quatro concluíram o desafio e uma terminou em derrota (gato comum, 214 segundos). O pico foi de 240 inimigos no modo de tempo e 140 nas rodadas. As combinações alteram a sequência do combate; uma seed e um robô não estabelecem a dificuldade para jogadores. O resumo está em SIMULACOES.json.
