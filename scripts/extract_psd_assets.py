"""
Render clean, independent assets from the portfolio PSD.

Outputs (apps/web/static/board/):
  - board.png    : chalkboard frame + math sketches (NO text, avatar or icons)
                   Cleanly cropped to the wooden frame boundaries with zero white halo!
  - texture.jpg  : plain green chalkboard interior (for full-screen section boards)
  - avatar.png   : avatar cut-out with the PSD colour adjustments applied

Usage:  python scripts/extract_psd_assets.py
Requires: pip install psd-tools pillow scipy numpy
"""
import os
import time

import numpy as np
from PIL import Image
from psd_tools import PSDImage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PSD_PATH = os.path.join(ROOT, "psd", "tampilan_index_halaman_porto.psd")
OUT_DIR = os.path.join(ROOT, "apps", "web", "static", "board")
PREVIEW_PATH = os.path.join(ROOT, "psd", "extracted", "full_preview.png")

# Exact wooden frame bounding box in artboard coordinates (zero white artboard margin):
# Layer 1 was bbox=(193, 69, 1155, 714). The outer boundary of the wooden frame is at:
# left=193+7=200, top=69+11=80, right=193+955=1148, bottom=69+626=695.
CLEAN_BOARD_BOX = (200, 80, 1148, 695)    # 948 x 615 px
INTERIOR_ARTBOARD_BOX = (225, 105, 1123, 663) # green area inside wooden frame
AVATAR_BOX = (574, 242, 752, 452)         # Layer 2 bbox inside the artboard

ADJUSTMENT_KINDS = {"huesaturation", "vibrance", "brightnesscontrast"}
MATH_LAYERS = ["Layer 4", "Layer 4 copy", "Layer 4 copy 2"]


def render(keep: set[str]) -> np.ndarray:
    psd = PSDImage.open(PSD_PATH)
    artboard = psd[0]
    for layer in artboard:
        layer.visible = layer.name in keep or layer.kind in ADJUSTMENT_KINDS
    started = time.time()
    image = artboard.composite()
    print(f"rendered {sorted(keep)} in {time.time() - started:.1f}s", flush=True)
    return np.asarray(image.convert("RGBA")).astype(np.float32) / 255.0


def raw_layer_canvas(name: str, size: tuple[int, int]) -> np.ndarray:
    """Raw (unadjusted) layer pixels placed on an artboard-sized RGBA canvas."""
    psd = PSDImage.open(PSD_PATH)
    layer = next(l for l in psd[0] if l.name == name)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    canvas.paste(layer.topil().convert("RGBA"), (layer.left, layer.top))
    return np.asarray(canvas).astype(np.float32) / 255.0


def blend_if_mask(rgba: np.ndarray, black_lo: float = 169, black_hi: float = 176) -> np.ndarray:
    """Photoshop 'Blend If: This Layer' gray range with a split black slider."""
    lum = (0.3 * rgba[..., 0] + 0.59 * rgba[..., 1] + 0.11 * rgba[..., 2]) * 255.0
    return np.clip((lum - black_lo) / (black_hi - black_lo), 0.0, 1.0) * rgba[..., 3]


def main() -> int:
    os.makedirs(OUT_DIR, exist_ok=True)

    plain = render({"Layer 1"})                       # adjusted board, no sketches
    height, width = plain.shape[:2]
    size = (width, height)

    # 1. Plain interior texture for full-screen boards
    Image.fromarray((plain[..., :3] * 255).round().astype(np.uint8), "RGB") \
        .crop(INTERIOR_ARTBOARD_BOX).save(os.path.join(OUT_DIR, "texture.jpg"), quality=92)
    print("Saved texture.jpg", flush=True)

    # 2. Math sketches blended inside interior
    interior = np.zeros((height, width), dtype=np.float32)
    ix0, iy0, ix1, iy1 = INTERIOR_ARTBOARD_BOX
    interior[iy0:iy1, ix0:ix1] = 1.0

    color = plain[..., :3].copy()
    for name in MATH_LAYERS:
        over_board = render({"Layer 1", name})[..., :3]
        raw = raw_layer_canvas(name, size)
        raw[..., 3] = 1.0
        mask = blend_if_mask(raw) * interior
        color = color + (over_board - plain[..., :3]) * mask[..., None]

    # Crop to the wooden frame boundaries (zero artboard white halo)
    bx0, by0, bx1, by1 = CLEAN_BOARD_BOX
    cropped_color = color[by0:by1, bx0:bx1]
    ch, cw = cropped_color.shape[:2]

    # Alpha mask with smooth 4px corner rounding
    alpha = np.ones((ch, cw), dtype=np.float32)
    r = 4.0
    for y in range(int(r) + 1):
        for x in range(int(r) + 1):
            d = np.sqrt((r - x)**2 + (r - y)**2)
            if d > r:
                a = max(0.0, min(1.0, 1.0 - (d - r)))
                alpha[y, x] = a
                alpha[y, cw - 1 - x] = a
                alpha[ch - 1 - y, x] = a
                alpha[ch - 1 - y, cw - 1 - x] = a

    board = np.dstack([cropped_color, alpha])
    board_img = Image.fromarray((np.clip(board, 0, 1) * 255).round().astype(np.uint8), "RGBA")
    board_out_path = os.path.join(OUT_DIR, "board.png")
    board_img.save(board_out_path, optimize=True)
    print(f"Saved {board_out_path} ({cw}x{ch})", flush=True)

    # 3. Avatar: recover adjusted colours from (board + avatar) vs (board) renders
    with_avatar = render({"Layer 1", "Layer 2"})[..., :3]
    avatar_raw = raw_layer_canvas("Layer 2", size)
    av_alpha = avatar_raw[..., 3] * (230 / 255)          # layer fill opacity
    safe = np.maximum(av_alpha, 1e-3)[..., None]
    avatar_rgb = (with_avatar - (1 - av_alpha[..., None]) * plain[..., :3]) / safe
    avatar = np.dstack([np.clip(avatar_rgb, 0, 1), av_alpha])
    av_img = Image.fromarray((np.clip(avatar, 0, 1) * 255).round().astype(np.uint8), "RGBA")
    avatar_out_path = os.path.join(OUT_DIR, "avatar.png")
    av_img.crop(AVATAR_BOX).save(avatar_out_path, optimize=True)
    print(f"Saved {avatar_out_path}", flush=True)

    print("All assets successfully extracted!", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
