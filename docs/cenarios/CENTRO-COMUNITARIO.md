# Centro comunitário e acolhimento

Na vila, aproxime-se da porta do centro comunitário e pressione **E**.
A reforma tem três etapas. Cada material possui um botão **Entregar** e uma
quantidade ajustável; as entregas ficam salvas separadamente. **Concluir esta
etapa** usa apenas o saldo que ainda falta na mochila e exige um martelo,
que permanece com o jogador.

| Etapa | Materiais |
| --- | --- |
| Limpar e preparar | 16 pedras, 12 tábuas brutas, 4 cordas vegetais |
| Reparar a estrutura | 16 tábuas regulares, 24 cavilhas, 4 peças de metal |
| Preparar o alojamento | 12 tecidos, 24 fibras, 8 refeições |

A tela informa as fontes dos materiais nos comércios e serviços existentes.
Nenhum material depende do acampamento bloqueado.

Concluir a última etapa libera o interior com oito camas, a passagem ao norte
da Floresta Antiga e o recrutamento por diálogo. Os moradores mantêm as rotas
a pé e os pedidos de ajuda existentes. Os moradores que estão descansando
aparecem dentro do alojamento. A saída fica ao sul; inventário e HUD continuam
funcionando. A posição no interior é salva para continuar a partida.

Partidas anteriores que já recrutaram sobreviventes recebem o centro pronto,
preservando moradores, posições e tarefas. Apenas visitar o acampamento numa
versão anterior não libera o centro: uma partida salva ali, sem recrutados,
retorna à aproximação segura na floresta. Falhas ao gravar não consomem materiais.

## Validação

- `tests/community-center.test.ts`: entregas nas três etapas, estoque,
  transações, desbloqueio, migração, interiores e circulação entre oito camas.
- `scripts/qa-community-center.cjs`: bloqueio na floresta, reforma pela interface,
  recarga, interior, HUD, camas, saída e recrutamento após o desbloqueio.
- `tests/mine-room.test.ts` e `scripts/qa-mine-room.cjs`: correções de colisões
  da mina, preservação de saves antigos, circulação e transparência das vigas.
