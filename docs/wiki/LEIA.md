# Almanaque do Vale

`almanaque.html` é o guia para jogadores: horta, pratos, máquinas, fabricação, pesca, vila, obras, criação, festas, cenários, mina, expedições, companheiros e as missões com as conquistas. Abra o arquivo no navegador.

As tabelas saem direto dos dados do jogo. Depois de mudar plantas, receitas, preços, obras ou missões, gere de novo com:

```
npm run almanaque
```

- `scripts/almanaque/exportar.ts` lê os dados do jogo e grava `scripts/almanaque/dados.json`.
- `scripts/almanaque/gerar.py` monta as tabelas no `scripts/almanaque/modelo.html`.
- Os textos que não são tabela, como as dicas, os atalhos e as explicações, ficam escritos no modelo.
