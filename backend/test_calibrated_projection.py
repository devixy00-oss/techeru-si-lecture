import struct
import json
import numpy as np
from PIL import Image

glb_path = r"frontend\public\models\teacher-cat.glb"
img_path = r"frontend\public\character\cat_isolated.png"

img = Image.open(img_path).convert("RGBA")
img_arr = np.array(img)

with open(glb_path, "rb") as f:
    f.seek(12)
    clen, ctype = struct.unpack("<II", f.read(8))
    gltf = json.loads(f.read(clen))
    blen, btype = struct.unpack("<II", f.read(8))
    bin_data = f.read(blen)

pos_acc = gltf["accessors"][1]
pos_bv = gltf["bufferViews"][pos_acc["bufferView"]]
offset_pos = pos_bv.get("byteOffset", 0) + pos_acc.get("byteOffset", 0)
positions = np.frombuffer(bin_data, dtype=np.float32, count=pos_acc["count"]*3, offset=offset_pos).reshape((-1, 3))

xmin, xmax = positions[:, 0].min(), positions[:, 0].max()
ymin, ymax = positions[:, 1].min(), positions[:, 1].max()

# 2D character bounding box in cat_isolated.png:
bx0, bx1 = 38, 222
by0, by1 = 53, 302
bw = bx1 - bx0
bh = by1 - by0

vertex_colors = np.zeros((len(positions), 4), dtype=np.uint8)

# Color palettes for back/fill:
ORANGE_FUR = np.array([242, 142, 42, 255], dtype=np.uint8)
DARK_STRIPE = np.array([160, 68, 12, 255], dtype=np.uint8)
NAVY_SUIT = np.array([28, 48, 86, 255], dtype=np.uint8)
CREAM_WHITE = np.array([252, 248, 240, 255], dtype=np.uint8)
BROWN_SHOE = np.array([84, 42, 16, 255], dtype=np.uint8)

for i, p in enumerate(positions):
    x, y, z = p
    u = (x - xmin) / (xmax - xmin)
    v = (ymax - y) / (ymax - ymin)
    
    px = int(np.clip(bx0 + u * bw, 0, img.width - 1))
    py = int(np.clip(by0 + v * bh, 0, img.height - 1))
    
    col = img_arr[py, px]
    
    # If front-facing and non-transparent
    if z >= -0.05 and col[3] > 40:
        vertex_colors[i] = col
    else:
        # Anatomical back shading
        if y < -0.75:
            vertex_colors[i] = BROWN_SHOE
        elif y < -0.22:
            vertex_colors[i] = NAVY_SUIT
        elif y < 0.28:
            if x < -0.22 and z < -0.05: # tail
                vertex_colors[i] = ORANGE_FUR if int(y * 24) % 2 == 0 else DARK_STRIPE
            else:
                vertex_colors[i] = NAVY_SUIT
        else: # Head & Ears
            vertex_colors[i] = ORANGE_FUR if int(y * 30 + x * 20) % 3 != 0 else DARK_STRIPE

# Render depth-sorted preview
W, H = 512, 512
preview = np.zeros((H, W, 4), dtype=np.uint8)
order = np.argsort(positions[:, 2])

for idx in order:
    p = positions[idx]
    c = vertex_colors[idx]
    px = int((p[0] - xmin) / (xmax - xmin + 1e-6) * (W - 1))
    py = int((ymax - p[1]) / (ymax - ymin + 1e-6) * (H - 1))
    if 0 <= px < W and 0 <= py < H:
        preview[py, px] = c

out_img = Image.fromarray(preview)
out_img.save(r"frontend\public\calibrated_mesh_preview.png")
print("Saved calibrated mesh preview to frontend/public/calibrated_mesh_preview.png")
