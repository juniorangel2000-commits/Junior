# Rotas, plataformas e águas — alterações após a preview.25

## NPCs

As posições salvas dos dez moradores são preservadas ao reconstruir as rotinas, inclusive depois de um salto de horário. O destino muda com o calendário; a posição não é substituída pela posição do novo destino. Guias não dão o antigo salto lateral e entram pela porta, sem aparecer diretamente no balcão. Uma entrada ocupada faz o NPC esperar, sem procurar uma posição distante dentro do comércio.

Damião possui percurso persistido entre cabana, píer, saída do lago, estrada e passagem norte da vila. Na ida, sai do comércio e caminha até a passagem antes de aparecer no mapa seguinte. Na volta, começa a sair às 11h30, mas só deixa de ser desenhado no lago depois de alcançar a borda. O mesmo viajante aparece na estrada e chega à vila pela passagem real. O primeiro encontro tardio na cabana também mantém essa saída a pé. Obstáculos e o jogador podem interromper a caminhada sem reposicionar o NPC.

## Colisões e ordem de desenho

Píeres e pontes só aceitam passagem pelas entradas em terra. O píer da vila ganhou uma verificação de travessia equivalente às proteções do lago e das pontes da propriedade. A verificação considera também a largura dos pés. Piso elevado é tratado como seco antes de calcular a profundidade da água próxima.

A varanda da cabana mantém o jogador acima da camada do piso e abaixo dos corrimãos. O recorte dos corrimãos não inclui mais as tábuas do chão. A escadaria da montanha usa o contorno real dos degraus; musgo e pedras laterais ficam fora da área transitável. A subida se conecta à plataforma superior pelos degraus, e o acesso inferior continua livre.

## Água, ilha, barco e pesca

Propriedade, floresta e vila usam o material e a correnteza do lago aprovado, com máscaras das margens reais, ondulações e cardumes discretos. As poças do acesso à cidade recebem movimento, sem se tornarem pontos de pesca. O sistema usa uma camada de correnteza por mapa, com limpeza ao reconstruir ou sair do cenário.

A ilhota possui costa irregular, margem mais estreita, árvore de copa larga e colisão no tronco; a pedra central foi removida. A mistura de cores da margem é limitada a valores válidos para impedir a mancha branca. O casco do barco é desenhado separadamente do píer e oscila suavemente em torno da amarra, sem a imagem estática duplicada.

A pesca continua disponível nas margens dos lagos e rios da propriedade, vila, floresta e lago. O acesso à cidade também suporta corpos de água suficientemente grandes pintados no editor; as pequenas poças naturais não permitem pesca. Somente `fishingLake` pode sortear truta ou dourado. A chance base de lixo é 8% nesse cenário e 24% nos demais. Durante a captura, a identidade continua oculta.

## Áudio e mapa geral

O próprio Player dispara o som de movimento em todos os mapas: passos em terra e braçadas na água, apenas enquanto se move. O nado usa um efeito original de água, com intervalo de 0,7 segundo. As preferências de volume e silêncio são preservadas. A entrada nos mapas normais retoma a mistura de áudio do mundo.

`scripts/export-world-atlas.cjs` exporta os sete cenários externos reais em um atlas PNG e em HTML com zoom. A propriedade é capturada no cenário ativo para incluir a montanha e a casinha dos companheiros. Os mapas urbanos são indicados como destinos da viagem à cidade; os interiores ficam associados às suas construções.

## Validação

1.496 testes automatizados, TypeScript e build de produção aprovados. O QA no navegador confirma: bloqueio da subida lateral nos píeres e ponte; percurso livre pela escadaria e laterais fechadas; personagem visível na varanda; casco sem duplicação e em movimento; saída de Damião pela passagem e continuidade na estrada; passos e mistura de áudio na Floresta Antiga; braçadas na água, passos em terra e silêncio parado. A pescaria foi conferida novamente com teclado, mouse, rede, raro, cancelamento, pausa e persistência. O atlas e a ilhota corrigida foram conferidos visualmente.

Estas alterações ainda não foram publicadas em um novo executável; a release instalada preview.25 permanece inalterada.
