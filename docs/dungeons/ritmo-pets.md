# Ajuste de ritmo dos pets após a preview.15

A caminhada no mundo normal passa de 110 para 72 unidades por segundo, com corrida a 104 somente quando a distância supera 160. Os bônus de velocidade adquiridos continuam aplicados. Na dungeon, a velocidade base passa de 112 para 72 no cachorro e de 140 para 78 no gato; a recuperação de distância usa 1,45× a base. A apresentação diferencia caminhada e corrida.

Caminhada, idle e transições usam 6 fps; corrida usa 8 fps. O repouso usa 4 fps. O gato esperando permanece no primeiro frame de repouso, inicia uma sequência lenta após quatro segundos e volta a ficar quieto. O ciclo se repete a cada dez segundos, congelando durante a pausa. Sentar e levantar também ficam mais lentos.

Ataques mantêm os 10 fps anteriores, contato aos 0,6 segundo e duração de 0,8 segundo. O campo opcional `running` no snapshot preserva a apresentação de locomoção e aceita saves anteriores sem esse campo.

Validação: 52 testes direcionados aprovados, incluindo repouso intermitente, navegação, comandos, snapshots e dano dos saltos; build de produção aprovado. Alterações locais, ainda não publicadas.

## Movimentação livre

Os pets deixam de buscar um ponto fixo colado ao jogador. Circulam numa faixa aproximada de 70–110 unidades, alternando deslocamentos curtos e pausas, e reagrupam quando a distância passa de 190. Nas dungeons podem alcançar inimigos próximos por conta própria, respeitando obstáculos e uma distância limitada do jogador. Os destinos são determinísticos e não consomem a aleatoriedade do combate; retomar um save mantém o movimento reproduzível. Esperar aqui continua impedindo deslocamento no mundo normal.

Validação desta etapa: 1.162 testes completos aprovados, build aprovado e simulações do modo de 15 minutos sem saves inválidos. O caso com cachorro concluiu os 900 segundos, nível 647. Ainda sem publicação.
