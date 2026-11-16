# Passagem de trabalho

<!-- Reescreva este arquivo inteiro ao fim de cada rodada, mantendo as seções. -->

- **Atualizado em:** 2026-11-16
- **Por:** Claude Code
- **Continuar a partir de:** `release/v0.10.0-preview.40` (não publicado ainda).
- **Última versão publicada:** `v0.10.0-preview.39`, enviada à `main`. A criação da Release no GitHub pelo Junior não foi confirmada.
- **Estado:** preview.40 em andamento. Tudo enviado, testes passando. Publicar só quando o Junior pedir.

## Feito nesta rodada

### Montaria com a arte do Junior (Claude Code)

- O Junior mandou a personagem feminina montada, parada, nas 8 direções.
- `scripts/pack_horse_rider.py` separa só a personagem. No jogo, ela vai por cima do cavalo animado (passo e galope) e sobe e desce com o lombo.
- Detalhes em `docs/construcoes/MONTARIA.md`; imagem em `docs/planejamento/montaria-preview.png`.
- O Junior pediu acabamento caprichado. Foram limpos restos do cavalo nas bordas, pontas de rédea e o contorno; na vista de frente, as mãos ficaram sobre a cabeça do cavalo.
- O personagem masculino continua com a versão por código (cortado na cintura, pernas, sela e rédeas desenhadas). Falta a arte dele no mesmo formato.
- Correção: o efeito de nado não aparece mais por cima de quem está montado.

### Antes, nesta versão (preview.40)

- Fabricação:
  - categorias melhores;
  - filtros com contador e prontas primeiro;
  - "Para aprender";
  - melhorias de ferramentas na bancada de trabalho (`docs/construcoes/FABRICACAO.md`).
- Qualidade das colheitas por sorteio, conforme os cuidados (rega diária e adubo). A semente do nabo ganhou nome próprio (`docs/construcoes/QUALIDADE.md`).
- Painel do abrigo:
  - cartões com retrato de lado de cada animal;
  - amizade, "Comeu hoje" e "Carinho";
  - números em blocos;
  - "Liberar moradia" alinhado.
- Montaria no cavalo domado: tecla V perto dele, na Propriedade. Shift galopa. Ao entrar em lugares fechados, o jogador desce sozinho.

## Em andamento e próximo passo exato

1. O Junior vai conferir a montaria no jogo. Se ele mandar a arte do personagem masculino montado, rode `pack_horse_rider.py` com `farmer-male` e inclua-o em `RIDER_ART`.
2. Pendentes do pedido "depois fazemos o restante":
   - porteira do lote 01 no chiqueiro;
   - ícones extras (pregos, dobradiça, engrenagem, molas, óleo) como peças de construção;
   - instalador em WebP (precisa de aprovação para instalar o `sharp`);
   - ajustes pelos números do F3 no PC do Junior.
3. Publicar a preview.40 quando o Junior pedir.

## Pendências e ideias para depois

- Plano em `docs/planejamento/ANIMAIS-E-RECEITAS.md`. Animais, cozinha, abelhas, patos, porcos, máquinas e qualidade estão prontos. Faltam conferir os preços jogando e substituir as artes provisórias.
- Estábulo/corda e calendário seguem planos anteriores.
- Há um stash antigo do branch preview.34 com evidências e documentação do estábulo aberto. **Não aplicar sobre esta PASSAGEM nem desfazer os interiores atuais.**

## Problemas conhecidos

- Os interiores dos animais não guardam a posição de cada animal lá dentro.
- Os travamentos nos Campos ainda precisam ser medidos no PC do Junior; o navegador aqui usa SwiftShader. **Não afirmar que o problema de FPS foi resolvido.**
- A arte definitiva dos interiores deve ficar na resolução original; o Junior rejeitou reduzir os PNGs.
- `scripts/qa-animal-escort.cjs` está desatualizado e falha na volta à Propriedade. A corda é conferida em `qa-horse-taming`.
- `qa-open-fields` e `qa-horse-fields` têm o caminho `executablePath:'/usr/bin/chromium'` fixo no código; para rodar aqui, use uma cópia sem esse caminho.
- `scripts/qa-farm-interior.cjs` falha (já falhava antes da preview.37): perto da porta do galinheiro aparece a dica da missão.
- Qualidade: unidades soltas no chão e recolhidas voltam como comuns.
- O Chromium daqui às vezes trava ("Target crashed") em capturas com zoom e movimento. Rode uma direção por execução.

## Testes

- `npm run check`: ok.
- `npm test`: **2.121 passaram, zero falhas** (inclui o teste novo da personagem montada em `tests/horse-riding.test.ts`).
- Montaria conferida no Chromium, andando nas 4 direções principais e galopando de lado. As diagonais e a vista de costas foram conferidas em imagem montada sobre o cavalo parado.
- Para os QAs: `npx vite --host 127.0.0.1 --port 5190 --strictPort`.
