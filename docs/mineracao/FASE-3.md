# Fase 3 — recursos e regeneração

> Histórico: na fase seguinte, o usuário pediu acesso por menu e cenário separado.
> O fluxo atual está em `FASE-4.md`; os recursos e a renovação descritos aqui permanecem.

**Concluída:** depósitos, coleta e renovação parcial integrados ao mapa contínuo.
A sala e a abertura central aprovadas são mantidas. Não há menus de profundidade,
novas picaretas, novos itens, alterações de preços ou minérios adicionais.

## Funcionalidades verificadas

- Pedra, ferro, ouro e metal negro. A posição e o material dependem da semente,
  célula, faixa de profundidade, categoria de galeria e ciclo de renovação.
  Não existe depósito obrigatório de metal negro nem compensação por azar.
- Novas sprites de parede têm versões de pedra comum, ferro bruto, ouro bruto
  e metal negro bruto encrustados na mesma rocha-base. O inventário mantém as
  imagens e itens oficiais. Somente a camada exposta aparece; o interior do maciço
  permanece oculto. Minerar revela e ajusta a face seguinte localmente; escavar revela os depósitos vizinhos sem revelar minérios enterrados
  no mapa geral. O nome do material aparece ao se aproximar.
- Mesmas regras de ferramenta, eficiência, desgaste, fragmentos/minérios inteiros,
  coleta, capacidade da mochila e contagem de extrações da ferraria.
- O primeiro golpe fixa o material daquela rocha. Trabalho parcial e túneis da
  fase 2 mantêm pedra; os dados antigos recebem uma data conservadora ao atualizar,
  sem presumir há quantos dias foram escavados.
- Renovação acontece exclusivamente numa entrada nova, após uma saída registrada
  e o intervalo em dias do jogo. Continuar uma partida dentro da mina não inicia
  outra expedição. Nenhum bloco se regenera durante a exploração.
- Somente blocos antes escavados da categoria C reaparecem. A rocha e sua colisão
  voltam de fato; o material é sorteado novamente e o ciclo ganha identidade própria.
  A categoria B permanece escavada e a categoria A nunca é candidata.
- Antes de repor uma célula, uma busca verifica que seus vizinhos caminháveis
  continuam ligados. Isso preserva a conexão de todas as células restantes,
  incluindo túneis permanentes que dependam de passagem por uma galeria secundária.
- Posições de pets presentes ou esperando na mina ficam protegidas com margem.
  A API também recebe pontos de segurança para os futuros NPCs e objetos de missão;
  os sistemas de Bento e de missões continuam nas suas fases próprias.
- Materiais não são concedidos pela renovação. O novo ciclo só entrega recursos
  quando novamente minerado. Falha na gravação reverte a entrada e a renovação.
- Datas, contadores e ciclos persistem. Renovações não podem ser repetidas pelo
  ato de abrir/fechar o jogo ou atravessar repetidamente a entrada no mesmo dia.

## Parâmetros provisórios

Arquivo: `src/data/underground-balance.ts`. Valores para teste, **não finais**.
As probabilidades abaixo são por bloco escavável de categoria B. Na categoria C,
usa-se 85% de cada probabilidade; o restante corresponde a pedra.

| Faixa | Ferro | Ouro | Metal negro |
| --- | ---: | ---: | ---: |
| Superficial | 20% | 0% | 0% |
| Intermediária | 23% | 2% | 0% |
| Profunda | 25% | 3,5% | 0,08% |
| Extrema | 27% | 5% | 0,16% |

Prazos mínimos desde a extração: pedra 3 dias, ferro 5, ouro 9, metal negro 14.
A renovação seleciona uma fração-alvo de 35% das células elegíveis (arredondada
para cima), com máximo de 64 por entrada. Rotas e posições protegidas têm
prioridade, portanto o resultado pode ser menor ou zero. Entre renovações
bem-sucedidas há pelo menos 3 dias. A margem dos atores é de 64 pixels.

## Arquivos realmente alterados nesta fase

Novos:
- `src/data/underground-balance.ts`
- `src/systems/underground-geology.ts`
- `src/systems/underground-renewal.ts`
- `src/underground-mineral-art.ts`
- `public/assets/visual/mine/front-wall-materials.png`
- `public/assets/visual/mine/front-wall-materials.json`
- `tests/underground-phase3.test.ts`
- `docs/mineracao/FASE-3.md`

Integração e verificações existentes:
- `src/systems/underground.ts`
- `src/systems/save.ts`
- `src/scenes/HighlandScene.ts`
- `src/scenes/MineScene.ts`
- `src/underground-view.ts`
- `tests/underground.test.ts`
- `scripts/qa-underground.cjs`
- `docs/mineracao/IMPLEMENTACAO.md`

## Testes

167 testes direcionados passaram em 10 arquivos: a cobertura da fase anterior
mais 17 casos novos da fase 3. Foram verificados materiais oficiais, raridade,
faixas e parâmetros, ferramentas, recompensas únicas, conversão dos saves da
fase 2, progresso parcial, ciclos, intervalos, limites, conectividade, proteção
de pets/pontos extras, falha de salvamento e rejeição de dados inválidos.
TypeScript e a compilação de produção passaram. Não foi repetida a suíte global.

`node scripts/qa-underground.cjs --phase3` passou sem erros de JavaScript:
- percurso da entrada central e escavação normal;
- ferro visível, minerado com a picareta e coletado uma única vez;
- camadas de trás ocultas e próxima face revelada ao destruir o bloco;
- veios brutos encrustados no lugar de ícones de minério solto;
- persistência e saída/reentrada;
- avanço de 15 dias dentro da mina sem regeneração;
- continuar pelo menu sem criar outra expedição;
- reposição real de um bloco secundário na entrada posterior;
- nova entrada no mesmo dia sem renovar mais blocos.

Prévias: `/workspace/mineracao-fase3-qa/`, incluindo `07-Veio-de-ferro.png`.

## Pendências e próxima fase

Probabilidades, intervalos e quotas continuam ajustáveis e provisórios.
Próxima: **fase 4 — perigos subterrâneos**: zumbis e ruído, desabamentos
sinalizados, ar contaminado com 2% da vida máxima por segundo, escuridão e
morcegos. Isso ainda não foi implementado nesta fase. Viagens, mineração e
estoque privado de Bento, expedições, missões e resgate continuam nas fases 5–10.
