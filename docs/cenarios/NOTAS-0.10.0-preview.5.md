# After Rain v0.10.0-preview.5 — desempenho e fachada do armazém

- Corrige picos de cálculo nos caminhos de Augusto e Bento, compilando as colisões do interior e reutilizando as consultas de navegação.
- Otimiza as identificações e falas para evitar reconstruções desnecessárias de texto.
- Ajusta a escala uniforme do Augusto pela altura visível de suas poses, aproximando-a da escala do Bento.
- Adiciona a fachada original do comércio do Augusto, alinhada à porta, com colisões, janelas iluminadas, lanternas, sombra e fumaça.
- Aplica o novo JSON da ferraria com 52 peças e preserva as personalizações posteriores dos cenários.

Na mesma amostra local de 1.200 atualizações de IA, o maior pico caiu de 556,4 ms para 4,3 ms. A medição é da simulação da IA, não uma garantia de FPS para todo hardware.

Validação local: TypeScript, build, 741 testes em 74 arquivos e 47 verificações no navegador. A geração Windows repete os testes antes de publicar.
