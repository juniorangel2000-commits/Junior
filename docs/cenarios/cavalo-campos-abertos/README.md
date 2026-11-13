# Cavalo dos Campos Abertos

Um cavalo selvagem (`field-horse-1`) nasce em uma clareira do cenário e circula
respeitando troncos, pedras, abrigo e bordas do mapa. O raio de colisão é maior
que o dos animais pequenos. Ao se assustar, usa a corrida fornecida.

Fonte: `referencias/animais/create_a_horse_with_medium_details.zip`, enviada
pelo Junior. O cavalo gerado anteriormente como estudo não foi usado.
Os 180 PNGs originais e seus pixels foram preservados: oito poses paradas,
64 quadros de caminhada, 64 de corrida e 44 de mexer a cabeça. Esta última
animação está guardada para integração futura.

`node scripts/import-horse-sprites.cjs` reproduz o atlas a partir dos originais
em `public/assets/animals/horse`. O atlas translada os quadros para células
uniformes, sem esticar ou recortar a arte.

A posição usa o estado de animais já existente dos Campos Abertos. Partidas
anteriores continuam válidas e recebem um único cavalo ao entrar no cenário.
Salvar, continuar e trocar de mapa não multiplicam o animal.
Captura, condução e montaria não fazem parte desta entrega.

Validação: `scripts/qa-horse-fields.cjs` no Chromium e testes de importação,
movimento, colisão e compatibilidade de saves.
