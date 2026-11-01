# Pescaria interativa — alterações após a preview.24

A vara e a isca básica Minhoca têm PNGs próprios na mochila, barra e comércio. Ao pescar com a vara, o personagem se vira para uma posição de água livre próxima e arremessa: vara na mão, linha, minhoca em trajetória curva e boia no ponto de lançamento. A rede usa um lançamento de malha. Os efeitos são removidos ao encerrar a sessão.

## Controles

1. Fique em terra, junto à margem, ou no píer, com equipamento, minhoca e aula de pesca.
2. Use a vara/rede pela mochila ou barra rápida. No lago, E também inicia a pesca.
3. Espere entre 10 e 20 segundos. Após a mordida, há 3 segundos para fisgar com E, Espaço ou clique.
4. Segure E, Espaço ou o botão da interface para subir a faixa verde; solte para descer. Mantenha o peixe na faixa até completar a captura.
5. Esc cancela. Ao perder o foco a disputa pausa; retome pelo botão.

Cada tentativa utiliza uma minhoca e 3 de vigor. Vara captura um peixe, rede até dois. Peixes raros se movem mais rápido; aulas e rede ampliam a faixa de controle. Custos e captura são gravados em rascunhos independentes antes de modificar o estado vivo. Falha de gravação preserva os materiais; falha ao guardar a captura permite repetir a gravação.

## Correções relacionadas

- Criação carrega as poses dos dois personagens antes de habilitar o início, com tentativa novamente se a rede falhar.
- Damião indica naturalmente a vila e oferece a vara, sem falar em liberar passagem. O progresso existente continua compatível.
- Varanda permite entrada e saída pela escada. Píer e ponte impedem travessia lateral, inclusive a partir da água.
- Equipamentos ficam na parte larga do píer. Extremidades dos apoios recebem acabamento submerso.
- Margens são amostradas por pixel. Água e queda animam a arte atual; máscaras e texturas temporárias são limpas ao trocar de mapa.
- Mochila, barra rápida, fabricação simples e consumíveis funcionam também na estrada e no lago.
- Acesso norte da propriedade mantém a placa e a abertura de grama entre árvores, sem uma faixa nova de terra.

## Validação

- 1.423 testes automatizados aprovados; TypeScript e build de produção aprovados.
- QA de criação: ambos os personagens, oito direções, caminhada, falha de rede e recuperação, tela estreita.
- QA da pescaria: espera, janela de fisgada, teclado/mouse, rede, peixe raro, cancelamento, perda de foco, captura persistida e ausência de duplicação.
- QA integrado: arremesso antes do minigame, limpeza dos efeitos, colisão com o Player real, escada utilizável, mochila/cura/fabricação salvas no lago e na estrada, animação da água e transição/editor sem erro.

A alteração ainda não foi publicada como nova versão Windows.

## Refino da queda e da vara

- A queda e o riacho superior usam faixas de textura contínuas, sem reaproveitar trechos estáticos da imagem entre os quadros.
- A espuma branca original da base e dos respingos é retirada da camada da montanha e substituída por partículas animadas.
- O leito superior acompanha o desenho do riacho entre as pedras. A bacia abaixo da queda fica mais larga, com união suave e margens irregulares.
- O acabamento submerso dos apoios consulta a água real, incluindo edições do mapa; não colore madeira sobre terra.
- A vara de bambu tem quatro vistas, com empunhaduras individuais. Norte fica atrás do personagem. As oito combinações de personagem/direção foram conferidas no navegador.
- A arte `docs/arte/pescaria/fazendeira-com-vara-previa.png` é uma proposta de pose para avaliação; não substitui ainda as animações dos personagens.

## Riacho e cachoeira reconstruídos

A água e a espuma antigas da faixa central foram substituídas por um leito limpo. A composição usa somente a região de água identificada no sprite original; o restante da montanha, pedras, escada e vegetação é preservado. O novo material da queda é independente, com escoamento contínuo, velocidade crescente na descida, bordas levemente irregulares e espuma móvel concentrada no impacto. O riacho superior recebe o material de água do jogo em movimento e uma crista animada na passagem para a queda. Não usa os recortes de espuma da cachoeira anterior.

Validação: testes da animação, margens e plataformas; build de produção; conferência no navegador da preservação dos pixels fora da região alterada, movimento no riacho, em toda a queda e no impacto, e limpeza ao trocar de cenário. Sem nova publicação Windows.

## Pedras, margem e turbulência junto à queda

As marcas claras de água pintadas nos pés das pedras foram substituídas por pedra/sombra neutra da arte limpa. O contato animado é calculado separadamente, apenas onde o pé da pedra toca água real. As ondas não surgem ao redor de uma pedra seca apenas porque existe água um pouco mais longe. Pintar chão no editor remove o contato correspondente.

Novas ondas curtas, arcos quebrados e dois redemoinhos suaves se afastam do impacto da cachoeira. São recortados pela margem, pelo terreno editado e pelas silhuetas das pedras. A queda e o riacho aprovados continuam com a mesma animação.

Validação adicional: 31 testes focados aprovados, build e QA no navegador. O QA verifica a limpeza das marcas antigas, preservação da arte fora das regiões de água e dos contatos alterados, pedras molhadas/secas, animação e saída do cenário.

## Personagens segurando a vara

Os dois personagens têm sprites completos de pesca em norte, sul, oeste e leste. A vara faz parte da pose, com as mãos na empunhadura; não é desenhada outra vara sobre o personagem. A arte fica em `public/assets/visual/fishing/characters/`. As células têm 627 × 627 pixels e os pontos de cabeça, sola e ponta da vara ficam em `src/data/fishing-character-poses.ts`.

A altura visível e o contato dos pés foram calibrados para a respectiva pose original. A linha sai da ponta da vara da nova arte, inclusive durante o leve movimento de arremesso. O corpo original é ocultado durante a pesca e restaurado ao capturar, cancelar ou sair do cenário. Rede continua usando o corpo normal. As diagonais escolhem a vista cardinal predominante. Nenhum formato de save foi alterado.

Nas telas largas, o painel aparece à direita e a câmera enquadra o personagem na área livre sem mudar o zoom. Fechar a pesca restaura o enquadramento anterior; telas estreitas mantêm o painel central.

Validação: suíte completa com 1.450 testes aprovada antes do ajuste final de enquadramento; 67 testes focados aprovados após esse ajuste (incluindo 19 novos testes de poses/câmera). Build de produção aprovado. QA no navegador cobre as oito combinações, arremesso/espera/cancelamento dos dois personagens, rede, saída de cenário e ausência de duplicação. Duas pescarias completas gravadas confirmam captura persistida, uma isca por tentativa, restauração do personagem e do zoom/enquadramento. Continua sem nova publicação Windows.

## Espécies, sucata e resultado da pescaria

A pescaria sorteia lambari, tilápia, carpa e bagre no estoque comum; truta e dourado usam o estoque raro. As espécies têm pesos de sorteio, raridades, comprimentos e pesos próprios. O dourado é menos frequente que a truta. Uma tentativa não rara tem 12% de chance de recolher lixo: lata enferrujada, galho encharcado, bota velha ou corda embolada. Eles rendem sucata, galho, tecido e corda, respectivamente. A bota não concede equipamento nem bônus. A rede entrega duas unidades.

As artes transparentes ficam em `public/assets/visual/fishing/catches/`. O script `scripts/build-fishing-icons.cjs` cria as vistas SVG de cada figura sem alterar os PNGs e isola cada silhueta com recorte explícito para não mostrar partes das figuras vizinhas nas áreas transparentes. Os ícones da mochila também usam as novas artes. Para manter receitas e comércio compatíveis, os peixes continuam agrupados nos itens `fish` e `rareFish`; a espécie, tamanho e peso da última captura são registrados no campo opcional `lastFishingHaul`. Partidas antigas continuam válidas. Um registro cosmético corrompido é descartado apenas em memória durante a leitura, preservando a partida.

Durante a disputa, a interface exibe somente uma silhueta escura genérica. A espécie, a arte e a raridade são reveladas na pequena tela de resultado, junto com comprimento, peso e confirmação de armazenamento. Escapar mostra o motivo e não entrega itens. A captura é salva antes do resultado; falha de gravação permite tentar novamente sem entregar prêmio duplicado. Uma tecla mantida da disputa não fecha automaticamente essa tela.

A boia tem flutuação suave, parte submersa translúcida, mergulho na mordida, ondulações móveis e linha ligada à antena. A tensão responde ao comando de recolher. Perder foco congela tanto a espera quanto a animação; a preferência por movimento reduzido diminui as oscilações.

## Arremesso da ferramenta e correções de direção

Sul aponta a vara para a frente e para baixo; no norte, a vara permanece atrás do corpo e a ponta final curva para baixo. O arremesso usa o personagem original, sem quadros de animação corporal: somente a vara de bambu gira junto à mão. Um pequeno pulinho vertical de 3 pixels acompanha o lançamento, sem alterar posição, colisão ou quadro do personagem. A transição dura 1,9 segundo. A isca sai da ponta da ferramenta e segue um arco até a água, com a origem de voo fixa enquanto a vara termina o movimento. Depois da queda da boia, aparece a pose estática de espera. Os atlas de arremesso do corpo foram removidos.

Dois efeitos originais e suaves acompanham a transição: passagem de ar na saída da vara e um pequeno impacto de água quando a boia cai. São disparados uma única vez, respeitam volume/silêncio e não tocam na queda se o arremesso for cancelado antes dela. A captura da prévia grava a saída real de áudio do jogo.

O cabeçalho da pescaria usa o nome do cenário atual. A espera mostra “Aguarde...”; não exibe o prazo da mordida nem o número da técnica. As instruções de fisgada e disputa aparecem quando necessárias. Sair do cenário durante o arremesso ou a espera remove a interface e restaura os efeitos.

Validação: suíte completa com 1.480 testes aprovada após o ajuste da ferramenta/áudio; 70 testes focados aprovados após o ajuste final da interface e limpeza da espera; TypeScript e build de produção aprovados. QA no navegador cobre seis espécies, quatro lixos, rede, tela estreita, silhueta anônima, pausa da boia, motivos de fuga, falha de gravação e tentativa posterior, imagens distintas, oito poses, cancelamento e saída de cenário. Os recortes finais também foram conferidos em uma galeria de dez figuras. Sem nova publicação Windows.
