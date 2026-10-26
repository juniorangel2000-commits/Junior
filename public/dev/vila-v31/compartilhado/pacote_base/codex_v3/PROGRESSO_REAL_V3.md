# After Rain — Reconstrução V3 (continuidade, não aprovação final)

## Trabalho realizado nesta rodada
- Preservei o pacote V2.1 e as 10 fachadas + 10 interiores originais em alta resolução.
- Recortei **10 novos balcões** (um para cada comércio) com máscaras poligonais e pixels da ilustração original, sem reamostragem nem geração de novos desenhos.
- Reprocessei os **42 candidatos anteriores** para limpar valores RGB ocultos em áreas de alfa zero e eventuais partículas soltas de um ou dois pixels nas bordas.
- Adicionei **10 páginas de QA** em 4 fundos diferentes, uma por comércio.
- Gerei as **comparações dos 10 balcões** e o mapa de referência dos objetos de cada estabelecimento (não coordenadas do mapa em jogo).
- Acrescentei demonstrador de integração em Phaser e script de validação de PNG.

## Importante: condições de uso
- Os novos balcões são **CANDIDATOS**, não aprovação final. As máscaras recortam objetos mas podem incluir piso/parede ou faltar bordas sob móveis. Conferir antes de colocar no jogo.
- Alguns itens chamados *tapete* nos recortes são composições que incluem outros móveis. Não trate como tapetes isolados.
- Os **26 sprites oficiais** da pasta `02_SPRITES_ORIGINAIS_V081` são sprites independentes extraídos do jogo, não reconstruções por IA.
- O efeito do recorte nos 10 cenários completos NÃO foi reparado: os fundos sob móveis removidos ainda precisam de reconstrução.
- Não houve teste de colisões, posições, portas nem jogo Phaser.
- **Nenhum arquivo do GitHub foi alterado.**

## Ordem para chegar ao nível final
1. Validar individualmente cada contorno em zoom pixel a pixel.
2. Reconstruir faces ocultas dos 10 balcões e outros itens com referências dedicadas, sem inventar autenticidade.
3. Limpar piso/paredes descobertos nos 10 interiores.
4. Definir pontos de colisão e interação em tile grid real.
5. Montar e testar cena por cena no After Rain antes de marcar `game_ready`.

## Visualizador
Abra `05_MELHORIAS_V3/VISUALIZADOR_OFFLINE.html` após extrair o ZIP, selecione o NPC e troque o fundo para inspecionar recortes transparentes. Os caminhos referenciam arquivos locais, sem servidor.
