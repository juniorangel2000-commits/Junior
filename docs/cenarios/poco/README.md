# Poço à direita da casa

Implementação local sobre a base 0.9.7, preservando as melhorias de cenário e coleta já feitas.

As sprites originais do ZIP ficam em `public/assets/visual/architecture/well/`, sem recorte, mudança de paleta ou regravação dos PNGs. A imagem parada e os oito frames usam o mesmo ponto de origem e a mesma escala de 0,42. O GIF opaco do pacote serve apenas como documentação.

O poço está à direita da casa, em x1008/y528 do cenário. A base de pedra tem colisão elíptica; o telhado não bloqueia o personagem. O espaço de aproximação permanece livre de árvores e de geração de recursos. O poço aparece também na visualização do editor, como um marco fixo, e participa das sombras solares existentes.

Ao se aproximar e apertar E, usando as mãos ou o regador, o poço executa uma única sequência se o jogador já recolheu o regador e ele não está cheio. Os tempos fornecidos (180, 180, 220, 270, 210, 180, 190, 230 ms) somam 1,66 s. O personagem permanece parado durante o uso. A pausa congela o ciclo; E repetido não o reinicia. Ao terminar, o regador recebe 8 regas, muda de ícone e salva normalmente. Sem regador ou com o regador cheio, nenhuma água é concedida e a animação não começa. Sair da partida cancela o ciclo sem recompensa.

Validação: TypeScript, 503 testes em 52 arquivos, build e teste real no Chromium. O navegador verificou localização, frame aos 180 ms, ausência de água antecipada, bloqueio de acionamento repetido, pausa, passagem por trás do telhado, colisão com a pedra, ícone cheio e salvamento/recarregamento. Relatório: `validacao.json`.

- [Poço ao lado da casa](poco-ao-lado-casa.png)
- [Poço em uso](poco-em-uso.png)
