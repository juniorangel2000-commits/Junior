extends CanvasLayer
signal recipe(id: String)
signal piece(id: String)
signal close_requested
const Build=preload("res://scripts/construcao.gd")
var panel: PanelContainer
var list: VBoxContainer
var mode:=0

func _ready() -> void:
	layer=15
	panel=PanelContainer.new()
	add_child(panel)
	panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	panel.offset_left=-300
	panel.offset_right=300
	panel.offset_top=-260
	panel.offset_bottom=260
	var column:=VBoxContainer.new()
	panel.add_child(column)
	var header:=HBoxContainer.new()
	column.add_child(header)
	for i in 2:
		var b:=Button.new()
		b.text=["Fabricação","Construção"][i]
		b.focus_mode=Control.FOCUS_NONE
		b.pressed.connect(func(): mode=i; _refresh())
		header.add_child(b)
	var close:=Button.new()
	close.text="Fechar (C)"
	close.focus_mode=Control.FOCUS_NONE
	close.pressed.connect(func(): close_requested.emit())
	header.add_child(close)
	var info:=Label.new()
	info.text="Receitas da V51 · R gira · Esc cancela a prévia"
	column.add_child(info)
	var scroll:=ScrollContainer.new()
	scroll.custom_minimum_size=Vector2(580,440)
	column.add_child(scroll)
	list=VBoxContainer.new()
	list.size_flags_horizontal=Control.SIZE_EXPAND_FILL
	scroll.add_child(list)
	_refresh()
	panel.hide()

func show_menu(value: bool) -> void:
	panel.visible=value

func _refresh() -> void:
	for child in list.get_children():
		list.remove_child(child)
		child.queue_free()
	var data: Dictionary=Build.RECIPES if mode==0 else Build.PIECES
	for id in data:
		var def: Dictionary=data[id]
		var parts: Array[String]=[]
		for item in def["cost"]:
			parts.append("%s ×%d" % [item,def["cost"][item]])
		var b:=Button.new()
		b.focus_mode=Control.FOCUS_NONE
		b.text="%s | %s" % [def["name"],", ".join(parts)]
		if def.has("station"):
			b.text+=" | "+("Bancada de trabalho" if def["station"]=="workbench" else "Bancada de construção")
		b.pressed.connect(func():
			if mode==0:
				recipe.emit(id)
			else:
				piece.emit(id))
		list.add_child(b)
