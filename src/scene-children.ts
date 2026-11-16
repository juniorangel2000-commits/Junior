import type Phaser from 'phaser';
/** Destrói todos os objetos de um cenário.
 * `children.removeAll(true)` NÃO destrói nada no Phaser 3.90: o argumento significa "não
 * avisar a remoção". Os objetos saíam da tela, mas continuavam na memória com as suas
 * animações e atualizações. Aqui cada objeto é destruído de verdade. */
export function destroySceneChildren(scene:Phaser.Scene):void{
 for(const o of [...scene.children.list])if(o.scene)o.destroy();
 scene.children.removeAll();
}
