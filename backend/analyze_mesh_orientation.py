import json
import struct
import numpy as np

glb_path = r"C:\Users\user\.gemini\antigravity\brain\46e85e44-06f2-42d3-a57a-7f8d4f6b2c3a\.user_uploaded\media_1794830602820_181969c4.glb"

with open(glb_path, "rb") as f:
    f.seek(12)
    clen, ctype = struct.unpack("<II", f.read(8))
    gltf = json.loads(f.read(clen))
    
    # Read buffer
    blen, btype = struct.unpack("<II", f.read(8))
    bin_data = f.read(blen)

# Extract positions
pos_acc = gltf["accessors"][1]
pos_bv = gltf["bufferViews"][pos_acc["bufferView"]]
offset = pos_bv.get("byteOffset", 0) + pos_acc.get("byteOffset", 0)
count = pos_acc["count"]

positions = np.frombuffer(bin_data, dtype=np.float32, count=count*3, offset=offset).reshape((count, 3))

print("Total vertices:", count)
print("X range: min =", positions[:, 0].min(), ", max =", positions[:, 0].max())
print("Y range: min =", positions[:, 1].min(), ", max =", positions[:, 1].max())
print("Z range: min =", positions[:, 2].min(), ", max =", positions[:, 2].max())

# Let's see percentiles along axes to find out the orientation
print("\nPercentiles:")
for ax, name in enumerate(['X', 'Y', 'Z']):
    p = np.percentile(positions[:, ax], [0, 10, 25, 50, 75, 90, 100])
    print(f"{name}: 0%={p[0]:.3f}, 10%={p[1]:.3f}, 50%={p[3]:.3f}, 90%={p[5]:.3f}, 100%={p[6]:.3f}")
