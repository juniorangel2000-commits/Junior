# Animais e corda vegetal — implementação local

- **C → Corda vegetal:** 3 fibras vegetais produzem 1 corda. A receita existente foi aproveitada e pode ser usada na propriedade ou na floresta, sem bancada.
- **E perto do animal:** prende a corda; exige distância de até 32 pixels e passagem livre. Só um animal pode ser conduzido por vez.
- **G:** solta o animal e devolve a corda. Soltar na floresta não acolhe o animal.
- Conduza o animal até a saída marcada da floresta e pressione **E**. É preciso que ele esteja próximo, com passagem livre. O acolhimento termina ao atravessar para a propriedade, onde a corda volta ao inventário e o animal passa a passear livremente.
- Animais nunca se tornam itens do inventário. Posição, direção, animal preso e corda alocada acompanham o save; saves antigos continuam compatíveis.

Os dez animais da floresta agora passeiam. Detectam o jogador em até 144 pixels (4,5 tiles), sem enxergar através de obstáculos, e fogem a 90% da velocidade do jogador. Após se afastarem, levam dois segundos para se acalmar. Animais acolhidos passeiam sem fugir. A navegação contorna árvores, pedras e margens, preserva separação entre animais e impede entrada na água. A corda tem alcance de 88 pixels e impede abandonar o animal ou nadar durante a condução.

A galinha e a vaca usam as sprites enviadas pelo jogador: oito poses paradas e oito frames de caminhada em cada uma das oito direções. Os 144 PNGs originais ficam preservados em `public/assets/animals`; `scripts/pack-animal-sprites.py` monta atlas por cópia dos pixels, sem redimensionar ou repintar. As telas expandidas de alguns frames da vaca são alinhadas pelo centro, com ponto de apoio fixo. A escala no mundo é constante. A fase acompanha a distância percorrida, limitada a 12 frames por segundo na galinha e 9 na vaca para não acelerar demais os desenhos. Pequenas pausas de navegação seguram a pose por 0,14 segundo antes de voltar à pose parada. Não há espelhamento artificial nem oscilação extra nesses dois animais.

A orientação usa setores angulares de 45 graus, com uma pequena margem nas mudanças de setor: corrigir alguns pixels no eixo vertical não transforma uma caminhada lateral em diagonal. Na condução, o animal segue diretamente o jogador quando há passagem para o corpo inteiro; quando há obstáculos, a rota contorna e elimina desvios desnecessários pelos centros dos tiles. Uma margem de distância entre parar e retomar evita pequenos arranques junto à personagem. A velocidade de fuga continua em 90% da velocidade do jogador.

As outras espécies conservam a arte anterior e o movimento provisório do sprite inteiro até receberem suas animações. A corda é desenhada atrás do jogador e do animal, inclusive quando a ordem vertical entre eles muda. As prévias reais da floresta ficam em `docs/cenarios/animais-animados`, produzidas por `scripts/capture-animal-animation.cjs`.

A ponta da corda acompanha a **cabeça**: a galinha e a vaca têm um ponto medido separadamente em cada um dos 72 frames, nas oito direções. A referência acompanha as pequenas mudanças da cabeça na caminhada. Nas espécies que ainda usam arte estática, o ponto da cabeça acompanha o espelhamento da sprite.

A origem acompanha a **mão esquerda anatômica da personagem**, não um deslocamento fixo do corpo nem a mão mais próxima da câmera. Fazendeira e fazendeiro têm referências para suas 128 poses originais (parados e caminhando nas oito direções), em `src/data/character-left-hand.json`. Quando a mão esquerda está oculta no perfil, a referência mantém o lado anatômico e o contramovimento do braço, sem trocar para a mão direita. O ponto passa pela mesma origem, escala e rotação da sprite, independentemente do zoom. `scripts/build-character-hand-anchors.py` gera as referências sem modificar os PNGs; `scripts/qa-rope-left-hand.cjs` confere a origem no desenho real da corda em todas as poses.

Lógica: `src/systems/animals.ts`. Adaptação para Phaser: `src/animals.ts`. Verificação automatizada: `tests/animals.test.ts` e `scripts/qa-animal-escort.cjs`. Esta etapa não altera a versão publicada nem gera um novo executável.
