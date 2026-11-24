# Jornada das conquistas no navegador

Avança os 46 capítulos de missões, na ordem da trilha, numa partida nova. Em cada capítulo, cumpre as missões, salva como o jogo salva e registra a conquista, o aviso e o capítulo seguinte no painel. No fim, recarrega a página e confere que tudo ficou salvo.

- `passos.cjs`: o que cada capítulo muda na partida.
- `x.cjs`: dados auxiliares montados com as funções do próprio jogo, para que o save aceite as estruturas criadas (construções, máquinas, mina, acampamento, móveis, estufa).
- `diag.cjs`: diagnóstico rápido. Aplica todos os capítulos sem esperas e aponta qual campo o save recusaria.

```bash
npx vite --host 127.0.0.1 --port 5190
node scripts/qa-conquistas/jornada.cjs
```

O vídeo e os prints vão para esta pasta (`video/`, `c-*.png`). Não os inclua no commit. A rodada leva cerca de 35 minutos no Chromium sem placa de vídeo.

Resultado de 24/11/2026: 46/46 conquistas, uma por capítulo, até "O Vale Renasceu". Continuaram salvas depois de recarregar, e não houve nenhum erro.
