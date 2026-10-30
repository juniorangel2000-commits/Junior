# Testes da preview.16

Código publicado: `a92126e09e2be6ce73f4bd31259220aa3a78ff7c`.

## Método

Partidas aceleradas pelo motor real, com passo fixo de 1/30 s, escolhas legais de cartas aleatórias, sem conceder XP, pré-equipar armas ou dar invulnerabilidade. Duas combinações de armas e duas sementes, sem pet e com pets comuns/especiais. Os cenários não formam uma amostra estatística equilibrada; vitórias e derrotas deste bot não estimam a taxa de vitória humana. Navegação da interface e persistência foram verificadas no Chromium. Não foi executado um teste manual do EXE em Windows.

## Partidas e checkpoints

- 16 partidas: 8 vitórias aos 900 s e 8 derrotas.
- Nas oito vitórias, os cinco chefes previstos apareceram.
- 410 comparações de estado após restauração aos 450 s passaram, usando as mesmas entradas e escolhas na partida contínua e na retomada.
- Nenhuma simulação gerou snapshot inválido. Máximo de curas no chão: 3, respeitando o limite de três.

## Achados de balanceamento

1. **Progressão adiantada.** Todas as melhorias terminaram entre 7min56s e 10min57s nas simulações que completaram as cartas. Isso deixa de quatro a sete minutos para subir níveis sem novas escolhas. A intenção de completar perto dos 15 minutos ainda pede ajuste. Recomenda-se reduzir o crescimento tardio da XP ou revisar a curva de níveis, preservando a possibilidade de completar a combinação.
2. **Pets ainda recuperam com frequência.** Nas cinco vitórias com companheiro, foram 18 a 27 recuperações, mesmo com a esquiva atual. O pet passa uma parte relevante da sessão sem atacar. Recomenda-se rever o intervalo de proteção entre contatos e o posicionamento perto das hordas, antes de aumentar novamente a chance de esquiva.
3. **Variação de dificuldade.** Houve derrotas entre cerca de dois e seis minutos, além de partidas completas e uma derrota aos 14min28s. Mudanças de cartas e trajetórias do bot influenciam bastante o resultado. Os dados não bastam para concluir que uma espécie ou variante é universalmente pior.

Não houve mudança de balanceamento ou nova publicação durante esta rodada de testes.

## Interface e recompensas

- 19 verificações de resultado e retorno aprovadas: vitória, derrota e abandono; moedas, materiais, XP e pet resgatado; HUD e leitura do save. Abandono preserva XP e pet, sem moedas ou materiais.
- 27 verificações de companheiros aprovadas: propriedade, casa, vila, nove comércios, ferraria e florestas; seguir/esperar/chamar; colisões; falha ao salvar; ataques sincronizados, pausa e restauração.
- Nenhum erro JavaScript ou HTTP nessas duas verificações.

Os detalhes completos estão nos arquivos JSON desta pasta.


## Checagem geral da dungeon

Mais 61 verificações passaram no navegador: recarregar a página e continuar a expedição pausada com o mesmo tempo e Arsenal; cartas, quatro espaços de armas, evoluções, defesa e escudo; chefes por minuto, ataques e avisos visuais; HUD em telas amplas e estreitas; resultados, evolução permanente e retorno. Nenhum erro JavaScript, HTTP ou WebGL foi registrado.

Total desta rodada: **107 verificações no navegador aprovadas**, além das 16 partidas simuladas e das 410 comparações de retomada. A verificação TypeScript também passou. As medições de tempo de CPU do primeiro lote incluem o custo da cópia espelhada; não devem ser usadas como benchmark. O segundo lote mede apenas o passo do motor, sem renderização ou GPU.

Prioridade recomendada: reduzir a frequência de recuperação dos companheiros e aproximar a conclusão das cartas do fim dos 15 minutos. Os resultados de interface/save não indicaram perda de progresso nesta rodada.
