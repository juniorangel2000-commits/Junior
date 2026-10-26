import {describe,expect,it,vi} from 'vitest';
import {MapEditor} from '../src/map-editor';
import {emptyMapEdits,type MapEditData} from '../src/systems/map-editor';
import type {WorldEditorObject} from '../src/world';
import {editorBaselineObjects} from '../src/map-editor-baseline';
import {FOREST_TREES} from '../src/data/ancient-forest';
import {defaultMap} from '../src/data/default-maps';

vi.mock('phaser',()=>({default:{}}));
vi.mock('../src/map-editor-ui',()=>({MapEditorUI:class {}}));

const object=(id:string,x:number,y:number,kind:WorldEditorObject['kind']):WorldEditorObject=>({id,x,y,kind,texture:''});
function layoutError(data:MapEditData,original:WorldEditorObject[]):string|null {
  // Exercise the same validation used by Import, Apply and switching maps,
  // without creating a Phaser canvas or editor UI.
  const editor=Object.create(MapEditor.prototype);
  Object.assign(editor,{history:{current:data},adapter:{originalObjects:original,protectedTile:()=>false,baseWater:()=>false,baseWaterPoint:()=>false}});
  return editor.layoutError(data);
}

describe('editor validation for the connected map border',()=>{
  it('only edits native forest tree identities that exist in the original generator',()=>{
    const nativeIds=new Set(FOREST_TREES.map(tree=>`standingTree-${tree.x}-${tree.y}`));
    for(const id of Object.keys(defaultMap('forest').objects)){
      if(id.startsWith('standingTree-'))expect(nativeIds.has(id),id).toBe(true);
    }
  });

  it.each(['property','forest'] as const)('accepts the new %s border without resurrecting implicit trees or passage props',area=>{
    const data=emptyMapEdits(area==='forest'?'forest':undefined);data.continuation=1;
    const x=area==='forest'?92:3;
    const original=[object(`standingTree-${x}-33`,x,33,'standingTree'),object(`stone-${x}-52`,x,52,'stone')];
    data.objects['editor-oakA-border']={x,y:33,kind:'oakA'};
    data.points={exit:{x,y:52}};
    expect(layoutError(data,original)).toBeNull();
    expect(editorBaselineObjects(original,data)).toEqual([]);
  });

  it('matches forest detail priority while still rejecting overlapping native rocks and explicit moves',()=>{
    const data=emptyMapEdits('forest');data.continuation=1;
    data.objects['editor-oakA-border']={x:92,y:33,kind:'oakA'};
    const fern=object('fern-92-33',92,33,'fern');
    expect(layoutError(data,[fern])).toBeNull();
    expect(layoutError(data,[object('lakeRockA-92-33',92,33,'lakeRockA')])).toContain('Dois objetos');
    data.objects[fern.id]={x:92,y:33};
    expect(layoutError(data,[fern])).toContain('Dois objetos');
  });

  it('keeps native ID validation and collision checks outside the seam intact',()=>{
    const data=emptyMapEdits('forest');data.continuation=1;
    data.objects['editor-oakA-inland']={x:80,y:33,kind:'oakA'};
    expect(layoutError(data,[object('fern-80-33',80,33,'fern')])).toContain('Dois objetos');
    delete data.objects['editor-oakA-inland'];
    data.objects['stone-90-33']={x:90,y:33,removed:true};
    expect(layoutError(data,[])).toContain('não pertence');
  });

  it('preserves original legacy draft collisions when no continuation is active',()=>{
    const data=emptyMapEdits('forest');
    data.objects['editor-oakA-border']={x:92,y:33,kind:'oakA'};
    expect(layoutError(data,[object('standingTree-92-33',92,33,'standingTree')])).toContain('Dois objetos');
  });

  it('honors native tree moves and removals on either side of the border band',()=>{
    const data=emptyMapEdits('forest');data.continuation=1;
    const original=[object('standingTree-92-33',92,33,'standingTree'),object('standingTree-80-33',80,33,'standingTree')];
    data.objects['standingTree-92-33']={x:80,y:33};
    expect(layoutError(data,original)).toContain('Dois objetos');
    data.objects['standingTree-80-33']={x:92,y:33};
    expect(layoutError(data,original)).toBeNull();
    data.objects['standingTree-80-33'].removed=true;
    data.objects['editor-oakA-replacement']={x:92,y:33,kind:'oakA'};
    expect(layoutError(data,original)).toBeNull();
  });

  it('does not resurrect border trees after all authored seam trees have been removed',()=>{
    const data=emptyMapEdits('forest');data.continuation=1;
    const original=[object('standingTree-92-33',92,33,'standingTree')];
    expect(editorBaselineObjects(original,data)).toEqual([]);
    expect(layoutError(data,original)).toBeNull();
  });
});
