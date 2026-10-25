/** World-space fragment shader: warm window cones lift the blue ambient shade.
 * Forward-facing cones stop at the facade; no halo bleeds onto the roof. */
export const WINDOW_LIGHT_FRAGMENT = `
precision highp float;
uniform vec2 resolution;
uniform float darkness;
uniform float golden;
uniform float lamp;
uniform vec2 windowA;
uniform vec2 windowB;
varying vec2 fragCoord;

float beam(vec2 p, vec2 source) {
  float down = p.y - source.y;
  float spread = mix(10.0, 64.0, clamp(down / 135.0, 0.0, 1.0));
  float side = 1.0 - smoothstep(spread * 0.32, spread, abs(p.x - source.x));
  float reach = smoothstep(-2.0, 8.0, down) * (1.0 - smoothstep(75.0, 155.0, down));
  return side * reach;
}
void main() {
  vec2 p = vec2(fragCoord.x, resolution.y - fragCoord.y);
  float pool = max(beam(p, windowA), beam(p, windowB)) * lamp;
  float coolAlpha = darkness * (1.0 - pool * 0.90);
  float warmAlpha = golden + pool * 0.20;
  float alpha = warmAlpha + coolAlpha * (1.0 - warmAlpha);
  vec3 premult = vec3(0.0941, 0.1490, 0.2588) * coolAlpha * (1.0 - warmAlpha)
    + vec3(0.953, 0.710, 0.424) * warmAlpha;
  // Phaser's normal blend uses ONE, ONE_MINUS_SRC_ALPHA (premultiplied RGB).
  gl_FragColor = vec4(premult, alpha);
}`;
