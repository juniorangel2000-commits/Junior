# After Rain 0.8.1 — prévia de personagens e ferramentas

- Dois personagens enviados pelo autor, com caminhada em oito direções e texturas originais preservadas. Personalizações antigas substituídas pela seleção do personagem e nome.
- Picareta e machado com os sprites fornecidos, orientação corrigida e posição quatro pixels à frente na direção do personagem.
- Golpes com impacto sincronizado, bloqueio de movimento durante o uso e cancelamento ao pausar. Slots vazios deixam as mãos vazias.
- Editor de mapa por F2, com importação/exportação JSON, e zoom de 50% a 200%.
- Salvamento e recursos existentes preservados.

Validação: TypeScript, 317 testes, build e Chromium com os dois personagens, impacto, cancelamento, coleta sem duplicação e save/reload.

Limitação visual: os braços usam a pose parada; a animação fornecida é da ferramenta isolada. O machado possui animações laterais; outras direções usam suas poses específicas.

Executável portátil para Windows 11 x64, gerado no Windows pelo GitHub Actions. Sem instalação de Node.js. Execução interativa no Windows 11 não testada neste ambiente Linux.
