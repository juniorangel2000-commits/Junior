// Terreno da Propriedade: cada bloco pintado no mapa diz o material; aqui os materiais são
// desenhados de verdade, com bordas irregulares (o ruído desloca a fronteira) e a água animada.
shader_type canvas_item;

uniform sampler2D mapa : filter_nearest;          // 1 pixel por bloco; vermelho = número do material
uniform sampler2D ruido : repeat_enable, filter_linear;
uniform vec2 tamanho_mapa = vec2(96.0, 72.0);
uniform float bloco = 32.0;
uniform float borda = 22.0;                        // quanto a fronteira entre materiais ondula, em pixels
uniform sampler2D m0 : repeat_enable, filter_nearest; // grama
uniform sampler2D m1 : repeat_enable, filter_nearest; // floresta
uniform sampler2D m2 : repeat_enable, filter_nearest; // campo
uniform sampler2D m3 : repeat_enable, filter_nearest; // estrada seca
uniform sampler2D m4 : repeat_enable, filter_nearest; // estrada úmida
uniform sampler2D m5 : repeat_enable, filter_nearest; // terra de plantio
uniform sampler2D m6 : repeat_enable, filter_nearest; // areia
uniform sampler2D m7 : repeat_enable, filter_nearest; // musgo
uniform sampler2D m8 : repeat_enable, filter_nearest; // água

// Repetição espelhada, como no jogo: esconde a emenda das texturas.
vec2 espelhado(vec2 p) { vec2 m = mod(p, 2.0); return 1.0 - abs(m - 1.0); }

int material_em(vec2 p) {
	vec2 c = clamp(floor(p / bloco), vec2(0.0), tamanho_mapa - 1.0);
	return int(round(texelFetch(mapa, ivec2(c), 0).r * 255.0));
}

vec4 cor(int id, vec2 p) {
	vec2 uv = espelhado(p / 96.0);
	if (id == 1) return texture(m1, uv);
	if (id == 2) return texture(m2, uv);
	if (id == 3) return texture(m3, uv);
	if (id == 4) return texture(m4, uv);
	if (id == 5) return texture(m5, uv);
	if (id == 6) return texture(m6, uv);
	if (id == 7) return texture(m7, uv);
	if (id == 8) {
		// Água: a textura corre devagar e balança um pouco.
		vec2 q = p / 96.0 + vec2(TIME * 0.025, sin(TIME * 0.7 + p.x * 0.02) * 0.01);
		return texture(m8, fract(q));
	}
	return texture(m0, uv);
}

void fragment() {
	vec2 p = UV * tamanho_mapa * bloco;
	vec2 n = texture(ruido, p / 300.0).rg - 0.5;
	int id = material_em(p + n * borda * 2.0);
	COLOR = cor(id, p);
}
