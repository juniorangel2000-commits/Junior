# Visitas entre comerciantes e portas após o expediente

Cada um dos dez comerciantes possui uma visita diária com horário, destino, motivo e diálogo próprios, além de ordem dos pontos de trabalho e tempo de pausa diferentes. As visitas usam deslocamento físico na vila, entrada pela porta, navegação do interior e retorno ao próprio comércio. O ritmo de deslocamento externo e as janelas das visitas foram validados com o relógio real do jogo, que avança dois minutos por segundo de simulação.

| Comerciante | Saída programada | Destino | Motivo |
| --- | --- | --- | --- |
| Augusto | 09:00 | Rosa | Buscar sementes |
| Bento | 09:10 | Ícaro | Conferir ferramentas |
| Celina | 09:20 | Nilo | Pesquisar tecidos e bordados |
| Ícaro | 13:35 | Tobias | Ajustar uma bancada |
| Rosa | 13:45 | Amélia | Conversar sobre plantas |
| Helena | 13:50 | Celina | Encomendar tecidos |
| Nilo | 15:00 | Augusto | Examinar antiguidades nas entregas |
| Amélia | 16:05 | Helena | Levar ervas para chá |
| Tobias | 16:10 | Bento | Buscar ferragens |
| Damião | 16:15 | Rosa | Buscar mantimentos |

Dono e visitante aparecem juntos no interior e se voltam um para o outro durante a conversa. O dono se aproxima do atendimento para receber o visitante. Enquanto visita outra loja, o comerciante não atende transações como se ainda estivesse na própria loja. O jogador recebe indicação de ausência no diálogo de disponibilidade. As visitas não transferem itens ou dinheiro do jogador.

Ao encerrar o horário de cada comércio, a porta bloqueia fisicamente a passagem do jogador. Também há uma verificação antes da transição, incluindo a ferraria. O dono pode voltar ao próprio comércio após fechar; visitantes não recebem essa exceção. Quem já estava dentro pode sair normalmente. Antes das 08:00 o jogador também não entra. Horários de fechamento anteriores foram mantidos.

O estado de visita guarda o proprietário do interior ocupado em um campo opcional da rotina. Saves antigos sem esse campo continuam válidos. O estado legado do Bento permanece consistente mesmo durante visitas, evitando falha de gravação. Cada chegada verifica colisões e ocupação por outros atores.

## Validação

- 863 testes em 100 arquivos passaram, com 23 testes novos de visitas: deslocamento dos dez moradores, tempo real de viagem, retorno, persistência, estados inválidos e regras de entrada.
- Seis verificações integradas no Chromium passaram. Todos os dez visitaram outros comércios e conversaram com os donos no relógio real, sem colisões de cenário.
- O save foi gravado e validado durante a visita de cada um dos dez NPCs, incluindo Bento em outro interior.
- As dez portas bloquearam entrada caminhando após fechar; os dez donos conseguiram entrar quando a passagem estava livre. Saída após fechar foi preservada.
- Sem erros JavaScript, WebGL ou arquivos ausentes. Captura da conversa entre Augusto e Rosa conferida visualmente.

Alterações locais, com backup, sem push, tag ou publicação.
