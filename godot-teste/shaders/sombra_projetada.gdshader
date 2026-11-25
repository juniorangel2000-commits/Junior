shader_type canvas_item;
render_mode unshaded;
uniform float shadow_strength = 0.42;
uniform float softness = 1.2;

float alpha_at(sampler2D tex, vec2 uv) {
    if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 0.0;
    return smoothstep(0.20,0.78,texture(tex,uv).a);
}
void fragment() {
    vec2 step_uv = TEXTURE_PIXEL_SIZE * softness;
    float a = alpha_at(TEXTURE,UV)*0.28;
    a += (alpha_at(TEXTURE,UV+vec2(step_uv.x,0.0))+alpha_at(TEXTURE,UV-vec2(step_uv.x,0.0))+alpha_at(TEXTURE,UV+vec2(0.0,step_uv.y))+alpha_at(TEXTURE,UV-vec2(0.0,step_uv.y)))*0.12;
    a += (alpha_at(TEXTURE,UV+step_uv)+alpha_at(TEXTURE,UV-step_uv)+alpha_at(TEXTURE,UV+vec2(step_uv.x,-step_uv.y))+alpha_at(TEXTURE,UV+vec2(-step_uv.x,step_uv.y)))*0.06;
    // Sombra de contato mais densa; pontas progressivamente mais leves.
    float falloff = mix(0.48,1.0,smoothstep(0.0,0.88,UV.y));
    COLOR = vec4(0.065,0.105,0.12,a*falloff*shadow_strength);
}
