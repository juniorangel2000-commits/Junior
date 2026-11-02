# Mina Antiga

Sala interna do Platô da Nascente, usando integralmente a arte aprovada em `public/assets/visual/mine/first-gallery.png`. O PNG de 1536 × 1024 é exibido em um mundo compacto de 768 × 512, com filtro de pixel nítido. O interior não recebe chuva nem aves externas.

## Acesso e circulação

- E na entrada da mina do platô leva à sala.
- Chegada em (346, 342), voltada para cima, já dentro da sala e acima da viga principal.
- A saída fica no corredor inferior, centralizada em x=347, na altura y=482. Caminhar para baixo através dessa faixa devolve o jogador ao lado externo da porta da mina. E também permite sair quando próximo do fim do corredor.
- A travessia só é armada por um passo para fora; chegada, pausa e retomada não provocam retorno automático.
- A entrada central ao fundo abre o painel inicial de Mineração, preparado para a futura elaboração do sistema. A passagem lateral permite examinar a continuação da galeria.

`src/data/mine-room.ts` guarda o contorno do chão e as colisões nas coordenadas do PNG original. O jogador usa sua caixa habitual de quatro pontos nos pés. Paredes, depósitos de pedra/carvão/cobre, carrinho, caixote, saco, cristais e pilares têm bloqueios próprios. Os trilhos são piso transitável. A área central e as aproximações dos dois túneis permanecem conectadas à chegada.

## Camadas visuais

A arte base permanece intacta. `MineRoomView` recorta silhuetas alinhadas à fonte para os objetos altos, com ordenação pela base. As vigas e os pilares das três entradas usam camadas dianteiras que não incluem retângulos de chão. Assim, o jogador pode passar sob a viga principal e atrás de equipamentos sem ser encoberto por uma cópia opaca do piso. Lanternas usam o sistema de iluminação já existente no jogo.

## Interface e persistência

A sala mantém HUD, inventário, pausa, zoom, mapa M com proporção e marcador próprios, áudio de movimento, avanço de tempo e companheiro. O contexto do companheiro distingue o interior `mine` do exterior do platô.

O save continua usando `activeArea: highland`, acrescido do campo opcional `mineInterior`. A posição externa permanece em `highlandPosition`. Partidas antigas sem esse campo continuam no exterior. Salvar e continuar dentro da mina restaura o ponto interno; sair remove `mineInterior` e posiciona o jogador diante da entrada externa. Reentrar pela montanha usa novamente a chegada principal.

Esta etapa torna a sala explorável. Os depósitos permanecem parte do cenário e o painel central aguarda o projeto do minigame de mineração.

## Verificação

`tests/mine-room.test.ts` verifica circulação com a folga dos pés, colisões dos sólidos, faixa de saída, recuperação de posições, persistência compatível com saves antigos e correspondência da fonte aprovada.

`scripts/qa-mine-room.cjs` entra pela montanha, percorre a sala com os controles reais, confere bloqueios, abre o painel central, inventário e mapa, salva e continua no interior, sai pelo corredor principal e reentra. Também captura a chegada, a sala com HUD e as colisões para inspeção visual.

Validação final: TypeScript, build e suíte completa de 1.576 testes em 183 arquivos aprovados; após o refinamento das bordas, os 18 testes de mina e platô passaram novamente. O navegador percorreu todas as áreas, verificou obstáculos, painel central, inventário e mapa, salvamento/retomada interna, saída e reentrada, sem erros JavaScript.

`scripts/qa-world-hud.cjs` também verificou inventário, mapa, fabricação, diário, companheiros, salvamento e pausa nos oito cenários de exploração; vento/água nos mapas onde existem e quatro luzes na mina. Nas dungeons, os atalhos de exploração ficaram bloqueados tanto no menu quanto em combate. Voltar à exploração restaurou o inventário normalmente. A entrada central permanece preparada para a elaboração futura da mineração.
