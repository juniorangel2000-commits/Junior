extends CanvasLayer
## HUD da Propriedade: aviso curto acima da barra, item na mão, vigor e ajuda de teclas (F1).
## Visual da V51 (moldura de madeira e papel); substitui o texto de depuração do canto.
const Tema=preload("res://scripts/tema_ui.gd")
const TOAST_SECONDS:=3.2
const CONTROLS=[["WASD / setas","Andar"],["E ou clique","Usar o item na mão"],["Shift + E","Desfazer canteiro vazio, recolher construção"],["1 a 9","Escolher espaço da barra"],["Q","Trocar a semente do espaço"],["I","Mochila"],["C","Fabricar e construir"],["B","Criação de animais"],["G","Comer o prato da mão"],["+ / −","Aproximar e afastar"],["F5","Salvar"],["F3 / F4","Diagnóstico e colisões"]]

var _toast: PanelContainer
var _toast_label: Label
var _toast_time:=0.0
var _held: Label
var _vigor_card: PanelContainer
var _vigor_bar: ProgressBar
var _vigor_value: Label
var _effect: Label
var _help: PanelContainer
var _hint: PanelContainer

func _ready() -> void:
	layer=12
	var root:=Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter=Control.MOUSE_FILTER_IGNORE
	add_child(root)
	Tema.apply(root)
	# Aviso: papel com moldura, centralizado acima da barra rápida.
	_toast=PanelContainer.new()
	_toast.mouse_filter=Control.MOUSE_FILTER_IGNORE
	_toast.add_theme_stylebox_override("panel",Tema.frame("paper",2))
	root.add_child(_toast)
	_toast_label=Label.new()
	_toast_label.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER
	_toast.add_child(_toast_label)
	_toast.modulate.a=0.0
	# Item na mão: texto creme com sombra logo acima da barra.
	_held=Label.new()
	_held.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER
	_held.mouse_filter=Control.MOUSE_FILTER_IGNORE
	_held.add_theme_color_override("font_color",Tema.CREAM)
	_held.add_theme_color_override("font_outline_color",Color("#2b1c10"))
	_held.add_theme_constant_override("outline_size",6)
	_held.add_theme_font_size_override("font_size",15)
	root.add_child(_held)
	_held.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	_held.offset_left=-300
	_held.offset_right=300
	_held.offset_top=-112
	_held.offset_bottom=-90
	# Vigor: cartão abaixo do relógio, com barra dourada.
	_vigor_card=PanelContainer.new()
	_vigor_card.mouse_filter=Control.MOUSE_FILTER_IGNORE
	_vigor_card.add_theme_stylebox_override("panel",Tema.frame("paper",0))
	root.add_child(_vigor_card)
	_vigor_card.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	_vigor_card.offset_left=-262
	_vigor_card.offset_right=-12
	_vigor_card.offset_top=106
	_vigor_card.grow_horizontal=Control.GROW_DIRECTION_BEGIN
	var vbox:=VBoxContainer.new()
	vbox.add_theme_constant_override("separation",3)
	_vigor_card.add_child(vbox)
	var row:=HBoxContainer.new()
	vbox.add_child(row)
	var title:=Label.new()
	title.text="Vigor"
	title.size_flags_horizontal=Control.SIZE_EXPAND_FILL
	row.add_child(title)
	_vigor_value=Label.new()
	row.add_child(_vigor_value)
	_vigor_bar=ProgressBar.new()
	_vigor_bar.max_value=100
	_vigor_bar.show_percentage=false
	_vigor_bar.custom_minimum_size=Vector2(0,12)
	vbox.add_child(_vigor_bar)
	_effect=Label.new()
	_effect.add_theme_font_size_override("font_size",14)
	_effect.add_theme_color_override("font_color",Tema.LEAF.darkened(0.25))
	vbox.add_child(_effect)
	# Dica de ajuda e painel de controles.
	_hint=PanelContainer.new()
	_hint.mouse_filter=Control.MOUSE_FILTER_IGNORE
	_hint.add_theme_stylebox_override("panel",Tema.flat(Color(0.16,0.1,0.06,0.62),Color(0,0,0,0),0,6,4))
	root.add_child(_hint)
	_hint.position=Vector2(12,12)
	var hint_label:=Label.new()
	hint_label.text="F1  Controles"
	hint_label.add_theme_color_override("font_color",Tema.CREAM)
	hint_label.add_theme_font_size_override("font_size",14)
	_hint.add_child(hint_label)
	_help=PanelContainer.new()
	root.add_child(_help)
	_help.position=Vector2(12,12)
	var help_box:=VBoxContainer.new()
	help_box.add_theme_constant_override("separation",6)
	_help.add_child(help_box)
	help_box.add_child(Tema.heading("Controles"))
	var grid:=GridContainer.new()
	grid.columns=2
	grid.add_theme_constant_override("h_separation",18)
	grid.add_theme_constant_override("v_separation",3)
	help_box.add_child(grid)
	for pair in CONTROLS:
		var key:=Label.new()
		key.text=pair[0]
		key.add_theme_color_override("font_color",Tema.WOOD)
		grid.add_child(key)
		var what:=Label.new()
		what.text=pair[1]
		grid.add_child(what)
	var close:=Label.new()
	close.text="F1 fecha"
	close.add_theme_font_size_override("font_size",13)
	close.add_theme_color_override("font_color",Tema.INK_SOFT)
	help_box.add_child(close)
	_help.hide()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo and event.keycode==KEY_F1:
		toggle_help()
		get_viewport().set_input_as_handled()

func toggle_help() -> void:
	_help.visible=not _help.visible
	_hint.visible=not _help.visible

func help_open() -> bool:
	return _help.visible

func toast(text: String) -> void:
	if text=="":
		return
	_toast_label.text=text
	_toast.reset_size()
	_toast_time=TOAST_SECONDS
	_toast.modulate.a=1.0

func toast_text() -> String:
	return _toast_label.text if _toast_time>0.0 else ""

func _process(delta: float) -> void:
	if _toast_time>0.0:
		_toast_time-=delta
		_toast.modulate.a=clampf(_toast_time/0.4,0.0,1.0)
	var view:=get_viewport().get_visible_rect().size
	_toast.position=Vector2((view.x-_toast.size.x)*0.5,view.y-160.0-_toast.size.y*0.5)

## held: nome e detalhe do item na mão; vigor 0–100; effect: efeito ativo ("" sem efeito).
func sync(held: String,vigor: int,extra: int,effect: String) -> void:
	_held.text=held
	_vigor_bar.value=vigor
	_vigor_value.text="%d/100" % vigor if extra<=0 else "%d/100 +%d" % [vigor,extra]
	var low: bool=vigor<=20
	_vigor_value.add_theme_color_override("font_color",Color("#a3402c") if low else Tema.INK)
	_effect.text=effect
	_effect.visible=effect!=""

func set_visible_in_world(value: bool) -> void:
	for node in [_vigor_card,_held]:
		node.visible=value
