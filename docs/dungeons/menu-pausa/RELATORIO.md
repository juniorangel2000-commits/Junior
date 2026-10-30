# Pausa da expedição

A pausa agora mostra mapa, modo, tempo sobrevivido, nível, eliminações, rodada ou tempo restante e vida atual. O arsenal usa os ícones reais, reconhece armas evoluídas e mostra as próximas escolhas nos níveis 10, 30 e 50. O companheiro aparece com vida e brilho ao lado do nome quando aplicável. As melhorias exibem descrição e progresso de níveis, com cores de raridade.

Retomar tem destaque e recebe o foco inicial; o botão de fechar também retoma. A navegação por Tab permanece dentro da pausa. Abandonar continua exigindo a confirmação existente. A área de conteúdo rola sem tirar as ações da tela, e a versão móvel organiza arsenal e melhorias em menos colunas.

## Verificação

Build de produção e `scripts/qa-dungeon-pause.cjs` no Chromium, usando os ícones reais exportados pelo mesmo atlas do jogo. Foram conferidos início sem melhorias, partida com quatro armas e evolução, companheiro especial, vida, modo de rodadas, foco e Tab, retomada pelos dois botões, cancelamento e confirmação do abandono. O script verifica ausência de rolagem horizontal e ações visíveis em 1280×800, 960×540, 390×844 e 360×640, e gera capturas em PAUSE_QA_OUTPUT.

As capturas usam dados controlados para testar a interface; não representam uma partida humana. Alterações locais, sem publicação de release.
