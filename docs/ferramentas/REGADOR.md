# Regador — integração local

Coleta única na casa entrega o regador vazio. ZIP e imagens recebidas preservados.
O ícone vazio `empty-matched.png` foi gerado a partir do cheio para combinar madeira e aros; não substitui o original recebido.

Equipe o regador e pressione E junto ao rio ou lago para abastecer, ou clique na água próxima. Cada abastecimento permite oito regas. A barra e a mochila mostram o ícone vazio ou com água e a descrição informa a quantidade. Saves antigos sem quantidade começam vazios.

Regas válidas consomem uma carga no contato da animação. Alvos já regados não gastam água; cancelar antes do contato também não. Quantidade salva/recarregada. Animação original de nove quadros, espelhada para esquerda/direita, visível apenas em uso. Gotas e ondulação ao encher; gotas sobre a terra ao regar.

Todas as ferramentas usam deslocamento de sete pixels à frente da mão (antes quatro).

Validação: 318 testes, TypeScript, build e `scripts/qa-watering.cjs` no Chromium com abastecimento, bloqueio vazio, cancelamento, oito regas nos dois lados, ícones e recarga após cada rega. Alterações ainda não publicadas no executável.
