# Casa inicial — sprite original

`starter-cottage.png` é a fonte original gerada para a fachada de After Rain, com transparência, reboco creme, telhas terracota, madeira restaurada, venezianas turquesa, floreiras e trepadeiras. A direção segue as árvores aprovadas e o cenário de referência do projeto. Não contém placa, texto, personagem, terreno ou pedras de passagem.

A fonte RGBA mede **1341×1173**. Ela permanece intacta no repositório. `src/house-sprites.ts` prepara o sprite em memória, recortando somente a transparência e aplicando uma escala proporcional, alpha nítido e filtro nearest-neighbor sobre canvas lógico **256×224**. A base permanece em **(128,216)**, sem mudar a origem do objeto no mundo ou a colisão da casa.

O enquadramento visível ocupa aproximadamente **248×188 pixels lógicos**. O limiar de alpha elimina a borda semitransparente da geração; o conteúdo opaco forma uma única silhueta conectada. O arquivo não é usado como cenário de fundo nem esticado para mudar suas proporções.

As janelas usam âncoras locais próprias exportadas por `HOUSE_WINDOW_LIGHTS` para manter o brilho da abertura chuvosa alinhado com o novo desenho. O interior é um ambiente separado; esta arte é apenas a fachada.
