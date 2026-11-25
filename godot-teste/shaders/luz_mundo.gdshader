shader_type canvas_item;
render_mode unshaded;
uniform sampler2D world_screen : hint_screen_texture, filter_nearest;
uniform vec4 ambient : source_color = vec4(1.0);
uniform float saturation = 1.0;
uniform float contrast = 1.0;
void fragment() {
    vec3 rgb = texture(world_screen, SCREEN_UV).rgb;
    float luma = dot(rgb, vec3(0.299,0.587,0.114));
    rgb = mix(vec3(luma),rgb,saturation);
    rgb = (rgb - vec3(0.5))*contrast + vec3(0.5);
    COLOR = vec4(clamp(rgb * ambient.rgb,vec3(0.0),vec3(1.0)),1.0);
}
