# Mineração integrada — execução por fases

**Estado atual: fases 10 e 11 concluídas e verificadas.** Veja
[FASE-10.md](FASE-10.md) para afinidade, conversas e memórias verdadeiras, e
[FASE-11.md](FASE-11.md) para os ajustes de persistência, polimento e regressão.
A última distribuição Windows é `v0.10.0-preview.29`, com as fases 1–9.
As fases posteriores estão na branch `feature/vida-social-npcs`.
Resgate e retorno físico de Bento estão em `FASE-9.md`; pedidos e diário em
`FASE-8.md`; companhia e defesa em `FASE-7.md`; mineração e depósitos em
`FASE-6.md`; rotina e viagens em `FASE-5.md`; perigos e menu em `FASE-4.md`.

**Correção mais recente do usuário:** Mina Antiga → menu na porta central →
cenário separado Galerias da Mina. A recepção não inicia uma expedição. Confirmar
o menu leva à área de mineração; a passagem de volta retorna à recepção.
Os relatórios abaixo preservam o histórico das entregas anteriores; o acesso
direto da fase 2 foi substituído por este fluxo.

## Fase 1 — análise concluída

Phaser 3.90 + TypeScript, Vite e Electron. Não são necessárias dependências novas.
A especificação completa aprovada está em `ESPECIFICACAO.md`.

| Componente | Existente e reutilizável | Extensão necessária |
| --- | --- | --- |
| Entrada e mundo | `scenes/MineScene.ts`, `data/mine-room.ts`, `scenes/HighlandScene.ts` | Galerias contínuas ligadas à porta norte, sem andares ou seleção de profundidade |
| Colisões e navegação | `Player`, `systems/village-walk.ts`, `systems/room-navigation.ts` | Consulta por célula e revisão local de blocos escavados |
| Picaretas | `systems/resources.ts`, `systems/tool-use.ts`, `tool-visual.ts`, `systems/economy.ts` | Adaptador de blocos; conservar alcance de 68 px, golpes, eficiência e desgaste |
| Inventário e metais | `Inventory`, `data/economy-balance.ts`, `systems/mining.ts` | Pedra/ferro/ouro/metal negro com IDs atuais; distribuição por faixa na fase 3 |
| Tempo e saves | `systems/clock.ts`, `systems/save.ts` | Delta esparso da mina e migração de posições da entrada |
| Bento | `bento-sprites.ts`, `systems/merchant-routine.ts`, `systems/village-background.ts` | Viagens semanais, mineração real, inventário privado, expedições e resgate |
| Oficina | `smith-layout-art.ts`, `systems/smith-layout.ts`, `blacksmith-panel.ts` | Depósito privado dentro da oficina; fechar comércio durante ausências |
| Combate e zumbis | `dungeons/run.ts`, `dungeons/boss-combat.ts`, `systems/survivor-combat.ts` | Extrair/adaptar componentes comuns na fase 4, sem combate paralelo |
| Luz e diálogos | `FixtureLighting`, iluminação das dungeons, painéis de conversa da vila | Escuridão por faixa, comandos do Bento e pedidos nas fases correspondentes |

Bento tem idle e caminhada oficial em oito direções, seis quadros por caminhada.
Quadros específicos de mineração, forja, bigorna, guardar/retirar materiais,
conversa gestual, defesa e fuga não foram encontrados como clips oficiais.
Não considerar esses movimentos finalizados antes de produzir/verificar os assets.
O relógio tem dia absoluto e hora, sem calendário sazonal: semana será calculada
pelo dia existente, sem implementar as estações que continuam adiadas.
A exploração usa vigor e as dungeons têm vida própria; integrar vida e derrota
subterrâneas na fase 4/9 exige uma decisão de modelo compartilhado, sem fingir
que vigor já é o sistema de vida pedido.

## Plano técnico da fase 2

- Uma cena `Mina`, com entrada aprovada no sul e galerias conectadas ao norte.
- Layout determinístico, células de 32 px e alterações esparsas persistentes.
- Categorias A/B/C explícitas; a fase 2 não regenera células C.
- Serviço de golpe compartilhável por jogador e Bento, usando `Resources.hit`,
  `Inventory`, `ToolUse` e durabilidade atuais; recompensas confirmadas uma vez.
- Atualização de autotile apenas no bloco alterado e vizinhos imediatos.
- Texturas próprias de piso e rocha, criadas com a Mina Antiga como referência; props reutilizam os sprites aprovados. A sala original permanece preservada.
- Salvamento transacional de golpes, estoque e túneis. Falha de gravação reverte
  toda a ação. Partidas antigas continuam carregando na entrada original.
- Testes direcionados de mineração, saves, ferramentas e circulação; teste no
  navegador de entrada, escavação real, coleta, retomada e retorno à montanha.

## Sequência posterior

3. Raridades configuráveis, profundidade, coleta e regeneração protegida.
4. Zumbis/ruído, desabamentos, contaminação de 2%/s, luz e morcegos.
5–6. Uma identidade de Bento, semana/viagens/comércio e mineração com estoque privado.
7–8. Expedições, liderança, pedidos, acontecimentos e diário.
9–10. Derrota/resgate e relações sociais simples, sem mudar economia ou profissões.
11. Polimento integrado, desempenho e verificações finais.

A implementação não altera regras das picaretas, não adiciona cobre nem novos
NPCs, não garante metal negro e não disponibiliza estoque privado ao jogador.

## Fase 2 — concluída e verificada

- Um mapa de 160 × 192 células (5.120 × 6.144 px), na mesma cena `Mina`.
  A sala aprovada fica ao sul, e a abertura **central** leva às galerias sem
  menu de profundidade nem troca de cena. Ramificações e quatro faixas espaciais
  estão conectadas. Os perigos dessas faixas ainda pertencem à fase 4.
- Blocos individuais, alcance e linha de visão, animação de ferramenta existente,
  cinco golpes com picareta básica, eficiência/desgaste originais, rachaduras,
  partículas de impacto e coleta pela mochila já existente.
- Pedra nesta fase: a lógica comum de recursos entrega as mesmas quatro pedras
  da rocha minerável atual. A distribuição de ferro/ouro/metal negro é fase 3.
- Atualização da célula e quatro vizinhas ao abrir uma parede; rachaduras também
  são atualizadas individualmente. O layout imutável é reutilizado por semente,
  sem reconstruir o mapa por golpe. Navegação consulta as colisões atuais.
- Transação de golpe, ferramenta, inventário e abertura. Um segundo ator não
  recebe novamente o recurso de uma célula já destruída. Falha de salvamento
  preserva tudo. Uma mochila cheia não perde a rocha no golpe final.
- Saves anteriores traduzem a posição da entrada e os pets daquele interior
  uma única vez. Posição externa e outros cenários são preservados.
- Texturas novas de piso e rocha; amostragem contínua entre células, bordas arredondadas com variação orgânica compartilhada pela colisão,
  com curvas nas saliências e reentrâncias, trilhos refinados e lanternas recortadas sem fundo retangular.
  A imagem oficial `first-gallery.png` não foi modificada.

### Arquivos realmente alterados nesta fase

Novos:
- `src/data/underground-layout.ts`
- `src/data/mine-wall-shape.ts`
- `src/systems/underground.ts`
- `src/underground-view.ts`
- `public/assets/visual/mine/subterranean-textures.png`
- `public/assets/visual/mine/subterranean-textures.json`
- `tests/underground.test.ts`
- `scripts/qa-underground.cjs`

Integração:
- `src/scenes/MineScene.ts`
- `src/scenes/HighlandScene.ts`
- `src/mine-room-view.ts`
- `src/data/mine-room.ts` (rótulos dos veios decorativos; nenhum cobre criado)
- `src/systems/resources.ts` (material explícito opcional, mantendo regras)
- `src/systems/save.ts`
- `src/types.ts`
- `src/systems/village-walk.ts` (dimensões opcionais; padrões preservados)
- `src/dungeons/world-pet-state.ts`
- `src/dungeons/world-companion.ts`
- `src/dungeons/world-pet-controller.ts`
- `scripts/qa-mine-room.cjs` (mesmo comando, agora cobre a mina contínua)

Documentação da fase 1 e continuidade:
- `docs/mineracao/ESPECIFICACAO.md`
- `docs/mineracao/IMPLEMENTACAO.md`

### Testes

150 testes direcionados passaram em nove arquivos: `underground`, `mine-room`,
`economy6`, `tool-use`, `world-pets`, `navigation-performance`, `save-migration`,
`save-directions` e `survivor-residents`. TypeScript e compilação de produção
passaram. A suíte global não foi repetida.

O teste real `scripts/qa-underground.cjs` passou sem erros de JavaScript: entrada
pelo platô, sala preservada, passagem central, caminhada nas galerias, seleção
pela hotkey, cancelamento antes do contato ao abrir inventário, golpes por E e
clique, rachaduras, desgaste, recompensa única, nove atualizações locais nos
cinco golpes, circulação na célula escavada, mapa geral, save/continue e saída e
reentrada preservando os túneis.

Prévias locais: `/workspace/mineracao-fase2-qa/`.

### Pendências e próxima fase

Próxima: **fase 3 — recursos e regeneração**. As categorias permanentes e
renováveis estão identificadas, mas **não há regeneração ainda**. Adicionar
probabilidades/intervalos configuráveis, sem garantir metal negro e sem fechar
corredores. Células parcialmente trabalhadas desta versão devem conservar sua
pedra/progresso ao introduzir os depósitos.

Ainda não implementados: perigos (incluindo 2% de vida máxima/s de contaminação),
vida/resgate subterrâneo, viagens de Bento, mineração e depósito privados,
expedições conjuntas, pedidos e memórias. Os clips específicos de trabalho e
defesa de Bento seguem pendentes; os sprites oficiais de caminhada são mantidos.
Esses itens não estão sendo apresentados como concluídos.
