shader_type canvas_item;
render_mode unshaded;
uniform sampler2D world_screen : hint_screen_texture, filter_nearest;
uniform vec4 ambient : source_color = vec4(1.0);
uniform float saturation = 1.0;
uniform float contrast = 1.0;
uniform float vignette = 0.0;
void fragment() {
    vec3 rgb = texture(world_screen, SCREEN_UV).rgb;
    float luma = dot(rgb, vec3(0.299,0.587,0.114));
    rgb = mix(vec3(luma),rgb,saturation);
    rgb = max((rgb - vec3(0.5))*contrast + vec3(0.5),vec3(0.0));
    rgb *= ambient.rgb;
    // Contraste cromático natural sem esmagar os detalhes da arte escura.
    float night = 1.0-smoothstep(0.25,0.80,ambient.r);
    rgb += vec3(0.009,0.016,0.035)*night*(1.0-luma);
    float edge = smoothstep(0.22,0.72,length((SCREEN_UV-vec2(0.5))*vec2(1.0,0.85)));
    rgb *= 1.0-edge*vignette;
    COLOR = vec4(clamp(rgb,vec3(0.0),vec3(1.0)),1.0);
}
