# Montaria (preview.40)

- **V** perto do cavalo domado, na Propriedade: monta. **V** montado: desce. **Shift** galopa.
- Montado, o jogador anda 1,9× mais rápido (galope 1,25× a mais).
- **Água:** montado, o cavalo não entra na água. Conduzindo um animal na corda, o jogador também
  não entra. Quem já está na água sempre consegue sair para o raso.
- **Interiores (preview.41, pedido do Junior):** montado, a porta não abre. Isso vale para casa,
  lojas, ferreiro, centro comunitário, abrigos dos animais, mina e masmorras. Aparece o aviso
  "Desça do cavalo (V) para entrar." (`src/riding-guard.ts`). Se, por algum caminho, o jogador
  chegar montado a um cenário fechado, a sincronização ainda o faz descer, e o cavalo volta
  sozinho para a Propriedade.
- **Acampamento (preview.41, pedido do Junior):** o cavalo não entra. A passagem da Floresta avisa
  "O cavalo não entra no acampamento. Desça (V) para seguir."
- O cavalo vai junto pelos outros cenários ao ar livre: Floresta, Campos, Vila, Lago, Serra e Acesso
  à Cidade. Descendo na Propriedade, o cavalo fica
  onde o jogador desceu.
- Save: `riding: true` (só com o cavalo domado alojado). Código: `src/systems/horse-riding.ts`,
  `src/riding-controller.ts` (tecla V e acompanhamento entre cenários), `src/riding-guard.ts`
  (portas e água), `src/horse-mount.ts`
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
- **Personagem masculino** (`farmer-male`): oito poses próprias na folha
  `farmer-male-mounted.png`. A pose frontal aprovada abre espaço entre as pernas
  para a cabeça do cavalo. Um recorte do próprio atlas passa à frente do cavaleiro
  para mostrar as orelhas e a crina. As outras sete poses usam os mesmos pixels e
  o mesmo encaixe de `farmer-male-seated.png`.
  `src/data/horse-rider-art.ts` compartilha os recortes entre o cenário e a tela
  de carregamento. O cavaleiro acompanha o lombo no passo e no galope.
  Para preparar o atlas, rode `node scripts/prepare-male-mounted.cjs`.
- Sem arte (personagem novo): o jogo usa o personagem cortado na cintura, com pernas, sela e
  rédeas desenhadas por código.
- Prompts antigos em `docs/planejamento/PROMPTS-ARTE-MONTARIA.md`. Imagem de conferência em
  `docs/planejamento/montaria-preview.png`.
