"""Pack the supplied animation frames without redrawing, resizing or trimming pixels."""
from pathlib import Path
from zipfile import ZipFile
from io import BytesIO
from hashlib import sha256
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/dungeons/animacoes-demolidor/demolidor-original.zip"
OUT = ROOT / "public/assets/visual/dungeons"
DIRECTIONS = ["south", "west", "east", "north"]

with ZipFile(SOURCE) as archive:
    metadata = json.loads(archive.read("metadata.json"))
    supplied = metadata["states"][0]["frames"]
    entries = []
    pivots = {}
    for direction in DIRECTIONS:
        frames = supplied["animations"]["Walking"][direction]
        assert len(frames) == 4, (direction, len(frames))
        entries.extend((f"{direction}-{i}", name) for i, name in enumerate(frames))
    entries.extend((f"idle-{direction}", supplied["rotations"][direction]) for direction in DIRECTIONS)
    atlas = Image.new("RGBA", (1024, 1280))
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
    assert len(entries) == 20
    # Check exact RGBA parity before encoding the combined atlas.
    for key, r in rectangles.items():
        region = atlas.crop((r["x"], r["y"], r["x"] + 256, r["y"] + 256))
        assert region.tobytes() == originals[key], key
    file = OUT / "boss-demolisher.png"
    atlas.save(file)
    manifest = dict(
        file="assets/visual/dungeons/boss-demolisher.png",
        sha256=sha256(file.read_bytes()).hexdigest(),
        alphaCutoff=160,
        frames=rectangles,
        animation=dict(walkFrames=4, frameRate=5, referenceHeight=184,
                       canvasSize=256, pivots=pivots),
        sourceArchive=dict(file=str(SOURCE.relative_to(ROOT)),
                           sha256=sha256(SOURCE.read_bytes()).hexdigest()),
        sources=sources,
    )
    (OUT / "boss-demolisher.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print("20 frames packed; original RGBA pixels preserved; four walk directions and four idle views.")
