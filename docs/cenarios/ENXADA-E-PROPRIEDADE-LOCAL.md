# Enxada, canteiros removíveis e acesso à casa

Implementação local sobre o código preservado da versão 0.9.4. A publicação
existente permanece em v0.9.4; este trabalho prepara a próxima atualização.

## Como jogar

- C: fabricar **Enxada simples** com 1 cabo, 1 pedra lascada e 1 corda.
- I: arrastar a enxada da mochila para um dos nove atalhos.
- Com a enxada, **E ou clique** prepara um quadrado livre da propriedade.
- **Shift + E ou Shift + clique** desfaz um canteiro vazio.
- Uma planta, inclusive madura, precisa ser colhida antes de desfazer o solo.
- Sementes, regador e mãos vazias continuam usando as ações existentes.

O solo só é alterado no contato do golpe. Pausar, trocar a ferramenta ou abrir
um menu antes do contato cancela a ação. A operação e o alvo são capturados no
início: soltar Shift durante o golpe não transforma uma restauração em preparo.

## Terreno e continuidade

Os 45 quadrados da horta original usam a mesma camada de canteiros que os novos
quadrados. Ao desfazer um deles, a grama original aparece por baixo. Os novos
canteiros revelam o piso anterior do mapa, sem substituir a pintura do autor.
É possível preparar o chão novamente. Canteiros, plantas, água do regador e
conclusão da primeira colheita são preservados ao salvar e recarregar.

O save mantém versão 2 e sua chave original. A migração de partidas v2 anteriores
acrescenta somente o contador ausente `hoe: 0`, sem dar ferramentas ou modificar
o armazenamento durante a leitura. `preparedSoil`, `restoredFarmSoil` e
`farmingProgress` são extensões opcionais validadas. Saves anteriores continuam
com a horta e as plantas existentes.

Plantas apontadas têm prioridade sobre a busca automática de recursos próximos
quando o jogador usa as mãos. A colheita não se repete após recarregar, e a missão
não volta a ficar incompleta quando o jogador gasta o nabo.

## Caminho, flores e editor

O acesso termina alinhado à porta e usa pequenas pedras gastas sobre terra,
com bordas de grama. Os canteiros densos nas laterais da casa foram removidos;
as flores de chão aparecem em grupos esparsos pelo cenário, inclusive a leste
e ao sul. Essa decoração tem posições estáveis e não fornece recompensas.

Pintar o piso no editor elimina toda a decoração de chão que cruza aquele
quadrado, inclusive folhas que invadiriam a borda. Os pisos secos da entrada
podem ser trocados. Depois de desfazer um quadrado da horta, seu piso também
pode ser personalizado. Construções, plantas e canteiros ativos ficam protegidos
durante a edição e importação. Os pontos de transição e chegada são preservados.

## Arte provisória e validação

A enxada usa uma cópia idêntica da antiga `enxada_simples.png`, sem repintura nem
redução do arquivo original. O adaptador de arte faz um movimento lateral
provisório; será substituído quando o autor enviar sua nova sprite e animação.

- `npm run check`: aprovado.
- `npm test`: 413 testes aprovados em 38 arquivos.
- `npm run build`: aprovado.
- Roteiro interativo: `scripts/qa-farming-soil.cjs`.
- Evidências do navegador: `docs/cenarios/enxada-provisoria/`.
- Chromium: aprovado; 26 verificações registradas em
  `enxada-provisoria/validacao.json`, sem erros de página. Inclui restauração
  da horta inicial para grama, troca dos pisos da entrada e da horta desfeita,
  decoração espalhada a leste/sul e remoção integral das flores ao pintar.

Nenhuma Release ou executável novo foi publicado nesta etapa.
