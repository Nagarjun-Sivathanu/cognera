"""Measures the drawn-pixel bounding box of each sprite sheet animation.

Sprites in the asset packs are anchored inconsistently inside their frames (small
mobs float mid-frame, big ones sit on the frame's bottom edge), so rendering them
with a naive centred crop hides the large ones entirely. The game aligns sprites
by their measured content box instead; this script produces those numbers.

Run: python scripts/measure_sprites.py
"""

import json
import os

from PIL import Image

SHEETS = [
    # (label, path, frame_width, frame_height, frame_count, row)
    ("rabbit", "public/sprites/enemies/rabbit-idle.png", 128, 128, 4, 0),
    ("rabbit-horned", "public/sprites/enemies/rabbit-horned-idle.png", 128, 128, 4, 0),
    ("zombie5", "public/sprites/enemies/zombie5-idle.png", 128, 128, 4, 0),
    ("zombie6", "public/sprites/enemies/zombie6-idle.png", 128, 128, 4, 0),
    ("cat", "public/sprites/enemies/cat-idle.png", 128, 128, 5, 0),
    ("badger", "public/sprites/enemies/badger-idle.png", 128, 128, 5, 0),
    ("frogger", "public/sprites/enemies/frogger-idle.png", 128, 128, 5, 0),
    ("pengu", "public/sprites/enemies/pengu-idle.png", 128, 128, 5, 0),
    # Dino Tri's sheet is 6 frames of 384x128 - NOT 18 frames of 128px.
    ("dino", "public/sprites/enemies/dino-idle.png", 384, 128, 6, 0),
    ("gollux", "public/sprites/enemies/gollux-idle.png", 128, 128, 5, 0),
    ("player-idle", "public/sprites/player/idle.png", 128, 128, 4, 0),
    ("player-attack", "public/sprites/player/attack.png", 128, 128, 6, 0),
]


def union_box(path, fw, fh, count, row):
    """Union of every frame's alpha bounding box, in frame-local pixels."""
    im = Image.open(path).convert("RGBA")
    boxes = []
    for col in range(count):
        frame = im.crop((col * fw, row * fh, (col + 1) * fw, (row + 1) * fh))
        bb = frame.getbbox()
        if bb:
            boxes.append(bb)
    if not boxes:
        return None
    x0 = min(b[0] for b in boxes)
    y0 = min(b[1] for b in boxes)
    x1 = max(b[2] for b in boxes)
    y1 = max(b[3] for b in boxes)
    return {"x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0}


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)
    out = {}
    for label, path, fw, fh, count, row in SHEETS:
        box = union_box(path, fw, fh, count, row)
        out[label] = box
        print(f"{label:15s} frame={fw}x{fh} x{count}  content={box}")
    print()
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
