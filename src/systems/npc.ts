export function getLiaDialogue(met: boolean): string[] {
  if (!met) return [
    'Você chegou! Eu sou a Lia. Depois de tanta chuva, quase desisti desta clareira. Mas olha só: o sol voltou.',
    'A casa ainda está de pé e aquela terra ali é boa. Plante um nabo, dê uma regada e espere um pouquinho. Começos pequenos também alimentam.',
    'Deixei madeira, pedras e sementes na sua mochila. Pela mata tem mais. Se quiser companhia, vou estar por aqui. Vamos fazer deste lugar um lar?',
  ];
  return [
    'Gosto do cheiro de terra molhada. Faz parecer que o mundo ainda sabe recomeçar.',
    'Lembrete de amiga: semente sem água não cresce. Quando as folhas estiverem grandes, colha com as mãos. Cada nabo devolve uma semente.',
    'Uma cerca, um banco, uma horta… nossa clareira já está ficando com cara de casa. Sem pressa: ainda temos muitos dias pela frente.',
  ];
}
