import struct
import json
import numpy as np
from PIL import Image

glb_path = r"frontend\public\models\teacher-cat.glb"
img_path = r"frontend\public\character\official_cat_ref.jpg"

img = Image.open(img_path).convert("RGBA")
w, h = img.size
print(f"Image size: {w}x{h}")

with open(glb_path, "rb") as f:
    f.seek(12)
    clen, ctype = struct.unpack("<II", f.read(8))
    gltf = json.loads(f.read(clen))
    blen, btype = struct.unpack("<II", f.read(8))
    bin_data = f.read(blen)

pos_acc = gltf["accessors"][1]
pos_bv = gltf["bufferViews"][pos_acc["bufferView"]]
offset = pos_bv.get("byteOffset", 0) + pos_acc.get("byteOffset", 0)
count = pos_acc["count"]

positions = np.frombuffer(bin_data, dtype=np.float32, count=count*3, offset=offset).reshape((count, 3))
print(f"Mesh has {count} vertices")
print(f"X bounds: [{positions[:,0].min():.3f}, {positions[:,0].max():.3f}]")
print(f"Y bounds: [{positions[:,1].min():.3f}, {positions[:,1].max():.3f}]")
print(f"Z bounds: [{positions[:,2].min():.3f}, {positions[:,2].max():.3f}]")
