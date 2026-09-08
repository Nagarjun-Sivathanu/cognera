"""Slices the text_npc sheets into transparent sprite strips.

The source sheets are 1800x1200 on a flat grey background, with a text label column
down the left ("IDLE", "DIALOGUE", "WALK", "SELL") and four animation rows. This
keys out the grey, drops the label column, finds the real frame grid from the pixel
data rather than assuming one, and writes one horizontal strip per animation.

Run: python scripts/build_npcs.py
"""

import os

from PIL import Image

SRC_DIR = os.path.join("Assets", "text_npc")
OUT_DIR = os.path.join("public", "sprites", "npc")

NPCS = {
    "bard": "bard.webp",
    "smith": "black smith.webp",
    "chopper": "choper.webp",
    "maid": "maid.webp",
}

ROWS = ["idle", "dialogue", "walk", "sell"]
LABEL_COLUMN_END = 260  # the text labels live left of this
TOLERANCE = 26  # how close to the background colour still counts as background


def key_out_background(im):
    """Makes the flat grey backdrop transparent, sampling it from a corner pixel."""
    im = im.convert("RGBA")
    bg = im.getpixel((5, 5))[:3]
    pixels = im.load()
    width, height = im.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if abs(r - bg[0]) <= TOLERANCE and abs(g - bg[1]) <= TOLERANCE and abs(b - bg[2]) <= TOLERANCE:
                pixels[x, y] = (r, g, b, 0)
    return im


def column_runs(im, top, bottom):
    """Column ranges containing drawn pixels - one run per sprite frame."""
    alpha = im.split()[3]
    px = alpha.load()
    width = im.size[0]
    runs = []
    start = None
    for x in range(LABEL_COLUMN_END, width):
        occupied = any(px[x, y] > 0 for y in range(top, bottom))
        if occupied and start is None:
            start = x
        elif not occupied and start is not None:
            runs.append((start, x))
            start = None
    if start is not None:
        runs.append((start, width))
    # Drop specks left by the keying pass.
    return [(a, b) for a, b in runs if b - a > 12]


def tallest_island(frame):
    """Bounding box of the frame's largest vertical run of drawn pixels.

    Each row band carries a sliver of the next band's text label along its bottom
    edge, which survives the colour keying. Keeping only the tallest island discards
    it without having to guess at exact label heights.
    """
    alpha = frame.split()[3]
    px = alpha.load()
    width, height = frame.size
    occupied = [any(px[x, y] > 0 for x in range(width)) for y in range(height)]

    islands = []
    start = None
    for y, filled in enumerate(occupied):
        if filled and start is None:
            start = y
        elif not filled and start is not None:
            islands.append((start, y))
            start = None
    if start is not None:
        islands.append((start, height))
    if not islands:
        return None

    top, bottom = max(islands, key=lambda pair: pair[1] - pair[0])
    band = frame.crop((0, top, width, bottom))
    bbox = band.getbbox()
    return None if not bbox else (bbox[0], top + bbox[1], bbox[2], top + bbox[3])


def drop_slivers(frames):
    """Discards slicing artefacts - partial figures leaked in from a neighbouring row.

    A row's real frames are all the same character at the same size, so anything much
    shorter than the row's median is not a frame. Without this, an eight-frame strip
    ends with a cropped fragment that flashes past once per animation cycle.
    """
    if len(frames) < 3:
        return frames
    heights = sorted(box[3] - box[1] for box in frames)
    median = heights[len(heights) // 2]
    return [box for box in frames if (box[3] - box[1]) >= median * 0.7]


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)
    os.makedirs(OUT_DIR, exist_ok=True)
    manifest = {}

    for npc_id, filename in NPCS.items():
        src = Image.open(os.path.join(SRC_DIR, filename))
        keyed = key_out_background(src)
        width, height = keyed.size
        row_height = height // len(ROWS)

        # One shared frame box across every row keeps the NPC from jittering between
        # animations, so measure the union first.
        boxes = {}
        for index, row in enumerate(ROWS):
            top, bottom = index * row_height, (index + 1) * row_height
            runs = column_runs(keyed, top, bottom)
            if not runs:
                continue
            frames = []
            for left, right in runs:
                frame = keyed.crop((left, top, right, bottom))
                bbox = tallest_island(frame)
                if bbox:
                    frames.append((left + bbox[0], top + bbox[1], left + bbox[2], top + bbox[3]))
            frames = drop_slivers(frames)
            if frames:
                boxes[row] = frames

        widest = max((b[2] - b[0]) for frames in boxes.values() for b in frames)
        tallest = max((b[3] - b[1]) for frames in boxes.values() for b in frames)
        frame_w, frame_h = widest + 4, tallest + 4

        counts = {}
        for row, frames in boxes.items():
            strip = Image.new("RGBA", (frame_w * len(frames), frame_h), (0, 0, 0, 0))
            for i, (x0, y0, x1, y1) in enumerate(frames):
                sprite = keyed.crop((x0, y0, x1, y1))
                # Centre horizontally, sit on the floor line, so feet line up.
                ox = i * frame_w + (frame_w - sprite.width) // 2
                oy = frame_h - sprite.height - 2
                strip.alpha_composite(sprite, (ox, oy))
            out = os.path.join(OUT_DIR, f"{npc_id}-{row}.png")
            strip.save(out, optimize=True)
            counts[row] = len(frames)
            print(f"{npc_id:9s} {row:9s} {len(frames)} frames -> {out}")

        manifest[npc_id] = {"frameWidth": frame_w, "frameHeight": frame_h, "frames": counts}
        print(f"{npc_id:9s} frame {frame_w}x{frame_h}\n")

    print(manifest)


if __name__ == "__main__":
    main()
