# After Rain 0.10.0-preview.25 — Pescaria interativa e águas do lago

A pescaria agora tem arremesso, fisgada, disputa e uma pequena tela de resultado. O Lago entre as Serras recebe a cachoeira e a correnteza reconstruídas, margens mais naturais e correções nas plataformas.

## Pescaria

- A mordida acontece entre 10 e 20 segundos. Quando a boia afunda, há 3 segundos para fisgar com E, Espaço ou clique. Durante a disputa, segure para subir a faixa verde e solte para descer, acompanhando a silhueta escura do peixe.
- O arremesso movimenta somente a vara, com um pequeno pulinho do personagem e duração de aproximadamente 2 segundos. A isca segue um arco até a água. Sons suaves acompanham a passagem da vara e a queda da boia.
- As poses de espera dos dois personagens têm quatro direções, mãos alinhadas à vara e escala preservada. Norte mantém a vara atrás do corpo, com a ponta curvada para baixo; sul aponta para a frente e para baixo.
- Lambari, tilápia, carpa, bagre, truta e dourado possuem artes, raridades, comprimentos e pesos próprios. A espécie só aparece depois da captura. A tela de resultado mostra as informações do peixe ou o motivo de ele ter escapado.
- Também é possível recolher lata enferrujada, galho encharcado, bota velha e corda embolada. Esses objetos rendem materiais reaproveitáveis; a bota não concede equipamento. A rede recolhe duas unidades.
- Boia com flutuação, parte submersa, ondulações e reação à tensão da linha. A perda de foco pausa a pescaria. O cabeçalho mostra o nome do cenário e a espera usa o texto “Aguarde...”.
- A captura é salva antes da confirmação. Uma falha de gravação permite tentar novamente sem duplicar a recompensa. Os peixes continuam nos estoques comuns e raros usados pelas receitas e pelo comércio; partidas anteriores permanecem compatíveis.

## Lago e exploração

- Queda e riacho superior reconstruídos com água em movimento contínuo sobre um leito limpo, sem os antigos respingos estáticos. Espuma, perturbações e pequenos redemoinhos acompanham o impacto da cachoeira.
- Água e efeitos nas pedras respeitam a margem real. Pedras secas não recebem marcas de água, e as ondas próximas da queda acompanham as áreas aquáticas, inclusive quando editadas.
- Margens e encontros do rio mais arredondados. Os itens de pesca ficam na parte larga do píer, liberando a entrada. Píer, ponte e varanda têm acesso pelas entradas previstas e colisões nas laterais.
- O acabamento submerso da madeira aparece somente nos apoios que estão dentro da água.
- HUD e inventário disponíveis também no lago e no acesso à cidade. O acesso pela propriedade mantém a placa e a abertura natural entre as árvores, sem o caminho de terra adicionado anteriormente.
- Corrigida a exibição dos personagens na criação de partida e retirada a fala de Damião sobre liberar a passagem para a vila.

## Validação e distribuição

Suíte completa com 1.480 testes aprovada localmente, além de TypeScript, build de produção e verificações no navegador. As verificações incluem capturas e persistência, seis espécies, quatro tipos de lixo, rede, tela estreita, pausa, falha de gravação, recortes das artes, poses, cancelamento e saída de cenário. O workflow Windows repete os testes e gera o instalador e o portátil com SHA256SUMS.txt.
