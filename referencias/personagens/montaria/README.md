# Arte do fazendeiro montado

`masculino-proposta.png` é a fonte de imagegen, 1536×1024. A primeira linha tem sul,
norte, oeste e leste. A segunda tem sudoeste, sudeste, noroeste e nordeste.

`node scripts/prepare-male-rider.cjs` limpa a transparência residual e gera a folha
do jogo com os pixels nativos. O encaixe de cada pose sobre o cavalo fica em
`src/data/horse-rider-art.ts`. O atlas do cavalo usa outra ordem de direções.
