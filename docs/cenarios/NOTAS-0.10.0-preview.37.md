# After Rain 0.10.0-preview.37 — Luz nova e jogo mais leve

O mundo ganhou um sistema de luz novo, com noites de verdade e sombras em tudo, e o jogo
ficou bem mais leve, principalmente nos Campos Abertos e nas viagens entre cenários.

**Luz do dia e da noite**
- Cada hora tem a sua cor: amanhecer rosado, dia claro, hora dourada no fim da tarde e
  noite azul e escura.
- À noite, postes, lampiões e fogueiras iluminam a rua em volta, com poças de luz quente
  entre o escuro. As janelas da casa acendem e há um halo de luz em volta do personagem.
- Sombras de nuvens correm pelo chão nos dias abertos; na chuva o céu fecha.
- Vaga-lumes piscam e iluminam à noite, e há pólen brilhando na luz do fim da tarde.
- Tudo roda num único passe na placa de vídeo. A opção de intensidade continua valendo.

**Sombras**
- Tudo o que fica em pé projeta sombra: árvores, pedras, casas, cercas, bancos, canteiros,
  fonte, barris, máquinas e pessoas.
- A sombra nasce no pé do objeto e deita no chão para o lado oposto ao sol. É mais
  comprida de manhã e à tarde.

**Desempenho**
- Tecla **F3**: mostra FPS, memória de vídeo e memória do jogo.
- Os cenários liberam as imagens ao sair. Depois de visitar o mundo, a memória de vídeo
  caiu de 2,3 GB para cerca de 1,1 GB.
- Corrigido um vazamento antigo: cada volta à Propriedade deixava o mundo anterior
  inteiro na memória, com a água animada rodando por trás.
- Campos Abertos: os animais fugindo e o cavalo correndo não travam mais. A rota de fuga
  custava 25 ms por quadro e agora custa menos de 3 ms; as sombras de pedras e árvores
  não travam mais no meio da caminhada.

**Correções**
- O cavalo domado termina de comer a cesta e vem até você.

Partidas anteriores continuam compatíveis.

Validação: TypeScript, 2.092 testes em 237 arquivos e build de produção aprovados. No
Chromium foram conferidos a liberação de memória entre cenários, os Campos Abertos, a
doma do cavalo, a qualidade, a cozinha e a iluminação em vários horários.
