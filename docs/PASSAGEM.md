# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

> **Este arquivo é a passagem do projeto nativo (Godot 4.4 + C++20)**, no branch
> `native/cpp-foundation`. A passagem do jogo publicado (Phaser, previews 0.10.0) fica em
> `docs/PASSAGEM.md` da `main` e do branch `release/v0.10.0-preview.N` atual.

- **Atualizado em:** 2026-11-27
- **Por:** Claude Code
- **Continuar a partir de:** `native/cpp-foundation` (V0.14.3).
- **Última versão nativa:** V0.14.3. Não há tag nem Release: o executável sai como artefato do workflow `After Rain Native - Windows x64` (`.github/workflows/native-windows.yml`), que roda a cada push neste branch que mexa em `godot-teste/`.
- **Estado:** protótipo da Propriedade na Godot com relógio, calendário, clima e luz em C++; horta, mochila, coleta, fabricação, construção, interior, criação, pesca, máquinas, culinária, vigor e qualidade em GDScript. Histórico de cada versão em `godot-teste/NATIVE.md`. Não lê os saves do jogo publicado.

## Feito nesta rodada (V0.14.3)

- **CI vermelho corrigido.** As execuções 45957774531 (V0.14.2) e 45965051749 (V0.14.2.1) falharam em `Nutrition persistence or expiration failed` (`godot-teste/tests/native_smoke.gd`). A cópia do save era feita antes de comer o peixe assado; a V0.14.2.1 passou a esperar vigor 100, o que não testava nada. Agora há duas cópias: uma antes de comer (qualidade boa do prato) e outra depois (vigor 70, efeito "Mão firme" ativo aos 500 min e expirado aos 840, prato consumido). Nenhuma regra do jogo mudou.
- **Compilação e testes no Linux** (para testar na nuvem antes de enviar):
  - `godot-teste/native/SConstruct` aceita `platform=linux` além de `windows`; `after_rain.gdextension.in` ganhou a linha do Linux.
  - `godot-teste/native/build-linux.sh` baixa o godot-cpp `godot-4.4-stable` e gera `bin/libafter_rain_native.so`.
  - `godot-teste/native/test-linux.sh` importa o projeto, roda o smoke interno, confere todos os marcadores que o workflow exige, roda o smoke do jogo (`--native-export-smoke`) e falha se houver `SCRIPT ERROR`/`ERROR` nos logs.
- Workflow: nomes do executável e do artefato passaram para V0.14.3 (o artefato ainda se chamava V0.13).

## Em andamento e próximo passo exato

1. Conferir se o CI de Windows da V0.14.3 ficou verde (Actions → After Rain Native - Windows x64). Se falhar, os logs do passo "Import project and smoke test" mostram o erro.
2. Próxima etapa do protótipo, a escolher com o Junior. Pendências já registradas em `NATIVE.md`:
   - qualidade na venda e nos efeitos dos pratos (o ledger já preserva qualidade na pesca, nas máquinas e na cozinha);
   - colmeia, cera, mel e capim fresco, para as receitas de máquinas que ainda não têm fonte;
   - madeira nobre sem fonte na Propriedade (custos da criação);
   - ferramentas com níveis e durabilidade, animação completa do corpo;
   - passar mais regras do GDScript para o C++ (hoje só movimento, relógio, calendário, clima e luz estão em C++).
3. Revisão visual no PC do Junior: o CI e o teste no Linux são headless e não validam aparência nem FPS.

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

A Godot 4.4 para Linux sai de `https://github.com/godotengine/godot/releases/download/4.4-stable/Godot_v4.4-stable_linux.x86_64.zip`. A importação gera arquivos `.import` e `.uid` em `godot-teste/`: não envie esses arquivos (o projeto só versiona `jogador.gd.uid` e `terreno.gd.uid`).

## Pendências e ideias para depois

- Saves do protótipo são próprios e separados da V51; ainda sem migração a partir do jogo publicado.
- Regras marcadas como "extensão do protótipo" em `NATIVE.md` (qualidade por tamanho na pesca, qualidade mínima no processamento e na cozinha) não existem na V51 e precisam de aprovação do Junior antes de virar regra.

## Problemas conhecidos

- A importação headless da Godot imprime erros de `progress_dialog.cpp` (comportamento da própria Godot 4.4 no modo headless); o workflow só checa erros nos logs dos smokes, não no da importação.
- Fogão, fogueira, máquinas e pesca usam receitas e desbloqueios provisórios, sem moradores.

## Testes

- Linux x64, Godot 4.4 stable, extensão C++ carregada: smoke interno com todos os 11 marcadores exigidos pelo CI (mais `NATIVE_LIGHT_SMOKE_OK` e `NATIVE_WORLD_SMOKE_OK`), smoke do jogo com `NATIVE_EXPORT_SMOKE_OK`, zero erros nos logs.
- Antes da correção, o mesmo teste no Linux reproduzia a falha do CI (`Nutrition persistence or expiration failed`).
- Este branch não altera o jogo em Phaser: `npm run check` e `npm test` valem para a `main`/previews.
