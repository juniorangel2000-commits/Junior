# Domesticação do cavalo — direção proposta pelo Junior

Ideia recebida após integrar a sprite enviada pelo Junior. Ainda não implementada.

- Estábulo concluído é pré-requisito para começar a domesticação.
- Um NPC vende/prepara comida especial exigindo vegetais específicos da colheita do jogador.
- Jogador deixa essa comida nos Campos Abertos; barra de confiança cresce gradualmente.
- São necessários sete dias para domar o cavalo. Evitar completar o processo repetindo ofertas no mesmo dia.
- Cavalo selvagem corre muito mais rápido que o jogador, impedindo domesticação por aproximação direta.

Pontos a definir com Junior: NPC responsável, vegetais e quantidades, construção
do estábulo, manutenção/alimentação e funcionamento da montaria após domar.
Hoje a agricultura oferece nabo; outros vegetais exigem ampliar o cultivo.
A velocidade atual de fuga usa o fator genérico dos animais (.9 da velocidade
básica), e precisa de ajuste específico para superar também a corrida do jogador.

Sugestões ainda não aprovadas: ponto de alimentação persistente perto da clareira;
um avanço diário consumindo comida; estoque para alguns dias; dias sem comida
pausam o vínculo sem apagar o progresso; comportamento gradualmente mais confiante;
último dia permite aproximação voluntária e apresentação do cavalo pelo jogador.
Salvar/carregar e trocar de cenário devem preservar vínculo, consumo e dia já contado.
