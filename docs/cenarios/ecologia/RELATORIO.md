# Ecologia — árvores, sementes e plantas medicinais

27/10/2026 · After Rain 0.10.0-preview.8

## Comportamento final

A base de terra aparece **somente no dia do plantio da semente**. Some na próxima virada do dia, mesmo antes de completar 24 horas e mesmo que a árvore ainda seja um broto. Não aparece sob árvores antigas nem sob tocos. É uma imagem independente: nunca altera o terreno pintado, os canteiros ou o piso que já existia. O ciclo verifica a virada do dia imediatamente, sem esperar o intervalo normal de atualização dos recursos.

O crescimento usa o relógio do jogo: broto ao plantar, muda após um dia completo, árvore jovem após três e adulta após sete. Árvores naturais existentes começam adultas. Cada espécie fornece sua semente ao ser cortada; árvores adultas deixam um toco da mesma espécie. O machado recolhe o toco e libera a posição. Remover uma árvore imatura devolve a semente, sem produzir madeira de árvore adulta. Não há regeneração automática do toco: a semente permite replantar.

As sementes são plantadas pelo comando existente de usar/instalar item, na propriedade ou floresta. Água, construções, passagens e terreno inadequado impedem o plantio sem consumir a semente. O espaçamento e o limite de registros evitam sobreposição e crescimento ilimitado de dados. O espaço da árvore fica reservado desde o broto. Estado, espécie, idade, tocos e dano parcial persistem no save.

## Arte

Estágios iniciais refeitos a partir do estilo das árvores adultas. Tocos largos e baixos, proporcionais ao tronco, aprovados pelo usuário. O corte deixa esses novos tocos; as árvores adultas preservam a arte existente. O balanço é sutil, aplicado somente às árvores adultas visíveis, mantendo a raiz e a colisão fixas; o editor permanece estático.

Fontes e manifestos: `public/assets/visual/ecology/{herbal-trees,tree-stages-refined,tree-stumps-wide,tree-soil}.png` e respectivos JSONs. PNGs nativos preservados; recortes e texturas compactas são montados em runtime sem suavização. As folhas antigas permanecem como fontes históricas; estágios e tocos rejeitados não estão registrados no renderizador final.

Prévia aprovada: `estagios-arvores-tocos-baixos.png`. Comportamento atual da terra: `terra-primeiro-dia.png`. As demais prévias desta pasta são históricas e não definem o comportamento final.

## Ervas, cogumelos e Amélia

- Sprite própria para ervas; cogumelos do cenário agora são coletáveis à mão.
- Duas unidades por coleta; reposição após três dias do jogo, preservando limites e prazos dos campos existentes.
- Floresta e propriedade possuem ambos os ingredientes. Ervas da floresta podem fornecer uma erva rara conforme regra determinística centralizada.
- Nova infusão de cogumelos: três ervas + dois cogumelos, recupera 50 de vigor.
- Amélia ensina a receita em troca desses ingredientes. Preparação pelo serviço usa os mesmos ingredientes e cobra 8 Coroas. Compra por 68 C e venda por 18 C, sem arbitragem.
- Receitas anteriores, curativos e tônico continuam disponíveis. Nenhum sistema paralelo de inventário, calendário ou crafting foi criado.

## Arquivos principais

- `src/data/ecology-balance.ts`: crescimento, limites, rendimentos e receita medicinal centralizados.
- `src/systems/tree-growth.ts`: plantio, estágios, corte, validação e migração de tocos.
- `src/tree-growth-art.ts`, `src/tree-planting-soil.ts`, `src/tree-wind.ts`, `src/ecology-art.ts`: apresentação e ciclo de vida dos efeitos.
- `src/resource-lifecycle.ts`, `src/systems/resource-spawns.ts`, `src/systems/resources.ts`: extração, reposição, migração e sincronização.
- Integração em `world`, `forest-world`, `ValleyScene`, `ForestScene`, `types`, `save`, `items`, `recipes`, `village-commerce`, `village-services`, `consumables`, `visual-assets` e catálogo de natureza.
- `tests/tree-growth.test.ts`, `tests/tree-wind.test.ts`, `tests/herbalism.test.ts`; `scripts/qa-ecology.cjs`.

## Validação e correções

791 testes automatizados em 85 arquivos passaram; TypeScript e build de produção passaram. Os testes novos cobrem transações, limites, migrações, save/load, espécies, corte/toco, vento, ingredientes, receita, preço e reposição.

14 verificações no Chromium passaram, sem erros JavaScript ou assets ausentes. Incluem plantio real nos dois mapas, estágios, virada do dia, preservação do piso/canteiro, colisão, corte, seed drop, toco, persistência e medicina. Resultado detalhado em `validacao.json`.

Foi corrigida a ausência de ervas na floresta quando os recursos fixos já ocupavam o orçamento do cenário: parte dos bolsões procedurais de cogumelos agora gera ervas, sem aumentar o limite ou alterar os cogumelos pintados pelo autor. O teste de sete dias na floresta usa hora inteira controlada para evitar diferenças fracionárias na fronteira exata do prazo. Saves antigos recebem os campos novos e a migração de tocos uma única vez, evitando recriação após a coleta.

## Balanceamento sugerido

Testar em sessões longas a oferta de ervas e a duração de sete dias de crescimento antes de alterar os parâmetros. Valores ficam centralizados para ajuste posterior. Não há alteração remota ou publicação associada a estes testes locais.

## Pacote Windows

Executável portátil `After-Rain-0.10.0-preview.8-Windows-x64.exe` gerado localmente. Verificados 1.143 arquivos do build dentro do ASAR, incluindo 723 assets visuais, versão, cabeçalho AMD64 e assinatura de integridade interna do arquivo ASAR no PE. Hash e tamanho em `executavel.json`.

Quatro verificações adicionais passaram no build final servido por HTTP: novo jogo, inventário, salvar/continuar após recarregar e ausência de erros/404. Total: 34 verificações de navegador. A execução nativa do EXE no Windows não foi realizada neste ambiente Linux.
