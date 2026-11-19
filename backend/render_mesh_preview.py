import struct
import json
import numpy as np
from PIL import Image

glb_path = r"frontend\public\models\teacher-cat.glb"

with open(glb_path, "rb") as f:
    f.seek(12)
    clen, ctype = struct.unpack("<II", f.read(8))
    gltf = json.loads(f.read(clen))
    blen, btype = struct.unpack("<II", f.read(8))
    bin_data = f.read(blen)

# Read indices
idx_acc = gltf["accessors"][0]
idx_bv = gltf["bufferViews"][idx_acc["bufferView"]]
offset_idx = idx_bv.get("byteOffset", 0) + idx_acc.get("byteOffset", 0)
num_indices = idx_acc["count"]
dtype_idx = np.uint32 if idx_acc["componentType"] == 5125 else np.uint16
indices = np.frombuffer(bin_data, dtype=dtype_idx, count=num_indices, offset=offset_idx).reshape((-1, 3))

# Read positions
pos_acc = gltf["accessors"][1]
pos_bv = gltf["bufferViews"][pos_acc["bufferView"]]
offset_pos = pos_bv.get("byteOffset", 0) + pos_acc.get("byteOffset", 0)
num_pos = pos_acc["count"]
positions = np.frombuffer(bin_data, dtype=np.float32, count=num_pos*3, offset=offset_pos).reshape((num_pos, 3))

print(f"Loaded {num_pos} vertices, {len(indices)} triangles")

# Project front view (X, Y) onto an image
W, H = 512, 512
img = np.zeros((H, W), dtype=np.float32) - 999.0

# Map X to [0, W-1] and Y to [0, H-1] (Y is flipped in screen space)
xmin, xmax = positions[:, 0].min(), positions[:, 0].max()
ymin, ymax = positions[:, 1].min(), positions[:, 1].max()
zmin, zmax = positions[:, 2].min(), positions[:, 2].max()

# Rasterize vertices depth buffer
for p in positions:
    px = int((p[0] - xmin) / (xmax - xmin + 1e-6) * (W - 1))
    py = int((ymax - p[1]) / (ymax - ymin + 1e-6) * (H - 1))
    if 0 <= px < W and 0 <= py < H:
        if p[2] > img[py, px]:
            img[py, px] = p[2]

# Normalize depth to 0-255
valid = img > -900
out = np.zeros((H, W), dtype=np.uint8)
if valid.any():
    depth_norm = (img[valid] - zmin) / (zmax - zmin + 1e-6)
    out[valid] = (depth_norm * 255).astype(np.uint8)

pil_img = Image.fromarray(out)
preview_path = r"frontend\public\mesh_preview.png"
pil_img.save(preview_path)
print(f"Saved depth silhouette preview to {preview_path}")
