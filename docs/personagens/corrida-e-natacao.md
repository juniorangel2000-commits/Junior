# Corrida e natação

Segurar Shift enquanto se movimenta ativa a corrida dos dois personagens, com velocidade 50% maior e as oito direções dos pacotes Running enviados. Soltar Shift volta à caminhada; parar ou encontrar um obstáculo interrompe o ciclo. A cadência acompanha a distância efetivamente percorrida. Os pontos de apoio dos itens na mão têm referências próprias para a corrida.

A água é acessível ao jogador na propriedade, floresta, vila, acesso à cidade, Lago entre as Serras e áreas de água pintadas nas duas dungeons. A profundidade define a transição entre caminhar na água rasa e nadar. Shift não acelera a natação. Os obstáculos sólidos, as construções, os penhascos, os barcos e as proteções dos píeres e pontes continuam bloqueados; a navegação terrestre dos NPCs e companheiros mantém suas regras.

Posições salvas dentro da água continuam válidas ao carregar. A restauração das dungeons também preserva a posição do jogador na água, e pausar não desfaz a apresentação de natação. Pisos de pontes e píeres permanecem secos.

Validação: `player-running.test.ts`, `running-assets.test.ts` e `all-water-swimming.test.ts`. A verificação no navegador está em `scripts/qa-running-swimming.cjs`.
