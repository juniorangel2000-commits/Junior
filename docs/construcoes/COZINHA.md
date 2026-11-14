# Cozinha

Etapa 1 implementada no branch `release/v0.10.0-preview.35`, ainda sem publicação.
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
os vende. Os preços são iniciais, a ajustar jogando.

| Prato | Ingredientes | Vigor | Aula | Venda |
| --- | --- | --- | --- | --- |
| Omelete de couve | 2 ovos, 1 couve | 40 | 20 C | 36 |
| Salada da horta | 1 alface, 1 tomate, 1 cenoura | 35 | 20 C | 60 |
| Pão caseiro | 2 farinhas, 1 ovo, 1 leite | 45 | 30 C | 80 |
| Broa de milho | 2 fubás, 1 ovo, 1 manteiga | 50 | 30 C | 115 |
| Pamonha | 2 milhos, 1 leite, 1 manteiga | 55 | 35 C | 110 |
| Sopa de abóbora | 1 abóbora, 1 batata-doce, 1 manteiga | 60 | 35 C | 110 |
| Bolo de cenoura | 2 farinhas, 2 ovos, 1 cenoura, 1 leite | 60 | 40 C | 110 |
| Feijão tropeiro | 2 feijões, 1 couve, 1 ovo, 1 fubá | 70 | 45 C | 100 |
| Suco de melancia | 1 melancia, 1 hortelã | 30 | 25 C | 70 |
| Mingau de aveia | 1 aveia em flocos, 1 leite, 1 mel | 50 | 35 C | 75 |
| Chá de camomila com mel | 1 camomila, 1 mel | 35 | 30 C | 55 |
| Doce de leite | 3 leites, 1 mel | 45 | 40 C | 95 |
| Torta de morango | 2 farinhas, 2 morangos, 1 manteiga, 1 ovo de pato | 70 | 50 C | 160 |
| Pão com queijo e mel | 1 pão caseiro, 1 queijo, 1 mel | 80 | 50 C | 170 |

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

## Próximas etapas da cozinha

Forno de barro, fogueira portátil, efeitos por algumas horas, receitas escondidas,
pedidos e qualidade, conforme `docs/planejamento/ANIMAIS-E-RECEITAS.md`.

## Verificação

- Testes: `tests/kitchen.test.ts` (12).
- Navegador: `scripts/qa-kitchen.cjs`, com capturas em `docs/planejamento/qa-cozinha/`.
