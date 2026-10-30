import { gameAudio } from './audio';

interface TitleWeather {
  setAnimated(enabled: boolean): void;
  destroy(): void;
}

const noise = (n: number): number => {
  const value = Math.sin(n * 127.1 + 31.7) * 43758.5453;
  return value - Math.floor(value);
};

/** One soft flash per storm cycle; reduced motion keeps the rain without flashes. */
export function titleLightningAt(elapsed: number, reducedMotion: boolean): { strike: number; strength: number } {
  if (reducedMotion || elapsed < 3.5) return { strike: 0, strength: 0 };
  const strike = Math.floor((elapsed - 3.5) / 14);
  const age = (elapsed - 3.5) % 14;
  const strength = age < .18 ? age / .18 : age < 1.5 ? ((1.5 - age) / 1.32) ** 2 : 0;
  return { strike, strength };
}

/** Rain, distant lightning and fog belong to the opening screen, never to a save. */
export function createTitleWeather(holder: HTMLElement): TitleWeather {
  const canvas = document.createElement('canvas');
  canvas.className = 'title-weather';
  canvas.setAttribute('aria-hidden', 'true');
  holder.prepend(canvas);
  const ctx = canvas.getContext('2d')!;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = true, animated = false, frame = 0, previous = 0, elapsed = 0, lastThunder = -1;
  const draw = (): void => {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const illustrated = holder.classList.contains('has-title-art');
    ctx.fillStyle = illustrated ? 'rgba(13,29,38,.12)' : 'rgba(13,29,38,.30)';
    ctx.fillRect(0, 0, w, h);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, 'rgba(11,23,34,.36)');
    sky.addColorStop(.6, 'rgba(45,64,66,.02)');
    sky.addColorStop(1, 'rgba(34,52,56,.24)');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    const { strike, strength } = titleLightningAt(elapsed, reducedMotion.matches);
    if (strength > 0) {
      if (animated && strike !== lastThunder && elapsed - 3.5 - strike * 14 >= .3) {
        lastThunder = strike;
        gameAudio.play('thunder');
      }
      // Keep the bolt over the distant valley, behind the menu copy and buttons.
      const x = w * (illustrated ? .12 + noise(strike + 280) * .18 : .66 + noise(strike + 280) * .21);
      const glow = ctx.createRadialGradient(x, h * .12, 0, x, h * .12, w * .62);
      glow.addColorStop(0, `rgba(180,211,224,${strength * .17})`);
      glow.addColorStop(1, 'rgba(151,185,207,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      const points = Array.from({ length: 9 }, (_, i) => ({
        x: Math.round(x + (noise(strike * 19 + i + 360) - .5) * w * .07 + i * w * .003),
        y: Math.round(h * (-.02 + i * .049)),
      }));
      for (const layer of [0, 1]) {
        ctx.lineWidth = layer ? 1 : 4;
        ctx.strokeStyle = layer ? `rgba(219,235,232,${strength * .84})` : `rgba(138,183,212,${strength * .17})`;
        ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
        for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
        for (const branch of [3, 5]) {
          const point = points[branch], direction = branch === 3 ? -1 : 1;
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(Math.round(point.x + direction * w * .025), Math.round(point.y + h * .025));
          ctx.lineTo(Math.round(point.x + direction * w * .018), Math.round(point.y + h * .05));
          ctx.lineTo(Math.round(point.x + direction * w * .045), Math.round(point.y + h * .095));
        }
        ctx.stroke();
      }
    }
    // Broad banks of mist drift slowly beneath the distant storm.
    for (let i = 0; i < 3; i++) {
      const x = w * (.30 + i * .30) + Math.sin(elapsed * .09 + i * 2) * w * .06;
      const y = h * (.67 + i * .06), radius = w * .48;
      const fog = ctx.createRadialGradient(x, y, 0, x, y, radius);
      fog.addColorStop(0, 'rgba(158,181,175,.11)');
      fog.addColorStop(.55, 'rgba(122,150,149,.05)');
      fog.addColorStop(1, 'rgba(112,144,142,0)');
      ctx.fillStyle = fog; ctx.fillRect(0, 0, w, h);
    }
    ctx.lineWidth = 1;
    const drops = Math.min(190, Math.max(55, Math.round(w * h / 1900)));
    for (let i = 0; i < drops; i++) {
      const speed = 85 + noise(i + 5) * 95;
      const y = (noise(i + 93) * (h + 40) + elapsed * speed) % (h + 40) - 20;
      const x = (noise(i + 717) * (w + 40) - y * .19 + w + 40) % (w + 40) - 20;
      const length = 4 + noise(i + 43) * 7;
      ctx.strokeStyle = i % 3 ? 'rgba(167,192,197,.26)' : 'rgba(206,221,218,.35)';
      ctx.beginPath(); ctx.moveTo(Math.round(x), Math.round(y));
      ctx.lineTo(Math.round(x - length * .19), Math.round(y + length)); ctx.stroke();
    }
    // Fine rain rings on the wet approach, below the cottage.
    if (illustrated) for (let i = 0; i < 7; i++) {
      const age = (elapsed * .65 + noise(i + 1800)) % 1;
      const x = w * (.36 + noise(i + 1900) * .20), y = h * (.85 + noise(i + 2000) * .12);
      ctx.strokeStyle = `rgba(194,206,197,${(1 - age) * .18})`;
      ctx.beginPath(); ctx.ellipse(x, y, 1 + age * 5, .5 + age * 1.4, 0, 0, Math.PI * 2); ctx.stroke();
    }
  };
  const resize = (): void => {
    canvas.width = Math.max(1, Math.ceil(holder.clientWidth / 2));
    canvas.height = Math.max(1, Math.ceil(holder.clientHeight / 2));
    draw();
  };
  const tick = (now: number): void => {
    if (!active || !animated) return;
    if (!previous) previous = now;
    if (now - previous >= 1000 / 30) {
      elapsed += Math.min((now - previous) / 1000, .1);
      previous = now; draw();
    }
    frame = requestAnimationFrame(tick);
  };
  const observer = new ResizeObserver(resize);
  const onMotionPreference = (): void => { if (active) draw(); };
  reducedMotion.addEventListener('change', onMotionPreference);
  observer.observe(holder); resize();
  return {
    setAnimated(enabled: boolean): void {
      if (!active || enabled === animated) return;
      animated = enabled; cancelAnimationFrame(frame); previous = 0;
      if (animated) frame = requestAnimationFrame(tick);
    },
    destroy(): void {
      active = false; animated = false; cancelAnimationFrame(frame);
      reducedMotion.removeEventListener('change', onMotionPreference);
      observer.disconnect(); canvas.remove();
    },
  };
}
