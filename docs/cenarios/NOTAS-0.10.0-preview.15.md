# After Rain 0.10.0-preview.15 — companheiros em todos os mapas

## Pets e comandos

- Integração das sprites e animações enviadas do gato siamês e do cachorro, em quatro direções, com os frames originais preservados.
- Companheiro disponível na propriedade, dentro de casa, na vila, nos nove comércios e na ferraria, na Floresta Antiga e na Floresta de Acesso à Cidade.
- Novo menu **Companheiros**, acessível pelo Menu do jogo: escolher um pet, **Seguir**, **Esperar aqui**, **Chamar para perto** e **Ficar sem companheiro**.
- Um companheiro ativo por vez. Ao esperar, ele fica no mapa e no interior onde recebeu o comando. O menu indica a localização; chamar traz o pet de volta para um ponto livre perto do jogador.
- Seleção e comandos são salvos. Falha de gravação desfaz a alteração e informa o jogador.
- Caminhada, corrida e repouso usam as novas animações. O gato senta ao esperar e levanta ao retomar o acompanhamento. Os pets respeitam colisões e não aparecem sobre a água.

## Dungeons

- O gato usa **Jump** e o cachorro usa **Jump Attack** para os ataques básicos e especiais. O dano acontece no frame de contato do salto, acompanhado dos impactos e números de dano.
- O ataque mantém seu andamento ao pausar ou retomar um save, sem repetir o dano já aplicado.
- O pet escolhido continua lutando automaticamente dentro das dungeons. Os comandos de esperar/seguir controlam o comportamento no mundo normal.
- Pets aguardando resgate também usam as novas artes e mantêm o alerta direcional da preview.14.

## Retorno, zoom e caminho norte

- Corrigido o saldo exibido na HUD da floresta de acesso após uma dungeon: as moedas já eram guardadas no save, mas a interface mostrava zero. O retorno e a persistência de XP, moedas, materiais e pets foram conferidos nos três tipos de saída.
- Zoom da floresta de acesso alinhado à vila e à Floresta Antiga: mesmo enquadramento padrão, preferência de 50% a 200%, scroll, botões e atalhos +/=/−/_, com Home para restaurar 100%.
- O controle de zoom aparece ao usar e desaparece depois de alguns segundos. Pausa e painéis bloqueiam mudanças; movimentos pequenos do trackpad são acumulados.
- O caminho da vila que leva à estrada começa em pedra, recebe trechos de terra e pedras remanescentes gradualmente e termina em terra junto à saída norte. As bordas acompanham a transição, mantendo o traçado e a passagem existentes.

## Saves e download

Saves anteriores continuam compatíveis. Pets já resgatados e seus atributos são preservados. As novas preferências de acompanhamento são opcionais no save e começam em seguir quando um pet ainda não tem comando salvo.

Baixe `After-Rain-0.10.0-preview.15-Windows-x64.exe`. É portátil: abra o arquivo para jogar. O arquivo `SHA256SUMS.txt` permite conferir a integridade do download.
