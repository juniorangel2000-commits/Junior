# ATIVOS, PROTÓTIPOS E ESTADO REAL — AUDITORIA DO PACOTE

**Propósito:** evitar a confusão entre *imagem conceitual aprovada*, *PNG separado*, *demonstração funcional isolada* e *módulo já integrado ao jogo principal*.

| Arquivo/pacote neste dossiê | Tipo | Conteúdo / destino de uso | Estado |
|---|---|---|---|
| `referencias/CENARIO_ORIGINAL.png` | arte conceitual | cenário inicial com casa e natureza; arquitetura oficial | APROVADO como referência |
| `referencias/CENARIO_PIXELADO.png` | arte conceitual | adaptação com maior aspecto pixelado | APROVADO como referência |
| `referencias/MAPA_EXPANDIDO.png` | mapa ilustrativo | vista geral das regiões e pontos de interesse | APROVADO; NÃO é mapa explorável |
| `referencias/PERSONAGEM_ORIGINAL.png` | ficha visual | aparência do primeiro preset e 4 vistas | APROVADO; não é editor de personagem |
| `referencias/CONSTRUCOES_MODULARES.png` | atlas conceitual | fachadas, paredes, portas, coberturas, peças de paisagismo | APROVADO como direção visual; encaixes não garantidos |
| `referencias/CONSTRUCOES_MODULARES_DETALHADAS.png` | atlas conceitual | casas variantes, interiores, telhado removível e formatos | APROVADO como direção visual |
| `referencias/INTERFACE_UI_CONCEITO.png` | UI conceitual | HUD, inventário, crafting, bancadas, construção | APROVADO como layout/estilo; não interface funcional |
| `referencias/ACOES_PERSONAGEM_CONCEITO.png` | ação conceitual | quatro direções, corte, mineração e serra | REFERÊNCIA; não sprites separados finais |
| `referencias/ESTADOS_OBJETOS_CONCEITO.png` | arte conceitual | árvores, rochas, serragem, parede e efeitos | REFERÊNCIA; não integração funcional |
| `pacotes_existentes/Jardim_Depois_da_Chuva_Assets_v0.2.zip` | sprites PNG | 65 sprites RGBA + 65 ícones 96px + manifest/QA: 20 ferramentas, 20 recursos, 15 materiais, 10 estações | ÚTEIS EM PROTOTIPAGEM, revisar contornos e tiers |
| `pacotes_existentes/Jardim_Depois_da_Chuva_Casa_Modular_Piloto_v0.1.zip` | tiles técnicos | peças 32px e teste de encaixe com visual simplificado | PROTÓTIPO GEOMÉTRICO, não arte final |
| `pacotes_existentes/Jardim_Depois_da_Chuva_Casa_Modular_v1.zip` | protótipo HTML | 38 componentes, casa 8×6, roof-on/off, JSON de blueprint e editor demonstrativo | FUNCIONA ISOLADO, não integrado à engine |
| `pacotes_existentes/Jardim_Depois_da_Chuva_Sistema_Acoes_v0.1.zip` | protótipo HTML/sprites | personagem extraído, 24 sprites de referência, 128 quadros compostos (não desenhados à mão), demo de quatro ações | PROTÓTIPO ISOLADO; teste automático de browser não integralmente validado |

## Arquivos dentro dos pacotes a priorizar

### Assets v0.2
- `manifest.json` define o mapeamento de `id → sprites/<categoria>/<item>.png` e `id → icones_96px/<categoria>/<item>.png`.
- `LEIA_ME.md` descreve 65 sprites, transparência, verificações de margem, tiers com semelhanças que pedem retoque.
- Ícones de inventário são separados de objetos no mundo. Estações exigem footprint/colisão definido na engine.

### Casa modular v1
- `ABRIR_CASA_INTERATIVA.html` é demo de navegador, **não** cena do jogo principal.
- `casa_inicial_blueprint.json` demonstra **casa 8×6 com quarto, sala/cozinha e oficina**, diferente da **receita de abrigo 3×3**.
- `assets/` contém peças extraídas de atlas com dimensões diferentes; precisam de padronização visual e atlas de transições para uso definitivo.
- `CASA_TELHADO_VISIVEL.png` e `CASA_INTERIOR_VISIVEL.png` mostram o efeito de camada, não trocam automaticamente por colisão em uma engine.

### Ações v0.1
- `TESTAR_ACOES.html` demonstra movimento e ações perto dos alvos (código experimental independente).
- `manifest.json` descreve canvas de 96×128, direções e animações propostas; quadro de impacto no índice 4 do laboratório.
- `acoes/<acao>/<direcao>/*.png` foi composto sobre personagem de referência e ferramenta; **não há 128 poses originais ajustadas manualmente**.
- `ANIMACAO_*.gif` são previews, não um controlador de animações final.

## Alertas

- Pôsteres não são arquivos de assets de produção; podem incluir títulos, sombras, fundo ou enquadramentos diferentes.
- Algumas folhas têm fundo com padrão de quadriculado desenhado; isso NÃO significa canal alpha. Verifique antes de extrair.
- A imagem com fundo removido de uma ficha de personagem apresentou halos/resíduos; **não a substitua pela ficha original** sem reavaliar transparência.
- O conjunto de sprites da casa ainda precisa de junções de paredes/telhados e encaixes como corners, edges, T, L, finalizações, portas e sombras.
- Não converter arte a 32x32 cegamente: o grid físico pode ser 32px, mas personagem, telhado e estações podem ocupar múltiplos tiles.
- Para arte renderizada, prefira nearest-neighbor em zoom inteiro e alinhamento de pixels; pivô de pés do personagem, offset de objetos e footprint de estação são propriedades independentes.

## A fonte de verdade sobre o código

**Só o repositório efetivamente aberto no Codex confirma o que está implementado.** Este dossiê lista produtos gerados nesta conversa, não executa auditoria do repositório nem permite afirmar que o jogo principal usa uma tecnologia determinada.
