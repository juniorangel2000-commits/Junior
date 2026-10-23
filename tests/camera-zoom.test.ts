import { describe, expect, it } from 'vitest';
import { baseCameraZoom, CAMERA_ZOOM_KEY, clampCameraZoom, homeFitsCamera, loadCameraZoom, saveCameraZoom, stepCameraZoom } from '../src/camera-zoom';

describe('zoom da câmera independente do progresso', () => {
  it('afastar até 50% dobra os dois eixos visíveis em telas grandes e pequenas', () => {
    for (const [width, height] of [[1280, 800], [960, 640], [1920, 1080]]) {
      const base = baseCameraZoom(width, height);
      expect(width / (base * .5)).toBe(width / base * 2);
      expect(height / (base * .5)).toBe(height / base * 2);
      expect(width / (base * 2)).toBe(width / base / 2);
    }
  });

  it('mantém o enquadramento anterior em 100% após redimensionar', () => {
    expect(baseCameraZoom(1280, 800)).toBe(2);
    expect(baseCameraZoom(960, 640)).toBe(1);
    expect(baseCameraZoom(1280, 640)).toBe(1);
    expect(baseCameraZoom(1280, 800, 320)).toBe(2);
    expect(baseCameraZoom(960, 640, 320)).toBe(1);
  });

  it('limita os passos e permite restaurar o padrão a partir dos dois extremos', () => {
    let factor = 1;
    for (let i = 0; i < 30; i++) factor = stepCameraZoom(factor, -1);
    expect(factor).toBe(.5);
    expect(stepCameraZoom(factor, 0)).toBe(1);
    for (let i = 0; i < 30; i++) factor = stepCameraZoom(factor, 1);
    expect(factor).toBe(2);
    expect(stepCameraZoom(factor, 0)).toBe(1);
    expect(stepCameraZoom(1, 1)).toBe(1.25);
    expect(stepCameraZoom(1, -1)).toBe(.75);
  });

  it('carrega e salva apenas a preferência de câmera, sem tocar no save do jogo', () => {
    const entries = new Map([['depois-da-chuva-v1', 'progresso existente']]);
    const storage = { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => { entries.set(key, value); } };
    expect(loadCameraZoom(storage)).toBe(1);
    saveCameraZoom(.5, storage);
    expect(loadCameraZoom(storage)).toBe(.5);
    expect(entries.get('depois-da-chuva-v1')).toBe('progresso existente');
    expect(entries.get(CAMERA_ZOOM_KEY)).toBe('0.5');
    saveCameraZoom(2, storage);
    expect(loadCameraZoom(storage)).toBe(2);
  });

  it('mantém controles funcionais se o armazenamento estiver indisponível', () => {
    const storage = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('quota'); } };
    expect(loadCameraZoom(storage)).toBe(1);
    expect(() => saveCameraZoom(.75, storage)).not.toThrow();
    for (const stored of ['', 'NaN', 'Infinity', 'texto']) expect(loadCameraZoom({ getItem: () => stored })).toBe(1);
    expect(clampCameraZoom(-10)).toBe(.5);
    expect(clampCameraZoom(20)).toBe(2);
    expect(clampCameraZoom(undefined)).toBe(1);
  });

  it('centraliza a casa inteira quando cabe e acompanha o jogador na aproximação', () => {
    expect(homeFitsCamera(1280, 800, 1, 384, 320)).toBe(true);
    expect(homeFitsCamera(1280, 800, 2, 384, 320)).toBe(true);
    expect(homeFitsCamera(1280, 800, 4, 384, 320)).toBe(false);
    expect(homeFitsCamera(960, 640, 2, 384, 320)).toBe(false);
    expect(homeFitsCamera(960, 640, .5, 384, 320)).toBe(true);
  });
});
