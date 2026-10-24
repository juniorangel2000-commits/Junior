import {directionVector, type CharacterDirection} from '../character-directions';

export const SWIM_BODY_FRAMES = 12;
export const SWIM_BODY_MOTION = {movingHz: .72, idleHz: .28, cadenceSmoothing: 5} as const;

type Joint = {x: number; y: number};
type Limb = {upper: HTMLCanvasElement; lower: HTMLCanvasElement; root: Joint; joint: Joint; tip: Joint; upperWidth: number; lowerWidth: number; scale: number};
export interface SubmergedRig {
  torso: HTMLCanvasElement;
  arms: [Limb, Limb];
  legs: [Limb, Limb];
  headBottom: number;
  waist: number;
  feet: number;
}

/** A closed sculling cycle, with a narrow flutter kick rather than alternating steps. */
export function swimBodyPose(cycle: number, direction: CharacterDirection) {
  const phase = (cycle - Math.floor(cycle)) * Math.PI * 2;
  const heading = directionVector(direction), profile = Math.abs(heading.x);
  const spread = (1 - Math.cos(phase)) * .5;
  const flutter = Math.sin(phase * 2 + Math.PI / 12);
  return {
    arms: [0, 1].map(index => {
      const side = index === 0 ? 1 : -1;
      return {
        upper: side * (.29 * spread - .025) * (1 - profile * .7) - heading.x * Math.sin(phase) * .23,
        lower: side * (.09 * spread + Math.sin(phase) * .10) * (1 - profile * .6) + heading.x * Math.sin(phase + .6) * .12,
      };
    }),
    legs: [0, 1].map(index => {
      const inward = index === 0 ? -1 : 1;
      return {
        upper: inward * (.065 * (1 - profile) + flutter * (.035 * (1 - profile) + .10 * profile)),
        lower: inward * (.04 * (1 - profile) + flutter * (.06 * (1 - profile) - .055 * profile)),
        lift: (1 + (index === 0 ? 1 : -1) * flutter) * 4,
      };
    }),
  };
}

/** Cadence changes smoothly on stopping; phase never resets or snaps back to idle. */
export class SwimBodyClock {
  cycle = 0;
  private hz: number = SWIM_BODY_MOTION.idleHz;
  advance(delta: number, moving: boolean, speedRatio: number): number {
    const target = moving ? SWIM_BODY_MOTION.movingHz * Math.max(.6, Math.min(1.25, speedRatio / .55)) : SWIM_BODY_MOTION.idleHz;
    this.hz += (target - this.hz) * (1 - Math.exp(-SWIM_BODY_MOTION.cadenceSmoothing * delta));
    this.cycle = (this.cycle + Math.max(0, delta) * this.hz) % 1;
    return this.cycle;
  }
}

const makeCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; return canvas;
};

/** Keep each boot intact when a diagonal toe crosses the leg divider. */
function bootOwnership(rgba: Uint8ClampedArray, width: number, height: number, firstRow: number,
  fallback: (x: number) => number, reverse: boolean): Int8Array {
  const labels = new Int8Array(width * height).fill(-1), seen = new Uint8Array(labels.length);
  const components: Array<{pixels: number[]; center: number}> = [];
  const brown = (i: number) => rgba[i * 4 + 3] > 32 && rgba[i * 4] > 32
    && rgba[i * 4] > rgba[i * 4 + 1] * 1.15 && rgba[i * 4 + 1] > rgba[i * 4 + 2] * 1.05;
  for (let start = firstRow * width; start < labels.length; start++) if (!seen[start] && brown(start)) {
    const pixels = [start]; seen[start] = 1; let totalX = 0;
    for (let n = 0; n < pixels.length; n++) {
      const i = pixels[n]; totalX += i % width;
      for (const j of [i - width, i + width, ...(i % width ? [i - 1] : []), ...(i % width < width - 1 ? [i + 1] : [])]) {
        if (j >= firstRow * width && j < labels.length && !seen[j] && brown(j)) {seen[j] = 1; pixels.push(j);}
      }
    }
    if (pixels.length > 20) components.push({pixels, center: totalX / pixels.length});
  }
  const selected = components.sort((a, b) => b.pixels.length - a.pixels.length).slice(0, 2).sort((a, b) => a.center - b.center);
  const queue: number[] = [];
  selected.forEach((component, index) => {
    const leg = selected.length === 1 ? fallback(component.center) : reverse ? 1 - index : index;
    for (const i of component.pixels) {labels[i] = leg; queue.push(i);}
  });
  for (let n = 0; n < queue.length; n++) {
    const i = queue[n];
    for (const j of [i - width, i + width, ...(i % width ? [i - 1] : []), ...(i % width < width - 1 ? [i + 1] : [])]) {
      if (j >= firstRow * width && j < labels.length && labels[j] < 0 && rgba[j * 4 + 3] > 32) {labels[j] = labels[i]; queue.push(j);}
    }
  }
  return labels;
}

/** Extract original pixels once. Hidden side-view limbs are never duplicated. */
export function prepareSubmergedRig(source: HTMLCanvasElement, direction: CharacterDirection, headBottom: number): SubmergedRig {
  const {width, height} = source;
  const rgba = source.getContext('2d', {willReadFrequently: true})!.getImageData(0, 0, width, height).data;
  const opaque = (x: number, y: number) => rgba[(y * width + x) * 4 + 3] > 32;
  let bottom = headBottom;
  for (let y = headBottom; y < height; y++) for (let x = 0; x < width; x++) if (opaque(x, y)) bottom = y;
  const length = Math.max(1, bottom - headBottom);
  const shoulder = Math.round(headBottom + length * .055), hip = Math.round(headBottom + length * .48);
  let left = width, right = 0;
  for (let y = shoulder + 8; y <= hip; y++) for (let x = 0; x < width; x++) if (opaque(x, y)) {left = Math.min(left, x); right = Math.max(right, x);}
  // Pelvis center is not biased by the ponytail or the asymmetry of a sleeve.
  let pelvisLeft = width, pelvisRight = 0;
  for (let y = hip - 2; y <= hip + 2; y++) for (let x = 0; x < width; x++) if (opaque(x, y)) {pelvisLeft = Math.min(pelvisLeft, x); pelvisRight = Math.max(pelvisRight, x);}
  const center = (pelvisLeft + pelvisRight) / 2, span = Math.max(1, right - left + 1);
  const profile = direction === 'left' || direction === 'right';
  const nearArm = direction === 'left' ? 1 : 0;
  const half = span * .26;
  const armIndex = (x: number) => profile ? (direction === 'left' ? x > center : x < center) ? nearArm : -1 : x < center - half ? 0 : x > center + half ? 1 : -1;
  const armBottom = [shoulder + 10, shoulder + 10];
  const armStart = [height, height];
  let ankle = bottom - Math.round(length * .13);
  for (let y = shoulder; y < bottom; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    if (!opaque(x, y)) continue;
    const skin = rgba[i] > 120 && rgba[i] > rgba[i + 1] * 1.19 && rgba[i + 1] > rgba[i + 2] * 1.15;
    const sleeve = rgba[i] > 150 && rgba[i + 1] > 135 && rgba[i + 2] > 85 && rgba[i] - rgba[i + 1] < 85;
    const arm = armIndex(x);
    if (sleeve && y < hip && arm >= 0) armStart[arm] = Math.min(armStart[arm], y);
    if (skin && y < hip + length * .13 && arm >= 0) armBottom[arm] = Math.max(armBottom[arm], y + 2);
    if (skin && y > hip + (bottom - hip) * .35) ankle = Math.min(ankle, y);
  }
  ankle = Math.max(hip + 8, ankle);
  armStart.forEach((start, index) => {armStart[index] = Math.max(shoulder, Math.min(start, armBottom[index] - 4));});
  const elbow = armBottom.map((end, index) => Math.round(armStart[index] + (end - armStart[index]) * .52));
  const knee = Math.round(hip + (ankle - hip) * .52);
  let soleLeft = width, soleRight = 0;
  for (let y = bottom - 2; y <= bottom; y++) for (let x = 0; x < width; x++) if (opaque(x, y)) {soleLeft = Math.min(soleLeft, x); soleRight = Math.max(soleRight, x);}
  const legIndex = (x: number) => profile ? (direction === 'left' ? x <= soleRight : x >= soleLeft) ? 0 : 1 : x < center ? 0 : 1;
  const bootRow = Math.max(hip, ankle - 4);
  const boots = bootOwnership(rgba, width, height, bootRow, legIndex, profile && direction === 'right');
  let bootMask = 0;
  for (const owner of boots) if (owner >= 0) bootMask |= 1 << owner;
  // An occluded/overlapping pair of shoes remains one intact group; never invent a sliced rear boot.
  const singleBootLeg = bootMask === 1 ? 0 : bootMask === 2 ? 1 : undefined;
  const layers = Array.from({length: 9}, () => makeCanvas(width, height));
  const pixels = layers.map(c => c.getContext('2d')!.createImageData(width, height));
  const put = (layer: number, i: number) => pixels[layer].data.set(rgba.subarray(i, i + 4), i);
  for (let y = headBottom; y <= bottom; y++) for (let x = 0; x < width; x++) {
    if (!opaque(x, y)) continue;
    const i = (y * width + x) * 4, arm = armIndex(x);
    if (arm >= 0 && y >= armStart[arm] && y <= armBottom[arm]) {
      if (y <= elbow[arm] + 3) put(1 + arm * 2, i);
      if (y >= elbow[arm] - 3) put(2 + arm * 2, i);
      // Restore the silhouette of the torso under an occluding profile arm.
      if (profile && y <= hip + 2 && Math.abs(x - center) < span * .27) put(0, i);
      if (y <= armStart[arm] + 6) put(0, i);
    } else {
      if (y <= hip + 3) put(0, i);
      if (y >= hip - 3) {
        const leg = singleBootLeg ?? (y >= bootRow && boots[y * width + x] >= 0 ? boots[y * width + x] : legIndex(x));
        if (y <= knee + 3) put(5 + leg * 2, i);
        if (y >= knee - 3) put(6 + leg * 2, i);
      }
    }
  }
  layers.forEach((layer, i) => layer.getContext('2d')!.putImageData(pixels[i], 0, 0));
  const jointX = (layer: number, y: number, fallback: number) => {
    let total = 0, count = 0;
    for (let row = Math.max(0, y - 2); row <= Math.min(height - 1, y + 2); row++) for (let x = 0; x < width; x++) if (pixels[layer].data[(row * width + x) * 4 + 3]) {total += x; count++;}
    return count ? total / count : fallback;
  };
  const limb = (index: number, start: number, bend: number, fallback: number, arm = false): Limb => {
    const thickness = (layer: number, from: number, to: number, minimum: number) => {
      const widths: number[] = [];
      for (let y = from; y <= to; y++) {
        let first = width, last = -1;
        for (let x = 0; x < width; x++) if (pixels[layer].data[(y * width + x) * 4 + 3]) {first = Math.min(first, x); last = x;}
        if (last >= first) widths.push(last - first + 1);
      }
      if (!widths.length) return 0;
      widths.sort((a, b) => a - b);
      return Math.min(span * .25, Math.max(minimum, widths[Math.floor(widths.length / 2)] ?? minimum));
    };
    let end = bend;
    for (let y = bend; y <= bottom; y++) for (let x = 0; x < width; x++) if (pixels[index + 1].data[(y * width + x) * 4 + 3]) end = y;
    const upperWidth = arm ? thickness(index, start + 3, bend, span * .16) : 0;
    const lowerWidth = arm ? thickness(index + 1, bend, end, span * .13) : 0;
    const tipY = Math.max(bend, end - Math.max(2, lowerWidth / 2));
    return {
      upper: layers[index], lower: layers[index + 1],
      root: {x: jointX(index, start, fallback), y: start}, joint: {x: jointX(index, bend, fallback), y: bend},
      tip: {x: jointX(index + 1, Math.round(tipY), fallback), y: tipY},
      upperWidth, lowerWidth,
      scale: width / 192,
    };
  };
  return {
    torso: layers[0], headBottom, waist: hip, feet: ankle,
    arms: [limb(1, armStart[0], elbow[0], center - half, true), limb(3, armStart[1], elbow[1], center + half, true)],
    legs: [limb(5, hip, knee, center - half * .5), limb(7, hip, knee, center + half * .5)],
  };
}

/** Rigid pixel limbs pivot at overlapping joints; there is no stretch or row squashing. */
export function drawSubmergedBody(context: CanvasRenderingContext2D, rig: SubmergedRig, cycle: number, direction: CharacterDirection): void {
  const pose = swimBodyPose(cycle, direction);
  const limb = (part: Limb, angles: {upper: number; lower: number; lift?: number}) => {
    context.save(); context.translate(part.root.x, part.root.y - (angles.lift ?? 0) * part.scale); context.rotate(angles.upper);
    if (part.upperWidth) {
      context.strokeStyle = '#164f5a'; context.lineWidth = part.upperWidth; context.lineCap = 'round'; context.lineJoin = 'round';
      context.beginPath(); context.moveTo(0, 0); context.lineTo(part.joint.x - part.root.x, part.joint.y - part.root.y); context.stroke();
    }
    context.drawImage(part.upper, -part.root.x, -part.root.y);
    context.translate(part.joint.x - part.root.x, part.joint.y - part.root.y); context.rotate(angles.lower);
    if (part.lowerWidth) {
      context.strokeStyle = '#164f5a'; context.lineWidth = part.lowerWidth;
      context.beginPath(); context.moveTo(0, 0); context.lineTo(part.tip.x - part.joint.x, part.tip.y - part.joint.y); context.stroke();
    }
    context.drawImage(part.lower, -part.joint.x, -part.joint.y); context.restore();
  };
  context.save(); context.imageSmoothingEnabled = false;
  context.beginPath(); context.rect(0, rig.headBottom, rig.torso.width, rig.torso.height - rig.headBottom); context.clip();
  const rear = direction.includes('right') ? 0 : 1;
  limb(rig.arms[rear], pose.arms[rear]);
  limb(rig.legs[0], pose.legs[0]); limb(rig.legs[1], pose.legs[1]);
  context.drawImage(rig.torso, 0, 0); limb(rig.arms[1 - rear], pose.arms[1 - rear]);
  context.restore();
}
