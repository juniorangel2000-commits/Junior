import { describe, expect, it, vi } from 'vitest';
import {
  cloneMapEdits, createEditorObjectId, editorObjectKind, emptyMapEdits, isProtectedMapTile,
  loadMapDraft, MAP_DRAFT_KEY, MapEditHistory, parseMapEdits, saveMapDraft, validateMapEdits,
} from '../src/systems/map-editor';
import type { EditorObjectKind, MapEditData } from '../src/systems/map-editor';

function editedMap(): MapEditData {
  const data = emptyMapEdits();
  data.terrain = { '12,12': 'path', '13,12': 'water', '14,12': 'sand', '15,12': 'soil', '16,12': 'grass' };
  data.objects = {
    'standingTree-7-7': { x: 17, y: 12 },
    'stone-8-8': { x: 18, y: 12, removed: true },
    'editor-pine-garden-1': { x: 19, y: 12, kind: 'pine' },
  };
  return data;
}

describe('map editor document', () => {
  it('round-trips sparse terrain and stable resource identities', () => {
    const data = editedMap();
    expect(validateMapEdits(emptyMapEdits())).toBe(true);
    expect(parseMapEdits(JSON.stringify(data))).toEqual(data);
    expect(editorObjectKind('standingTree-7-7')).toBe('standingTree');
    expect(editorObjectKind('editor-pine-garden-1')).toBe('pine');
  });

  it.each([
    { version: 2 }, { width: 95 }, { height: 73 }, { terrain: [] }, { objects: [] },
    { terrain: null }, { objects: null }, { save: {} },
  ])('rejects incompatible document fields: %j', change => {
    expect(validateMapEdits({ ...emptyMapEdits(), ...change })).toBe(false);
  });

  it.each(['0,12', '95,12', '12,0', '12,71', '12.5,12', '-1,12', '012,12', '12,012', '12,12,1', 'NaN,12'])
  ('rejects invalid or noncanonical terrain cell %s', key => {
    expect(validateMapEdits({ ...emptyMapEdits(), terrain: { [key]: 'grass' } })).toBe(false);
  });

  it.each([NaN, Infinity, -Infinity, -1, 0, 95, 1.5])('rejects invalid object x coordinate %s', x => {
    expect(validateMapEdits({ ...emptyMapEdits(), objects: { 'tree-7-7': { x, y: 12 } } })).toBe(false);
  });

  it('requires known terrain, object kinds and consistent stable IDs', () => {
    expect(validateMapEdits({ ...emptyMapEdits(), terrain: { '12,12': 'lava' } })).toBe(false);
    const invalid = [
      ['editor-pine-garden-1', { x: 12, y: 12 }],
      ['editor-pine-garden-1', { x: 12, y: 12, kind: 'stone' }],
      ['tree-7-7', { x: 12, y: 12, kind: 'tree' }],
      ['tree-7-7', { x: 12, y: 12, removed: 'true' }],
      ['tree-7-7', { x: 12, y: 12, id: 'tree-7-7' }],
      ['unknown-7-7', { x: 12, y: 12 }],
      ['tree-0-7', { x: 12, y: 12 }],
      ['tree-7-72', { x: 12, y: 12 }],
      ['editor-pine-../../save', { x: 12, y: 12, kind: 'pine' }],
      ['editor-pine-', { x: 12, y: 12, kind: 'pine' }],
    ] as const;
    for (const [id, object] of invalid) {
      expect(validateMapEdits({ ...emptyMapEdits(), objects: { [id]: object } }), id).toBe(false);
    }
  });

  it('forbids overlapping live object edits and objects on painted water', () => {
    const data = emptyMapEdits();
    data.objects = { 'tree-7-7': { x: 12, y: 12 }, 'stone-8-8': { x: 12, y: 12 } };
    expect(validateMapEdits(data)).toBe(false);
    data.objects['stone-8-8'].removed = true;
    expect(validateMapEdits(data)).toBe(true);
    data.terrain['12,12'] = 'water';
    expect(validateMapEdits(data)).toBe(false);
    data.objects['tree-7-7'].removed = true;
    expect(validateMapEdits(data)).toBe(true);
  });

  it('rejects prototype keys and custom objects without executing accessors', () => {
    const getter = vi.fn(() => 1);
    const accessor = Object.defineProperty(emptyMapEdits(), 'version', { enumerable: true, get: getter });
    expect(validateMapEdits(accessor)).toBe(false);
    expect(getter).not.toHaveBeenCalled();
    expect(validateMapEdits(Object.assign(Object.create({ inherited: true }), emptyMapEdits()))).toBe(false);
    expect(validateMapEdits({ ...emptyMapEdits(), [Symbol('secret')]: 1 })).toBe(false);
    expect(validateMapEdits(Object.defineProperty(emptyMapEdits(), 'secret', { value: 1 }))).toBe(false);
    for (const key of ['__proto__', 'constructor', 'prototype']) {
      expect(parseMapEdits(`{"version":1,"width":96,"height":72,"terrain":{},"objects":{"${key}":{"x":12,"y":12}}}`)).toBeNull();
    }
    expect(validateMapEdits({ ...emptyMapEdits(), terrain: Object.create(null) })).toBe(true);
  });

  it('rejects malformed, oversized or incomplete imported JSON', () => {
    for (const text of ['', '{', 'null', '[]', '{}', ' '.repeat(2_000_001)]) {
      expect(parseMapEdits(text)).toBeNull();
    }
    expect(() => cloneMapEdits({ ...emptyMapEdits(), width: 1 } as unknown as MapEditData)).toThrow(TypeError);
  });

  it('generates valid distinct object identities for repeated additions', () => {
    const ids = Array.from({ length: 100 }, () => createEditorObjectId('pine'));
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(editorObjectKind(id)).toBe('pine');
    expect(() => createEditorObjectId('house' as EditorObjectKind)).toThrow(TypeError);
  });
});

describe('protected gameplay landmarks', () => {
  it.each([[8, 15], [83, 28], [31, 59]])('libera terreno da estrutura removida em %i,%i', (x, y) => {
    expect(isProtectedMapTile(x, y)).toBe(false);
    expect(validateMapEdits({ ...emptyMapEdits(), terrain: { [`${x},${y}`]: 'grass' } })).toBe(true);
  });
  it.each([
    ['house', 20, 9], ['porch', 28, 17], ['arrival', 25, 18], ['farm', 21, 20],
    ['Lia', 29, 17],
    ['north bridge', 42, 18], ['south bridge', 49, 53],
    ['world boundary', 0, 20],
  ] as const)('protects %s from terrain and object edits', (_name, x, y) => {
    expect(isProtectedMapTile(x, y)).toBe(true);
    expect(validateMapEdits({ ...emptyMapEdits(), terrain: { [`${x},${y}`]: 'grass' } })).toBe(false);
    expect(validateMapEdits({ ...emptyMapEdits(), objects: { 'tree-7-7': { x, y } } })).toBe(false);
  });

  it('allows editing surrounding land and the distant playable map', () => {
    for (const [x, y] of [[19, 9], [30, 17], [20, 20], [77, 25], [33, 59], [94, 70]]) {
      expect(isProtectedMapTile(x, y)).toBe(false);
      expect(validateMapEdits({ ...emptyMapEdits(), terrain: { [`${x},${y}`]: 'grass' } })).toBe(true);
    }
  });
});

describe('map edit history', () => {
  it('protects snapshots from mutations to constructor, commit and returned documents', () => {
    const initial = editedMap(), history = new MapEditHistory(initial);
    initial.objects['standingTree-7-7'].x = 30;
    expect(history.current.objects['standingTree-7-7'].x).toBe(17);
    const next = history.current;
    next.objects['standingTree-7-7'].x = 31;
    expect(history.commit(next)).toBe(true);
    next.objects['standingTree-7-7'].x = 32;
    history.current.objects['standingTree-7-7'].x = 33;
    expect(history.current.objects['standingTree-7-7'].x).toBe(31);
    const previous = history.undo()!;
    previous.objects['standingTree-7-7'].x = 34;
    expect(history.current.objects['standingTree-7-7'].x).toBe(17);
    expect(history.redo()?.objects['standingTree-7-7'].x).toBe(31);
  });

  it('undoes a whole brush stroke, clears future history on a new edit and ignores equivalent imports', () => {
    const history = new MapEditHistory();
    expect(history.undo()).toBeNull();
    expect(history.redo()).toBeNull();
    const stroke = history.current;
    stroke.terrain = { '12,12': 'grass', '13,12': 'path', '14,12': 'sand' };
    expect(history.commit(stroke)).toBe(true);
    expect(history.commit({ ...stroke, terrain: { '14,12': 'sand', '13,12': 'path', '12,12': 'grass' } })).toBe(false);
    expect(history.undo()?.terrain).toEqual({});
    expect(history.canRedo).toBe(true);
    const newBranch = history.current;
    newBranch.terrain['15,12'] = 'soil';
    history.commit(newBranch);
    expect(history.canRedo).toBe(false);
    expect(history.redo()).toBeNull();
    expect(history.current.terrain).toEqual({ '15,12': 'soil' });
  });

  it('retains at most 80 undoable edits and preserves the earliest retained snapshot', () => {
    const history = new MapEditHistory();
    for (let step = 0; step < 85; step++) {
      const next = history.current;
      next.objects['tree-7-7'] = { x: 2 + step, y: 5 };
      expect(history.commit(next)).toBe(true);
    }
    let count = 0;
    while (history.undo()) count++;
    expect(count).toBe(80);
    expect(history.current.objects['tree-7-7']).toEqual({ x: 6, y: 5 });
  });

  it('keeps history intact after invalid data and starts a clean history on reset', () => {
    const history = new MapEditHistory();
    history.commit(editedMap());
    const invalid = { ...emptyMapEdits(), width: 1 } as unknown as MapEditData;
    expect(history.commit(invalid)).toBe(false);
    expect(() => history.reset(invalid)).toThrow(TypeError);
    expect(history.current).toEqual(editedMap());
    expect(history.canUndo).toBe(true);
    history.reset();
    expect(history.current).toEqual(emptyMapEdits());
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
  });
});

describe('isolated map drafts', () => {
  it('saves and loads only the editor draft without changing the game save or migration backup', () => {
    const entries = new Map([['depois-da-chuva-v1', 'current game'], ['depois-da-chuva-v1-backup', 'older game']]);
    const storage = {
      getItem: vi.fn((key: string) => entries.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => { entries.set(key, value); }),
    };
    expect(loadMapDraft(storage)).toBeNull();
    expect(saveMapDraft(editedMap(), storage)).toBe(true);
    expect(loadMapDraft(storage)).toEqual(editedMap());
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenCalledWith(MAP_DRAFT_KEY, expect.any(String));
    expect(storage.getItem.mock.calls.every(([key]) => key === MAP_DRAFT_KEY)).toBe(true);
    expect(entries.get('depois-da-chuva-v1')).toBe('current game');
    expect(entries.get('depois-da-chuva-v1-backup')).toBe('older game');
  });

  it('handles corrupt drafts, storage failures and invalid edits without throwing or writing invalid data', () => {
    const setItem = vi.fn();
    expect(saveMapDraft({ ...emptyMapEdits(), height: 1 } as unknown as MapEditData, { setItem })).toBe(false);
    expect(setItem).not.toHaveBeenCalled();
    expect(loadMapDraft({ getItem: () => '{broken' })).toBeNull();
    expect(loadMapDraft({ getItem: () => { throw new Error('blocked'); } })).toBeNull();
    expect(saveMapDraft(editedMap(), { setItem: () => { throw new Error('quota'); } })).toBe(false);
  });
});
