# Pacotes de arte e protótipos recebidos

Os quatro pacotes enviados foram descompactados nesta pasta, mantendo os nomes internos, a estrutura de diretórios e o conteúdo de cada arquivo. São referências, assets provisórios e demonstrações independentes para avaliação antes da integração ao jogo.

| ZIP de origem | Pasta extraída | Arquivos | Conteúdo conferido |
| --- | --- | ---: | --- |
| `Jardim_Depois_da_Chuva_Sistema_Acoes_v0.1.zip` | [Jardim_Depois_da_Chuva_Acoes_v0.1](Jardim_Depois_da_Chuva_Acoes_v0.1/) | 172 | 24 bases do personagem, 128 quadros compostos de ação, ferramentas, cenário, prévias, quatro GIFs, manifesto e demo HTML |
| `Jardim_Depois_da_Chuva_Casa_Modular_Piloto_v0.1.zip` | [Jardim_Depois_da_Chuva_Modulos_Casa_Piloto_v0.1](Jardim_Depois_da_Chuva_Modulos_Casa_Piloto_v0.1/) | 18 | 14 tiles técnicos, duas prévias, manifesto e documentação |
| `Jardim_Depois_da_Chuva_Casa_Modular_v1.zip` | [Jardim_Depois_da_Chuva_Casa_Modular_v1](Jardim_Depois_da_Chuva_Casa_Modular_v1/) | 46 | 38 componentes, quatro imagens gerais, manifesto, blueprint, documentação e demo HTML |
| `Jardim_Depois_da_Chuva_Assets_v0.2.zip` | [Jardim_Depois_da_Chuva_Assets_v0.2](Jardim_Depois_da_Chuva_Assets_v0.2/) | 137 | 65 sprites, 65 ícones de 96 px, quatro prévias, manifesto, relatório de QA original e documentação |

## Documentos e demonstrações

- Ações: [LEIA_ME.md](Jardim_Depois_da_Chuva_Acoes_v0.1/LEIA_ME.md), [manifest.json](Jardim_Depois_da_Chuva_Acoes_v0.1/manifest.json) e [TESTAR_ACOES.html](Jardim_Depois_da_Chuva_Acoes_v0.1/TESTAR_ACOES.html).
- Piloto: [ANIMACOES_E_CONSTRUCAO.md](Jardim_Depois_da_Chuva_Modulos_Casa_Piloto_v0.1/ANIMACOES_E_CONSTRUCAO.md) e [manifest_modulos.json](Jardim_Depois_da_Chuva_Modulos_Casa_Piloto_v0.1/manifest_modulos.json).
- Casa modular: [LEIA_ME.md](Jardim_Depois_da_Chuva_Casa_Modular_v1/LEIA_ME.md), [casa_inicial_blueprint.json](Jardim_Depois_da_Chuva_Casa_Modular_v1/casa_inicial_blueprint.json) e [ABRIR_CASA_INTERATIVA.html](Jardim_Depois_da_Chuva_Casa_Modular_v1/ABRIR_CASA_INTERATIVA.html).
- Assets: [LEIA_ME.md](Jardim_Depois_da_Chuva_Assets_v0.2/LEIA_ME.md), [manifest.json](Jardim_Depois_da_Chuva_Assets_v0.2/manifest.json) e [QA_RESULTADOS.json](Jardim_Depois_da_Chuva_Assets_v0.2/QA_RESULTADOS.json).

Os documentos e códigos dos anexos foram preservados como material de consulta. As demonstrações HTML permanecem independentes da aplicação Phaser; sua presença não significa que os sistemas mostrados estejam integrados ao jogo. A extração não executou scripts ou demonstrações dos pacotes.

## Conferência da importação

- Total dos pacotes: **373 arquivos**, incluindo **357 PNGs, quatro GIFs, seis JSONs, quatro documentos Markdown e dois HTMLs**.
- Os quatro ZIPs passaram na verificação de CRC.
- Cada arquivo extraído foi comparado por SHA-256 com o conteúdo correspondente do ZIP.
- Todos os PNGs e GIFs passaram na verificação de leitura de imagem; todos os JSONs foram lidos com sucesso.
- Essa conferência verifica integridade. Transparência visual, escala, pivôs, encaixes, animações e adequação à perspectiva do jogo ainda exigem avaliação antes do uso.
- O relatório `QA_RESULTADOS.json` pertence ao pacote original e foi mantido sem alterações.

### SHA-256 dos ZIPs recebidos

```text
f05353d305488d20379389ce08b168745adcce65eb3ce6b8d2a8da75062e9542  Jardim_Depois_da_Chuva_Sistema_Acoes_v0.1.zip
6dac83a2d52bfedd39367ee36ae9e0ea010af9603f20acb1f135ea53f09aa01a  Jardim_Depois_da_Chuva_Casa_Modular_Piloto_v0.1.zip
fd8740e02641c43e3869a61ee14d8fa47ad07e9326e8e9560c8774022bb1d0c1  Jardim_Depois_da_Chuva_Casa_Modular_v1.zip
8c1b09a7de2fd1729b5772e180197afc0412be7b7fd772de04b817fca3ff0747  Jardim_Depois_da_Chuva_Assets_v0.2.zip
```

## Referências adicionais

A casa modular inclui [REFERENCIA_ARTISTICA_MODULOS.png](Jardim_Depois_da_Chuva_Casa_Modular_v1/REFERENCIA_ARTISTICA_MODULOS.png). A correspondência dessa imagem com as pranchas `CONSTRUCOES_MODULARES.png` e `CONSTRUCOES_MODULARES_DETALHADAS.png` ainda precisa ser confirmada. O mapa expandido e o cenário original com os nomes citados no inventário não foram encontrados nestes quatro pacotes.

Consulte também o [inventário do dossiê](../documentacao/03_ATIVOS_E_ESTADO_REAL.md) e as [decisões de implementação](../docs/decisoes-vertical-slice.md).
