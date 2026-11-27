#!/usr/bin/env python3
"""Refaz a margem oeste da Propriedade como fazenda organizada (pedido do Junior).

Lê dados/propriedade-v51.json (o mapa extraído do jogo publicado, preservado como está)
e grava dados/propriedade.json. A margem leste, o rio, as pontes e as placas de saída ficam
como no original; a margem oeste vira:

  - casa no centro da margem oeste, com poço e casinha do cachorro;
  - horta grande ao norte da casa (inclui os canteiros iniciais 21–29 × 20–24, então saves
    antigos continuam com a horta no lugar);
  - pomar em fileiras a oeste da casa;
  - campo aberto ao sul para galinheiro, curral e outros abrigos, com um piquete cercado;
  - pátio da oficina perto da ponte norte;
  - lago com areia e juncos a sudoeste;
  - pedreira com rochas e minério de ferro no canto noroeste;
  - mata fechada nas bordas e estradas de terra ligando pontes e saídas.

Depois rode:  godot --headless --path godot-teste --script res://ferramentas/montar_propriedade.gd
"""
import json
import random
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
SRC = BASE / "dados" / "propriedade-v51.json"
DST = BASE / "dados" / "propriedade.json"
T = 32
W, H = 96, 72

# Centro da casa (base da arte) e itens ao redor. Repetidos em scripts/mapa_fazenda.gd.
HOUSE = (752, 1152)
WELL = (HOUSE[0] + 224, HOUSE[1] - 4)
PLAYER = (HOUSE[0], HOUSE[1] + 78)
GARDEN = (17, 20, 29, 27)          # x0, y0, x1, y1 (inclusive), terra de plantio
ROAD_X = (33, 34)                  # estrada norte–sul (colunas)
NORTH_ROAD_Y = (18, 19)            # estrada da ponte norte
SOUTH_ROAD_Y = (52, 53)            # estrada da saída oeste até a ponte sul
SOUTH_EXIT_X = (26, 27)            # estrada até a saída sul
WORKSHOP = (36, 21, 39, 28)        # pátio da oficina
POND = (4, 55, 11, 61)             # lago (água), com borda de areia
QUARRY = (3, 4, 9, 9)              # pedreira (musgo)
PADDOCK_OFFSET = (-160, 1024)      # desloca o cercado antigo (x 400–624, y 336–528)
ORCHARD_X = [144, 256, 368, 480]
ORCHARD_Y = [1000, 1112, 1224]
ORCHARD_SCALE = 0.58               # árvores frutíferas menores que as da mata

rng = random.Random(51)


def rect_tiles(x0, y0, x1, y1):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            yield x, y


def main() -> None:
    data = json.loads(SRC.read_text())
    tiles = [row[:] for row in data["tiles"]]

    # Onde começa o rio em cada linha (corrida de água que alcança a coluna 44).
    river_start = []
    for y in range(H):
        row = tiles[y]
        x = 44
        while x > 0 and row[x - 1] == "water":
            x -= 1
        if row[44] != "water":
            x = min([i for i in range(40, 50) if row[i] == "water"] or [42])
        river_start.append(x)

    def west(x, y):
        return x < river_start[y] - 1

    # 1) Terreno da margem oeste.
    for y in range(H):
        for x in range(W):
            if not west(x, y):
                continue
            border = x <= 2 or y <= 3 or y >= 67
            tiles[y][x] = "forest" if border else "grass"
        # Faixa de areia entre a fazenda e o rio.
        if river_start[y] - 1 >= 0:
            tiles[y][river_start[y] - 1] = "sand"
    # Margens do rio: faixa contínua de areia nos dois lados (antes eram manchas soltas).
    river = {(x, y) for y in range(H) for x in range(30, 62) if tiles[y][x] == "water"}
    for (x, y) in river:
        for dy in (-1, 0, 1):
            for dx in (-2, -1, 0, 1, 2):
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and tiles[ny][nx] not in ("water", "path-dry", "path-wet"):
                    if abs(dx) <= 1 or (nx + ny * 7) % 3 == 0:
                        tiles[ny][nx] = "sand"
    # Campo (prado) no pomar e no pasto ao sul.
    for x, y in rect_tiles(3, 29, 16, 40):
        tiles[y][x] = "meadow"
    for x, y in rect_tiles(15, 40, 32, 50):
        tiles[y][x] = "meadow"
    for x, y in rect_tiles(*QUARRY):
        tiles[y][x] = "moss"
    for x, y in rect_tiles(*GARDEN):
        tiles[y][x] = "soil"
    for x, y in rect_tiles(*WORKSHOP):
        tiles[y][x] = "path-dry"
    # Lago com borda de areia.
    px0, py0, px1, py1 = POND
    for x, y in rect_tiles(px0 - 1, py0 - 1, px1 + 1, py1 + 1):
        tiles[y][x] = "sand"
    for x, y in rect_tiles(*POND):
        corner = (x in (px0, px1)) and (y in (py0, py1))
        tiles[y][x] = "sand" if corner else "water"
    # Estradas.
    def road(x, y):
        if 0 <= x < W and 0 <= y < H and tiles[y][x] != "water":
            tiles[y][x] = "path-dry"
    for y in NORTH_ROAD_Y:
        for x in range(3, river_start[y]):
            road(x, y)
    for x in ROAD_X:
        for y in range(NORTH_ROAD_Y[0], SOUTH_ROAD_Y[1] + 1):
            road(x, y)
    for y in SOUTH_ROAD_Y:
        for x in range(0, river_start[y]):
            road(x, y)
    for x in SOUTH_EXIT_X:
        for y in range(SOUTH_ROAD_Y[0], H):
            road(x, y)
    # Caminho da porta: desce da casa e segue para a estrada principal.
    door_x = HOUSE[0] // T
    for y in range(HOUSE[1] // T, HOUSE[1] // T + 3):
        for x in (door_x - 1, door_x):
            road(x, y)
    for x in range(door_x - 1, ROAD_X[0]):
        for y in (HOUSE[1] // T + 2, HOUSE[1] // T + 3):
            road(x, y)
    # Trilha estreita da horta até a estrada norte.
    for y in range(NORTH_ROAD_Y[1], GARDEN[1]):
        road(23, y)
    # Trilha do pomar e do lago ligando à estrada sul.
    for y in range(HOUSE[1] // T + 2, SOUTH_ROAD_Y[0]):
        road(16, y)

    # 2) Objetos: a margem leste e as pontes ficam; a oeste só a mata das bordas.
    def tile_of(o):
        return int(o["x"]) // T, int(o["y"]) // T

    keep = []
    removed = 0
    for o in data["objs"]:
        x, y = tile_of(o)
        art = o["arte"]
        tx, ty = min(x, W - 1), min(y, H - 1)
        is_tree = art.startswith("asset-tree") or art.startswith("asset-pine")
        # Árvores em cima da areia da margem, da estrada ou da água (ex.: na cabeceira da ponte).
        if is_tree and tiles[ty][tx] in ("sand", "path-dry", "path-wet", "water"):
            removed += 1
            continue
        if art.startswith("bridge-") or art.startswith("exit-sign") or not west(tx, ty):
            keep.append(o)
            continue
        is_tree = art.startswith("asset-tree") or art.startswith("asset-pine")
        if is_tree and tiles[min(y, H - 1)][min(x, W - 1)] == "forest":
            keep.append(o)
        else:
            removed += 1

    # Tamanho e âncora de cada arte como no mapa original (quando a arte já existia lá).
    SIZES = {}
    for o in data["objs"]:
        SIZES.setdefault(o["arte"], (o["w"], o["h"], o["ox"], o["oy"]))

    def obj(art, x, y, w, h, ox=0.5, oy=1.0, flip=False):
        if art in SIZES:
            w, h, ox, oy = SIZES[art]
        return {"x": x, "y": y, "ox": ox, "oy": oy, "w": w, "h": h, "flip": flip, "depth": y, "arte": art}

    TREE_SIZE = {"asset-tree-0.png": (188, 239), "asset-tree-1.png": (196, 249), "asset-tree-2.png": (204, 259),
                 "asset-pine-0.png": (220, 280), "asset-pine-1.png": (210, 268), "asset-pine-2.png": (200, 255)}
    # Pega o tamanho real usado no mapa original para cada arte de árvore.
    for o in data["objs"]:
        if o["arte"] in TREE_SIZE:
            TREE_SIZE[o["arte"]] = (o["w"], o["h"])

    def tree(art, x, y, flip=None, scale=1.0):
        w, h = TREE_SIZE[art]
        o = obj(art, x, y, w, h, 0.5, 0.9696969696969697, rng.random() < 0.5 if flip is None else flip)
        o["w"], o["h"] = round(w * scale), round(h * scale)
        return o

    new = []
    # Mata das bordas: completa os vazios com árvores e pinheiros em grade solta.
    occupied = {(tile_of(o)) for o in keep}
    def near_taken(x, y, r=1):
        return any((x + dx, y + dy) in occupied for dx in range(-r, r + 1) for dy in range(-r, r + 1))
    for y in range(1, H, 2):
        for x in range(0, W, 2):
            if not west(x, y) or tiles[y][x] != "forest" or near_taken(x, y):
                continue
            art = rng.choice(["asset-pine-0.png", "asset-pine-1.png", "asset-pine-2.png", "asset-tree-0.png", "asset-tree-1.png", "asset-tree-2.png"])
            px = x * T + 16 + rng.randint(-8, 8)
            py = y * T + 24 + rng.randint(-6, 6)
            new.append(tree(art, px, py))
            occupied.add((x, y))

    # Casa, poço e casinha do cachorro.
    new.append(obj("asset-house.png", HOUSE[0], HOUSE[1], 256, 224))
    new.append(obj("property-well-idle.png", WELL[0], WELL[1], 108, 108))
    new.append(obj("pet-shelter-0-shelter.png", HOUSE[0] - 176, HOUSE[1] + 8, 81, 73))
    # Canteiro de flores e moitas em volta da casa (as moitas dão fibra).
    for dx in (-112, -80, 96, 128):
        new.append(obj("forest-detail-flowers.png", HOUSE[0] + dx, HOUSE[1] + 30, 40, 34))
    for (x, y) in [(HOUSE[0] - 150, HOUSE[1] - 40), (HOUSE[0] + 150, HOUSE[1] - 120)]:
        new.append(obj("forest-detail-bush.png", x, y, 56, 44))

    # Pomar em fileiras a oeste da casa.
    # Árvores do pomar da V51 (src/data/orchard-art.ts): tamanho e pivô originais.
    FRUIT = [("orchard-apple.png", 154, 147), ("orchard-pear.png", 143, 155), ("orchard-orange.png", 161, 153)]
    for j, y in enumerate(ORCHARD_Y):
        for i, x in enumerate(ORCHARD_X):
            art, w, h = FRUIT[(i + j) % 3]
            new.append({"x": x + (16 if j % 2 else 0), "y": y, "ox": 0.5, "oy": 0.96, "w": round(w * 0.8), "h": round(h * 0.8),
                        "flip": (i + j) % 2 == 1, "depth": y, "arte": art})
    for x in (224, 352, 480):
        new.append(obj("asset-berry-bush.png", x, 1300, 52, 44))

    # Piquete cercado (o cercado antigo do quintal, deslocado) no pasto.
    for o in data["objs"]:
        a = o["arte"]
        if (a.startswith("fence-new-") or a.startswith("gate-")) and o["x"] < 700 and o["y"] < 600:
            m = dict(o)
            m["x"] = o["x"] + PADDOCK_OFFSET[0]
            m["y"] = o["y"] + PADDOCK_OFFSET[1]
            m["depth"] = o["depth"] + PADDOCK_OFFSET[1]
            new.append(m)
    new.append(obj("ecology-herbs.png", 300, 1440, 40, 36))
    # Capim alto no pasto: dá capim fresco (silo e composteira).
    for (x, y) in [(16, 41), (22, 44), (28, 41), (31, 48), (18, 48), (25, 49)]:
        new.append(obj("forest-detail-reeds.png", x * T + 16, y * T + 24, 36, 40))

    # Campo norte: árvores isoladas, moitas e flores soltas no capim (sem bloquear a estrada).
    lone = [(9, 8), (17, 6), (27, 9), (35, 6), (13, 14), (31, 14), (38, 11)]
    for i, (x, y) in enumerate(lone):
        art = ["asset-tree-1.png", "asset-tree-2.png", "asset-tree-0.png"][i % 3]
        new.append(tree(art, x * T + 16, y * T + 24, None, 0.8 if i % 2 else 0.9))
    meadow_bits = [("forest-detail-flowers.png", 12, 10), ("forest-detail-bush.png", 21, 12), ("forest-detail-flowers.png", 24, 6),
                   ("asset-berry-bush.png", 30, 11), ("forest-detail-flowers.png", 33, 15), ("forest-detail-fern.png", 6, 13),
                   ("forest-detail-flowers.png", 19, 15), ("forest-detail-bush.png", 37, 15), ("asset-new-branches.png", 15, 9)]
    for art, x, y in meadow_bits:
        new.append(obj(art, x * T + 16, y * T + 26, 48, 40))

    # Pátio da oficina: tronco, sucata e pedras para começar a fabricar.
    wx0, wy0, wx1, wy1 = WORKSHOP
    new.append(obj("forest-detail-log.png", (wx0 + 1) * T, (wy1 - 1) * T + 20, 96, 48))
    new.append(obj("asset-scrap.png", (wx1) * T, (wy0 + 1) * T + 20, 48, 40))
    new.append(obj("asset-scrap.png", (wx1 - 1) * T, (wy0 + 4) * T + 20, 48, 40))
    new.append(obj("asset-small-stones.png", (wx0 + 2) * T, (wy0 + 2) * T + 20, 44, 30))
    new.append(obj("asset-new-branches.png", (wx0 + 3) * T, (wy1) * T + 20, 60, 40))

    # Lago: juncos, pedras e cogumelos na beira.
    px0, py0, px1, py1 = POND
    for x in range(px0, px1 + 1, 2):
        new.append(obj("forest-detail-reeds.png", x * T + 16, (py0 - 1) * T + 24, 36, 40))
    new.append(obj("lake-rock-1.png", (px1 + 2) * T, (py0 + 2) * T + 24, 70, 54))
    new.append(obj("lake-rock-0.png", (px0 - 1) * T + 8, (py1 + 1) * T + 24, 64, 50))
    new.append(obj("forest-detail-fern.png", (px1 + 2) * T, (py1) * T, 48, 40))

    # Pedreira no canto noroeste: rochas e minério.
    qx0, qy0, qx1, qy1 = QUARRY
    rocks = ["lake-rock-0.png", "lake-rock-1.png", "lake-rock-2.png"]
    spots = [(qx0, qy0 + 1), (qx0 + 2, qy0), (qx0 + 4, qy0 + 2), (qx0 + 1, qy0 + 4), (qx0 + 5, qy0 + 4)]
    for i, (x, y) in enumerate(spots):
        new.append(obj(rocks[i % 3], x * T + 16, y * T + 28, 70, 54))
    ore = [o for o in data["objs"] if o["arte"] == "detailed-ore-atlas-iron.png"][0]
    for (x, y) in [(qx0 + 3, qy0 + 3), (qx0 + 6, qy0 + 1), (qx0 + 6, qy0 + 5)]:
        m = dict(ore)
        m["x"], m["y"], m["depth"] = x * T + 16, y * T + 28, y * T + 28
        new.append(m)
    new.append(obj("asset-small-stones.png", (qx1 - 1) * T, (qy1) * T + 20, 44, 30))

    # Recursos soltos na beira da mata (galhos, ervas, cogumelos, fibras), longe das estradas.
    extras = [("asset-new-branches.png", 60, 40), ("forest-detail-mushrooms.png", 40, 34), ("ecology-herbs.png", 40, 36),
              ("forest-detail-bush.png", 56, 44), ("asset-small-stones.png", 44, 30), ("forest-detail-fern.png", 48, 40)]
    edge = [(x, y) for y in range(4, 63) for x in (3, 4) if west(x, y) and tiles[y][x] == "grass"]
    edge += [(x, 4) for x in range(10, 32) if tiles[4][x] == "grass"]
    edge += [(x, 62) for x in range(12, 24) if tiles[62][x] == "grass"]
    rng.shuffle(edge)
    for i, (x, y) in enumerate(edge[:18]):
        art, w, h = extras[i % len(extras)]
        new.append(obj(art, x * T + 16, y * T + 26, w, h))

    data["tiles"] = tiles
    data["objs"] = keep + new
    data["player"] = {"x": PLAYER[0], "y": PLAYER[1]}
    DST.write_text(json.dumps(data, ensure_ascii=False))
    print(f"oeste removidos: {removed} · mantidos: {len(keep)} · novos: {len(new)} · total: {len(data['objs'])}")


if __name__ == "__main__":
    main()
