"""Pack the supplied animation frames without redrawing, resizing or trimming pixels."""
from pathlib import Path
from zipfile import ZipFile
from io import BytesIO
from hashlib import sha256
import json
import argparse
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("boss", choices=["demolisher", "sentinel", "chained", "contaminated", "devourer"])
args = parser.parse_args()
name = {"demolisher": "demolidor", "sentinel": "sentinela", "chained": "acorrentado", "contaminated": "contaminado", "devourer": "devorador"}[args.boss]
SOURCE = ROOT / f"docs/dungeons/animacoes-{name}/{name}-original.zip"
OUT = ROOT / "public/assets/visual/dungeons"
DIRECTIONS = ["south", "west", "east", "north"]

with ZipFile(SOURCE) as archive:
    metadata = json.loads(archive.read("metadata.json"))
    supplied = metadata["states"][0]["frames"]
    walk_count = len(supplied["animations"]["Walking"]["south"])
    assert 1 <= walk_count <= 16
    entries = []
    pivots = {}
    for direction in DIRECTIONS:
        frames = supplied["animations"]["Walking"][direction]
        assert len(frames) == walk_count, (direction, len(frames))
        entries.extend((f"{direction}-{i}", name) for i, name in enumerate(frames))
    entries.extend((f"idle-{direction}", supplied["rotations"][direction]) for direction in DIRECTIONS)
    atlas = Image.new("RGBA", (1024, (walk_count + 1) * 256))
    rectangles = {}
    sources = {}
    originals = {}
    for i, (key, name) in enumerate(entries):
        data = archive.read(name)
        image = Image.open(BytesIO(data))
        assert image.size == (256, 256) and image.mode == "RGBA", name
        x, y = (i % 4) * 256, (i // 4) * 256
        atlas.paste(image, (x, y))
        rectangles[key] = dict(x=x, y=y, width=256, height=256)
        sources[key] = dict(file=name, sha256=sha256(data).hexdigest())
        originals[key] = image.tobytes()
        if key.startswith("idle-"):
            bounds = image.getchannel("A").point(lambda a: 255 if a >= 160 else 0).getbbox()
            assert bounds is not None
            pivots[key[5:]] = dict(x=128, y=bounds[3] + 2)
    assert len(entries) == walk_count * 4 + 4
    # Check exact RGBA parity before encoding the combined atlas.
    for key, r in rectangles.items():
        region = atlas.crop((r["x"], r["y"], r["x"] + 256, r["y"] + 256))
        assert region.tobytes() == originals[key], key
    file = OUT / f"boss-{args.boss}.png"
    atlas.save(file)
    manifest = dict(
        file=f"assets/visual/dungeons/boss-{args.boss}.png",
        sha256=sha256(file.read_bytes()).hexdigest(),
        alphaCutoff=160,
        frames=rectangles,
        animation=dict(walkFrames=walk_count, frameRate=5, referenceHeight=184,
                       canvasSize=256, pivots=pivots),
        sourceArchive=dict(file=str(SOURCE.relative_to(ROOT)),
                           sha256=sha256(SOURCE.read_bytes()).hexdigest()),
        sources=sources,
    )
    (OUT / f"boss-{args.boss}.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"{len(entries)} frames packed; original RGBA pixels preserved; four walk directions and four idle views.")
