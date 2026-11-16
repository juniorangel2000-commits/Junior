# Montaria (preview.40)

- **V** perto do cavalo domado, na Propriedade: monta. **V** montado: desce. **Shift** galopa.
- Montado, o jogador anda 1,9× mais rápido (galope 1,25× a mais). O cavalo não entra na água.
- O cavalo vai junto por todos os cenários ao ar livre. Ao entrar em casa, loja, abrigo, mina
  ou masmorra, o jogador desce e o cavalo volta sozinho para a Propriedade. Descendo na
  Propriedade, o cavalo fica onde o jogador desceu.
- Save: `riding: true` (só com o cavalo domado alojado). Código: `src/systems/horse-riding.ts`,
  `src/riding-controller.ts` (tecla V e acompanhamento entre cenários), `src/horse-mount.ts`
  (desenho) e `Player.mountHorse`.

## Arte da montaria

- **Personagem feminina** (`farmer-female`): o Junior mandou a personagem montada, parada, nas 8
  direções (16/11/2026). `scripts/pack_horse_rider.py` separa só a personagem e grava:
  - `public/assets/animals/horse-rider/farmer-female.png`: 8 células de 192×192, nas
    coordenadas da célula do atlas do cavalo, na ordem de `RIDER_ORDER`;
  - `src/data/horse-rider-lift.json`: quanto o lombo sobe ou desce em cada quadro do atlas do
    cavalo, em relação ao cavalo parado.
  - No jogo, `HorseMount` desenha o cavalo animado de sempre (passo e galope) e a personagem
    por cima, subindo e descendo com o lombo. O sprite do jogador fica escondido enquanto monta.
  - Como separa: cores que o cavalo não tem (jeans, camisa, pele), o que fica fora do contorno
    do cavalo e o que difere do cavalo do jogo ponto a ponto. Depois, o acabamento tira restos
    do cavalo nas bordas e pontas de rédea e refaz o contorno escuro.
  - Ajustes à mão, por direção: `RAISE` (de frente a personagem sobe 6 px, porque a cabeça do
    nosso cavalo é mais alta) e `CHEST` (de frente, a faixa do peito e das mãos vem inteira do
    desenho).
  - Para refazer: `python3 -I scripts/pack_horse_rider.py <pasta do zip> farmer-female`.
- **Personagem masculino** (`farmer-male`): ainda sem arte. Usa o personagem cortado na
  cintura, com pernas, sela e rédeas desenhadas por código. Quando a arte dele chegar, no mesmo
  formato (`Idle/rotations/<direção>.png`, 128×128), basta rodar o script com `farmer-male`,
  incluí-lo em `RIDER_ART` e conferir `RAISE`/`CHEST`.
- Prompts antigos em `docs/planejamento/PROMPTS-ARTE-MONTARIA.md`. Imagem de conferência em
  `docs/planejamento/montaria-preview.png`.
