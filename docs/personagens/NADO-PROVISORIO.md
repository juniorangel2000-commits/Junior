# Animação provisória de nado

Aprovada provisoriamente pelo usuário; será substituída por animações fornecidas pelo PixelLab. Preserve os PNGs originais das personagens.

`src/swimming.ts` cria quatro poses em oito direções a partir da pose neutra; `drawRigSwimPose` movimenta braços sem alterar a cabeça. O atlas usa frames 192×256 e linha da água em y=196. A arte é exibida na densidade original de 4×.

Para substituir a arte, adapte a criação do atlas em `SwimmingVisual` para as duas personagens (`farmer-female`, `farmer-male`). A lógica de entrada/saída, velocidade, obstáculos e salvamento está separada em `Player` e nos adaptadores dos cenários. O estado de nado é derivado da posição sobre a água; não há campo novo obrigatório no save.

Evidências: `scripts/qa-swimming.cjs`, `docs/cenarios/validacao-nado.json` e capturas `nado-feminino.png` / `nado-masculino.png`.
