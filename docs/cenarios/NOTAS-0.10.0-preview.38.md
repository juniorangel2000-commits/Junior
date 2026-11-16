# After Rain 0.10.0-preview.38 — Correção da tela preta e patos

Versão de correção da preview.37.

**Correções**
- **Tela preta ao voltar para a Propriedade:** a cada volta da Floresta Antiga (ou de outro
  cenário), a luz nova empilhava uma camada a mais sobre a tela, e à noite tudo acabava
  preto. Agora fica sempre uma camada só.
- A dica na tela (porta, poço, animais) já aparece certa ao voltar para a Propriedade, sem
  precisar dar o primeiro passo.

**Patos da Floresta Antiga**
- Os pés ficam escondidos quando o pato está na água.
- Os patos saem da água e passeiam pela margem, até uns 3 blocos do lago; ao fugir,
  continuam indo para a água.
- A fuga não trava mais.

Partidas anteriores continuam compatíveis.

Validação: TypeScript, 2.094 testes em 238 arquivos e build de produção aprovados. No
Chromium foram conferidos idas e voltas entre a Propriedade, a Vila e a Floresta (sem tela
preta e sem crescer memória), os patos, os animais da criação, as máquinas, a cozinha, a
qualidade, o interior dos abrigos e a doma do cavalo.
