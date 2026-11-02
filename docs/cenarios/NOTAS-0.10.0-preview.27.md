# After Rain 0.10.0-preview.27 — Acampamento, sobreviventes e espada

Um novo acampamento ao norte da Floresta Antiga traz visitantes pacíficos e hostis. Os recrutados passam a morar na casa comunitária da vila e podem ajudar na exploração e na horta. A espada agora é um item fabricável e equipável para se defender no acampamento.

## Acampamento e moradores

- Cenário independente baseado na prévia aprovada, com barracas, cercas rústicas, fogueira, suprimentos, vegetação, HUD, mapa, inventário e editor de desenvolvimento.
- Acesso por uma abertura entre as árvores e pegadas discretas a oeste do lago da Floresta Antiga, sem novo caminho de terra sobre a água.
- Primeiro grupo pacífico; novos visitantes a cada três dias. O encontro e as posições são preservados ao carregar a partida.
- Até oito recrutados caminham do acampamento até a casa comunitária, atravessando a floresta e a propriedade pelos acessos. Rotas bloqueadas aguardam passagem. À noite entram pela porta para descansar.
- Diálogo após o convite e novas conversas com os aliados permitem pedir 4 madeiras caídas, 2 ervas ou regar até 6 plantas. Um pedido por aliado por dia; trabalho e retorno à vila antes da entrega. Recompensas não se repetem ao conversar ou recarregar.
- Cabelos, roupas e quatro aparências de sobreviventes. Oito direções seguindo os ciclos de caminhada do jogador; recortes e máscaras revisados para evitar braços sobrepostos e resíduos do cabelo antigo.

## Defesa e fabricação

- Hostis avisam antes de atacar. Recuar é permitido; escolher permanecer, avançar muito perto ou ficar na área após o prazo inicia o confronto.
- Espada improvisada na bancada: 2 lâminas de sucata, 1 cabo e 1 corda, com martelo. Sem duplicação de armas nem cobrança de materiais quando faltam requisitos.
- Item próprio na mochila e na barra rápida. I permite equipar ou guardar; Q abre o equipamento no acampamento. É necessário possuir a espada para equipá-la ou produzir o golpe armado.
- E ou clique contra agressores usa o mesmo sprite, escala, arco visual e som da espada da dungeon. Ataques respeitam alcance, intervalo e obstáculos; pacíficos e aliados ficam protegidos.
- Equipamento persistido, com falhas de gravação preservando o estado anterior. Partidas antigas recebem o novo campo de estoque vazio.

## Refinamentos de pesca incluídos

- Pagamento de capturas identificadas e encomendas diárias revistos em relação à venda comum.
- Reforços da vara com ganhos de controle mais claros; sprites dos preparos de isca e rede usada na água.
- Condição de chuva alinhada entre cenário, HUD e pesca. Cancelamento durante o arremesso preservado; lançar sem água válida não inicia a tentativa nem gasta isca.

## Validação

Verificações de tipos, build e 1.555 testes automatizados em 180 arquivos; testes em Chromium cobrem fabricação com bancada, custos, receita única, mochila, barra rápida, viagem entre cenários, golpe com espada e retomada da partida. O acampamento também foi verificado quanto a aviso hostil e recuo, deslocamento dos recrutados, tarefas e entrega persistida. O workflow Windows repete os testes e gera instalador, portátil e SHA256SUMS.txt.

O calendário sazonal permanece para uma etapa futura.
