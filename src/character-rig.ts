import { directionVector, type CharacterDirection } from './character-directions';

type Point = { x: number; y: number };
interface Limb { image: HTMLCanvasElement; top: number; bottom: number; }
export interface CharacterRig {
  neutral: HTMLCanvasElement;
  body: HTMLCanvasElement;
  legs: [Limb, Limb];
  arms: [Limb, Limb];
  hip: number;
  ankle: number;
  direction: CharacterDirection;
}
const canvas = (source: HTMLCanvasElement): HTMLCanvasElement => {
  const c = document.createElement('canvas'); c.width = source.width; c.height = source.height; return c;
};

/** Keep the original sleeves, denim and boots instead of redrawing thinner limbs. */
export function prepareCharacterRig(source: HTMLCanvasElement, direction: CharacterDirection): CharacterRig {
  const context = source.getContext('2d', { willReadFrequently: true })!;
  const original = context.getImageData(0, 0, source.width, source.height);
  let left = source.width, right = 0, top = source.height, bottom = 0;
  for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) if (original.data[(y * source.width + x) * 4 + 3]) {
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  const w = right - left + 1, h = bottom - top + 1, center = (left + right) / 2;
  const profile = direction === 'left' || direction === 'right';
  const rightFacing = direction.includes('right');
  const shoulder = Math.round(top + h * .46), hip = Math.round(top + h * .69), ankle = Math.round(top + h * .89);
  const body = canvas(source), legImages = [canvas(source), canvas(source)], armImages = [canvas(source), canvas(source)];
  const layers = [body, ...legImages, ...armImages];
  const pixels = layers.map(c => c.getContext('2d')!.createImageData(c.width, c.height));
  const armX = center + (rightFacing ? -.11 : .11) * w;
  const put = (layer: number, i: number): void => { pixels[layer].data.set(original.data.subarray(i, i + 4), i); };
  for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
    const i = (y * source.width + x) * 4;
    if (!original.data[i + 3]) continue;
    const px = (x - left) / w;
    const isArm = y >= shoulder && y < top + h * .75
      && (profile ? Math.abs(x - armX) < w * .20 : px < .25 || px > .75);
    if (isArm) put(x < center ? 3 : 4, i);
    else {
      // A small overlap at the hips avoids a seam when the torso settles down.
      if (y < hip + 2) put(0, i);
      if (y >= hip) {
        if (profile) { put(1, i); put(2, i); }
        else put(x < center ? 1 : 2, i);
      }
    }
  }
  layers.forEach((layer, index) => layer.getContext('2d')!.putImageData(pixels[index], 0, 0));
  if (profile) {
    // The neutral side view contains a second, higher boot behind the near one.
    // Select the near sole before duplicating the leg, otherwise a walk has four boots.
    let bootLeft = right, bootRight = left;
    for (let y = bottom - 1; y <= bottom; y++) for (let x = left; x <= right; x++) {
      if (original.data[(y * source.width + x) * 4 + 3]) {
        bootLeft = Math.min(bootLeft, x); bootRight = Math.max(bootRight, x);
      }
    }
    const bootCenter = (bootLeft + bootRight) / 2;
    for (const image of legImages) {
      const c = image.getContext('2d')!, p = c.getImageData(0, 0, image.width, image.height);
      for (let y = hip; y <= bottom; y++) for (let x = left; x <= right; x++) {
        const i = (y * source.width + x) * 4;
        const outside = y >= ankle ? x < bootLeft || x > bootRight : Math.abs(x - bootCenter) > 4;
        if (outside) p.data[i + 3] = 0;
      }
      c.putImageData(p, 0, 0);
    }
    const c = body.getContext('2d')!;
    c.globalCompositeOperation = 'destination-over';
    c.fillStyle = '#ded0af'; c.fillRect(Math.round(center - w * .23), shoulder, Math.round(w * .46), 6);
    c.fillStyle = '#3e607b'; c.fillRect(Math.round(center - w * .23), shoulder + 6, Math.round(w * .46), hip - shoulder - 4);
    c.globalCompositeOperation = 'source-over';
    // Both arms overlap in a profile pose. Preserve the complete visible sleeve.
    const visible = canvas(source), paint = visible.getContext('2d')!;
    paint.drawImage(armImages[0], 0, 0); paint.drawImage(armImages[1], 0, 0);
    armImages.forEach(image => { const c = image.getContext('2d')!; c.clearRect(0, 0, image.width, image.height); c.drawImage(visible, 0, 0); });
    // The far limbs have the same costume with a little depth shading, so the
    // alternating contacts remain readable even when both legs share a side view.
    const far = rightFacing ? 1 : 0;
    for (const image of [legImages[far], armImages[far]]) {
      const c = image.getContext('2d')!, p = c.getImageData(0, 0, image.width, image.height);
      for (let i = 0; i < p.data.length; i += 4) {
        for (let channel = 0; channel < 3; channel++) p.data[i + channel] = Math.round(p.data[i + channel] * .84);
      }
      c.putImageData(p, 0, 0);
    }
  }
  const limb = (image: HTMLCanvasElement, start: number): Limb => {
    const p = image.getContext('2d')!.getImageData(0, 0, image.width, image.height).data;
    let first = bottom, last = start;
    for (let y = start; y <= bottom; y++) for (let x = 0; x < image.width; x++) {
      if (p[(y * image.width + x) * 4 + 3]) { first = Math.min(first, y); last = Math.max(last, y); }
    }
    return { image, top: first, bottom: last };
  };
  return { neutral: source, body, hip, ankle,
    legs: legImages.map(image => limb(image, hip)) as [Limb, Limb],
    arms: armImages.map(image => limb(image, shoulder)) as [Limb, Limb], direction };
}

/** The planted foot travels back evenly; only the returning foot lifts. */
function foot(cycle: number): { stride: number; lift: number } {
  const p = ((cycle % 1) + 1) % 1;
  if (p < .5) return { stride: 7 - 28 * p, lift: 0 };
  const swing = (p - .5) * 2;
  return { stride: -7 + 14 * (swing * swing * (3 - 2 * swing)), lift: Math.sin(Math.PI * swing) * 3 };
}

/** Inverse row sampling produces solid pixel silhouettes without gaps at joints. */
function bendRows(ctx: CanvasRenderingContext2D, part: Limb, start: number, end: number,
  topOffset: Point, bottomOffset: Point, kneeOffset = 0): void {
  const first = Math.round(start + topOffset.y), last = Math.round(end + bottomOffset.y);
  for (let y = first; y <= last; y++) {
    const t = (y - first) / Math.max(1, last - first);
    const sourceY = Math.min(end, Math.round(start + (end - start) * t));
    const x = Math.round(topOffset.x + (bottomOffset.x - topOffset.x) * t + Math.sin(Math.PI * t) * kneeOffset);
    ctx.drawImage(part.image, 0, sourceY, part.image.width, 1, x, y, part.image.width, 1);
  }
}

export function drawRigPose(ctx: CanvasRenderingContext2D, rig: CharacterRig, cycle: number | null): void {
  if (cycle === null) { ctx.drawImage(rig.neutral, 0, 0); return; }
  const heading = directionVector(rig.direction), feet = [foot(cycle), foot(cycle + .5)];
  const drop = Math.round((1 - Math.cos(cycle * Math.PI * 4)) * .5);
  const rear = heading.x > 0 ? 1 : 0;
  const arm = (index: number): void => {
    const part = rig.arms[index], swing = -feet[index].stride;
    bendRows(ctx, part, part.top, part.bottom,
      { x: 0, y: drop }, { x: swing * heading.x * .45, y: drop + swing * heading.y * .20 });
  };
  const leg = (index: number): void => {
    const part = rig.legs[index], step = feet[index];
    const offset = { x: Math.round(step.stride * heading.x), y: Math.round(step.stride * heading.y * .23 - step.lift) };
    bendRows(ctx, part, rig.hip, rig.ankle - 1, { x: 0, y: drop }, offset, step.lift * heading.x * .4);
    // Boots stay rigid: no squashing, re-drawing or changing their original width.
    ctx.drawImage(part.image, 0, rig.ankle, part.image.width, part.bottom - rig.ankle + 1,
      offset.x, rig.ankle + offset.y, part.image.width, part.bottom - rig.ankle + 1);
  };
  arm(rear);
  leg(rear); leg(1 - rear);
  ctx.drawImage(rig.body, 0, drop);
  arm(1 - rear);
}

/** Four restrained arm strokes; the original head and torso stay rigid. */
export function drawRigSwimPose(ctx:CanvasRenderingContext2D,rig:CharacterRig,cycle:number,waterline:number):void {
  ctx.save();ctx.beginPath();ctx.rect(0,0,rig.body.width,waterline);ctx.clip();
  const heading=directionVector(rig.direction),rear=heading.x>0?1:0;
  const arm=(index:number):void=>{
    const part=rig.arms[index],phase=cycle*Math.PI*2+index*Math.PI;
    const spread=Math.sin(phase)*10,reach=Math.cos(phase)*10;
    bendRows(ctx,part,part.top,part.bottom,{x:0,y:0},{x:(index?1:-1)*(7+spread)+heading.x*reach,y:-10+heading.y*reach*.45});
  };
  arm(rear);ctx.drawImage(rig.body,0,0);arm(1-rear);ctx.restore();
}
