@tool
extends ColorRect
## Desenha o terreno a partir da camada "Pintura": cada bloco pintado vira o material dele.
## Funciona também no editor: pintou, o terreno muda na hora.

const MATERIAIS := ["grass", "forest", "meadow", "path-dry", "path-wet", "soil", "sand", "moss", "water"]
const NOMES := ["Grama", "Floresta", "Campo", "Estrada seca", "Estrada úmida", "Terra de plantio", "Areia", "Musgo", "Água"]

@export var pintura: TileMapLayer
var _mapa := Image.create(96, 72, false, Image.FORMAT_L8)
var _pendente := true

func _ready() -> void:
	if pintura and not pintura.changed.is_connected(_marcar):
		pintura.changed.connect(_marcar)
	_atualizar()

func _marcar() -> void:
	_pendente = true

func _process(_delta: float) -> void:
	if _pendente:
		_atualizar()

func _atualizar() -> void:
	_pendente = false
	if not pintura or not material:
		return
	for y in 72:
		for x in 96:
			var c := pintura.get_cell_atlas_coords(Vector2i(x, y))
			_mapa.set_pixel(x, y, Color8(maxi(c.x, 0), 0, 0))
	(material as ShaderMaterial).set_shader_parameter("mapa", ImageTexture.create_from_image(_mapa))

## Material no ponto (em pixels do mundo): usado pelo jogador para não entrar na água.
func material_em(p: Vector2) -> String:
	if not pintura:
		return "grass"
	var c := pintura.get_cell_atlas_coords(Vector2i(floori(p.x / 32.0), floori(p.y / 32.0)))
	return MATERIAIS[maxi(c.x, 0)]
