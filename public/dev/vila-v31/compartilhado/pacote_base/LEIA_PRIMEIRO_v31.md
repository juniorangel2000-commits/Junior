# After Rain — Biblioteca de comércios / Reconstrução v2.0

Esta entrega **não é 100% concluída**: 10 fachadas e 10 interiores aprovados foram preservados, recortes contextuais originais disponíveis, e uma nova série de PNGs com máscaras de segmentação foi produzida.

Os arquivos em `01_SPRITES_EM_RECONSTRUCAO` são *CANDIDATOS* a sprites individuais: a remoção do fundo foi realizada automaticamente com máscaras orientadas e requer retoque manual em contornos, peças parcialmente ocultas, pixels residuais e sombras. **Não devem ser confundidos com assets prontos ou usados sem inspeção.** Os 26 PNGs em `02_SPRITES_ORIGINAIS_V081` são recursos independentes extraídos da versão do jogo e conferidos na revisão anterior.

Pastas:
- `01_LOJAS/`: referência completa, fachada, interior, recortes originais e novos candidatos RGBA de cada comércio.
- `02_SPRITES_ORIGINAIS_V081/`: recursos independentes preservados do executável.
- `03_PREVIAS_AUDITORIA/`: comparação lado a lado (original / máscara), 10 panoramas por comércio e overview.
- `04_DADOS_CODEX/`: status por NPC e mapeamento da posição original de cada item para reedição e integração.

Para obter 100%: finalizar contornos manualmente, reconstruir partes não visíveis de cada item, revisar 100% dos sprites em três fundos diferentes, remover objetos das cenas e refazer o piso sob cada um, identificar os que não devem mover (prateleiras embutidas), testar ordenação por profundidade, colisões, entradas e interações com NPCs dentro de Phaser. Este pacote **não** realiza essas etapas nem modifica o GitHub.

**Não reamostrar o pixel art original, preservar os nomes de NPC, usar escala nearest-neighbor.**

### Revisao manual adicional
Contornos de bigorna, tanque de resfriamento e barril do Augusto foram redefinidos com poligonos para remover parte do fundo. As demais mascaras seguem experimentais. As amostras de `03_PREVIAS_AUDITORIA/02_DEMONSTRACAO_RECONSTRUCAO.png` mostram os resultados atuais, nao teste final de jogabilidade.

### Revisao manual adicional
Contornos de bigorna, tanque de resfriamento e barril do Augusto foram redefinidos com poligonos para remover parte do fundo. As demais mascaras seguem experimentais. As amostras de `03_PREVIAS_AUDITORIA/02_DEMONSTRACAO_RECONSTRUCAO.png` mostram os resultados atuais, nao teste final de jogabilidade.


## Atualização v3.1
- Adicionadas pranchas de status por loja em `06_STATUS_V31/PREVIEWS_POR_LOJA`.
- Adicionado `status_manifest_v31.json` e `.csv` com contagens por loja.
- Adicionado `STATUS_GERAL_V31.png` com visão consolidada.
