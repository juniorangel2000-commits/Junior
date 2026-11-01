import { expect, it } from 'vitest';
import { atlasTrimBounds } from '../src/atlas-trim';
it('finds cell-local opaque bounds and keeps a one-pixel sampling border',()=>{
 const pixels=new Uint8ClampedArray(16*16*4),cell={x:4,y:5,width:8,height:8};
 for(let y=2;y<=4;y++)for(let x=2;x<=3;x++)pixels[((cell.y+y)*16+cell.x+x)*4+3]=255;
 const before=pixels.slice();expect(atlasTrimBounds(pixels,16,cell)).toEqual({x:1,y:1,width:4,height:5});expect(pixels).toEqual(before);
});
it('does not include an adjacent atlas cell or expand beyond the cell edge',()=>{
 const pixels=new Uint8ClampedArray(8*4*4);
 pixels[(1*8+3)*4+3]=255;pixels[(3*8+4)*4+3]=255;
 expect(atlasTrimBounds(pixels,8,{x:0,y:0,width:4,height:4})).toEqual({x:2,y:0,width:2,height:3});
});
it('retains every nonzero alpha pixel, including faint edges, and leaves empty cells untrimmed',()=>{
 const pixels=new Uint8ClampedArray(5*5*4);
 expect(atlasTrimBounds(pixels,5,{x:0,y:0,width:5,height:5})).toBeUndefined();
 pixels[3]=1;pixels[(4*5+4)*4+3]=128;
 expect(atlasTrimBounds(pixels,5,{x:0,y:0,width:5,height:5})).toEqual({x:0,y:0,width:5,height:5});
});
