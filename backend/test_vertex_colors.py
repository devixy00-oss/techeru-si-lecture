import struct
import json
import numpy as np
from PIL import Image

glb_path = r"frontend\public\models\teacher-cat.glb"
img_path = r"frontend\public\character\pose_point.png"

ref_img = Image.open(img_path).convert("RGBA")
W_ref, H_ref = ref_img.size
img_arr = np.array(ref_img)

with open(glb_path, "rb") as f:
    f.seek(12)
    clen, ctype = struct.unpack("<II", f.read(8))
    gltf = json.loads(f.read(clen))
    blen, btype = struct.unpack("<II", f.read(8))
    bin_data = f.read(blen)

# Read positions
pos_acc = gltf["accessors"][1]
pos_bv = gltf["bufferViews"][pos_acc["bufferView"]]
offset_pos = pos_bv.get("byteOffset", 0) + pos_acc.get("byteOffset", 0)
positions = np.frombuffer(bin_data, dtype=np.float32, count=pos_acc["count"]*3, offset=offset_pos).reshape((-1, 3))

xmin, xmax = positions[:, 0].min(), positions[:, 0].max()
ymin, ymax = positions[:, 1].min(), positions[:, 1].max()
zmin, zmax = positions[:, 2].min(), positions[:, 2].max()

# Compute vertex colors by sampling the reference image
vertex_colors = np.zeros((len(positions), 4), dtype=np.uint8)

# Color palettes for back/fill:
ORANGE_FUR = np.array([238, 138, 38, 255], dtype=np.uint8)
DARK_STRIPE = np.array([160, 68, 12, 255], dtype=np.uint8)
NAVY_SUIT = np.array([28, 45, 78, 255], dtype=np.uint8)
CREAM_WHITE = np.array([250, 246, 238, 255], dtype=np.uint8)
BROWN_SHOE = np.array([72, 36, 15, 255], dtype=np.uint8)

for i, p in enumerate(positions):
    x, y, z = p
    # Front-facing coordinate projection
    u = (x - xmin) / (xmax - xmin)
    v = (ymax - y) / (ymax - ymin)
    
    px = int(np.clip(u * (W_ref - 1), 0, W_ref - 1))
    py = int(np.clip(v * (H_ref - 1), 0, H_ref - 1))
    
    col = img_arr[py, px]
    
    # If front and non-transparent
    if z >= -0.05 and col[3] > 30:
        vertex_colors[i] = col
    else:
        # Anatomical back shading
        if y < -0.75:
            vertex_colors[i] = BROWN_SHOE
        elif y < -0.22:
            vertex_colors[i] = NAVY_SUIT
        elif y < 0.28:
            if x < -0.22 and z < -0.05: # tail
                vertex_colors[i] = ORANGE_FUR if int(y * 20) % 2 == 0 else DARK_STRIPE
            else:
                vertex_colors[i] = NAVY_SUIT
        else: # Head & Ears
            vertex_colors[i] = ORANGE_FUR

# Now let's render a preview of the colored vertices
W, H = 512, 512
preview = np.zeros((H, W, 4), dtype=np.uint8)
depth = np.zeros((H, W), dtype=np.float32) - 999.0

# Sort vertices by Z (back to front) for painters algorithm
order = np.argsort(positions[:, 2])

for idx in order:
    p = positions[idx]
    c = vertex_colors[idx]
    px = int((p[0] - xmin) / (xmax - xmin + 1e-6) * (W - 1))
    py = int((ymax - p[1]) / (ymax - ymin + 1e-6) * (H - 1))
    if 0 <= px < W and 0 <= py < H:
        preview[py, px] = c

out_img = Image.fromarray(preview)
out_img.save(r"frontend\public\colored_mesh_preview.png")
print("Saved colored mesh preview to frontend/public/colored_mesh_preview.png")
