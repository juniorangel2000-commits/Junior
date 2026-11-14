# Móveis da casa do jogador

Conjunto original gerado por imagegen em 14/11/2026: cama, mesa, cadeira,
estante, tapete, vaso e fogão a lenha. Madeira em tom mel, tecido verde e creme,
cerâmica de terracota e ferro escuro. O fogão tem chaleira verde e nicho de lenha.

`source.png` contém os seis primeiros móveis; `stove-source.png` é o original
do fogão. Ambos permanecem na resolução recebida. `node scripts/pack-home-furniture.cjs`
recorta cada peça e remove apenas transparências residuais (alfa abaixo de 200).
Não redimensiona os pixels. `art.json` registra os recortes e hashes das fontes.

`src/home-art.ts` carrega os PNGs e dimensiona a exibição para as mesmas bases
de colisão do sistema `Home`. A posição é o centro inferior da base. A altura
do móvel inclui sua parte elevada: estante/cadeira podem aparecer acima do tile
ocupado; tapete permanece atrás dos atores. O fogão usa base de 64 × 64 e imagem
ajustada proporcionalmente à largura (cerca de 95 px de altura) e recuada 12 px:
com a base na linha 4, sua traseira entra no rodapé da linha 2, junto
à parede norte, enquanto o cano aparece sobre a parede. O ID e a posição salvos
continuam válidos; uma peça movida pelo jogador não é reposicionada ao carregar.

O editor, o sono e o caderno de receitas mantêm as regras atuais. A arte antiga
do fogão em `visual/kitchen` permanece como fonte histórica, sem carga em jogo.

## Paredes e piso

`room-source.png` é a fonte original da sala vazia, com reboco creme, janelas,
vigas e assoalho desenhados no mesmo estilo dos móveis. `src/home-room-art.ts`
compõe os recortes nas dimensões atuais da casa; a parede termina em y=64,
o piso livre vai de (32,64) a (352,288), e a soleira sul fica aberta em x=160..224.
Assim, a porta desenhada coincide com a passagem real e não muda saves ou colisões.

O assoalho escuro usa a mesma madeira com tingimento; sálvia e argila tingem o
reboco, conservando as cores das janelas, luminária e quadro. O piso de pedra usa
a textura de acabamento existente, encaixada nas novas vigas. As nove combinações
continuam disponíveis em H. As texturas da sala são montadas uma única vez e
reutilizadas, sem processamento de pixels por quadro.
