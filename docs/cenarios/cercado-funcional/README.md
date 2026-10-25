# Cercado funcional — implementação local

## Como usar

1. Abra **B** e escolha **Porteira** (4 madeiras). **R** gira entre quatro posições (dobradiça à esquerda, acima, à direita ou abaixo). **F** inverte o sentido da abertura; a seta no terreno indica esse sentido antes de colocar.
2. Com as mãos livres, use **E** na porteira para abrir ou fechar. Ela não fecha sobre o jogador ou os pontos de colisão de um animal.
3. Conduza o animal da floresta com a corda, atravesse a porteira e feche quando o animal estiver inteiramente dentro. **G** solta o animal, acolhe-o na propriedade e devolve a corda uma única vez.
4. Para mudar um animal já acolhido de lugar, aproxime-se com as mãos livres e **E** reserva uma corda novamente. **G** devolve essa mesma corda sem duplicar o animal.
5. Em **B → Reparar cerca**, selecione o reparo e use **E** ou clique sobre uma cerca desgastada: custa 1 madeira e reinicia sua idade. Cercas novas não gastam material.

Os animais continuam andando e respeitam a colisão física do cercado. Porteira aberta ou trecho removido permite passagem; o animal não é forçado a sair se preferir o terreno protegido dentro. A orientação, o lado de abertura (`gateFlip`), o estado aberto/fechado, a posição dos animais, a corda reservada e as datas das cercas são salvos. Porteiras de saves antigos mantêm a orientação original sem exigir conversão manual.

A chegada à propriedade já não solta a corda automaticamente. A condução continua após a transição e após salvar/recarregar; o acolhimento acontece ao soltar com G. Saves existentes continuam compatíveis.

## Arte e capturas

As artes aprovadas das cercas foram preservadas. A porteira usa a mesma madeira, com folha emoldurada, diagonal estrutural, ferragens e fecho. A folha abre a 90° nas duas orientações. A horizontal aberta é vista de perfil, alinhada ao eixo norte/sul, presa ao pino interno da dobradiça; a vertical aberta mostra a folha alinhada ao eixo leste/oeste. Os postes permanecem sempre em pé. As camadas se ordenam em torno do personagem durante a passagem.

**Preferência do usuário para revisão visual: ocultar as árvores ao capturar imagens dos objetos e cercados.** Somente a visibilidade da sessão de captura é alterada; as árvores, colisões e dados dos mapas continuam presentes no jogo.

- `cercado-fechado.png`: captura real do cercado completo com o animal acolhido, árvores ocultas.
- `cercado-aberto.png`: a mesma área após conduzir o animal para fora pela porteira aberta, árvores ocultas.
- `porteira-vertical-90-graus.png`: captura real, com a porteira vertical fechada à esquerda e totalmente aberta à direita; árvores ocultas.
- `porteira-horizontal-abertura-90-graus.png`: captura real da abertura horizontal reta, de perfil, nos dois sentidos; árvores ocultas.
- `direcoes-porteiras/porteiras-horizontais-abertas.png`: captura real de duas porteiras horizontais, abrindo nos sentidos opostos; árvores ocultas.
- `direcoes-porteiras/porteiras-quatro-direcoes-texturas.png`: as quatro posições e os dois sentidos, compostos com as texturas efetivamente carregadas pelo jogo.
- `direcoes-porteiras/direcoes-validacao.json`: R/F pela UI, oito construções por E, custo, colisão, reabertura, persistência e 64 texturas verificadas.
- `porteiras.png`: detalhes das quatro texturas reais da porteira, não uma imagem conceitual.
- `validacao.json`: construção pela UI, reparo, transição real, percurso no chão com limite da corda, salvar/recarregar, G, movimento contido, nova captura e passagem aberta. Inclui fechamento recusado na borda exata do corpo do animal.
- `orientacao.json`: construção vertical por R/E, abertura, persistência, profundidades das camadas e ausência de pixels da folha aberta dentro da passagem.

A folha da porteira é composta em tempo de execução. `finished-gate-source.png` é a referência gerada para as ferragens: apenas regiões opacas das dobradiças e do fecho são usadas, sem o fundo dessa referência.

### Ajuste mais recente do encaixe horizontal

A prévia atual está em `ponta-corrigida/porteira-horizontal-encaixe-medido.png`: fechada à esquerda e aberta à direita, na mesma escala e com as árvores ocultas. `ponta-corrigida/porteiras-horizontais-abertas.png` mostra os dois sentidos. A ponta do perfil usa uma tábua contínua, sem o montante transversal que aparecia invertido ao recortar a moldura. As capturas anteriores, inclusive em `encaixe-curto/`, foram preservadas para comparação.

Medidas extraídas dos pixels carregados no jogo: perfil aberto de **3 × 28 pixels do mundo**, contra 42 pixels de comprimento na prévia anterior (redução de um terço). O comprimento agora iguala os 28 pixels da folha fechada, num tile de 32 pixels. O perfil sobrepõe 0,5 pixel da borda interna do poste; as duas faixas de dobradiça foram verificadas sem fresta nos quatro arranjos horizontais. A arte fechada e toda a arte vertical mantêm os mesmos pixels. O relatório completo está em `ponta-corrigida/direcoes-validacao.json`.

## Verificação

- 521 testes aprovados em 54 arquivos, incluindo vaca e galinha caminhando dentro do cercado fechado e saindo pela passagem aberta.
- TypeScript e build de produção aprovados.
- `scripts/qa-gates-enclosures.cjs`: ciclo completo da floresta ao cercado e saída conduzida, sem erros no navegador.
- `scripts/qa-gate-orientation.cjs`: colocação horizontal/vertical, abertura e salvamento.
- `scripts/qa-gate-directions.cjs`: quatro posições, espelhamento da abertura, interface R/F/E, persistência e prévias sem árvores.
- `scripts/qa-auto-map-transition.cjs`: regressão das passagens e editor oculto na versão de produção.

Esta implementação ainda não foi publicada em uma nova Release.
