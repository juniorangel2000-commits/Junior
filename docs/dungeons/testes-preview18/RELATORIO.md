# Validação da preview.18

## Resultado

1.225 testes em 137 arquivos e compilação de produção aprovados. No Chromium, 168 verificações passaram, sem erros JavaScript registrados nas execuções finais. Nenhuma alteração no comportamento do jogo foi necessária nesta rodada de QA.

Foram usados perfis de navegador isolados e saves de teste. Os testes gráficos executam o jogo real com SwiftShader; cenários específicos alteram o estado da partida para alcançar resultados, chefes, falhas de gravação e limites de forma reproduzível. As partidas completas do simulador usam o motor real, cartas legais e passos de 1/30 s, sem XP concedida ou invulnerabilidade.

## Navegador

| Grupo | Verificações | Cobertura |
| --- | ---: | --- |
| Regressão | 61 | Armas, chefes, HUD, pausa, mapas, cartas e retomada após recarregar a página |
| Retorno e recompensas | 47 | Vitória, derrota e abandono nos dois modos, recibos, menu intermediário, saída explícita e save reaberto |
| Partidas consecutivas | 26 | Três partidas na mesma cena, limpeza de atores, controles únicos, pet e compras, falha de gravação e retry sem duplicação |
| Pets | 20 | Quatro variações, bônus, esquiva, recuperação, coleção e nomes com ✦ |
| Apoio inicial | 5 | Complemento inicial, primeira compra, recibo de rodadas e tela estreita |
| Menu | 3 | Saída visível, foco e largura em 1280×720 e 390×844 |
| Curva de XP | 3 | Custos crescentes, nível 101 e excedente com pet/melhorias ativos |
| Recuperação de save | 3 | Cancelar sobrescrita preserva original, confirmação preserva bytes inválidos, fallback ao backup |

O fluxo verificado foi fim da partida → recompensas salvas → menu de expedições, mantendo a cena Dungeons ativa e sem atores/checkpoint residual. A saída ao mundo normal ocorre por escolha explícita. O botão de pausa na nova partida atua no novo motor, sem referências à partida anterior.

Uma primeira execução do teste isolado da curva de XP excedeu os 30 segundos de espera pela tela inicial enquanto outros testes gráficos rodavam. Nenhuma asserção de XP chegou a executar. O script recebeu o mesmo limite de 120 segundos dos demais testes e passou na repetição. A saída inicial está preservada em `xp-primeira-tentativa-timeout.json`. O script de recuperação de save passou a aceitar URL e destino de relatório por variável para permitir esta execução isolada.

## Simulações e recompensas

- 13 cenários com cinco níveis em todos os atributos permanentes configurados: nove vitórias e quatro derrotas. Incluem os dois modos, duas combinações de armas, sementes diferentes, ausência de pet e variações de pet.
- Oito cenários com dez níveis: quatro variações de pet × duas combinações de armas; oito vitórias na praça de 15 minutos.
- Os cinco cenários do estacionamento completaram as 50 rodadas.
- 1.400 comparações entre a partida original e a restaurada não encontraram divergências. Os checkpoints finais foram válidos. Nunca houve mais de três curas no chão.
- Das 12 vitórias cronometradas, dez completaram todas as cartas; duas terminaram com 66 e 22 melhorias faltando. Nas que completaram, isso ocorreu entre 10min30s e 14min31s. Ofertas de cartas e trajetória de coleta ainda influenciam o resultado; não há garantia de completar tudo em qualquer partida.
- Aplicando a fórmula real de recompensas aos resultados, fora da janela de apoio inicial: vitórias cronometradas renderam 1.266–2.478 XP e 32–60 moedas; vitórias de 50 rodadas, 2.732–2.756 XP e 49–50 moedas.
- Essas amostras verificam o motor e documentam a variação de progressão; não estimam a taxa de vitória humana nem medem o FPS do executável Windows.

## Reprodução

`npm test` e `npm run build` verificam sistemas e compilação. Inicie `npm run dev -- --port 5186`; os scripts de navegador recebem `QA_URL=http://127.0.0.1:5186` e gravam relatórios nos diretórios indicados pelas respectivas variáveis de saída.

Scripts: `qa-dungeons.cjs`, `qa-dungeon-return-rewards.cjs`, `qa-dungeon-result-menu.cjs`, `qa-pet-bonuses.cjs`, `qa-opening-progression.cjs`, `qa-expedition-menu-layout.cjs`, `qa-xp-curve.cjs` e `qa-save-recovery.cjs`.

Simulações: `node scripts/simulate-dungeons.cjs --all-pets --permanent-rank=5` e `node scripts/simulate-dungeons.cjs --pet-matrix-only --permanent-rank=10`, com `DUNGEON_SIM_OUTPUT` separado por execução. `analyze-dungeon-rewards.cjs` recebe os dois `summary.json` para recalcular as recompensas.

As evidências JSON, logs e três imagens acompanham este relatório. O pipeline de publicação repete TypeScript e a suíte completa no Windows antes de empacotar e publicar o executável.
