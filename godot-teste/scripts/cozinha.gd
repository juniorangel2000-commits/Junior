extends CanvasLayer
signal changed(message: String)
const Model=preload("res://scripts/cozinha_estado.gd")
var farm
var player: CharacterBody2D
var panel: PanelContainer
var column: VBoxContainer
var status: Label
var open: bool=false
var station: String="stove"
var pending: String=""
var remaining: float=0.0

func setup(p: CharacterBody2D,inventory) -> void:
	player=p
	farm=inventory
	layer=20
	panel=PanelContainer.new()
	add_child(panel)
	panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	panel.offset_left=-340
	panel.offset_right=340
	panel.offset_top=-235
	panel.offset_bottom=235
	var layout:=VBoxContainer.new()
	panel.add_child(layout)
	status=Label.new()
	layout.add_child(status)
	var scroll:=ScrollContainer.new()
	scroll.custom_minimum_size=Vector2(660,375)
	layout.add_child(scroll)
	column=VBoxContainer.new()
	column.size_flags_horizontal=Control.SIZE_EXPAND_FILL
	scroll.add_child(column)
	panel.hide()

func show_station(kind: String) -> void:
	if open:
		return
	station=kind
	open=true
	player.set("tool_busy",true)
	panel.show()
	refresh()

func close_menu() -> void:
	if not open:
		return
	pending=""
	remaining=0.0
	open=false
	panel.hide()
	player.set("tool_busy",false)

func button(label: String,fn: Callable) -> Button:
	var b:=Button.new()
	b.text=label
	b.focus_mode=Control.FOCUS_NONE
	b.pressed.connect(fn)
	column.add_child(b)
	return b

func refresh() -> void:
	for child in column.get_children():
		column.remove_child(child)
		child.queue_free()
	status.text="Caderno de receitas · "+("Fogão a lenha" if station=="stove" else "Fogueira portátil")
	button("Fechar (Esc)",close_menu)
	if pending!="":
		status.text="Preparando "+str(Model.DISHES[pending]["name"])+"..."
		return
	for id in Model.DISHES:
		var dish: Dictionary=Model.DISHES[id]
		if dish["station"]!=station:
			continue
		var ingredients: Dictionary=Model.cost(id)
		var parts: Array[String]=[]
		var can_cook: bool=true
		for item in ingredients:
			var have: int=int(farm.stock.get(item,0))
			parts.append("%s %d/%d" % [item,have,ingredients[item]])
			if have<int(ingredients[item]):
				can_cook=false
		var b:=button("%s · +%d vigor · %s" % [dish["name"],dish["vigor"],", ".join(parts)],func():
			pending=id
			remaining=1.5
			refresh())
		b.disabled=not can_cook
		var path: String="res://arte/cozinha/%s.png" % id
		if ResourceLoader.exists(path):
			b.icon=load(path) as Texture2D
			b.expand_icon=true
			b.custom_minimum_size.y=42

func update(delta: float,_clock: Dictionary) -> void:
	if pending=="":
		return
	remaining-=delta
	if remaining<=0.0:
		var id: String=pending
		pending=""
		changed.emit(Model.cook(farm,id,station))
		refresh()
