# Vila harmonizada e encontros — preview.10 em preparação

## Paisagismo e circulação

Grama alta em pequenas moitas, usando três sprites novas. As plantas são atravessáveis e só aparecem em terreno livre, fora dos caminhos, da praça, da água, das portas e das silhuetas dos prédios. Pinturas manuais do editor não recebem as moitas automáticas.

Seis lixeiras de madeira foram colocadas perto dos bancos e áreas de descanso. Vasos e floreiras externos soltos foram retirados; canteiros arredondados da praça e flores integrantes das fachadas foram preservados. Bancos externos foram afastados da circulação e receberam orientações para o coreto, o lago e os caminhos.

A loja do Damião foi recuada da margem. O celeiro e as duas casas decorativas receberam novas posições e acessos. Barris que conflitavam com as novas frentes foram reposicionados ou retirados. Colisões, portas, navegação e sinais de comércio usam as posições atuais dos dados da vila.

A densidade de moitas foi ampliada em novos grupos entre os caminhos, mantendo os mesmos afastamentos. A comparação visual das portas com os personagens e fachadas levou a aumentar a largura das casas decorativas de 206 para 244 pixels (18,4%) e a do celeiro de 220 para 264 (20%). As proporções da arte e a linha de apoio no chão permanecem iguais; as áreas sólidas foram ampliadas proporcionalmente. Casa comunitária, moinho, coreto e lojas mantêm a escala existente. Nenhum PNG de construção foi redimensionado ou substituído nesta revisão.

Os caminhos usam a mesma definição dos tijolos da praça, a mesma cor aprovada e um leve desgaste. Contornos de pedra são preparados por pixel, com faces, juntas e pequenas variações que acompanham os trajetos sem alargar a área de circulação.

## Relógio, almoços e conversas

O relógio compartilhado pelos três mapas avança um minuto de jogo por segundo de simulação, metade da velocidade anterior. As animações e a velocidade de caminhada permanecem iguais.

| Dupla | Intervalo |
| --- | --- |
| Augusto e Bento | 12:00–12:50 |
| Rosa e Amélia | 12:40–13:30 |
| Celina e Nilo | 13:20–14:10 |
| Tobias e Ícaro | 14:00–14:50 |
| Damião e Helena | 14:40–15:30 |

Até quatro comerciantes estão de intervalo ao mesmo tempo. Cada dupla tem falas próprias, alternadas por dia. Os participantes precisam chegar e parar antes de começar; ambos permanecem imóveis e virados um para o outro. Cada fala fica pelo menos 4,5 segundos, com uma pequena pausa antes da resposta. Há uma única conversa automática por vez no ambiente observado.

Encontros nas lojas também esperam o dono se aproximar e parar. Depois da resposta, ambos são liberados; a conversa não reinicia continuamente no mesmo dia. Mudança de horário, ambiente ou condução do jogador cancela o encontro e libera os participantes. Esse controle é temporário e não adiciona campos obrigatórios ao save.

Balões usam texto HTML com tamanho independente do zoom. A posição fica limitada à tela; perto da borda superior, o balão passa para baixo da âncora. O nome sob o cursor não se sobrepõe ao balão do mesmo personagem.

## Validação

- 873 testes passaram em 101 arquivos.
- TypeScript e build de produção passaram; permanece o aviso conhecido de tamanho de bundle do Vite.
- 130 moitas de grama alta renderizadas, seis lixeiras e nenhum vaso ou floreira externo solto.
- Seis verificações de mapa e doze de conversas no Chromium aprovadas, sem erros JavaScript, HTTP ou WebGL.

`scripts/qa-social-preview10.cjs` simula os cinco encontros no relógio real, pergunta e resposta nas lojas, retomada do trabalho, ausência de movimento enquanto falam, colisões e save. Foram aprovadas 12 verificações; o pico observado na praça foi de três NPCs.

`scripts/qa-village-reform-preview10.cjs` verifica moitas e lixeiras carregadas, retirada de vasos, bancos fora das vias e da água, bases das construções fora do lago e rotas para os dez comércios. As capturas anexas vêm do Chromium e foram conferidas visualmente.

Versão e lockfile preparados como `0.10.0-preview.10`. Nenhuma tag ou release foi publicada nesta etapa.
