extends RefCounted
## Tema visual dos painéis, nas cores do HUD "Fazenda aconchegante" da V51
## (src/cozy-hud.css): moldura de madeira em nove partes, papel creme e tinta marrom.
## A moldura é o mesmo desenho de public/assets/ui/cozy-frame.svg, rasterizado em tempo
## de execução para não depender de importação.

const PAPER:=Color("#f5e6c5")
const PAPER_DARK:=Color("#e8d1a7")
const INK:=Color("#513c26")
const INK_SOFT:=Color("#7a6142")
const WOOD:=Color("#8d5931")
const WOOD_DARK:=Color("#55351f")
const WOOD_LIGHT:=Color("#c68e4d")
const GOLD:=Color("#e0af65")
const CREAM:=Color("#fff0ce")
const LEAF:=Color("#6f9a3e")

const FRAME_SVG:='''<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" shape-rendering="crispEdges">
<path fill="#422918" d="M6 0h52v2h4v4h2v52h-2v4h-4v2H6v-2H2v-4H0V6h2V2h4z"/>
<path fill="#a36a35" d="M7 2h50v2h3v3h2v50h-2v3h-3v2H7v-2H4v-3H2V7h2V4h3z"/>
<path fill="#c68e4d" d="M9 4h46v2H9zM4 9h2v46H4z"/>
<path fill="#694020" d="M9 58h46v2H9zM58 9h2v46h-2z"/>
<path fill="#87502b" d="M12 7h40v2H12zM7 12h2v40H7zM55 12h2v40h-2zM12 55h40v2H12z"/>
<path fill="#59351f" d="M12 10h40v2H12zM10 12h2v40h-2zM52 12h2v40h-2zM12 52h40v2H12z"/>
<path fill="#e0af65" d="M13 12h38v1H13zM12 13h1v38h-1zM51 13h1v38h-1zM13 51h38v1H13z"/>
<path fill="#70431f" d="M19 4h11v1H19zM37 5h12v1H37zM23 59h17v1H23zM4 22h1v13H4zM59 32h1v17h-1z"/>
<g fill="#3f291b"><path d="M5 5h6v6H5zM53 5h6v6h-6zM5 53h6v6H5zM53 53h6v6h-6z"/></g>
<g fill="#bd8c4d"><path d="M6 6h4v4H6zM54 6h4v4h-4zM6 54h4v4H6zM54 54h4v4h-4z"/></g>
<g fill="#f1cf87"><path d="M6 6h3v1H6zM54 6h3v1h-3zM6 54h3v1H6zM54 54h3v1h-3z"/></g>
%s
</svg>'''

static var _theme: Theme
static var _frames: Dictionary={}

## O miolo vai por cima do desenho original (que pinta o interior de madeira).
## Moldura com o miolo preenchido: "paper" (painéis) ou "wood" (barra de ferramentas).
## A borda tem 14 px na tela, 1:1 com o desenho original (pixel art nítida).
static func frame(fill: String="paper",pad: int=8) -> StyleBoxTexture:
	var key:="%s:%d" % [fill,pad]
	if _frames.has(key):
		return _frames[key]
	var center: String
	if fill=="wood":
		center='<rect x="13" y="13" width="38" height="38" fill="#8d5931"/><path fill="#7b4928" d="M13 19h38v1H13zM13 27h38v1H13zM13 35h38v1H13zM13 43h38v1H13z"/>'
	else:
		center='<rect x="13" y="13" width="38" height="38" fill="#f5e6c5"/>'
	var image:=Image.new()
	image.load_svg_from_string(FRAME_SVG % center,1.0)
	var box:=StyleBoxTexture.new()
	box.texture=ImageTexture.create_from_image(image)
	for side in [SIDE_LEFT,SIDE_TOP,SIDE_RIGHT,SIDE_BOTTOM]:
		box.set_texture_margin(side,14)
		box.set_content_margin(side,14+pad)
	_frames[key]=box
	return box

static func flat(bg: Color,border: Color,width: int=2,radius: int=4,pad: int=6) -> StyleBoxFlat:
	var s:=StyleBoxFlat.new()
	s.bg_color=bg
	s.border_color=border
	s.set_border_width_all(width)
	s.set_corner_radius_all(radius)
	s.content_margin_left=pad+2
	s.content_margin_right=pad+2
	s.content_margin_top=pad
	s.content_margin_bottom=pad
	s.anti_aliasing=false
	return s

static func theme() -> Theme:
	if _theme!=null:
		return _theme
	var t:=Theme.new()
	t.default_font_size=16
	t.set_stylebox("panel","PanelContainer",frame("paper"))
	t.set_stylebox("panel","Panel",frame("paper"))
	for type in ["Label","RichTextLabel"]:
		t.set_color("font_color",type,INK)
		t.set_color("default_color",type,INK)
	t.set_color("font_shadow_color","Label",Color(0,0,0,0))
	# Botões de papel com contorno de madeira, como os cartões da V51.
	t.set_stylebox("normal","Button",flat(Color("#ecd6a9"),Color("#87552f")))
	t.set_stylebox("hover","Button",flat(Color("#f6e4bd"),Color("#a36a35")))
	t.set_stylebox("pressed","Button",flat(Color("#d9bb84"),WOOD_DARK))
	t.set_stylebox("hover_pressed","Button",flat(Color("#d9bb84"),WOOD_DARK))
	t.set_stylebox("disabled","Button",flat(Color("#e9dcc0"),Color("#c4ab86"),1))
	t.set_stylebox("focus","Button",StyleBoxEmpty.new())
	for c in ["font_color","font_hover_color","font_pressed_color","font_hover_pressed_color","font_focus_color"]:
		t.set_color(c,"Button",INK)
	t.set_color("font_disabled_color","Button",Color("#a8977c"))
	t.set_constant("h_separation","Button",6)
	# Barras de progresso (vigor, máquinas, pesca).
	t.set_stylebox("background","ProgressBar",flat(Color("#4a3020"),WOOD_DARK,2,3,0))
	t.set_stylebox("fill","ProgressBar",flat(GOLD,Color("#f1cf87"),1,2,0))
	t.set_color("font_color","ProgressBar",INK)
	t.set_stylebox("panel","TooltipPanel",flat(PAPER,Color("#87552f"),2,4,6))
	t.set_color("font_color","TooltipLabel",INK)
	t.set_stylebox("normal","LineEdit",flat(Color("#fff7e4"),Color("#87552f")))
	t.set_color("font_color","LineEdit",INK)
	t.set_stylebox("panel","ScrollContainer",StyleBoxEmpty.new())
	t.set_stylebox("grabber","VScrollBar",flat(WOOD_LIGHT,WOOD,1,3,0))
	t.set_stylebox("grabber_highlight","VScrollBar",flat(GOLD,WOOD,1,3,0))
	t.set_stylebox("scroll","VScrollBar",flat(Color("#e3caa0"),Color("#c4a574"),1,3,0))
	_theme=t
	return t

## Aplica o tema a um controle de topo (filhos de CanvasLayer não herdam o tema da janela).
static func apply(control: Control) -> void:
	control.theme=theme()

## Título de painel em faixa de madeira, como .modal-heading da V51.
static func heading(text: String) -> PanelContainer:
	var bar:=PanelContainer.new()
	bar.add_theme_stylebox_override("panel",flat(WOOD,WOOD_DARK,2,3,6))
	var l:=Label.new()
	l.text=text
	l.add_theme_color_override("font_color",CREAM)
	l.add_theme_color_override("font_shadow_color",Color("#51331d"))
	l.add_theme_constant_override("shadow_offset_x",1)
	l.add_theme_constant_override("shadow_offset_y",2)
	l.add_theme_font_size_override("font_size",18)
	bar.add_child(l)
	bar.set_meta("label",l)
	return bar
