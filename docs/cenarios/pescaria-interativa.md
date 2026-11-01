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
