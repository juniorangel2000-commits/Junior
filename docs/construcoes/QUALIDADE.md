# Qualidade dos produtos

Adicionada na preview.36. Código em `src/systems/item-quality.ts`; amizade dos animais em
`src/systems/animal-production.ts`.

## Níveis

| Qualidade | Na mochila | Preço de venda | Vigor do prato |
| --- | --- | --- | --- |
| Comum | sem marca | 1× | 1× |
| Bom | estrela prateada | 1,25× | 1,25× |
| Excelente | estrela dourada | 1,5× | 1,5× |

Na mochila, o detalhe do item mostra quantas unidades de cada qualidade você tem
(por exemplo, "Qualidade: 1 excelente · 3 comuns").

## Amizade dos animais

- Cada galinha, pato, vaca, cabra, ovelha e porco tem amizade de 0 a 30.
- **+1** a cada manhã (06:00) em que comeu do cocho.
- **+1** com o carinho do dia: dentro do abrigo, chegue perto do animal e aperte **E**
  (uma vez por dia por animal; um coração sobe sobre ele). Se a vaca ou a cabra
  estiver com leite, ou a ovelha com lã, o E ordenha ou tosquia primeiro.
- **−2** a cada manhã em que o cocho estava vazio para ele.
- Amizade **10** produz **bom**; **25** produz **excelente**. Com comida e carinho todo
  dia, bom chega em cerca de 5 dias e excelente em cerca de 13.
- A dica do animal mostra "amizade N/30 · produz bom".

O ovo e o ovo de pato recebem a qualidade da ave na manhã em que foram postos (o ninho
guarda isso). O leite e a lã recebem a qualidade do animal na hora da ordenha ou da
tosquia. Esterco, pena e mel ficam sempre comuns.

## Colheitas da horta (preview.40)

- Cada planta nova guarda o cuidado desde o plantio (`crop.care`): dias sem rega enquanto
  crescia e se recebeu adubo.
- **Bom:** regada todos os dias **ou** adubada. **Excelente:** regada todos os dias **e**
  adubada. Esquecer a rega e não adubar dá comum.
- O status do canteiro mostra "rende bom/excelente" enquanto cresce. Plantas que rebrotam
  recomeçam o cuidado depois de cada colheita.
- Plantas de saves anteriores não têm o registro e colhem comum. O que cai no chão (mochila
  cheia) volta comum.

## Qualidade herdada

- **Máquinas:** queijo, queijo de cabra, manteiga, novelo e tecido de lã herdam a
  qualidade média da matéria-prima de animal que entrou.
- **Pratos e máquinas:** usam a qualidade média dos ingredientes com qualidade: produtos de
  animal, colheitas da horta (desde a preview.40) e o que as máquinas fazem com eles (farinhas,
  geleias). Ovos excelentes com couve comum dão prato bom.
- Média arredondada para baixo: 1 ovo excelente com 1 leite comum dá prato **bom**.
- Venda, cozinha, máquinas e o prato do dia usam primeiro as **melhores** unidades.

## Como o save guarda

- A mochila continua com a quantidade total de cada item.
- `save.itemQuality[item] = {good, excellent, seen}` diz quantas unidades são boas e
  excelentes; o resto é comum. `seen` é o total na última conferência.
- Se o total cair por um gasto que não conhece qualidade (presente, receita antiga,
  soltar no chão), saem primeiro as comuns. Cada save confere o registro.
- Ninhos: `site.nestQuality` (índice do ninho → 1 ou 2). Máquinas: `job.quality`.
  Animais: `animalCare.animals[id].bond` e `petted` (dia do carinho).
- Saves anteriores: tudo comum e amizade zero. Nenhuma migração é necessária, porque os
  campos são opcionais.

## Verificação

- Testes: `tests/item-quality.test.ts`.
- Navegador: `scripts/qa-quality.cjs`, com evidências em `docs/planejamento/qa-qualidade/`.
