# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

> **Este arquivo é a passagem do projeto nativo (Godot 4.4 + C++20)**, no branch
> `native/cpp-foundation`. A passagem do jogo publicado (Phaser, previews 0.10.0) fica em
> `docs/PASSAGEM.md` da `main` e do branch `release/v0.10.0-preview.N` atual.

- **Atualizado em:** 2026-11-27
- **Por:** Claude Code
- **Continuar a partir de:** `native/cpp-foundation` (V0.19).
- **Última versão nativa:** V0.19. Não há tag nem Release: o executável sai como artefato do workflow `After Rain Native - Windows x64` (`.github/workflows/native-windows.yml`), que roda a cada push neste branch que mexa em `godot-teste/`.
- **Estado:** protótipo da Propriedade na Godot. Em C++: relógio, calendário, clima, luz, crescimento da horta, golpe nos recursos e uso/desgaste das ferramentas. Em GDScript: o resto (horta, mochila, coleta, fabricação, construção, casa, criação, pesca, máquinas, colmeia, pomar, culinária, vigor, qualidade). Histórico em `godot-teste/NATIVE.md`. Não lê os saves do jogo publicado.

## Feito nesta rodada (V0.14.3 → V0.19)

Pedidos do Junior nesta rodada: continuar o C++, mandar imagens, "ajuste tudo, deixe natural e melhore os HUDs", "organize o mapa" (escolheu **refazer a fazenda**), "refaça os pisos sem bordas feias", "sem fade" → esmaecimento, "arrume as pontes", "melhore as bordas do rio".

- **V0.14.3:** CI vermelho da V0.14.2 corrigido (teste copiava o save antes de comer). Compilação e testes no Linux (`native/build-linux.sh`, `native/test-linux.sh`).
- **V0.15:** HUD no estilo da V51 (`scripts/tema_ui.gd`, `scripts/hud.gd`), mochila e barra com ícones, F1 com os controles.
- **V0.16:** fazenda refeita por `ferramentas/refazer_fazenda.py` (lê `dados/propriedade-v51.json`, o mapa original). Pontes com tabuleiro (`scripts/ponte.gd`). Piso novo (`shaders/terreno.gdshader`): sem repetição visível, esmaecimento largo entre materiais, rio com margem em curva, areia contínua, chão molhado, raso e espuma. Vaca/cavalo recortados certo (a vaca aparecia em dobro).
- **V0.17:** qualidade igual à V51 (melhores unidades primeiro, média, fator 1/1,25/1,5).
- **V0.18:** colmeia, pomar com frutas da estação, capim fresco.
- **V0.19:** níveis e desgaste das ferramentas, ipê-amarelo com madeira nobre; `tool_strike` e `resource_strike` em C++.
- Fotos de conferência: `ferramentas/fotos_sistemas.gd` gera 16 imagens (mapa, horta, criação, máquinas, pôr do sol, noite, chuva, mochila, casa, lago, pontes, rio, ipê, pomar).

## Em andamento e próximo passo exato

1. Conferir o CI de Windows das execuções 29 a 34 (V0.16.1 a V0.19). A V0.16 (execução 28) passou. Se alguma falhar, o log do passo "Import project and smoke test" mostra o marcador ou o erro.
2. Junior testar o executável da V0.19 no PC (aparência, FPS e se o piso e o rio ficaram como ele queria).
3. Ideias seguintes (o Junior escolhe):
   - venda de produtos (o valor com qualidade já existe em `sale_value`);
   - ouro e metal negro (hoje só há ferro na Propriedade, então as melhorias de ouro e metal negro não têm como ser feitas);
   - passar mais regras para o C++ (qualidade, colmeia, pomar);
   - colmeia com enxame dos ipês, como na V51, quando houver os Campos.

## Como testar aqui (Linux, sem Windows)

```bash
python3 -m pip install scons
```

```bash
godot-teste/native/build-linux.sh
```

```bash
GODOT=/caminho/Godot_v4.4-stable_linux.x86_64 godot-teste/native/test-linux.sh
```

Fotos (precisa de Xvfb e do renderizador OpenGL, não do modo headless):

```bash
xvfb-run -a -s "-screen 0 1600x900x24" /caminho/Godot_v4.4-stable_linux.x86_64 --rendering-driver opengl3 --path godot-teste --resolution 1600x900 --script res://ferramentas/fotos_sistemas.gd -- /pasta/de/saida --sem-save
```

A Godot 4.4 para Linux sai de `https://github.com/godotengine/godot/releases/download/4.4-stable/Godot_v4.4-stable_linux.x86_64.zip`. A importação gera arquivos `.import` e `.uid` em `godot-teste/`: não envie esses arquivos.

## Pendências e ideias para depois

- Provisórios (sem vila nem dinheiro no protótipo): colmeia fabricada na bancada; melhoria e reparo de ferramentas só com lingotes; vara e isca de pesca; caderno de receitas aberto.
- Saves do protótipo são separados da V51; sem migração a partir do jogo publicado.
- Regras marcadas como "extensão do protótipo" em `NATIVE.md` (qualidade por tamanho na pesca) precisam de aprovação do Junior.

## Problemas conhecidos

- A importação headless da Godot imprime erros de `progress_dialog.cpp` (da própria Godot 4.4); o CI só checa os logs dos smokes.
- Ícones de alguns itens (pratos, sementes) vêm de pranchas grandes da V51 e aparecem um pouco pequenos na mochila.
- Animais dentro do abrigo podem encostar na trave da cerca do desenho (a cerca faz parte da arte do abrigo).

## Testes

- Linux x64, Godot 4.4, extensão C++ carregada: smoke interno com os 13 marcadores exigidos pelo CI (incluindo os novos `NATIVE_HIVE_ORCHARD_SMOKE_OK` e `NATIVE_TOOLS_HARDWOOD_SMOKE_OK`), smoke do jogo com `NATIVE_EXPORT_SMOKE_OK`, zero erros nos logs.
- Paridade C++ × GDScript do golpe de ferramenta nos 4 níveis.
- CI de Windows: V0.14.3, V0.15 e V0.16 passaram; as seguintes estavam em execução no fim da rodada.
- Este branch não altera o jogo em Phaser.
