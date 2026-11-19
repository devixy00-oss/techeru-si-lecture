import struct
import json
import numpy as np
from PIL import Image

glb_path = r"frontend\public\models\teacher-cat.glb"
img_path = r"frontend\public\character\pose_point.png"

img = Image.open(img_path).convert("RGBA")
arr = np.array(img)
alpha = arr[:, :, 3]

# In 2D image:
# Find top of ears (min Y where alpha > 100)
ys, xs = np.where(alpha > 100)
top_y_2d = ys.min()
bot_y_2d = ys.max()
left_x_2d = xs.min()
right_x_2d = xs.max()

print(f"2D Character Bounds: X=[{left_x_2d}, {right_x_2d}], Y=[{top_y_2d}, {bot_y_2d}]")
print(f"2D Image Size: {img.size}")

# Find top of ears in 3D:
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

print(f"3D Character Bounds:")
print(f"X=[{positions[:,0].min():.4f}, {positions[:,0].max():.4f}]")
print(f"Y=[{positions[:,1].min():.4f}, {positions[:,1].max():.4f}]")
print(f"Z=[{positions[:,2].min():.4f}, {positions[:,2].max():.4f}]")

# Let's find the tip of the left paw pointing in 2D and in 3D:
# In 2D, the pointing paw is at the far right
rightmost_idx = np.argmax(positions[:, 0])
print(f"3D Rightmost vertex (pointing paw): {positions[rightmost_idx]}")

leftmost_idx = np.argmin(positions[:, 0])
print(f"3D Leftmost vertex (open paw / tail): {positions[leftmost_idx]}")

topmost_idx = np.argmax(positions[:, 1])
print(f"3D Topmost vertex (ear tip): {positions[topmost_idx]}")

bottommost_idx = np.argmin(positions[:, 1])
print(f"3D Bottommost vertex (shoe base): {positions[bottommost_idx]}")
