// Terreno da Propriedade: cada bloco pintado no mapa diz o material; aqui os materiais são
// desenhados de verdade, com transições naturais e a água animada.
//
// Transição: cada pixel mede (bilinear) a presença de cada material nos 4 blocos vizinhos e
// soma ruído em duas escalas, o que dá uma fronteira orgânica, sem degrau de bloco. Em vez
// de um corte seco, os dois materiais esmaecem um no outro numa faixa larga. A vegetação
// avança um pouco sobre terra e estrada; na água, a beira fica rasa e mais clara.
// Repetição: ladrilhamento hexagonal com deslocamentos sorteados (sem emendas nem distorção)
// e variação de tom em manchas grandes; o desenho de cada textura fica como na V51.
shader_type canvas_item;

uniform sampler2D mapa : filter_nearest;          // 1 pixel por bloco; vermelho = número do material
uniform sampler2D ruido : repeat_enable, filter_linear;
uniform vec2 tamanho_mapa = vec2(96.0, 72.0);
uniform float bloco = 32.0;
uniform float borda = 22.0;                        // mantido por compatibilidade com a cena
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

int material_bloco(vec2 c) {
	c = clamp(c, vec2(0.0), tamanho_mapa - 1.0);
	return int(round(texelFetch(mapa, ivec2(c), 0).r * 255.0));
}

bool vegetal(int id) { return id == 0 || id == 1 || id == 2 || id == 7; }
bool chao_nu(int id) { return id == 3 || id == 4 || id == 5 || id == 6; }

float n(vec2 p, float escala, vec2 desloca) { return texture(ruido, p / escala + desloca).r; }

vec4 amostra(int id, vec2 uv) {
	if (id == 1) return texture(m1, uv);
	if (id == 2) return texture(m2, uv);
	if (id == 3) return texture(m3, uv);
	if (id == 4) return texture(m4, uv);
	if (id == 5) return texture(m5, uv);
	if (id == 6) return texture(m6, uv);
	if (id == 7) return texture(m7, uv);
	return texture(m0, uv);
}

vec2 sorteio(vec2 v) {
	return fract(sin(vec2(dot(v, vec2(127.1, 311.7)), dot(v, vec2(269.5, 183.3)))) * 43758.5453);
}

vec4 cor(int id, vec2 p) {
	if (id == 8) {
		// Água: a textura corre devagar e balança um pouco.
		vec2 q = p / 96.0 + vec2(TIME * 0.025, sin(TIME * 0.7 + p.x * 0.02) * 0.01);
		return texture(m8, fract(q));
	}
	// Ladrilhamento hexagonal: cada hexágono lê a textura num deslocamento sorteado e os três
	// vizinhos se fundem só numa faixa estreita. Some o padrão de "rosáceas" do espelhamento.
	vec2 h = p / 230.0 * 3.4641016;
	vec2 sk = vec2(h.x, -0.57735027 * h.x + 1.15470054 * h.y);
	vec2 base = floor(sk);
	vec3 t = vec3(fract(sk), 0.0);
	t.z = 1.0 - t.x - t.y;
	vec2 v1; vec2 v2; vec2 v3; vec3 w;
	if (t.z > 0.0) {
		w = vec3(t.z, t.y, t.x); v1 = base; v2 = base + vec2(0.0, 1.0); v3 = base + vec2(1.0, 0.0);
	} else {
		w = vec3(-t.z, 1.0 - t.y, 1.0 - t.x); v1 = base + vec2(1.0, 1.0); v2 = base + vec2(1.0, 0.0); v3 = base + vec2(0.0, 1.0);
	}
	w = pow(w, vec3(7.0));
	w /= (w.x + w.y + w.z);
	vec4 c = amostra(id, espelhado((p + floor(sorteio(v1) * 192.0)) / 96.0)) * w.x
		+ amostra(id, espelhado((p + floor(sorteio(v2) * 192.0)) / 96.0)) * w.y
		+ amostra(id, espelhado((p + floor(sorteio(v3) * 192.0)) / 96.0)) * w.z;
	// Variação de tom em manchas grandes: quebra a uniformidade sem mudar a paleta.
	float tom = n(p, 700.0, vec2(0.13, 0.42));
	c.rgb *= 0.92 + 0.16 * tom;
	return c;
}

void fragment() {
	// p em pixels inteiros: mantém a pixel art nítida.
	vec2 p = floor(UV * tamanho_mapa * bloco);
	vec2 g = p / bloco - 0.5;
	vec2 i = floor(g);
	vec2 f = fract(g);
	f = f * f * (3.0 - 2.0 * f);
	int ids[4] = int[4](material_bloco(i), material_bloco(i + vec2(1.0, 0.0)), material_bloco(i + vec2(0.0, 1.0)), material_bloco(i + vec2(1.0, 1.0)));
	float ws[4] = float[4]((1.0 - f.x) * (1.0 - f.y), f.x * (1.0 - f.y), (1.0 - f.x) * f.y, f.x * f.y);
	// Ruído: formas grandes (bordas sinuosas) + grão fino (tufos e pedrinhas).
	float forma = (n(p, 260.0, vec2(0.0)) - 0.5) * 1.05;
	float grao = (n(p, 54.0, vec2(0.62, 0.27)) - 0.5) * 0.22;
	int melhor = ids[0];
	float pmelhor = -10.0;
	float segundo = -10.0;
	int id_segundo = ids[0];
	for (int k = 0; k < 4; k++) {
		int id = ids[k];
		float peso = 0.0;
		for (int j = 0; j < 4; j++) {
			if (ids[j] == id) peso += ws[j];
		}
		// A água segue a colisão de perto (menos ruído); a vegetação avança sobre a terra.
		float r = id == 8 ? (forma + grao) * 0.45 : forma + grao;
		float s = peso + (vegetal(id) ? r + 0.05 : -r);
		if (id == melhor) {
			pmelhor = max(pmelhor, s);
		} else if (s > pmelhor + 0.0001) {
			segundo = pmelhor;
			id_segundo = melhor;
			pmelhor = s;
			melhor = id;
		} else if (s > segundo) {
			segundo = s;
			id_segundo = id;
		}
	}
	vec4 c = cor(melhor, p);
	float margem = pmelhor - segundo;
	if (segundo > -9.0 && id_segundo != melhor) {
		// Esmaecimento: na fronteira os dois materiais se misturam meio a meio e o vizinho vai
		// sumindo aos poucos numa faixa larga (cerca de um bloco de cada lado). Com a água a
		// faixa é mais curta, para a margem continuar coincidindo com a colisão.
		float faixa = (melhor == 8 || id_segundo == 8) ? 0.30 : 0.55;
		float t = smoothstep(0.0, faixa, margem);
		vec4 outro = cor(id_segundo, p);
		// Água rasa: perto da margem a água clareia e deixa ver o fundo.
		if (melhor == 8) {
			float raso = 1.0 - t;
			c.rgb = mix(c.rgb, c.rgb * vec3(1.14, 1.18, 1.06) + vec3(0.03, 0.04, 0.02), raso * 0.8);
		}
		// Terra e areia escurecem um pouco ao encostar na água (chão molhado).
		if (chao_nu(melhor) && id_segundo == 8) {
			c.rgb *= mix(0.84, 1.0, t);
		}
		c = mix(outro, c, 0.5 + 0.5 * t);
	}
	COLOR = c;
}
