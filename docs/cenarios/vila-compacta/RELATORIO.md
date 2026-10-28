# Vila compacta e horta única do moinho

Revisão da primeira disposição da vila conforme solicitado: celeiro redesenhado, prédios aproximados, pisos organizados e apenas uma área de horta junto ao moinho, com o poço no mesmo cercado.

## Organização

O celeiro deixou de ser uma pequena construção elevada sobre pilares e passou a ter base baixa de pedra, portas largas e telhado de duas águas. Os PNGs anteriores foram preservados; a nova arte e os canteiros têm arquivos próprios, recortes e hashes no manifesto.

Herbalista, pousada, ateliê, carpintaria, antiquário, sementes, oficina e pescador foram aproximados da praça. Casa comunitária, coreto, moinho, celeiro e casas residenciais também foram reposicionados. Os centros das lojas agora ocupam um retângulo de 48 × 35 tiles, antes 61 × 42; as dimensões totais do mapa permanecem 96 × 72. O lago acompanha a cabana de pesca e sua renderização usa o mesmo centro da colisão.

A única horta cercada fica ao redor do moinho: dois canteiros de trigo à esquerda, dois canteiros de legumes à direita e poço no canto direito. Há passagem central e portões para os caminhos externos. As hortas anteriores da herbalista e da loja de sementes foram retiradas. Jardins de flores continuam como decoração. A horta integra o cenário; não altera os sistemas de cultivo da propriedade.

Os pisos agora têm uma rede contínua de terra, com largura mais uniforme e bordas mais definidas, e pedra concentrada na praça. Foram removidos os bolsões independentes de pedra e terra em frente às fachadas. Os canteiros da praça ficam gramados sem receber estrada de terra por baixo. Árvores, adereços, jardins e cercas acompanham os novos lugares.

As artes e os interiores aprovados da carpintaria e ferraria foram preservados. Os dez comércios mantêm atendimento e animações. Novas construções decorativas continuam sem interiores. Edições manuais de terreno existentes permanecem preservadas.

## Validação final

- 837 testes em 98 arquivos passaram.
- TypeScript e build de produção passaram; permanece o aviso existente sobre tamanho do bundle.
- Sete verificações integradas no Chromium passaram: carregamento de 13 elementos com nove tipos de arte, acesso aos dez comércios, fonte sólida sem natação, água animada com quantidade constante de objetos, ocultação em interiores e retorno ao exterior, rotina dos dez NPCs, persistência e ausência de erros JavaScript, HTTP e WebGL.
- Os dez comerciantes atenderam na manhã, saíram para o almoço e retornaram à tarde; nenhuma colisão com o cenário foi observada na simulação.
- Testes de portas usam os novos pontos das construções. A passagem da propriedade permanece na linha 52 e a acessibilidade dos caminhos completos continua coberta por navegação.
- Capturas finais conferidas visualmente: `vila-completa.png` e `moinho-e-trigo.png` mostram o mapa mais compacto e a horta única com poço.

Tudo salvo localmente, sem push, tag ou publicação.
