# Vila — paisagismo e cotidiano depois da preview.10

Implementação local para avaliação visual, sem nova publicação. A praça, seus pisos e os caminhos aprovados permanecem com as mesmas cores e dimensões.

## Comparação visual

A [comparação interativa](comparar.html) usa as capturas originais, com o mesmo enquadramento. A vista geral mostra clareiras e diferentes profundidades de bosque, no lugar das faixas regulares da preview.10. São 234 árvores de seis variedades. As copas completas respeitam fachadas, equipamentos externos e acessos.

As 195 moitas de grama alta aparecem em grupos mais densos, separados por áreas de grama baixa. Arbustos e flores soltos foram substituídos por pequenos conjuntos mistos. A proteção contra sobreposição considera os retângulos das plantas e a água/piso pintados no editor; não há juncos sobre o lago.

Os dez comércios têm equipamentos externos distintos: entregas no armazém, ferramentas e lingotes na ferraria, ervas secando, tábuas na carpintaria, sementes, baús no antiquário, varal na costura, tina e corda na pesca, mesa na pousada e peças mecânicas na oficina. Há ainda um quadro comunitário de avisos e uma reserva de lenha junto à casa sul. Os 12 conjuntos têm colisão na base, posições verificadas contra as fachadas e áreas reservadas contra vegetação.

As novas artes seguem a referência visual das construções. Os PNGs gerados foram preservados; os atlas usam coordenadas e recorte de alpha apenas na textura em memória. As fontes e os hashes estão em `public/assets/visual/village/lived-in`.

## Movimento

O moinho usa torre e pás separadas, com eixo fixo e uma volta a cada 120 segundos reais. A fonte mantém as ondulações e recebe pequenas gotas animadas. Não são criados timers ou tweens por objeto.

NPCs podem olhar brevemente para os lados após ficarem parados. O efeito altera apenas o frame exibido, sem deslocar o personagem nem alterar sua direção salva. Caminhada, condução, proximidade do jogador e conversas têm prioridade.

## Validação

- 892 testes em 104 arquivos passaram, incluindo os novos testes de posições, colisões, atlas e movimento ambiente.
- TypeScript e build de produção passaram; permanece o aviso conhecido do Vite sobre tamanho do bundle.
- 15 verificações de cenário no Chromium passaram: decoração, água, caminhos, giro do moinho, acesso às dez lojas, píer, coreto e save.
- 12 verificações de rotinas e conversas passaram: todas as cinco duplas, pico de quatro NPCs na praça, participantes parados e retomada do trabalho.
- Sem erros JavaScript, HTTP ou WebGL nas verificações do navegador.

A comparação visual favorece esta composição: os comércios são mais reconhecíveis e os espaços verdes apresentam áreas cheias e vazias. O movimento é propositalmente discreto; não foram criadas animações de trabalho com braços ou novos ciclos de sprites dos NPCs. O quadro de avisos, a mesa e os demais enfeites são decorativos nesta etapa.
