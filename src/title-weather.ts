interface TitleWeather {
  setAnimated(enabled: boolean): void;
  destroy(): void;
}

const noise = (n: number): number => {
  const value = Math.sin(n * 127.1 + 31.7) * 43758.5453;
  return value - Math.floor(value);
};

/** Rain and fog belong to the opening screen, never to the world or its save. */
export function createTitleWeather(holder: HTMLElement): TitleWeather {
  const canvas = document.createElement('canvas');
  canvas.className = 'title-weather';
  canvas.setAttribute('aria-hidden', 'true');
  holder.prepend(canvas);
  const ctx = canvas.getContext('2d')!;
  let active = true, animated = false, frame = 0, previous = 0, elapsed = 0;
  const draw = (): void => {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(13,29,38,.30)';
    ctx.fillRect(0, 0, w, h);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, 'rgba(11,23,34,.36)');
    sky.addColorStop(.6, 'rgba(45,64,66,.02)');
    sky.addColorStop(1, 'rgba(34,52,56,.24)');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    // Broad banks of mist drift slowly; no flashes or lightning.
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
  observer.observe(holder); resize();
  return {
    setAnimated(enabled: boolean): void {
      if (!active || enabled === animated) return;
      animated = enabled; cancelAnimationFrame(frame); previous = 0;
      if (animated) frame = requestAnimationFrame(tick);
    },
    destroy(): void {
      active = false; animated = false; cancelAnimationFrame(frame);
      observer.disconnect(); canvas.remove();
    },
  };
}
