import struct
import json
import numpy as np

def map_mesh_anatomy():
    glb_path = r"frontend\public\models\teacher-cat.glb"
    with open(glb_path, "rb") as f:
        f.seek(12)
        clen, _ = struct.unpack("<II", f.read(8))
        gltf = json.loads(f.read(clen))
        blen, _ = struct.unpack("<II", f.read(8))
        bin_data = f.read(blen)
        
    prim = gltf["meshes"][0]["primitives"][0]
    pos_acc = gltf["accessors"][prim["attributes"]["POSITION"]]
    pos_bv = gltf["bufferViews"][pos_acc["bufferView"]]
    offset = pos_bv.get("byteOffset", 0) + pos_acc.get("byteOffset", 0)
    positions = np.frombuffer(bin_data, dtype=np.float32, count=pos_acc["count"]*3, offset=offset).reshape((-1, 3))
    
    print(f"Total vertices: {len(positions)}")
    print(f"X bounds: [{positions[:, 0].min():.4f}, {positions[:, 0].max():.4f}]")
    print(f"Y bounds: [{positions[:, 1].min():.4f}, {positions[:, 1].max():.4f}]")
    print(f"Z bounds: [{positions[:, 2].min():.4f}, {positions[:, 2].max():.4f}]")
    
    # Check vertical slices
    # 1. Shoes: Y in [0.0, 0.25]
    shoes = positions[positions[:, 1] < 0.25]
    print(f"Shoes: {len(shoes)} verts, Y=[0.0, 0.25]")
    
    # 2. Trousers: Y in [0.25, 0.78]
    trousers = positions[(positions[:, 1] >= 0.25) & (positions[:, 1] < 0.78)]
    print(f"Trousers: {len(trousers)} verts, Y=[0.25, 0.78]")
    
    # 3. Torso / Jacket: Y in [0.78, 1.30]
    torso = positions[(positions[:, 1] >= 0.78) & (positions[:, 1] < 1.30)]
    print(f"Torso: {len(torso)} verts, Y=[0.78, 1.30]")
    
    # 4. Head & Ears: Y in [1.30, 1.96]
    head = positions[positions[:, 1] >= 1.30]
    print(f"Head: {len(head)} verts, Y=[1.30, 1.96]")
    
    # 5. Pointing paw: X > 0.40, Y in [1.0, 1.4], Z > 0.2
    paw_pt = positions[(positions[:, 0] > 0.40) & (positions[:, 1] >= 1.0) & (positions[:, 1] <= 1.4) & (positions[:, 2] > 0.2)]
    print(f"Pointing Paw: {len(paw_pt)} verts")
    
    # 6. Open paw: X < -0.30, Y in [0.8, 1.2], Z > 0.2
    paw_open = positions[(positions[:, 0] < -0.30) & (positions[:, 1] >= 0.8) & (positions[:, 1] <= 1.2) & (positions[:, 2] > 0.2)]
    print(f"Open Paw: {len(paw_open)} verts")
    
    # 7. Tail: X < -0.20, Y in [0.4, 1.2], Z < -0.05
    tail = positions[(positions[:, 0] < -0.20) & (positions[:, 1] >= 0.4) & (positions[:, 1] <= 1.2) & (positions[:, 2] < -0.05)]
    print(f"Tail: {len(tail)} verts")
    
    # 8. Chest center (Tie & Shirt): |X| < 0.12, Y in [0.85, 1.32], Z > 0.12
    tie_shirt = positions[(np.abs(positions[:, 0]) < 0.12) & (positions[:, 1] >= 0.85) & (positions[:, 1] <= 1.32) & (positions[:, 2] > 0.12)]
    print(f"Tie & Shirt: {len(tie_shirt)} verts")
    
    # 9. Face center (Eyes, Glasses, Muzzle): |X| < 0.25, Y in [1.35, 1.75], Z > 0.15
    face = positions[(np.abs(positions[:, 0]) < 0.25) & (positions[:, 1] >= 1.35) & (positions[:, 1] <= 1.75) & (positions[:, 2] > 0.15)]
    print(f"Face: {len(face)} verts")

if __name__ == "__main__":
    map_mesh_anatomy()
