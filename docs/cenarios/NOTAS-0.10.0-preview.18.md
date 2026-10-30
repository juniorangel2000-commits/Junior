# After Rain 0.10.0-preview.18 — recompensas e menu de expedições

As expedições agora terminam em uma tela de recompensas. Depois de salvar os ganhos, você volta ao menu de expedições para escolher outra partida, melhorar seus atributos ou selecionar um pet. O retorno ao mundo normal acontece apenas ao escolher **Sair do menu**, pelo × do cabeçalho ou pelo Escape no menu.

## Recompensas

- Praça de 15 minutos: XP calculada pelo tempo sobrevivido e pelo nível alcançado.
- Estacionamento: XP calculada pelas rodadas concluídas e pelo nível alcançado. Esperar mais tempo na mesma rodada não aumenta a recompensa.
- Vitórias concedem bônus. Moedas e materiais também consideram o progresso da expedição.
- A tela mostra tempo, nível, eliminações, rodadas quando aplicável, XP, moedas, materiais e companheiro resgatado. A origem do XP aparece discriminada.
- Abandonar preserva o XP conquistado e o pet resgatado, sem moedas, materiais ou bônus de vitória/aprendizado.
- O apoio inicial continua disponível: uma tentativa qualificada pode receber complemento até 100 XP, dentro dos primeiros 600 XP de progressão.
- Em falha de gravação, os ganhos ficam pendentes e a tela permite tentar salvar novamente antes de continuar. Materiais sem espaço na mochila mantêm a entrega pendente.

## Menu e progressão

- Menu de expedições com prévias dos mapas, objetivos, vitórias, saldo de XP, melhorias compradas e seleção de companheiro com seus bônus.
- A próxima partida começa no nível 1, com XP temporária zerada e o pet e os atributos permanentes escolhidos. Recompensas e melhorias adquiridas permanecem salvas.
- A XP necessária aumenta a cada nível. Depois do nível 16, o custo cresce em 1 XP por nível, sem ficar limitado a 89. A evolução continua depois de completar as cartas.
- As escolhas de novas armas continuam nos níveis 10, 30 e 50.
- Saves, pets, saldos e melhorias anteriores continuam compatíveis.

## Validação

Compilação de produção, suíte automatizada, testes no Chromium e partidas simuladas nos dois modos. Foram conferidos vitória, derrota, abandono, retorno ao menu, partidas consecutivas, persistência das recompensas, retomada do save, falha de gravação, menus estreitos e bônus dos pets. O relatório detalhado acompanha o código em `docs/dungeons/testes-preview18/RELATORIO.md`.

As simulações verificam o motor e não representam uma taxa de vitória humana. Concluir todas as cartas ainda depende das ofertas e da coleta durante a partida.

Baixe `After-Rain-0.10.0-preview.18-Windows-x64.exe`. O executável é portátil. O arquivo `SHA256SUMS.txt` permite conferir a integridade do download.
