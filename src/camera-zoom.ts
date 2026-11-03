/** Camera preference is independent from the game save and the title camera. */
export const CAMERA_ZOOM_KEY = 'after-rain-camera-zoom';
export const CAMERA_ZOOM_MIN = .5;
export const CAMERA_ZOOM_MAX = 2;
export const CAMERA_ZOOM_STEP = .25;

export function clampCameraZoom(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 1;
  return Math.max(CAMERA_ZOOM_MIN, Math.min(CAMERA_ZOOM_MAX,
    Math.round(value / CAMERA_ZOOM_STEP) * CAMERA_ZOOM_STEP));
}

export function stepCameraZoom(value: number, direction: -1 | 0 | 1): number {
  return direction === 0 ? 1 : clampCameraZoom(clampCameraZoom(value) + direction * CAMERA_ZOOM_STEP);
}

export function loadCameraZoom(storage?: Pick<Storage, 'getItem'>): number {
  try {
    const stored = (storage ?? localStorage).getItem(CAMERA_ZOOM_KEY);
    return stored === null || stored.trim() === '' ? 1 : clampCameraZoom(Number(stored));
  } catch { return 1; }
}

export function saveCameraZoom(value: number, storage?: Pick<Storage, 'setItem'>): void {
  try { (storage ?? localStorage).setItem(CAMERA_ZOOM_KEY, String(clampCameraZoom(value))); }
  catch { /* The current session still has working zoom without browser storage. */ }
}

/** Preserve the previous 100% framing; 50% doubles visible width and height. */
export function baseCameraZoom(width: number, height: number, homeHeight?: number): number {
  if (homeHeight !== undefined) return Math.max(1, Math.min(2,
    Math.floor(Math.min(width / 500, (height - 140) / homeHeight))));
  return width < 1000 || height < 700 ? 1 : 2;
}

export function homeFitsCamera(width: number, height: number, zoom: number, homeWidth: number, homeHeight: number): boolean {
  return homeWidth * zoom <= width - 40 && homeHeight * zoom <= height - 140;
}

/** A small map must cover the viewport even when a saved preference is 50%.
 * Fit is runtime-only: resizing/entering a room does not rewrite preference. */
export function mapCameraZoom(preferred:number,viewWidth:number,viewHeight:number,mapWidth:number,mapHeight:number,base=2):number{
 if(![viewWidth,viewHeight,mapWidth,mapHeight,base].every(n=>Number.isFinite(n)&&n>0))return clampCameraZoom(preferred);
 const minimum=Math.ceil(Math.max(viewWidth/mapWidth,viewHeight/mapHeight)/base/CAMERA_ZOOM_STEP-1e-9)*CAMERA_ZOOM_STEP;
 return Math.max(clampCameraZoom(preferred),minimum);
}
