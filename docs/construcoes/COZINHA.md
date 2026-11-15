# Cozinha

Etapas 1 e 2 implementadas no branch `release/v0.10.0-preview.35`, ainda sem publicação.
Dados em `src/data/kitchen.ts`, regras em `src/systems/kitchen.ts` e caderno em
`src/cookbook-ui.ts`.

## Fogão a lenha

- Já vem na casa, encostado na parede do fundo (móvel `woodStove`, 2×2, um por casa).
  Pode ser movido pelo editor da casa (H).
- Saves anteriores recebem o fogão no primeiro lugar livre, de preferência em (4,2).
  - Cada lugar é testado com o save inteiro, para o fogão nunca cair sobre o jogador
    que salvou dentro de casa.
  - Se não houver lugar, a casa fica como está, e o fogão pode ser colocado pelo editor.
- **E** em frente ao fogão abre o **caderno de receitas**.

## Receitas

A Helena ensina **uma receita por vez**, no serviço "Aprender" da pousada, na ordem
abaixo. Cozinhar gasta os ingredientes e **1 madeira** de lenha. O prato vai para a
mochila e recupera vigor ao ser comido. A Helena compra todos os pratos; nenhuma loja
os vende. Preços revistos na preview.36 (regra em `docs/construcoes/PRECOS.md`); a qualidade
multiplica preço e vigor (`docs/construcoes/QUALIDADE.md`).

| Prato | Ingredientes | Vigor | Aula | Venda |
| --- | --- | --- | --- | --- |
| Omelete de couve | 2 ovos, 1 couve | 40 | 20 C | 55 |
| Salada da horta | 1 alface, 1 tomate, 1 cenoura | 35 | 20 C | 95 |
| Pão caseiro | 2 farinhas, 1 ovo, 1 leite | 45 | 30 C | 130 |
| Broa de milho | 2 fubás, 1 ovo, 1 manteiga | 50 | 30 C | 190 |
| Pamonha | 2 milhos, 1 leite, 1 manteiga | 55 | 35 C | 165 |
| Sopa de abóbora | 1 abóbora, 1 batata-doce, 1 manteiga | 60 | 35 C | 205 |
| Bolo de cenoura | 2 farinhas, 2 ovos, 1 cenoura, 1 leite | 60 | 40 C | 180 |
| Feijão tropeiro | 2 feijões, 1 couve, 1 ovo, 1 fubá | 70 | 45 C | 155 |
| Suco de melancia | 1 melancia, 1 hortelã | 30 | 25 C | 135 |
| Mingau de aveia | 1 aveia em flocos, 1 leite, 1 mel | 50 | 35 C | 120 |
| Chá de camomila com mel | 1 camomila, 1 mel | 35 | 30 C | 95 |
| Doce de leite | 3 leites, 1 mel | 45 | 40 C | 120 |
| Torta de morango | 2 farinhas, 2 morangos, 1 manteiga, 1 ovo de pato | 70 | 50 C | 275 |
| Pão com queijo e mel | 1 pão caseiro, 1 queijo, 1 mel | 80 | 50 C | 285 |

**Mel** e **ovo de pato** já existem como itens, com arte, mas ainda não têm fonte: chegam
com as abelhas e com a criação de patos. O caderno mostra esse aviso no ingrediente que
falta, em vez de esconder a receita.

## Arte

Gerada no SpriteCook e mantida na resolução original, em `public/assets/visual/kitchen/`;
os ids estão em `spritecook-assets.json`.

- **Fogão:** a primeira arte usou uma captura do interior da casa. Foi substituída
  pelo conjunto rústico de `public/assets/visual/home-furniture/`, gerado por imagegen
  com os móveis como referência: ferro, alvenaria creme, chaleira verde e nicho de lenha.
  A fonte anterior permanece preservada, sem carga em jogo.
- **Pratos, mel e ovo de pato:** guia de estilo foram os ícones de ovo e leite.

## Etapa 2: forno, fogueira, efeitos, prato do dia e receitas escondidas

Decisões do Junior: pães e bolos passam ao forno; os quatro efeitos do plano; receitas
escondidas na Mina, com os sobreviventes e no mapa antigo.

### Forno de barro

- É uma máquina (`clayOven`, 2 de largura), instalada só **ao ar livre, na Propriedade**.
- O projeto é da **Helena** (60 C). A montagem é na bancada, com martelo: 24 pedras, 10 madeiras, 4 tábuas regulares e 2 fragmentos de ferro.
- **E no forno vazio** abre o caderno na aba do forno. A fornada gasta os ingredientes e 1 madeira e assa em **meio dia**.
- Durante a fornada, o forno aparece aceso. Quando termina, mostra o balão com o prato e E recolhe.
- **Receitas do forno:** pão caseiro, broa de milho, bolo de cenoura, torta de morango e bolo de mel.
- As fornadas não carregam pelo item solto: a farinha usada perto do forno não começa nada.
- "Guardar o forno na mochila" fica no próprio caderno do forno.

### Fogueira portátil

- Montada sem bancada: 4 pedras, 4 galhos e 1 corda.
- Usar pela mochila ou pela barra abre o caderno da fogueira em qualquer cenário aberto. Não funciona dentro de casa, nos interiores dos abrigos nem nas masmorras.
- **Receitas da fogueira:** já vêm conhecidas, e cada uma gasta 1 madeira.
  - Peixe assado: 1 peixe, 30 de vigor.
  - Milho assado: 1 milho, 20 de vigor.
  - Batata-doce assada: 1 batata-doce, 25 de vigor.

### Efeitos dos pratos

Um efeito por vez: comer outro prato com efeito troca o atual. O prazo usa o relógio do
jogo (`save.foodEffect`, `src/systems/food-effects.ts`).

| Prato | Efeito | Duração |
| --- | --- | --- |
| Café da manhã reforçado (fogão: pão caseiro, ovo, leite) | +30 de vigor extra, gasto antes do vigor normal | 8 h |
| Peixe assado | pesca mais fácil: faixa de controle +0,07 | 6 h |
| Feijão tropeiro | 35% menos dano dos perigos da Mina | 6 h |
| Suco de melancia | anda 15% mais rápido | 4 h |

Adaptações:
- **Feijão tropeiro:** a Mina não gasta vigor (lá existe a vida, com gás, desabamento e bichos), então o efeito "minerar gasta menos vigor" virou "menos dano na Mina".
- **Café da manhã reforçado:** o vigor continua limitado a 100 no save. Por isso o café dá vigor extra temporário em vez de aumentar o máximo.

### Prato do dia

- A Helena escolhe um prato pelo calendário entre as receitas dela, sem mel nem ovo de pato. Recarregar o jogo não troca o prato.
- Ela paga **o dobro** por 1 unidade, uma vez por dia (`save.kitchen.dishOfDaySold`).

### Receitas escondidas

Aparecem no caderno como "???", com uma pista, até serem encontradas:

| Receita | Onde | Ingredientes | Vigor |
| --- | --- | --- | --- |
| Caldo do mineiro (fogão) | anotação encontrada na primeira expedição à Mineração | 1 batata-doce, 1 couve, 1 ovo | 65 |
| Ensopado de peixe (fogão) | os sobreviventes ensinam ao conversar, com o acampamento amigável | 1 peixe, 1 tomate, 1 batata-doce | 70 |
| Bolo de mel (forno) | verso do mapa antigo; quem já tinha usado o mapa pode usá-lo de novo | 2 farinhas, 1 mel, 1 ovo, 1 leite | 75 |

### Arte nova (SpriteCook)

- Forno parado e aceso (guiado pelo moinho do Codex e pela casa).
- Ícone da fogueira.
- Ícones de 7 pratos: café da manhã, peixe, milho e batata-doce assados, caldo do mineiro, ensopado de peixe e bolo de mel.
- Os ids estão em `public/assets/visual/kitchen/spritecook-assets.json`. Restam cerca de 64 créditos.

## Próximas etapas da cozinha

Qualidade dos pratos, conforme `docs/planejamento/ANIMAIS-E-RECEITAS.md`.

## Verificação

- Testes: `tests/kitchen.test.ts` (12) e `tests/kitchen-stage2.test.ts` (15).
- Navegador: `scripts/qa-kitchen.cjs` e `scripts/qa-kitchen-stage2.cjs` (forno, fogueira e suco), com capturas em `docs/planejamento/qa-cozinha/`.
