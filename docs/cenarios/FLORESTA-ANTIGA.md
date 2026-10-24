# Floresta Antiga — primeira área separada

Área jogável de 96×72 blocos (3072×2304 pixels de mundo), do mesmo tamanho da propriedade atual. O mapa existente permanece inteiro como Propriedade Abandonada; os IDs de recursos, construções, plantações e edições existentes são preservados.

## Acesso e controles

Na propriedade, siga a trilha a leste, atravesse a ponte e continue até a placa Floresta Antiga no fim do caminho (bloco 75,18). Com as mãos vazias, aproxime-se e pressione E. A transição escurece a tela; a floresta abre pela entrada sul. Para voltar, siga ao sul até a placa Propriedade Abandonada e pressione E.

WASD/setas: caminhar em oito direções. M: mapa completo do cenário real, com indicador dourado na posição do personagem. +/- ou roda do mouse: zoom. Esc: pausa. Salvar e sair: volta ao início mantendo a área para Continuar. O nome aparece por dez segundos ao entrar.

## Animais

Dez animais em seis tipos: duas galinhas, duas ovelhas, duas cabras, duas vacas, um coelho e um cervo. Aproxime-se e pressione E para acolher. O animal passa a aparecer nos campos da propriedade; seu ID impede reaparecimento/duplicação na floresta, inclusive após sair e recarregar.

Esta etapa implementa exploração e acolhimento simples. Alimentação, reprodução, produção e animações de caminhada dos animais ainda não fazem parte dela. Construção, fabricação, ferramentas e editor de mapa continuam disponíveis na propriedade; a floresta possui controles próprios de exploração.

## Arte e terreno

Atlas novo e original em `public/assets/visual/forest/animals.png`, gerado para o jogo. Seis recortes individuais preservam as proporções e o PNG fonte; sem conversão para paleta reduzida. Árvores existentes reaproveitadas em escala maior, com uma árvore central antiga e transparência quando encobrem o jogador. Terreno próprio, caminhos, clareiras, lago, riacho, ponte, rochas e flores. A referência conceitual orienta a composição; não é usada como fundo plano com colisão aproximada.

## Persistência e validação

Save versão 2 mantém compatibilidade: campos opcionais `activeArea`, `forestPosition`, `recruitedAnimals`. A posição da propriedade continua em `player`; plantações e relógio continuam avançando durante a exploração. Pausar/mapa interrompem a simulação. A floresta salva periodicamente, ao acolher, sair e perder foco.

322 testes: acesso por caminhos às dez posições, limites, IDs únicos, validação e compatibilidade de saves, sistemas existentes. Chromium: entrada, mapa, movimento, pausa, acolhimento dos dez animais, retorno, presença na propriedade, reentrada sem respawn e recarga iniciando na floresta. Registros e capturas em `docs/cenarios/`.
