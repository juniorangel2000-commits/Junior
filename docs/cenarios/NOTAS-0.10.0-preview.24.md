# After Rain 0.10.0-preview.24 — Lago entre as Serras

O novo Lago entre as Serras conecta o norte da propriedade ao lado oeste do acesso à cidade. Damião atende em uma cabana de madeira envelhecida, com varanda elevada, escada transitável e caminho próprio até o píer em T.

## Exploração e pesca

- Lago central com margens irregulares de areia, rio ligado à propriedade, ponte alinhada, cachoeira, escadaria e mirante. Pedras aquáticas próximas das margens, cardumes de sombras, vegetação variada e grupos irregulares de árvores nos cantos livres de montanhas.
- Cachoeira com correnteza descendente, espuma e respingos na chegada; ondulações e reflexos transparentes sobre a água. A sprite e o acabamento de água aprovados permanecem. Pássaros em pequenos grupos distribuídos pelo lago e balanço das árvores integrado ao cenário.
- Novas partidas recebem a primeira vara gratuitamente de Damião. Ele aguarda na cabana até a apresentação, explica que a vila fica à direita da propriedade e oferece o presente no fim da conversa. As duas entradas da vila só abrem ao receber a vara. Fechar antes, não ter espaço ou falhar ao salvar mantém o bloqueio e o inventário anterior.
- Depois da apresentação, Damião alterna entre cabana e píer das 08:00 às 11:30 e retoma a rotina da vila em seguida. Conversa, compra/venda, aulas de pesca e entrega do peixe raro usam o inventário e a carteira reais.
- Partidas antigas sem o marcador da apresentação preservam os acessos e equipamentos que já tinham.

## Movimento, construção e edição

- Shift ativa corrida 50% mais rápida para os dois personagens, com as animações fornecidas nas oito direções e pontos próprios para os itens na mão. Soltar a tecla retoma a caminhada; não acelera a natação.
- Água acessível ao jogador em todos os mapas externos e nas áreas pintadas nas dungeons. Profundidade controla caminhada na água rasa e natação; pontes e píeres mantêm piso seco. Partidas salvas na água retomam a posição de natação.
- F2 inclui os sete mapas externos e os dez interiores dos comércios. Bancos, postes, barris e outros objetos da vila podem ser editados; marcos e acessos preservam suas restrições de navegação.
- Bancos com quatro vistas e cercas com a arte atual são fabricados na bancada. Passagens entre mapas têm uma faixa de travessia mais ampla.
- Exclusão de partidas usa confirmação dentro do jogo, com o visual atual.

## Validação

1.384 testes automatizados, TypeScript e build de produção aprovados localmente; o workflow Windows repete os testes e a compilação. As verificações no Chromium cobrem edição e persistência do lago, colisões e acessos, corrida dos dois personagens, natação e retomada dentro da água, atendimento e trajeto do Damião, bloqueio das duas entradas, diálogo e entrega única da vara. O instalador e o portátil acompanham SHA256SUMS.txt.
