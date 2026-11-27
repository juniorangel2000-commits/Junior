extends CanvasLayer
signal transfer(item: String,to_chest: bool,amount: int)
signal close_requested
var panel: PanelContainer
var left: VBoxContainer
var right: VBoxContainer
var amount: SpinBox
var names: Callable

func _ready() -> void:
	layer=16
	panel=PanelContainer.new()
	panel.theme=preload("res://scripts/tema_ui.gd").theme()
	add_child(panel)
	panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	panel.offset_left=-320
	panel.offset_right=320
	panel.offset_top=-225
	panel.offset_bottom=225
	var col:=VBoxContainer.new()
	panel.add_child(col)
	var header:=HBoxContainer.new()
	col.add_child(header)
	var title:=Label.new()
	title.text="Baú da casa · escolha a quantidade"
	header.add_child(title)
	amount=SpinBox.new()
	amount.min_value=1
	amount.max_value=999999
	amount.value=1
	header.add_child(amount)
	var close:=Button.new()
	close.text="Fechar"
	close.focus_mode=Control.FOCUS_NONE
	close.pressed.connect(func(): close_requested.emit())
	header.add_child(close)
	var row:=HBoxContainer.new()
	col.add_child(row)
	for i in 2:
		var side:=VBoxContainer.new()
		row.add_child(side)
		var label:=Label.new()
		label.text="Mochila → baú" if i==0 else "Baú → mochila"
		side.add_child(label)
		var scroll:=ScrollContainer.new()
		scroll.custom_minimum_size=Vector2(305,375)
		side.add_child(scroll)
		var items:=VBoxContainer.new()
		items.size_flags_horizontal=Control.SIZE_EXPAND_FILL
		scroll.add_child(items)
		if i==0:
			left=items
		else:
			right=items
	panel.hide()

func update_items(stock: Dictionary,chest: Dictionary) -> void:
	for i in 2:
		var list:=left if i==0 else right
		var data:=stock if i==0 else chest
		for child in list.get_children():
			list.remove_child(child)
			child.queue_free()
		for item in data:
			if data[item]<=0 or item=="wateringCan":
				continue
			var b:=Button.new()
			b.focus_mode=Control.FOCUS_NONE
			b.text="%s ×%d" % [names.call(item) if names.is_valid() else item,data[item]]
			b.pressed.connect(func(): transfer.emit(item,i==0,int(amount.value)))
			list.add_child(b)

func show_menu(value: bool) -> void:
	panel.visible=value
