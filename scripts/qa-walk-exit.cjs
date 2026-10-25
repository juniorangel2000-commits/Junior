/** Browser QA utility: use the marked approach and real movement keys, never E. */
exports.walkMapExit=async(page,sceneName='Vale')=>{
 const key=await page.evaluate(async sceneName=>{
  const {exitSignLayout}=await import('/src/data/exit-signs.ts');
  const scene=window.game.scene.getScene(sceneName),map=sceneName==='Vale'?scene.state.mapEdits:scene.state.forestMapEdits;
  const p=map.points.exit,entry=map.points.entry,direction=exitSignLayout(p,entry).direction;
  const negative=direction==='left'||direction==='up',horizontal=direction==='left'||direction==='right';
  const boundary=(horizontal?p.x:p.y)*32+(negative?32:0),approach=boundary+(negative?16:-16);
  Object.values(scene.player.keys).forEach(k=>k.isDown=false);
  scene.player.x=horizontal?approach:(p.x+.5)*32;scene.player.y=horizontal?(p.y+.5)*32:approach;
  scene.exitPassage.reset();window.game.loop.wake();
  return {left:'a',right:'d',up:'w',down:'s'}[direction];
 },sceneName);
 await page.keyboard.down(key);
 try{await page.waitForSelector(`#ui[data-area="${sceneName==='Vale'?'forest':'property'}"]`);}
 finally{await page.keyboard.up(key);}
};
