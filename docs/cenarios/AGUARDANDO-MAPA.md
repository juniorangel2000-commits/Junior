# Geração retomada por autorização do usuário

Após os mapas e a natação serem validados localmente, o usuário pediu: “adicione tudo e gere o executavel”. Esta instrução autoriza incorporar o trabalho, retomar o build Windows e disponibilizar o pacote atualizado nas Releases. O registro de suspensão abaixo é histórico.

# Etapa atual: somente local

A especificação de natação recebida em 24/10/2026 determina: “trabalhe somente no ambiente local autorizado. Não faça commit, push ou publicação no GitHub sem autorização explícita.” Os mapas já foram incorporados localmente, mas isso não autoriza retomar a publicação. O último executável publicado continua sendo a versão 0.9.2.

# Mapas recebidos e incorporados

Os dois mapas foram recebidos após a suspensão do build. Os originais estão preservados em `mapas-recebidos/`; as bases aplicadas estão em `src/data/maps/`. As melhorias e os pedidos posteriores foram incorporados localmente. A geração/publicação continua suspensa.

# Registro da suspensão anterior

O usuário pediu: “nao gere ainda, vou mandar o mapa atualizado”.

- O snapshot anterior ao recebimento dos mapas está preservado no commit `6a51c8b7db33dfb147b8a6efbe07b73178f89b4a`, branch `preview/swimming-0.9.3`.
- O commit `5fe8eb05daec6107502edf1a8b292accb73b78f0` suspende o job de empacotamento (`if: false`) e habilita cancelamento da execução anterior por concorrência.
- A execução Windows `40118591341` foi confirmada como `completed/cancelled`.
- A execução de suspensão `40118827484` terminou `completed/skipped`.
- A branch `title-screen-0.5` e o último executável publicado continuam na 0.9.2.
- Aguarde o mapa atualizado antes de gerar/publicar o próximo executável. Preserve os mapas e rascunhos separados da propriedade e da floresta; valide o JSON recebido antes de incorporá-lo.
- Ao retomar a publicação, retire a suspensão somente depois de incorporar o mapa e concluir a validação.

O registro anterior de animação provisória e espera por PixelLab foi substituído pela especificação atual: o sistema de natação utiliza as sprites oficiais preservadas. Consulte `../personagens/NADO-PROVISORIO.md` para o funcionamento e as validações atuais.
