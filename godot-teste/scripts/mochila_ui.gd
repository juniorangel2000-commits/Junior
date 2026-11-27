extends CanvasLayer
signal slot_selected(index: int)
signal assign_requested(item: String)
signal clear_requested
signal closed
const Farm=preload("res://scripts/fazenda_estado.gd")
const Tema=preload("res://scripts/tema_ui.gd")
const SLOT:=58
var _bar: HBoxContainer
var _grid: GridContainer
var _panel: PanelContainer
var _title: Label
var _status: Label
var _buttons: Array[Button]=[]
var _bar_icons: Array[TextureRect]=[]
var _bar_counts: Array[Label]=[]
var _detail: Label
var _selected:=0
var _last_stock: Dictionary={}
var _last_slots: Array=[]
var _last_water:=-1
var _textures: Dictionary={}

static func slot_style(selected: bool,empty: bool=false) -> StyleBoxFlat:
	if selected:
		return Tema.flat(Color("#fff0ce"),Tema.GOLD.darkened(0.1),3,4,2)
	return Tema.flat(Color("#e8d1a7") if not empty else Color("#d8bf93"),Color("#6b4224"),2,4,2)

## Espaço com ícone grande, número no canto de cima e quantidade no canto de baixo.
func _slot(size: Vector2,number: String) -> Array:
	var b:=Button.new()
	b.custom_minimum_size=size
	b.focus_mode=Control.FOCUS_NONE
	for state in ["normal","hover","pressed","hover_pressed","disabled"]:
		b.add_theme_stylebox_override(state,slot_style(false))
	var icon:=TextureRect.new()
	icon.expand_mode=TextureRect.EXPAND_IGNORE_SIZE
	icon.stretch_mode=TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	icon.texture_filter=CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	icon.mouse_filter=Control.MOUSE_FILTER_IGNORE
	icon.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	icon.offset_left=8
	icon.offset_top=6
	icon.offset_right=-8
	icon.offset_bottom=-10
	b.add_child(icon)
	var num:=Label.new()
	num.text=number
	num.position=Vector2(4,0)
	num.add_theme_font_size_override("font_size",11)
	num.add_theme_color_override("font_color",Tema.INK_SOFT)
	num.mouse_filter=Control.MOUSE_FILTER_IGNORE
	b.add_child(num)
	var count:=Label.new()
	count.horizontal_alignment=HORIZONTAL_ALIGNMENT_RIGHT
	count.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_RIGHT)
	count.offset_left=-40
	count.offset_top=-20
	count.offset_right=-4
	count.offset_bottom=0
	count.add_theme_font_size_override("font_size",13)
	count.add_theme_color_override("font_color",Tema.CREAM)
	count.add_theme_color_override("font_outline_color",Color("#3a2415"))
	count.add_theme_constant_override("outline_size",4)
	count.mouse_filter=Control.MOUSE_FILTER_IGNORE
	b.add_child(count)
	return [b,icon,count]

func _ready() -> void:
	layer=13
	var bar_panel:=PanelContainer.new()
	Tema.apply(bar_panel)
	bar_panel.add_theme_stylebox_override("panel",Tema.frame("wood",-6))
	add_child(bar_panel)
	bar_panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	bar_panel.grow_horizontal=Control.GROW_DIRECTION_BOTH
	bar_panel.grow_vertical=Control.GROW_DIRECTION_BEGIN
	bar_panel.offset_bottom=-8
	_bar=HBoxContainer.new()
	_bar.add_theme_constant_override("separation",4)
	bar_panel.add_child(_bar)
	for i in 9:
		var parts:=_slot(Vector2(SLOT,SLOT),str(i+1))
		var button: Button=parts[0]
		button.pressed.connect(func(): slot_selected.emit(i))
		_bar.add_child(button)
		_buttons.append(button)
		_bar_icons.append(parts[1])
		_bar_counts.append(parts[2])
	_panel=PanelContainer.new()
	Tema.apply(_panel)
	add_child(_panel)
	_panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	_panel.grow_horizontal=Control.GROW_DIRECTION_BOTH
	_panel.grow_vertical=Control.GROW_DIRECTION_BOTH
	_panel.offset_top=-40
	_panel.offset_bottom=-40
	var column:=VBoxContainer.new()
	column.add_theme_constant_override("separation",8)
	_panel.add_child(column)
	var head:=Tema.heading("Mochila")
	column.add_child(head)
	_title=head.get_meta("label")
	_grid=GridContainer.new()
	_grid.columns=6
	_grid.add_theme_constant_override("h_separation",5)
	_grid.add_theme_constant_override("v_separation",5)
	column.add_child(_grid)
	_detail=Label.new()
	_detail.custom_minimum_size=Vector2(0,22)
	_detail.add_theme_font_size_override("font_size",15)
	column.add_child(_detail)
	_status=Label.new()
	_status.text="Clique em um item para pô-lo no espaço selecionado da barra."
	_status.add_theme_font_size_override("font_size",13)
	_status.add_theme_color_override("font_color",Tema.INK_SOFT)
	column.add_child(_status)
	var actions:=HBoxContainer.new()
	actions.add_theme_constant_override("separation",8)
	actions.alignment=BoxContainer.ALIGNMENT_END
	column.add_child(actions)
	var clear:=Button.new()
	clear.text="Limpar espaço"
	clear.focus_mode=Control.FOCUS_NONE
	clear.pressed.connect(func(): clear_requested.emit())
	actions.add_child(clear)
	var close:=Button.new()
	close.text="Fechar  (I)"
	close.focus_mode=Control.FOCUS_NONE
	close.pressed.connect(func(): closed.emit())
	actions.add_child(close)
	_panel.hide()

func toggle(open: bool) -> void:
	_panel.visible=open

func item_name(item: String) -> String:
	const names={"hand":"Mão","hoe":"Enxada","wateringCan":"Regador","hatchet":"Machadinha","pickaxe":"Picareta","wood":"Madeira","stone":"Pedra","branch":"Galho","log":"Tronco","plank":"Tábua","scrap":"Sucata","fiber":"Fibra","ironShard":"Lasca de ferro","fertilizer":"Adubo","oakSeed":"Bolota","pineSeed":"Semente de pinheiro","herb":"Ervas","mushroom":"Cogumelos","hardwood":"Madeira nobre","hay":"Palha","egg":"Ovo","duckEgg":"Ovo de pato","milk":"Leite","goatMilk":"Leite de cabra","wool":"Lã","manure":"Esterco","feather":"Pena","milkPail":"Balde","shears":"Tesoura","ironIngot":"Lingote de ferro","fishingRod":"Vara de pescar","bait":"Isca","fish":"Peixe","cloth":"Tecido","board":"Tábua regular","hammer":"Martelo","peg":"Cavilha","cord":"Corda vegetal","handle":"Cabo","flakedStone":"Pedra lascada","blade":"Lâmina de sucata","handsaw":"Serrote","nails":"Pregos","hinge":"Dobradiça","spring":"Mola","gear":"Engrenagem","metalPart":"Peça de metal","doorKit":"Telhado de tábuas","windowKit":"Ninho e baias","furniture":"Banco de madeira","workbench":"Bancada de trabalho","constructionBench":"Bancada de construção","fence":"Cerca","gate":"Porteira","bench":"Banco","seeds":"Sementes de nabo","ironOre":"Minério de ferro","honey":"Mel","beeswax":"Cera de abelha","freshGrass":"Capim fresco","apple":"Maçã","pear":"Pera","orange":"Laranja","crab":"Caranguejo","water":"Água","beehive":"Colmeia povoada"}
	if preload("res://scripts/maquinas_estado.gd").MACHINES.has(item):
		return preload("res://scripts/maquinas_estado.gd").MACHINES[item]["name"]
	if preload("res://scripts/cozinha_estado.gd").DISHES.has(item):
		return preload("res://scripts/cozinha_estado.gd").DISHES[item]["name"]
	if item=="campfire":
		return "Fogueira portátil"
	for r in preload("res://scripts/maquinas_estado.gd").RECIPES.values():
		if r["out"]==item:
			return str(r["name"])
	if names.has(item):
		return names[item]
	for def in Farm.CATALOG.values():
		if def["seed"]==item:
			return "Sementes de "+str(def["name"]).to_lower()
		if def["harvest"]==item:
			return str(def["name"])
	return item

func icon_for(item: String,water: int) -> Texture2D:
	var path: String="res://arte/icones/%s.png" % item
	if ResourceLoader.exists("res://arte/itens/%s.png" % item):
		path="res://arte/itens/%s.png" % item
	if preload("res://scripts/cozinha_estado.gd").DISHES.has(item) or item=="campfire":
		path="res://arte/cozinha/%s.png" % item
	elif preload("res://scripts/maquinas_estado.gd").MACHINES.has(item):
		path="res://arte/maquinas/%s-icon.png" % item
	elif item=="wateringCan":
		path="res://arte/ferramentas/regador/cheio.png" if water>0 else "res://arte/ferramentas/regador/vazio.png"
	elif item=="fishingRod":
		path="res://arte/pesca/vara-icone.png"
	elif item=="bait":
		path="res://arte/pesca/isca.png"
	elif item=="hoe":
		path="res://arte/ferramentas/enxada.png"
	else:
		for id in Farm.CATALOG:
			var def: Dictionary=Farm.CATALOG[id]
			if def["seed"]==item or def["harvest"]==item:
				path="res://arte/cultivos/%s/%s.png" % [id,"seed" if def["seed"]==item else "harvest"]
				break
	if not _textures.has(path):
		_textures[path]=load(path) if ResourceLoader.exists(path) else null
	return _textures[path]

func sync(stock: Dictionary,slots: Array,selected: int,water: int) -> void:
	_selected=selected
	for i in 9:
		var item: String=slots[i]
		var b:=_buttons[i]
		var count:=int(stock.get(item,0))
		var tex: Texture2D=null
		if item=="hand":
			tex=_hand_icon()
		elif item!="":
			tex=icon_for(item,water)
		_bar_icons[i].texture=tex
		_bar_icons[i].modulate=Color(1,1,1,0.45) if item!="" and item!="hand" and count==0 else Color.WHITE
		_bar_counts[i].text=("%d/%d" % [water,Farm.WATER_CAPACITY]) if item=="wateringCan" else (str(count) if item!="" and item!="hand" and count!=1 else "")
		b.tooltip_text=item_name(item) if item!="" else "Espaço vazio"
		var style:=slot_style(i==selected,item=="")
		for state in ["normal","hover","pressed","hover_pressed"]:
			b.add_theme_stylebox_override(state,style)
	_title.text="Mochila  ·  %d/30 espaços" % _used(stock)
	if stock==_last_stock and slots==_last_slots and water==_last_water:
		return
	_last_stock=stock.duplicate()
	_last_slots=slots.duplicate()
	_last_water=water
	for child in _grid.get_children():
		_grid.remove_child(child)
		child.queue_free()
	var items: Array=[]
	for item in stock:
		if stock[item]>0:
			items.append(item)
	items.sort_custom(func(a,b): return item_name(a)<item_name(b))
	for i in 30:
		var parts:=_slot(Vector2(72,72),"")
		var b: Button=parts[0]
		if i<items.size():
			var item: String=items[i]
			(parts[1] as TextureRect).texture=icon_for(item,water)
			(parts[2] as Label).text=str(stock[item]) if int(stock[item])>1 else ""
			b.tooltip_text="%s ×%d" % [item_name(item),stock[item]]
			b.pressed.connect(func(): assign_requested.emit(item))
			b.mouse_entered.connect(func(): _detail.text="%s  ×%d" % [item_name(item),stock[item]])
			b.mouse_exited.connect(func(): _detail.text="")
		else:
			b.disabled=true
			b.add_theme_stylebox_override("disabled",slot_style(false,true))
		_grid.add_child(b)

var _hand: Texture2D
func _hand_icon() -> Texture2D:
	if _hand==null:
		var img:=Image.new()
		# Mão aberta em pixel art (contorno marrom, pele clara), desenhada no próprio jogo.
		img.load_svg_from_string('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16" shape-rendering="crispEdges"><path fill="#5a3a22" d="M5 2h2v1h1V1h2v1h1v1h1v1h1v5h-1v3h-1v1h-1v1H6v-1H5v-1H4v-1H3V8H2V6h2v1h1z"/><path fill="#f2c79a" d="M6 3h1v5h1V2h1v6h1V3h1v6h1V5h1v4h-1v3h-1v1H7v-1H6v-1H5v-1H4V8H3V7h1v1h1v1h1z"/><path fill="#d9a073" d="M7 12h4v1H7zM11 9h1v3h-1z"/></svg>',2.0)
		_hand=ImageTexture.create_from_image(img)
	return _hand

func _used(stock: Dictionary) -> int:
	var count:=0
	for value in stock.values():
		if value>0:
			count+=1
	return count
