# Companheiros: bônus, variantes e coleção

Alterações preparadas após a preview.15, sem publicação de nova versão.

## Bônus da espécie ao jogador nas dungeons

| Companheiro | Bônus |
| --- | --- |
| Cão | +10% de vida máxima; 8% de redução de dano |
| Cão ✦ | +20% de vida máxima; 16% de redução de dano; +15% de cura recebida |
| Gato | +20% de alcance de coleta de experiência; +5% de velocidade de movimento |
| Gato ✦ | +40% de alcance de coleta de experiência; +10% de velocidade de movimento; +10% de experiência recebida |

Os bônus da espécie continuam durante a recuperação do animal. Somam-se às melhorias já existentes, sem duplicar cartas, atributos permanentes ou atributos do próprio animal. A redução total de dano mantém o teto existente de 75%. A cura adicional inclui itens no chão, regeneração e a recuperação concedida pela carta de vida máxima; respeita o máximo de vida. O bônus de experiência afeta a experiência da partida, sem multiplicar novamente a recompensa permanente nem o item que concede um nível inteiro.

A seleção e a evolução permanente mostram os efeitos ao jogador. A HUD identifica a variante com ✦ e informa os efeitos no título do companheiro. A chance de uma variante especial caiu de 5% para 1% por pet resgatado, sem alterar a frequência de encontrar pets. É uma probabilidade independente em cada resgate; não há garantia após cem encontros.

Os saves existentes reutilizam o campo `rare`; não há perda de coleção ou necessidade de migração.

## Cores e coleção

As variantes especiais usam paletas provisórias: cão azul-prateado e gato dourado. As texturas são criadas uma vez no cache do jogo a partir das animações originais. Todos os quadros, posições, escalas, pivôs e valores de transparência são preservados. Os PNGs e ZIPs originais não são alterados. As mesmas cores aparecem nas dungeons, no mundo normal e nos retratos dos menus.

Acesso: **Menu do jogo → Companheiros → Ver coleção de pets**. A coleção mostra as quatro variações, os bônus, o estado de desbloqueio e a quantidade resgatada. Só permite equipar animais já pertencentes ao jogador. A variação comum e a especial têm desbloqueios separados. Duplicatas não aumentam o contador de variações descobertas. A identificação usa apenas o ícone ✦ junto ao nome.

## Ajustes anteriores incluídos

- Esquiva de contato dos pets: 70% no cão e 80% no gato, sem duplicação nas variantes especiais. Uma tentativa por contato a cada 0,9 s; o dano recebido não se acumula por inimigo e quadro. Acertos individuais têm limite de 35% da vida máxima do animal antes da resistência. Desvio curto respeita colisões, checkpoints e pausa; ataque em salto não recebe dano duplicado.
- Armas físicas com proporções menores e aspecto original preservado, incluindo evoluções e projéteis. A espada mantém 34 px de comprimento visual; alcance de dano e efeitos de área continuam seguindo as melhorias.

## Validação

- Testes automatizados cobrem bônus comuns e especiais, cura, experiência, coleta, recuperação, restauração do save, coleção e preservação das animações/transparência.
- `scripts/qa-pet-bonuses.cjs`: seleção, menus responsivos, HUD, esquiva, recuperação, paletas e desbloqueios no Chromium.
- `scripts/qa-weapon-remake.cjs`: aparências das sete armas e suas evoluções, HUD e pausa.


Resultados: compilação de produção aprovada; suíte completa com 1.189 testes em 132 arquivos aprovada antes do ajuste final de raridade. Depois do ajuste de 5% para 1%, os 18 testes específicos de bônus, raridade e coleção também passaram. Chromium: 20 verificações de jogo, 2 de layout e 17 de armas aprovadas. Nenhum erro JavaScript ou requisição falha nas verificações do jogo e das armas. A revisão visual corrigiu a sobreposição do painel de missões sobre a coleção em telas estreitas.

- [Prévia dos quatro retratos](colecao.png)
- [Coleção em tela estreita](colecao-estreita.png)
- [Validação de jogo](validacao-jogo.json)
- [Validação de layout](validacao-layout.json)
- [Validação das armas](validacao-armas.json)

## Escala e caminhada em oito direções

Os novos ZIPs foram integrados. A caminhada usa oito direções nos dois animais e nas variantes especiais. Poses estáticas nas diagonais usam as rotações fornecidas. Corrida, salto e outras ações que têm somente quatro direções usam uma direção cardinal disponível; a duração e o instante de dano permanecem iguais. A validação do save aceita orientações diagonais, preservando os saves antigos.

O cão passou de 30 para 34 unidades de altura de referência, mantendo o gato em 22. Os retratos agora usam a escala do mundo e um enquadramento compartilhado de 96×96, evitando que a margem transparente das artes deixe o cão menor no menu. Na vista frontal, os retratos têm 74 px de altura visível no cão e 53 px no gato, iguais entre comuns e variantes.

Foram adicionados 36 quadros por espécie (total atual: 192 no cão e 248 no gato). Os 368 quadros anteriores foram comparados pixel a pixel e continuam idênticos. Os ZIPs anteriores estão preservados como `original-preview15.zip`; `original.zip` contém a entrega mais recente.

Após a integração, a suíte completa passou com **1.195 testes em 133 arquivos**, e a compilação de produção foi aprovada.


- [Caminhada nas oito direções, comuns e variantes](caminhada-oito-direcoes.png)
- Validação final no Chromium: proporções, enquadramento responsivo e texturas de caminhada nas oito direções aprovadas.
