# Primeira vara e descoberta da vila

Novas partidas começam com `damiaoIntroduction: false`, sem vara e com as duas entradas da vila fechadas: o acesso leste da propriedade e a passagem sul do acesso à cidade. As cercas temporárias são apenas apresentação; colisão e transição também verificam a autorização. Não fazem parte das construções do jogador e não podem ser removidas para pular a descoberta.

Antes do primeiro encontro, Damião aguarda na varanda da cabana do lago, inclusive fora de seu horário habitual. A conversa apresenta o pescador, informa que a vila fica à direita/leste da propriedade e oferece uma vara gratuita. Somente o botão final de receber o presente grava a vara e a liberação da vila na mesma transação. Fechar a conversa antes disso não libera o acesso. A compra e os serviços não aparecem antes de receber o presente.

Mochila cheia ou falha de gravação mantêm ambos os estados anteriores, com uma mensagem explicando como tentar novamente. Receber o presente outra vez é recusado. Após a apresentação, voltam a valer a rotina normal de Damião, as aulas e os preços existentes; a aula de pesca e as iscas continuam necessárias para pescar.

Saves anteriores sem o campo novo preservam o acesso e o inventário já existentes. A retomada de uma partida no acesso à cidade continua possível antes da apresentação, sem liberar sua saída para a vila. A versão do save continua 4.

Validação: `tests/village-introduction.test.ts` cobre novas partidas, compatibilidade, transação única e as barreiras; `scripts/qa-damiao-introduction.cjs` percorre o bloqueio, a conversa, o presente, o carregamento e a entrada real na vila. `scripts/qa-fisher-cabin.cjs` cobre o atendimento normal após a apresentação.
