# Correção de pausas na vila, escala e fachada do Augusto

A medição antes da correção encontrou 15 atualizações de IA acima de 50 ms em uma amostra de 1.200 passos: o maior pico foi 556,4 ms. O problema principal era a busca de caminho consultando repetidamente os móveis, assets, vínculos e atores para cada vizinho da grade.

## Alterações

- A geometria dos interiores é compilada uma vez por configuração, com células de navegação e folga dos pés em cache. Aplicar uma edição cria um novo índice, sem colisões antigas presas no cache.
- A busca A* guarda ocupação e custo durante cada busca. A busca seguinte consulta novamente os obstáculos móveis. Permanecem os limites das paredes e a proibição de cortar quinas.
- A cena reutiliza a navegação do NPC e captura os outros atores uma vez por atualização, em vez de repetir essas operações em cada célula.
- Os textos da interface não são reconstruídos a cada quadro nem medidos quando não estão visíveis.
- Augusto passou de 72 para 84 unidades de exibição, com escala uniforme. Nas 56 poses, a mediana da altura visível ficou em 57,49 unidades, comparável às 57 do Bento. Os PNGs e seus alinhamentos originais foram preservados.
- A fachada transparente do pacote do Augusto foi integrada em sua resolução original, com porta no caminho existente, colisões do piso, iluminação das janelas/lanternas, sombra e fumaça.
- O JSON mais recente da ferraria foi incorporado integralmente, com 52 peças. O padrão anterior intacto é atualizado; cenários já personalizados permanecem preservados.

## Resultado da mesma medição

Na repetição dos 1.200 passos, o maior pico da IA foi 4,3 ms e não houve passos acima de 16,7 ms. O tempo total do trecho medido caiu de 4.231,6 ms para 21,9 ms. O salvamento permaneceu próximo de 5 ms na mediana. Esses números medem o trabalho de simulação da IA no ambiente de testes, não o FPS da placa de vídeo do jogador.

TypeScript e build aprovados; 741 testes em 74 arquivos; 47 verificações reais de navegador passaram, cobrindo fachada, escala, iluminação, rotinas, entrada/saída, condução, comércio, editores, persistência e textos. Os testes de desempenho também verificam a quantidade de consultas e a invalidação das colisões, sem depender de um limite de tempo específico da máquina.

Os relatórios antes/depois e as capturas estão nesta pasta. As árvores foram ocultadas apenas nas imagens de revisão.
