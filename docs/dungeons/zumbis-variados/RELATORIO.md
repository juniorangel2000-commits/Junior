# Zumbis comuns — entregador e moradora

Integração local posterior à preview.13, sem publicação.

Foram integradas as animações recebidas em `entregador_sem_olhos.zip` e `moradora.zip`. Os arquivos originais estão preservados em `../animacoes-entregador/entregador-original.zip` e `../animacoes-moradora/moradora-original.zip`.

Cada atlas contém quatro frames de caminhada por direção e quatro poses paradas, somente para sul, oeste, leste e norte. Os PNGs mantêm suas telas originais de 256 × 256 e seus pixels RGBA. O empacotador verifica cada região contra a imagem original e registra hashes do ZIP, das fontes e do atlas final.

As hordas misturam o zumbi original, o entregador e a moradora. A escolha da aparência usa o identificador do inimigo, preservado no save, sem consumir aleatoriedade do combate. Não há alteração de atributos, recompensas ou frequência de tipos de inimigo.

Os dois novos modelos usam escala fixa baseada na referência corporal de 184 pixels. A altura de referência no jogo é 52 pixels para inimigos comuns e 65 para especiais. A âncora por direção permanece constante durante cada ciclo, respeitando o apoio dos pés da pose parada. Corredores usam nove frames por segundo, e os demais cinco, como no modelo original.

Para reconstruir: `python scripts/prepare-boss-assets.py courier` e `python scripts/prepare-boss-assets.py resident`. O importador atende agora chefes e zumbis recebidos. O jogo não depende de Python; Pillow é usado somente na preparação dos assets.

## Validação

94 testes direcionados aprovados em quatro arquivos, incluindo aparência estável, quatro lados, frames recebidos, escala, âncoras, hashes e chefes. TypeScript e build de produção aprovados. Permanece o aviso conhecido do Vite sobre tamanho do bundle.

59 verificações integradas aprovadas no Chromium, sem erros JavaScript, HTTP ou WebGL registrados. Incluem as três aparências de zumbis, caminhada nos quatro lados, escala e âncora estáveis, chefes, cartas, drops, níveis contínuos, salvamento e retorno.

[Zumbis no cenário](zumbis-variados.png) · [Validação](validacao.json)
