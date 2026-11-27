extends CanvasLayer
signal changed(message: String)
const Model=preload("res://scripts/maquinas_estado.gd")
var farm
var builder
var player: CharacterBody2D
var panel: PanelContainer
var column: VBoxContainer
var open:=false
var tile:=Vector2i(-1,-1)
var now:=0.0
var tick:=0.0
var info: Label
var product_icons: Dictionary={}
var labels: Dictionary={}

func setup(p: CharacterBody2D,inventory,construction) -> void:
	player=p
	farm=inventory
	builder=construction
	layer=19
	panel=PanelContainer.new()
	panel.theme=preload("res://scripts/tema_ui.gd").theme()
	add_child(panel)
	panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	panel.offset_left=-310
	panel.offset_right=310
	panel.offset_top=-210
	panel.offset_bottom=210
	var content:=VBoxContainer.new()
	panel.add_child(content)
	info=Label.new()
	content.add_child(info)
	var scroll:=ScrollContainer.new()
	scroll.custom_minimum_size=Vector2(600,330)
	content.add_child(scroll)
	column=VBoxContainer.new()
	column.size_flags_horizontal=Control.SIZE_EXPAND_FILL
	scroll.add_child(column)
	panel.hide()

func find(point: Vector2) -> Vector2i:
	var cell: Vector2i=builder.piece_at(builder.tile_at(point))
	if cell.x>=0 and Model.MACHINES.has(farm.buildings[cell]["kind"]) and point.distance_to(player.global_position)<=70.0:
		return cell
	return Vector2i(-1,-1)

func show_machine(cell: Vector2i) -> void:
	tile=cell
	open=true
	player.set("tool_busy",true)
	panel.show()
	refresh()

func close_menu() -> void:
	if not open:
		return
	open=false
	panel.hide()
	player.set("tool_busy",false)

func button(label: String,fn: Callable) -> void:
	var b:=Button.new()
	b.text=label
	b.focus_mode=Control.FOCUS_NONE
	b.pressed.connect(fn)
	column.add_child(b)

func refresh() -> void:
	if not open:
		return
	if not farm.buildings.has(tile):
		close_menu()
		return
	for child in column.get_children():
		column.remove_child(child)
		child.queue_free()
	var kind: String=farm.buildings[tile]["kind"]
	info.text=Model.MACHINES[kind]["name"]
	button("Fechar (Esc)",close_menu)
	if farm.machine_jobs.has(tile):
		var job: Dictionary=farm.machine_jobs[tile]
		var rule: Dictionary=Model.RECIPES[job["recipe"]]
		if now>=job["ready"]:
			button("Recolher "+str(rule["name"]),func():
				changed.emit(Model.collect(farm,tile,now))
				refresh())
		else:
			var left:=ceili(job["ready"]-now)
			info.text+=" · %dh %02dmin restantes" % [int(left/60.0),left%60]
		return
	if kind=="beehive":
		info.text+=" · "+("as abelhas descansam no Inverno" if Model.winter(now) else "sem enxame trabalhando")
		button("Soltar as abelhas (mel em 4 dias)",func():
			changed.emit(Model.start(farm,tile,"hive-honey",now))
			refresh())
	for id in Model.RECIPES:
		var r: Dictionary=Model.RECIPES[id]
		if r["machine"]!=kind or id=="hive-honey":
			continue
		var ingredients: Array[String]=[]
		for item in r["cost"]:
			ingredients.append("%s ×%d" % [item,r["cost"][item]])
		button("%s · %s · %dh %02dmin" % [r["name"],", ".join(ingredients),int(r["minutes"]/60.0),int(r["minutes"])%60],func():
			changed.emit(Model.start(farm,tile,id,now))
			refresh())
	button("Guardar máquina na mochila",func():
		var center: Vector2=builder.center(tile)
		var result: String=builder.interact(center,true)
		changed.emit(result)
		close_menu())

func update(delta: float,clock: Dictionary) -> void:
	now=Model.clock(int(clock["day"]),float(clock["minute"]))
	tick+=delta
	if tick<0.2:
		return
	tick=0.0
	for cell in builder.nodes:
		var kind: String=farm.buildings[cell]["kind"]
		if not Model.MACHINES.has(kind):
			continue
		var sprite: Sprite2D=builder.nodes[cell]
		var job: Dictionary=farm.machine_jobs.get(cell,{})
		var busy: bool=not job.is_empty() and now<float(job["ready"])
		var ready: bool=not job.is_empty() and now>=float(job["ready"])
		var frames: int=sprite.hframes*sprite.vframes
		if frames>1:
			sprite.frame=1+int(Time.get_ticks_msec()/450.0)%(frames-1) if busy else 0
		var indicator: Label=labels.get(cell) as Label
		if not is_instance_valid(indicator) or indicator.get_parent()!=sprite:
			indicator=Label.new()
			indicator.position=Vector2(-26,-62)/sprite.scale
			indicator.scale=Vector2.ONE/sprite.scale
			indicator.z_index=5
			indicator.mouse_filter=Control.MOUSE_FILTER_IGNORE
			indicator.add_theme_font_size_override("font_size",10)
			indicator.add_theme_color_override("font_shadow_color",Color.BLACK)
			indicator.add_theme_constant_override("shadow_offset_y",1)
			sprite.add_child(indicator)
			labels[cell]=indicator
		indicator.text="Pronto!" if ready else ("%d%%" % int(100.0*clampf((now-float(job["started"]))/(float(job["ready"])-float(job["started"])),0.0,1.0)) if busy else "")
	for cell in labels.keys():
		if not builder.nodes.has(cell):
			labels.erase(cell)
	if open and farm.machine_jobs.has(tile):
		var job: Dictionary=farm.machine_jobs[tile]
		if now>=job["ready"] and not info.text.ends_with(" · pronto"):
			refresh()
			info.text=Model.MACHINES[farm.buildings[tile]["kind"]]["name"]+" · pronto"
