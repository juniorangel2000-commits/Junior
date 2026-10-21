import { describe, expect, it } from 'vitest';
import { audioSettings } from '../src/audio';

describe('Preferências de áudio', () => {
  it('recupera padrões de valores ausentes ou corrompidos', () => {
    for (const data of [null, undefined, 'bad', [], { music: NaN, effects: Infinity, muted: 'false' }]) {
      expect(audioSettings(data)).toEqual({ music: .45, effects: .65, muted: false });
    }
  });
  it('limita volumes e preserva zero e silêncio explícito', () => {
    expect(audioSettings({ music: -10, effects: 200, muted: true })).toEqual({ music: 0, effects: 1, muted: true });
    expect(audioSettings({ music: 0, effects: 0, muted: false })).toEqual({ music: 0, effects: 0, muted: false });
  });
  it('permite atualizar uma preferência sem perder as outras', () => {
    const saved = audioSettings(JSON.parse('{"music":0.23,"effects":0.76,"muted":true}'));
    expect(audioSettings({ ...saved, effects: .1 })).toEqual({ music: .23, effects: .1, muted: true });
  });
});
