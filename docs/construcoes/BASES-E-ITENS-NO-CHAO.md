# Construções da propriedade e itens no chão

A casa principal é a moradia do jogador. O menu B agora oferece bases de
galinheiro, curral e silo, além de bancada, bancos, cercas e porteiras. Os moldes
e peças de casas modulares não são mais oferecidos. Peças antigas permanecem no
save e podem ser recolhidas; vínculos antigos dessas ferramentas viram mãos vazias.
A decoração do interior da casa principal continua disponível em H.

Cada base custa quatro madeiras e quatro pedras, com martelo na mochila. É
preciso limpar a área, fora da água, caminhos, plantações, construções, instalações
e personagens. A entrada reserva uma faixa livre de três células. A posição pode
ser escolhida no terreno, sem lotes predeterminados. A base não entrega a obra
pronta: perto de sua entrada, E abre o painel de materiais. Entregas parciais ficam
salvas. Com todos os materiais e o martelo, o jogador conclui a obra. Cancelar uma
obra inacabada restitui integralmente base e materiais entregues, se houver espaço.
Uma falha de gravação preserva o estado anterior e todo o estoque.

As três artes possuem fundação, armação e acabamento. O galinheiro tem a abertura
da casinha livre, sem porta. Galinheiro e curral possuem um cercado com porteira.
Animais já conduzidos à propriedade podem receber uma moradia compatível, perto
da entrada. Caminham usando a navegação existente, sem teletransporte; depois
permanecem no cercado. A corda permite conduzi-los para fora pela porteira aberta.
O galinheiro comporta seis galinhas; o curral, quatro vacas. Novos produtos animais
e interiores destas construções não fazem parte desta alteração.

O silo guarda 240 palhas. Seu painel permite depositar, retirar ou preparar palha
a partir de fibras, na proporção 1:1. O estoque é independente da mochila e persiste.

Recursos da propriedade e floresta, colheitas e materiais minerados pelo jogador
agora caem no chão. Cada pilha usa o ícone do item, quantidade, sombra e um pequeno
salto. Aproximar-se recolhe a pilha, respeitando obstáculos e capacidade da mochila.
No inventário, selecione um item, escolha a quantidade e use Soltar no chão. Itens
soltos manualmente só podem ser recolhidos novamente depois de se afastar, evitando
que retornem imediatamente à mochila. Espécie/tamanho de peixes soltos permanecem
junto ao item, sem registrar uma nova captura no diário.

As pilhas persistem entre cenários, interiores, salvamento e recarregamento.
Desaparecem depois de 2.880 minutos do relógio do jogo (dois dias), inclusive quando
o tempo avança dormindo. Pausas não avançam esse relógio. A coleta não atravessa
paredes e uma mochila cheia deixa a pilha inteira no chão. Inventários e controles
de dungeons continuam fora deste fluxo. Recompensas e trabalho de NPCs mantêm suas
transações próprias.

## Verificação

- Testes de domínio: bases, entregas parciais, reembolso, proximidade, restrições,
  validação/migração, gravabilidade, porteira, alojamento por espécie e caminhada,
  capacidade/transferências do silo; drops, aproximação, mochila cheia, expiração,
  isolamento entre espaços, rollback e identidade dos peixes.
- `scripts/qa-farm-drops.cjs`: menu real, seleção e colocação das três bases,
  entregas e conclusão, silo, botão de soltar, sprite visível no chão e coleta.
- `scripts/qa-zoom-fit.cjs`: Platô e Mina Antiga em 1920×1080 com preferência
  salva em 50%; toda a vista permanece dentro do mapa e a preferência não é alterada.
- `scripts/qa-mine-natural.cjs`: mineração física com os dois personagens,
  colisões dos objetos, paredes contínuas, cancelamento e recarregamento.
