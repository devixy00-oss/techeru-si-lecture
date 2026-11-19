import struct
import json
import numpy as np

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
dtype_idx = np.uint32 if idx_acc["componentType"] == 5125 else np.uint16
indices = np.frombuffer(bin_data, dtype=dtype_idx, count=idx_acc["count"], offset=offset_idx).reshape((-1, 3))

# Read positions
pos_acc = gltf["accessors"][1]
pos_bv = gltf["bufferViews"][pos_acc["bufferView"]]
offset_pos = pos_bv.get("byteOffset", 0) + pos_acc.get("byteOffset", 0)
positions = np.frombuffer(bin_data, dtype=np.float32, count=pos_acc["count"]*3, offset=offset_pos).reshape((-1, 3))

# Compute face normals
v0 = positions[indices[:, 0]]
v1 = positions[indices[:, 1]]
v2 = positions[indices[:, 2]]
face_normals = np.cross(v1 - v0, v2 - v0)

# Normalize face normals
lens = np.linalg.norm(face_normals, axis=1, keepdims=True)
lens[lens == 0] = 1.0
face_normals /= lens

# Check center of front vertices (Z > 0.2)
front_faces = (v0[:, 2] > 0.2) & (v1[:, 2] > 0.2) & (v2[:, 2] > 0.2)
mean_z_norm = face_normals[front_faces, 2].mean()
print(f"Mean Z normal of front faces: {mean_z_norm:.3f}")
if mean_z_norm < 0:
    print("Notice: Face winding appears to be inverted (normals point inward). Needs flip!")
else:
    print("Face winding is correct (normals point outward).")
