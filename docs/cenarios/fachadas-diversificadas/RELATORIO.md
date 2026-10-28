# Fachadas com estruturas próprias

O usuário pediu diferenciar todas as fachadas, preservando a carpintaria do Tobias e a ferraria do Bento. Alterações locais, sem publicação.

| Comércio | Nova estrutura |
| --- | --- |
| Augusto | Armazém térreo, largo e baixo, com telhado de quatro águas |
| Rosa | Pavilhão de vidro baixo e comprido para plantas e sementes |
| Amélia | Torre de pedra arredondada com estufa lateral |
| Nilo | Antiquário alto e estreito, telhado de duas inclinações e janela saliente |
| Celina | Sobrado assimétrico com frontão curvo e vitrine saliente |
| Damião | Cabana térrea de madeira, telhado de uma água |
| Helena | Sobrado com telhado de quatro águas e ala baixa de refeições |
| Ícaro | Galpão de oficina com telhado metálico em níveis e portão fechado |

O interior específico do Ícaro continua como próxima etapa; nesta alteração recebeu somente fachada e colisões externas. O portão da oficina e a porta lateral da pousada são fechados e decorativos; as entradas principais continuam no mesmo ponto do mapa, alinhadas ao desenho novo por seus pivôs.

src/data/shop-facades.ts concentra dimensões, pivôs, portas, estoque sólido, luminárias e regiões de vidro. A renderização e a colisão consultam os mesmos dados. Beirais não se tornam obstáculos; as quatro amostras dos pés passam pela entrada. Máscaras de luz são construídas sobre pixels dos vidros, sem substituir os PNGs. As cores e os materiais permanecem na família visual da vila, mas proporções e silhuetas diferem.

Arquivos da carpintaria e da ferraria foram preservados. Os testes verificam hashes de fontes protegidas e as suítes de comportamento existentes passaram. Há também cópia anterior das seis fachadas substituídas em /workspace/recovery/fachadas-antes-da-diversificacao.tar.gz.

Validação: 822 testes em 92 arquivos e build passaram. Testes específicos verificam portas alinhadas, oficina/pousada com acessos secundários bloqueados e arquivos protegidos intactos. No navegador, scripts/qa-facade-structures.cjs percorre as oito entradas, verifica texturas próprias e máscaras de luz e grava capturas em /workspace/after-rain-facades. As suítes da pousada validam também sua rotina e interior. Não houve publicação ou geração de novo executável.

Scripts antigos de preparação de Amélia e Rosa passam a preservar a fachada existente ao reprocessar objetos, evitando restaurar a estrutura anterior por acidente.
