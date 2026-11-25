extends CanvasLayer
signal slot_selected(index: int)
signal assign_requested(item: String)
signal clear_requested
signal closed
const Farm=preload("res://scripts/fazenda_estado.gd")
var _bar: HBoxContainer
var _grid: GridContainer
var _panel: PanelContainer
var _title: Label
var _status: Label
var _buttons: Array[Button]=[]
var _selected:=0
var _last_stock: Dictionary={}
var _last_slots: Array=[]
var _last_water:=-1
var _textures: Dictionary={}

func _ready() -> void:
	layer=13
	var bar_panel:=PanelContainer.new()
	add_child(bar_panel)
	bar_panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	bar_panel.offset_left=-297
	bar_panel.offset_right=297
	bar_panel.offset_top=-82
	bar_panel.offset_bottom=-12
	_bar=HBoxContainer.new()
	_bar.add_theme_constant_override("separation",4)
	bar_panel.add_child(_bar)
	for i in 9:
		var button:=Button.new()
		button.custom_minimum_size=Vector2(62,62)
		button.focus_mode=Control.FOCUS_NONE
		button.expand_icon=true
		button.vertical_icon_alignment=VERTICAL_ALIGNMENT_TOP
		button.pressed.connect(func(): slot_selected.emit(i))
		_bar.add_child(button)
		_buttons.append(button)
	_panel=PanelContainer.new()
	add_child(_panel)
	_panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	_panel.offset_left=-330
	_panel.offset_right=330
	_panel.offset_top=-230
	_panel.offset_bottom=230
	var column:=VBoxContainer.new()
	column.add_theme_constant_override("separation",8)
	_panel.add_child(column)
	_title=Label.new()
	column.add_child(_title)
	_grid=GridContainer.new()
	_grid.columns=6
	_grid.add_theme_constant_override("h_separation",4)
	_grid.add_theme_constant_override("v_separation",4)
	column.add_child(_grid)
	_status=Label.new()
	_status.text="Clique em um item para equipá-lo no espaço selecionado."
	column.add_child(_status)
	var actions:=HBoxContainer.new()
	column.add_child(actions)
	var clear:=Button.new()
	clear.text="Limpar espaço"
	clear.focus_mode=Control.FOCUS_NONE
	clear.pressed.connect(func(): clear_requested.emit())
	actions.add_child(clear)
	var close:=Button.new()
	close.text="Fechar (I)"
	close.focus_mode=Control.FOCUS_NONE
	close.pressed.connect(func(): closed.emit())
	actions.add_child(close)
	_panel.hide()

func toggle(open: bool) -> void:
	_panel.visible=open

func item_name(item: String) -> String:
	const names={"hand":"Mão","hoe":"Enxada","wateringCan":"Regador","hatchet":"Machadinha","pickaxe":"Picareta","wood":"Madeira","stone":"Pedra","branch":"Galho","log":"Tronco","plank":"Tábua","scrap":"Sucata","fiber":"Fibra","ironShard":"Ferro","fertilizer":"Adubo"}
	if names.has(item):
		return names[item]
	for def in Farm.CATALOG.values():
		if def["seed"]==item:
			return "Sem. "+str(def["name"])
		if def["harvest"]==item:
			return str(def["name"])
	return item

func icon_for(item: String,water: int) -> Texture2D:
	var path: String="res://arte/icones/%s.png" % item
	if item=="wateringCan":
		path="res://arte/ferramentas/regador/cheio.png" if water>0 else "res://arte/ferramentas/regador/vazio.png"
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
		b.icon=icon_for(item,water) if item!="" and item!="hand" else null
		b.text="%d" % (i+1)
		if item=="hand":
			b.text+=" Mão"
		elif item!="":
			b.text+=" · %d" % (water if item=="wateringCan" else count)
		b.tooltip_text=item_name(item)
		b.modulate=Color(1.0,0.86,0.48) if i==selected else Color.WHITE
		if item!="" and item!="hand" and count==0:
			b.modulate.a=0.55
	_title.text="Mochila · %d/30 · Espaço selecionado: %d" % [_used(stock),selected+1]
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
	items.sort()
	for i in 30:
		var b:=Button.new()
		b.custom_minimum_size=Vector2(104,62)
		b.focus_mode=Control.FOCUS_NONE
		b.expand_icon=true
		b.vertical_icon_alignment=VERTICAL_ALIGNMENT_TOP
		if i<items.size():
			var item: String=items[i]
			b.icon=icon_for(item,water)
			b.text="%s ×%d" % [item_name(item),stock[item]]
			b.tooltip_text=item_name(item)
			b.pressed.connect(func(): assign_requested.emit(item))
		else:
			b.disabled=true
			b.text="—"
		_grid.add_child(b)

func _used(stock: Dictionary) -> int:
	var count:=0
	for value in stock.values():
		if value>0:
			count+=1
	return count
