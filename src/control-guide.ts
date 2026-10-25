import {toolbarIcon} from './toolbar-icons';
import {DEVELOPMENT_TOOLS} from './development-tools';

/** Grouped by what the player wants to do, rather than by keyboard order. */
export function controlGuide():string {
 const key=(label:string)=>`<kbd>${label}</kbd>`;
 const row=(keys:string,action:string)=>`<div class="control-row"><span class="control-keys">${keys}</span><span>${action}</span></div>`;
 const group=(title:string,body:string)=>`<section class="control-group"><h3>${title}</h3>${body}</section>`;
 return `<div class="controls-intro">${toolbarIcon('controls')}<p>Seu caminho pelo vale.<br><span>Consulte as teclas por atividade. Role para ver mais.</span></p></div><div class="control-guide-grid">${
 group('Andar e explorar',`<div class="movement-keys" aria-label="W, A, S, D ou setas para mover"><div>${key('W')}</div><div>${key('A')}${key('S')}${key('D')}</div><span>ou ↑ ← ↓ →</span></div>${row(key('E'),'Interagir, conversar e coletar')}${row(key('M'),'Ver o mapa e sua posição')}${row(key('H'),'Personalizar dentro de casa')}<p class="control-tip">Para mudar de cenário, siga a seta e ultrapasse a placa. A troca acontece automaticamente.</p>`)+
 group('Itens e ferramentas',`${row(key('1–9'),'Selecionar um slot da barra')}${row(key('E')+' / '+key('Clique esquerdo'),'Usar a ferramenta selecionada')}${row(key('Shift')+' + '+key('E'),'Desfazer um canteiro vazio')}${row(key('Arrastar'),'Mover itens da mochila para a barra')}<p class="control-tip">Slot vazio deixa as mãos livres. Botão direito em um slot permite trocá-lo ou esvaziá-lo.</p>`)+
 group('Mochila e construção',`${row(key('I'),'Abrir a mochila')}${row(key('C'),'Fabricar itens')}${row(key('B'),'Escolher uma construção')}${row(key('0')+' / '+key('P'),'Selecionar parede / porta')}${row(key('R'),'Girar a cobertura selecionada')}`)+
 group('Animais e corda',`${row(key('E'),'Prender um animal com a corda')}${row(key('G'),'Soltar o animal')}<p class="control-tip">Fabrique uma corda com fibras vegetais, equipe-a, aproxime-se do animal e leve-o até a propriedade.</p>`)+
 group('Câmera e tela',`${row(key('Roda do mouse'),'Aproximar ou afastar a câmera')}${row(key('+')+' / '+key('−'),'Ajustar o zoom')}${row(key('Home'),'Voltar ao zoom de 100%')}${row(key('Ctrl')+' + '+key('Alt'),'Entrar ou sair da tela cheia')}`)+
 group('Menus',`${row(key('Botão direito'),'Abrir a barra de opções no cenário')}${row(key('Esc'),'Fechar o menu ou pausar')}${DEVELOPMENT_TOOLS?row(key('F2'),'Editor de desenvolvimento'):''}<p class="control-tip">Na barra superior: Música ajusta o som e Gráficos ajusta a iluminação e os shaders.</p>`)
 }</div>`;
}
