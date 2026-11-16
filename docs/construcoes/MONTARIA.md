# Montaria (preview.40)

- **V** perto do cavalo domado, na Propriedade: monta. **V** montado: desce. **Shift** galopa.
- Montado, o jogador anda 1,9× mais rápido (galope 1,25× a mais). O cavalo não entra na água.
- O cavalo vai junto por todos os cenários ao ar livre. Ao entrar em casa, loja, abrigo, mina
  ou masmorra, o jogador desce e o cavalo volta sozinho para a Propriedade. Descendo na
  Propriedade, o cavalo fica onde o jogador desceu.
- Save: `riding: true` (só com o cavalo domado alojado). Código: `src/systems/horse-riding.ts`,
  `src/riding-controller.ts` (tecla V e acompanhamento entre cenários), `src/horse-mount.ts`
  (desenho) e `Player.mountHorse`.

## Arte provisória

Hoje o desenho junta o atlas do cavalo com o personagem cortado na cintura. O Junior achou as
animações ruins (16/11/2026) e vai mandar artes próprias. Prompts em
`docs/planejamento/PROMPTS-ARTE-MONTARIA.md`. Quando chegarem, `HorseMount` passa a usar a
folha nova (cavalo e cavaleiro já juntos), e o personagem deixa de ser desenhado por cima.
