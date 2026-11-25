shader_type canvas_item;
render_mode unshaded;
uniform float shadow_strength = 0.42;
uniform float softness = 1.2;
void fragment() {
    vec2 step_uv = TEXTURE_PIXEL_SIZE * softness;
    float a = 0.0;
    vec2 p0 = UV + vec2(0.0);
    if (all(greaterThanEqual(p0, vec2(0.0))) && all(lessThanEqual(p0, vec2(1.0)))) {
        a += smoothstep(0.20,0.78,texture(TEXTURE,p0).a)*0.28;
    }
    vec2 p1 = UV + vec2(step_uv.x,0.0);
    if (all(greaterThanEqual(p1, vec2(0.0))) && all(lessThanEqual(p1, vec2(1.0)))) {
        a += smoothstep(0.20,0.78,texture(TEXTURE,p1).a)*0.12;
    }
    vec2 p2 = UV + -vec2(step_uv.x,0.0);
    if (all(greaterThanEqual(p2, vec2(0.0))) && all(lessThanEqual(p2, vec2(1.0)))) {
        a += smoothstep(0.20,0.78,texture(TEXTURE,p2).a)*0.12;
    }
    vec2 p3 = UV + vec2(0.0,step_uv.y);
    if (all(greaterThanEqual(p3, vec2(0.0))) && all(lessThanEqual(p3, vec2(1.0)))) {
        a += smoothstep(0.20,0.78,texture(TEXTURE,p3).a)*0.12;
    }
    vec2 p4 = UV + -vec2(0.0,step_uv.y);
    if (all(greaterThanEqual(p4, vec2(0.0))) && all(lessThanEqual(p4, vec2(1.0)))) {
        a += smoothstep(0.20,0.78,texture(TEXTURE,p4).a)*0.12;
    }
    vec2 p5 = UV + step_uv;
    if (all(greaterThanEqual(p5, vec2(0.0))) && all(lessThanEqual(p5, vec2(1.0)))) {
        a += smoothstep(0.20,0.78,texture(TEXTURE,p5).a)*0.06;
    }
    vec2 p6 = UV + -step_uv;
    if (all(greaterThanEqual(p6, vec2(0.0))) && all(lessThanEqual(p6, vec2(1.0)))) {
        a += smoothstep(0.20,0.78,texture(TEXTURE,p6).a)*0.06;
    }
    vec2 p7 = UV + vec2(step_uv.x,-step_uv.y);
    if (all(greaterThanEqual(p7, vec2(0.0))) && all(lessThanEqual(p7, vec2(1.0)))) {
        a += smoothstep(0.20,0.78,texture(TEXTURE,p7).a)*0.06;
    }
    vec2 p8 = UV + vec2(-step_uv.x,step_uv.y);
    if (all(greaterThanEqual(p8, vec2(0.0))) && all(lessThanEqual(p8, vec2(1.0)))) {
        a += smoothstep(0.20,0.78,texture(TEXTURE,p8).a)*0.06;
    }
    float falloff = mix(0.48,1.0,smoothstep(0.0,0.88,UV.y));
    COLOR = vec4(0.065,0.105,0.12,a*falloff*shadow_strength);
}
