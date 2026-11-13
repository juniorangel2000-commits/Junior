# Alimentação e ações de repouso

`HorseIdleCycle` controla ações finitas, com pausa independente de 8–15 segundos.
O cavalo baixa a cabeça, come por 4–7 segundos e levanta a cabeça. Na próxima
ação, mexe a cabeça uma vez; depois volta ao intervalo de repouso. Caminhada,
proximidade do jogador e pausa impedem o início. Uma aproximação durante a
alimentação solicita o encerramento, sem cortar a transição inicial pela metade.

O corpo e a colisão ficam parados durante a ação. O renderer usa os quadros
originais do pacote, sem deformação. A direção da alimentação usa frente/costas,
as duas vistas disponíveis no arquivo enviado pelo Junior.

O GIF mostra a sequência de alimentação nas duas vistas. O loop do GIF é uma
prévia; no jogo existe a pausa de 8–15 segundos entre ações. A alimentação visual
não consome a futura mistura de vegetais nem aumenta confiança da domesticação.

O ciclo de descanso das vacas já tinha duração limitada; o primeiro intervalo foi
ajustado para a mesma faixa de 8–15 segundos. Os demais animais atualmente usam
poses estáticas no repouso, sem uma animação especial rodando continuamente.

Validação no cenário real: `scripts/qa-horse-idle.cjs`. O teste usa o renderer do
próprio cenário, evitando criar outra instância do módulo que registra sprites.
