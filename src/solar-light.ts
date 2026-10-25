import { dayMinutes, SUNRISE_MINUTES, SUNSET_MINUTES } from './daylight-model';

export function solarLight(time: number) {
  const minute = dayMinutes(time);
  const progress = (minute - SUNRISE_MINUTES) / (SUNSET_MINUTES - SUNRISE_MINUTES);
  const elevation = Math.sin(Math.max(0, Math.min(1, progress)) * Math.PI);
  const fade = Math.max(0, Math.min(1, (minute - SUNRISE_MINUTES) / 45, (SUNSET_MINUTES - minute) / 45));
  const x=-Math.cos(progress*Math.PI), y=.42;
  const length=.22+.52*(1-elevation);
  return { x,y,length,projectionX:x*length,projectionY:y*length,
    opacity: (.24 + .08 * elevation) * fade };
}

export function windowLight(time: number): number {
  const minute = dayMinutes(time);
  const smooth = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
  return minute < 720 ? 1 - smooth((minute - 330) / 90) : smooth((minute - 1080) / 90);
}
