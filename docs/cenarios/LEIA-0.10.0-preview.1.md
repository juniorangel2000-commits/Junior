# After Rain 0.10.0-preview.1 — vila e Economia 6.0

Pré-release portátil para **Windows 11 x64**. Baixe `After-Rain-0.10.0-preview.1-Windows-x64.exe` e abra o arquivo. Não requer instalação, Node.js ou servidor.

- Vila do Recomeço à direita da propriedade, com dez comerciantes, conversas, compra, venda e serviços próprios. Mapas da floresta e da propriedade com passagem alinhada e continuação visual.
- Moeda Coroa (C), saldo inicial de 100 C em novas partidas e preservação do saldo das partidas existentes. Galhos, pedras comuns, fibras e ferramentas iniciais não são comercializados.
- Mineração de Ferro, Ouro e Metal Negro, com exigência de nível da picareta antes da extração. Fragmentos e minérios inteiros raros possuem artes diferentes dos lingotes.
- Fundição: nove fragmentos ou um minério inteiro produzem um lingote. Forja própria sem mão de obra, ou serviço pago do Bento; materiais, prazo e retirada são validados e persistidos.
- Encomendas de machado, picareta, enxada, foice e pá: entregar materiais, pagar mão de obra, aguardar dias do jogo e retirar. Ferramentas de Metal Negro exigem exatamente nove lingotes de Metal Negro e quatro de Ouro.
- Ferramentas com eficiência, durabilidade e reparo. Novas artes das ferramentas aprimoradas aparecem nos menus, na mochila, na barra e durante a ação; pivôs e espelhamento dos dois lados ajustados.
- Bento só vende minerais a partir do dia 31. Um lingote de Metal Negro por ciclo de quinze dias, sem acumular estoque; sair da loja ou recarregar não repõe o produto.
- Pedidos renováveis de moradores, com consumo dos itens, pagamento único por ciclo e salvamento. Serviços de agricultura, medicina, carpintaria, costura, pesca, pousada e mecânica integrados à vila.
- 85 sprites novas: itens e depósitos metálicos, ferramentas, forja animada, Coroa, componentes e dez comerciantes com quatro vistas próprias. Sprites originais das personagens do jogador e dos animais preservadas.
- Preserva casa, poço, interior, cercas/porteiras, plantações, natação, animais e salvamentos. Editor de mapas restrito ao desenvolvimento.

**Controles:** WASD/setas andar; E interagir; I mochila; C fabricar; B construir; M mapa; H personalizar a casa; G soltar a corda; R/F posicionar porteiras; Ctrl+Alt tela cheia; roda do mouse ou +/− zoom; Esc pausa. As passagens entre cenários são automáticas.

A foice e a pá também podem ser usadas pela opção **Usar / instalar** da mochila. Instale uma forja em espaço livre da propriedade e interaja com E para processar os materiais. Na ferraria, use o botão de fundição, ferramentas e encomendas.

O save usa o mesmo local das versões anteriores. Feche o executável anterior antes de abrir esta prévia. É recomendável manter uma cópia do seu save antes de testar uma pré-release.

Validação local: TypeScript, **656 testes em 64 arquivos**, build de produção e Chromium (economia, estoques, encomendas, salvamento, rollback em falha de gravação, fundição, sprites e interface). O executável desta pré-release é gerado e verificado no Windows pelo GitHub Actions; não houve teste interativo nativo no Windows 11 neste ambiente.

Esta prévia não substitui a Release estável 0.9.8. Confira a integridade do arquivo em `SHA256SUMS.txt`.
