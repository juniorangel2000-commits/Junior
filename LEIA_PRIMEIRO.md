# JARDIM DEPOIS DA CHUVA — Dossiê de transferência para o Codex

**Revisão consolidada:** 20/10/2026  
**Objetivo:** transferir decisões aprovadas, artes, protótipos e ordem de implementação para um Codex que examinará a base real do projeto.  
**Estado:** pré-produção + protótipos visuais/HTML separados; **não** é um jogo final nem comprova que qualquer sistema está implementado no repositório principal.

## Primeiros passos

1. Abra `documentacao/01_BIBLIA_DO_JOGO.md` para entender a visão completa e as decisões aprovadas.
2. Abra `documentacao/02_PROMPTS_PARA_CODEX.md`; **cole APENAS o PROMPT 00** primeiro, no Codex conectado ao repositório real do jogo.
3. Revise o diagnóstico do Codex e confirme qual engine, linguagem, estrutura, cena inicial, controles e funcionalidades o projeto já possui.
4. Anexe este pacote/arquivos de referência no workspace do Codex (ou copie-os para uma pasta temporária). Não peça substituição automática de sprites ou recriação do projeto.
5. Execute os prompts seguintes **um por vez**, testando cada etapa antes da próxima.

## Arquivos

- `documentacao/01_BIBLIA_DO_JOGO.md`: direção artística, mapa, personagem, gameplay, crafting, construção, UI, mundo, NPCs, fases e decisões abertas.
- `documentacao/02_PROMPTS_PARA_CODEX.md`: prompts sequenciais 00–09, começando por auditoria sem alterações.
- `documentacao/03_ATIVOS_E_ESTADO_REAL.md`: inventário de pacotes visuais, usos e limitações.
- `documentacao/04_TESTES_E_CRITERIOS_DE_ACEITE.md`: testes por etapa, não regressão e validação de progresso.
- `documentacao/05_DECISOES_E_PENDENCIAS.md`: decisões consolidadas, inconsistências antigas resolvidas e itens a validar.
- `documentacao/06_DADOS_PROVISORIOS.json`: estrutura exemplificativa de gameplay para adaptação ao formato da engine; não é runtime obrigatório.
- `referencias/`: arte de referência e folhas visuais aprovadas, não equivalem a um tileset funcional.
- `pacotes_existentes/`: zips dos protótipos e sprites gerados anteriormente; cada um tem um estado e limites documentados.

## Mandamentos para o Codex

- **Não recriar** o jogo do zero, não trocar de engine e não apagar conteúdo anterior sem autorização explícita.
- Inspecionar o repositório antes de qualquer implementação. Informar o que encontrou e diferenciar o já implementado do planejado.
- Implementar em incrementos pequenos, executáveis e verificáveis, com testes e resumo dos arquivos alterados.
- Nunca tratar pôsteres conceituais como sprites diretamente utilizáveis nem esticar frames sem conferir a personagem em jogo.
- Usar ids estáveis em inventário, receitas, entidades e persistência; impedir drops ou materiais duplicados.
- Priorizar a vertical slice: **explorar → coletar → fabricar machadinha/picareta → cortar/minerar → transformar troncos → fabricar bancada → serrar → construir peça → salvar/recarregar**.
- Preservar a identidade da pixel art e o visual do personagem de referência, permitindo customização futura.
- Toda receita, número de golpes, tempo, escala e tecla é **configurável**, salvo decisão aprovada específica.

## Avisos de uso

A pasta `pacotes_existentes` pode conter arquivos de HTML interativos que funcionam sozinhos no navegador; eles **não** precisam ser usados como base de produção se o jogo tiver outra engine. Documente adaptações, mantenha a estrutura do jogo existente e faça backup/commit antes de alterações importantes.
