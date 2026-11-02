# Platô da Nascente — platô superior

Cenário de 1536 × 1024 pixels, com um único nível de circulação. A chegada é pelo topo da escada na borda sul. Somente os dois primeiros degraus aparecem; a descida continua no cenário do Lago entre as Serras. Não há vista inferior, lago de fundo nem cortina vertical de cachoeira neste mapa.

O rio atravessa o platô de norte a sul e passa sob uma ponte curta de madeira, com apoios de troncos e rampas de madeira nas duas margens. Na borda sul, a corrente acelera e mostra apenas a crista antes da queda fora do mapa. A mina fica a nordeste, com entrada no nível do chão, corredor central livre, equipamentos laterais e escala compatível com o personagem. E na entrada leva à sala jogável da Mina Antiga. A passagem central dessa sala fica preparada para o futuro menu de mineração.

## Arte e colisões

Terreno, ponte e mina são sprites separados em `public/assets/visual/highland`. A base não contém pedras soltas no interior dos percursos nem paredões entre áreas de circulação. As rochas ficam nos limites. As árvores são sprites com colisão no tronco, vento e transparência de copa. A ponte tem uma camada dianteira para o guarda-corpo e só pode ser acessada pelas duas cabeceiras terrestres.

`highland-river-contour.json` guarda o recorte da água por pixel. Renderização e nado usam esse mesmo contorno. `node scripts/build-highland-contour.cjs` o recompõe após uma mudança da arte (requer `pngjs`, disponível no ambiente de desenvolvimento). A suíte compara o hash do PNG e do contorno, verifica margens e percorre as duas margens e a ponte com a folga dos pés do personagem. O trecho junto à crista da queda bloqueia o avanço dos nadadores para fora do mapa.

A água usa o material animado aprovado para o lago, com peixes e reflexos. A crista é um efeito discreto na borda inferior; nenhuma parte da descida da água é desenhada. A escada reaproveita o início da arte original do lago em escala nativa, recortada em apenas 48 pixels de altura, junto ao limite inferior.

## Ligação com o lago e salvamento

- Entrada no platô: (272, 944), voltado para cima, acima dos degraus.
- Início da descida: faixa centralizada em x=271, na altura y=982, abrangendo a largura da escada.
- Retorno no lago: (1104, 240), nos primeiros degraus da escadaria original, voltado para baixo.
- Caminhar a partir do lago sempre usa o ponto de chegada. Continuar restaura a posição salva se houver espaço para os pés; posições inválidas são recuperadas na chegada.
- Ficar parado ou caminhar para dentro do platô não dispara uma troca de cenário.

HUD, inventário, mapa M com dimensões próprias, editor F2, companheiro e pesca comum no rio continuam integrados. O cenário armazena suas alterações e posição separadamente dos mapas existentes.

## Verificação

`tests/highland.test.ts` valida chegada, recorte curto da escada, trajeto completo até a mina, área frontal livre, escala da mina, contorno da água, limites, bloqueio dos guarda-corpos, retorno ao lago, persistência e proteção na borda da queda.

`scripts/qa-highland.cjs` confere a passagem a partir do lago, posição de chegada, inventário e mapa, interação na mina, bloqueio da ponte a partir da água, editor, retomada de save, descida sem retorno automático e reentrada após uma visita anterior.

`scripts/qa-highland-art.cjs` captura o mapa real, verifica água em movimento e confirma que só o topo da escada e a crista da queda estão desenhados. `scripts/preview-highland-walk.cjs` conduz o Player pelas trilhas, ponte e entrada da mina para gravar uma prévia.

Incluído na atualização 0.10.0-preview.28, com acesso à Mina Antiga e continuidade pela escadaria do lago.

Validação final do platô: build e 1.566 testes em 181 arquivos aprovados. A conferência no navegador confirmou chegada no alto, retorno aos degraus do lago, descida contínua, reentrada, mapa, inventário, interação na mina, editor, retomada de save e bloqueio das laterais da ponte, sem erros JavaScript.

## Ponte, mina e escada adaptadas ao platô

As novas artes substituem os apoios altos e a antiga composição da mina. A ponte tem 200 × 90 pixels, inteiramente de madeira, com tablado horizontal, guarda-corpo dianteiro separado e apoios de troncos próximos das margens. O perfil do tablado e o recorte do guarda-corpo usam o mesmo atlas que a renderização. A mina tem 400 × 140 pixels, substituindo um trecho do paredão norte com as mesmas lajes verticais, fendas e cobertura de grama. A abertura fica no nível do chão, com uma pequena caixa e uma picareta à esquerda. A colisão acompanha a frente rochosa e preserva o corredor central.

A escada foi centralizada no caminho de chegada: centro visual x=271,5 e jogador x=272. O recorte nativo recebe uma transição de transparência apenas na borda superior de grama e nas laterais, mantendo os dois degraus íntegros. Isso evita o contorno retangular do recorte no chão.

A conferência no navegador atravessa a ponte caminhando nos dois sentidos e captura o personagem sobre o tablado; também verifica bloqueio das laterais a partir da água, interação na mina, editor, retomada de save e retorno ao lago. Os testes dedicados verificam o tamanho dos novos frames, alinhamento da escada, passagem entre as margens e acesso livre à mina.

O alinhamento final da ponte acompanha as duas chegadas do caminho: cabeceiras próximas de (740, 397) e (932, 397), junto aos trechos pintados de terra nas margens. A passagem foi conferida caminhando nos dois sentidos. A nova mina ocupa a faixa do paredão ao norte, com centro em (1280, 90) e aproximação em (1278, 140,4), integrando a porta à pedra existente. A revisão final passou pelo build, 22 testes de serra/transição e conferência completa no navegador, sem erros JavaScript.

## Enfeites e último deslocamento da escada

A ponte usa nova arte inteiramente de madeira, mantendo as cabeceiras alinhadas aos caminhos. Barris, caixotes, sacos, lenha empilhada, pedras pequenas e samambaias foram colocados nas laterais do pátio da mina. O corredor central e a arte aprovada da mina foram preservados. Os objetos sólidos têm uma colisão na base, que acompanha suas posições no editor.

A escada e a chegada foram deslocadas 32 pixels para a esquerda: jogador em (272, 944), faixa de descida centralizada em x=271. Os pontos padrão do editor usam as mesmas constantes do cenário; coordenadas padrão antigas são recuperadas na chegada nova. A conferência no navegador verifica o retorno e a reentrada também após abrir o editor.

Validação da ponte inteiramente de madeira, enfeites e escada deslocada: build/TypeScript e 1.568 testes em 181 arquivos aprovados. A conferência no navegador atravessou a ponte nos dois sentidos, verificou a entrada da mina, as laterais da ponte, os novos objetos no editor, retomada de save e chegada na nova posição após voltar do lago, sem erros JavaScript.

## Arte do terreno em maior definição

O chão do platô foi redesenhado com lâminas de grama separadas, pétalas, pequenos grãos de terra e fendas de pedra definidos. A fonte está em quatro trechos de 1536 × 1024 pixels, em `terrain-sections`, cada um cobrindo uma área de 864 × 576 pixels do mundo com sobreposição entre trechos. A textura composta `ground-detailed.png` tem 3072 × 2048 texels e continua exibida no mesmo mundo de 1536 × 1024 pixels. O detalhe vem do desenho das novas fontes. A composição não acrescenta ruído nem aplica filtros de nitidez.

`node scripts/bake-highland-ground.cjs` compõe os quatro trechos e ajusta suas margens ao recorte aprovado em `highland-river-contour.json`. A máscara de água permanece idêntica por pixel, repetida exatamente em escala 2; as colisões, os objetos, a ponte, a mina e a escada mantêm suas coordenadas. `terrain.png` permanece como referência intacta do layout original.

`ground-detailed.json` registra os hashes dos quatro trechos, da referência original, do contorno e da receita para impedir uma textura desatualizada. A composição ocorre durante a autoria, sem processamento adicional por quadro ou entrada no cenário. O pacote leva apenas a textura pronta; as fontes e o metadado ficam no repositório.

A vegetação das extremidades do sprite da mina recebe um recorte de transparência, preservando a frente de pedra e a abertura. Isso elimina a faixa de grama que se sobrepunha à parede da montanha nas bordas. A arte original da mina permanece preservada.

`scripts/qa-highland-detail.cjs` captura o terreno isolado e a região da mina antes/depois em sessões separadas, no mesmo zoom e com iluminação controlada. Também verifica o tamanho real da textura, a dimensão inalterada do mundo e a transparência da água. `HIGHLAND_GROUND_BEFORE` permite comparar com uma textura anterior específica. Os testes da composição verificam a máscara inteira e impedem água estática em trechos sólidos das margens.

Validação da arte redesenhada: build e 18 testes de composição, circulação e conteúdo do pacote aprovados. As duas sessões do navegador passaram sem erros JavaScript, com o mesmo mundo de 1536 × 1024 e máscara de água íntegra. `Nitidez-antes.png` e `Nitidez-depois.png` mostram o terreno no mesmo enquadramento e iluminação.

## Equipamentos da mina, árvores e água

Um carrinho carregado sobre um trecho curto de trilho, um suporte com picareta/pá/lanterna e uma pequena pilha de minério e carvão ocupam as laterais do pátio. As três novas sprites ficam em `minecart.png`, `toolstand.png` e `orepile.png`, com colisão apenas na base e suporte para mover, remover e inserir no editor. A lanterna do suporte usa a iluminação de cenário existente. A frente da mina e seu corredor central continuam livres.

Sete árvores adicionais ocupam bolsões de grama, totalizando onze, com as mesmas variantes e balanço do vento já usados no jogo. Os troncos permanecem fora das trilhas, da ponte, da escada e da entrada da mina.

A água combina a textura comum `lake-flow-original-water` como fundo com a camada animada de opacidade 0,3, seguindo o material usado nos outros cenários. Peixes, reflexos e correnteza continuam recortados pelo mesmo contorno do rio, sob o terreno. A composição de maior definição aprovada permanece intacta.

Validação: build e 81 testes direcionados de terreno, colisões, circulação, editor, água e distribuição aprovados. `scripts/qa-highland-dressing.cjs` confirmou as três decorações carregadas/editáveis/sólidas, as onze árvores, o balanço do vento, a textura comum nas duas camadas de água, animação e travessia da ponte nos dois sentidos, sem erros JavaScript. `Mapa-no-jogo.png`, `Mina-decorada.png` e `Agua-padronizada.png` mostram essa versão dentro do jogo.
