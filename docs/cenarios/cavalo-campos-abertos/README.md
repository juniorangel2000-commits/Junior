# Cavalo dos Campos Abertos

Um cavalo selvagem (`field-horse-1`) nasce em uma clareira do cenário e circula
respeitando troncos, pedras, abrigo e bordas do mapa. O raio de colisão é maior
que o dos animais pequenos. Ao se assustar, usa a corrida fornecida.

Fonte: `referencias/animais/create_a_horse_with_medium_details.zip`, enviada
pelo Junior. O cavalo gerado anteriormente como estudo não foi usado.
O pacote v2 acrescenta 128 quadros, preservando integralmente os 180 anteriores.
Os 308 PNGs são mantidos: repouso, caminhada, corrida, mexer a cabeça, começar a
comer, comer, parar de comer, deitar, descansar e levantar. Alimentação e movimento
de cabeça têm duração limitada e pausas independentes de 8–15 segundos. Deitar e
levantar ficam preservados para uma etapa posterior.

`node scripts/import-horse-sprites.cjs` reproduz o atlas a partir dos originais
em `public/assets/animals/horse`. O atlas translada os quadros para células
uniformes, sem esticar ou recortar a arte.

A posição usa o estado de animais já existente dos Campos Abertos. Partidas
anteriores continuam válidas e recebem um único cavalo ao entrar no cenário.
Salvar, continuar e trocar de mapa não multiplicam o animal.
Captura, condução e montaria não fazem parte desta entrega.

Validação: `scripts/qa-horse-fields.cjs` no Chromium e testes de importação,
movimento, colisão e compatibilidade de saves.

O atlas usa 16 colunas e mede 3.072 × 3.840 pixels, mantendo-se abaixo de
4.096 pixels por eixo. Os índices dos primeiros 180 quadros foram preservados.
O pastoreio atual é visual; a confiança da domesticação futura exige comida especial.
