"""Builds playable character sprite sheets from the "Elementals" packs.

The packs ship one PNG per frame in per-animation folders. This packs each
animation into a single horizontal strip at the source's native 288x128 frame
size, which keeps every animation of a character on identical geometry - so the
character never jumps or resizes when it switches animation.

It also prints the anchor box the renderer needs: the idle pose's bounding box,
with its horizontal centre forced to the frame centre. The artists centre the
body in the frame and let weapons hang outside it, so centring on the raw bbox
would shove long-weapon characters (the knight's sword, the ranger's bow) off to
one side.

Run: python scripts/build_characters.py
"""

import glob
import json
import os

from PIL import Image

SRC_ROOT = r"C:\Users\nagun\Downloads\Assets\Charectors"
OUT_ROOT = os.path.join("public", "sprites", "characters")

FRAME_W, FRAME_H = 288, 128
FRAME_CENTRE_X = FRAME_W // 2

# game animation -> source folder name, per character pack
CHARACTERS = {
    "fire-knight": {
        "dir": os.path.join("Elementals_fire_knight_FREE_v1.1", "png", "fire_knight"),
        "anims": {
            "idle": "01_idle",
            "attack": "05_1_atk",
            "attack2": "06_2_atk",
            "attack3": "07_3_atk",
            "special": "08_sp_atk",
            "defend": "09_defend",
            "hurt": "10_take_hit",
            "death": "11_death",
        },
    },
    "ground-monk": {
        "dir": os.path.join("Elementals_ground_monk_FREE_v1.3", "png"),
        "anims": {
            "idle": "idle",
            "attack": "1_atk",
            "attack2": "2_atk",
            "attack3": "3_atk",
            "special": "sp_atk",
            "meditate": "meditate",
            "defend": "defend",
            "hurt": "take_hit",
            "death": "death",
        },
    },
    "leaf-ranger": {
        "dir": os.path.join("Elementals_Leaf_ranger_Free_v1.0", "animations", "PNG"),
        "anims": {
            "idle": "idle",
            "attack": "1_atk",
            "attack2": "2_atk",
            "attack3": "3_atk",
            "special": "sp_atk",
            "defend": "defend",
            "hurt": "take_hit",
            "death": "death",
        },
    },
    "wind-hashashin": {
        "dir": os.path.join("elementals_wind_hashashin_FREE_v1.1", "PNG"),
        "anims": {
            "idle": "idle",
            "attack": "1_atk",
            "attack2": "2_atk",
            "attack3": "3_atk",
            "special": "sp_atk",
            "defend": "defend",
            "hurt": "take_hit",
            "death": "death",
        },
    },
}

# The Leaf Ranger is the only pack shipping standalone projectile/impact art; these
# play over the enemy when its skills land. 256x128 frames, unlike the 288x128 bodies.
RANGER_FX_DIR = os.path.join(
    "Elementals_Leaf_ranger_Free_v1.0", "animations", "PNG", "projectiles_and_effects"
)
RANGER_FX = {
    "ranger-poison": ("arrow_hit_poison", 256, 128),
    "ranger-entangle": ("arrow_hit_entangle", 256, 128),
    "ranger-shower": ("arrow_shower_effect", 256, 128),
}


def frame_files(folder):
    """Frames sorted by their trailing number, not lexically (so 10 follows 9)."""
    files = glob.glob(os.path.join(folder, "*.png"))

    def key(path):
        stem = os.path.splitext(os.path.basename(path))[0]
        digits = "".join(ch for ch in stem.split("_")[-1] if ch.isdigit())
        return int(digits) if digits else 0

    return sorted(files, key=key)


def build_strip(folder, out_path, frame_w=FRAME_W, frame_h=FRAME_H):
    files = frame_files(folder)
    if not files:
        raise SystemExit(f"no frames in {folder}")
    strip = Image.new("RGBA", (frame_w * len(files), frame_h), (0, 0, 0, 0))
    for i, f in enumerate(files):
        im = Image.open(f).convert("RGBA")
        if im.size != (frame_w, frame_h):
            raise SystemExit(f"{f} is {im.size}, expected {(frame_w, frame_h)}")
        strip.alpha_composite(im, (i * frame_w, 0))
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    strip.save(out_path, optimize=True)
    return len(files)


def content_box(folder, frame_w, frame_h):
    """Union bbox across an effect's frames, used as its render anchor."""
    boxes = [Image.open(f).convert("RGBA").getbbox() for f in frame_files(folder)]
    boxes = [b for b in boxes if b]
    left = min(b[0] for b in boxes)
    top = min(b[1] for b in boxes)
    right = max(b[2] for b in boxes)
    bottom = max(b[3] for b in boxes)
    return {"x": left, "y": top, "w": right - left, "h": bottom - top}


def idle_anchor(folder):
    """Union bbox of the idle animation, re-centred on the frame's centre line."""
    boxes = []
    for f in frame_files(folder):
        bb = Image.open(f).convert("RGBA").getbbox()
        if bb:
            boxes.append(bb)
    top = min(b[1] for b in boxes)
    bottom = max(b[3] for b in boxes)
    left = min(b[0] for b in boxes)
    right = max(b[2] for b in boxes)
    # Widen symmetrically about the frame centre so the body, not the weapon, centres.
    half = max(FRAME_CENTRE_X - left, right - FRAME_CENTRE_X)
    return {
        "x": FRAME_CENTRE_X - half,
        "y": top,
        "w": half * 2,
        "h": bottom - top,
    }


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)

    manifest = {}
    for char_id, spec in CHARACTERS.items():
        src_dir = os.path.join(SRC_ROOT, spec["dir"])
        anchor = idle_anchor(os.path.join(src_dir, spec["anims"]["idle"]))
        anims = {}
        for anim, folder in spec["anims"].items():
            out = os.path.join(OUT_ROOT, char_id, f"{anim}.png")
            count = build_strip(os.path.join(src_dir, folder), out)
            anims[anim] = count
            print(f"{char_id:16s} {anim:8s} {count:2d} frames -> {out}")
        manifest[char_id] = {"anchor": anchor, "frames": anims}
        print(f"{char_id:16s} anchor={anchor}\n")

    fx = {}
    for fx_id, (folder, fw, fh) in RANGER_FX.items():
        src = os.path.join(SRC_ROOT, RANGER_FX_DIR, folder)
        out = os.path.join("public", "sprites", "vfx", f"{fx_id}.png")
        count = build_strip(src, out, fw, fh)
        fx[fx_id] = {
            "frameWidth": fw,
            "frameHeight": fh,
            "frameCount": count,
            "content": content_box(src, fw, fh),
        }
        print(f"{fx_id:16s} {count:2d} frames -> {out}")

    print(json.dumps({"characters": manifest, "vfx": fx}, indent=2))


if __name__ == "__main__":
    main()
