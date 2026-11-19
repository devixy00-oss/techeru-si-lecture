import struct
import json
import numpy as np
from PIL import Image

def verify_and_render():
    glb_path = r"frontend\public\models\teacher-cat.glb"
    
    print("Reading baked GLB:", glb_path)
    with open(glb_path, "rb") as f:
        magic, version, length = struct.unpack("<4sII", f.read(12))
        chunk_len, _ = struct.unpack("<II", f.read(8))
        gltf = json.loads(f.read(chunk_len).decode("utf-8"))
        bin_len, _ = struct.unpack("<II", f.read(8))
        bin_data = f.read(bin_len)
        
    print(f"GLB Magic: {magic}, Version: {version}, Total Length: {length:,} bytes")
    
    # Check attributes
    prim = gltf["meshes"][0]["primitives"][0]
    attrs = prim["attributes"]
    print("Primitive attributes present:", attrs)
    assert "POSITION" in attrs and "NORMAL" in attrs and "COLOR_0" in attrs, "Missing core attributes!"
    
    # Read indices
    idx_acc = gltf["accessors"][prim["indices"]]
    idx_bv = gltf["bufferViews"][idx_acc["bufferView"]]
    offset_idx = idx_bv.get("byteOffset", 0) + idx_acc.get("byteOffset", 0)
    dtype_idx = np.uint32 if idx_acc["componentType"] == 5125 else np.uint16
    indices = np.frombuffer(bin_data, dtype=dtype_idx, count=idx_acc["count"], offset=offset_idx).reshape((-1, 3))
    
    # Read positions
    pos_acc = gltf["accessors"][attrs["POSITION"]]
    pos_bv = gltf["bufferViews"][pos_acc["bufferView"]]
    offset_pos = pos_bv.get("byteOffset", 0) + pos_acc.get("byteOffset", 0)
    positions = np.frombuffer(bin_data, dtype=np.float32, count=pos_acc["count"]*3, offset=offset_pos).reshape((-1, 3))
    
    # Read normals
    norm_acc = gltf["accessors"][attrs["NORMAL"]]
    norm_bv = gltf["bufferViews"][norm_acc["bufferView"]]
    offset_norm = norm_bv.get("byteOffset", 0) + norm_acc.get("byteOffset", 0)
    normals = np.frombuffer(bin_data, dtype=np.float32, count=norm_acc["count"]*3, offset=offset_norm).reshape((-1, 3))
    
    # Read colors
    col_acc = gltf["accessors"][attrs["COLOR_0"]]
    col_bv = gltf["bufferViews"][col_acc["bufferView"]]
    offset_col = col_bv.get("byteOffset", 0) + col_acc.get("byteOffset", 0)
    colors = np.frombuffer(bin_data, dtype=np.float32, count=col_acc["count"]*4, offset=offset_col).reshape((-1, 4))
    
    print(f"Positions shape: {positions.shape}, Y range: [{positions[:,1].min():.4f}, {positions[:,1].max():.4f}]")
    print(f"Normals shape: {normals.shape}")
    print(f"Colors shape: {colors.shape}")
    
    # Light direction: studio key light from top-front-right
    light_dir = np.array([0.45, 0.65, 0.60])
    light_dir /= np.linalg.norm(light_dir)
    
    # Render Studio Quality Previews
    def render_studio_view(rot_y_deg, center_y, span_y, W=480, H=600):
        rad = np.radians(rot_y_deg)
        cos_a, sin_a = np.cos(rad), np.sin(rad)
        
        rot_p = np.zeros_like(positions)
        rot_p[:, 0] = positions[:, 0] * cos_a - positions[:, 2] * sin_a
        rot_p[:, 1] = positions[:, 1]
        rot_p[:, 2] = positions[:, 0] * sin_a + positions[:, 2] * cos_a
        
        rot_n = np.zeros_like(normals)
        rot_n[:, 0] = normals[:, 0] * cos_a - normals[:, 2] * sin_a
        rot_n[:, 1] = normals[:, 1]
        rot_n[:, 2] = normals[:, 0] * sin_a + normals[:, 2] * cos_a
        
        # Shading with ambient + diffuse key light + rim light
        diffuse = np.maximum(0.0, np.sum(rot_n * light_dir, axis=1, keepdims=True))
        rim = np.maximum(0.0, -rot_n[:, 2:3]) * (1.0 - np.maximum(0.0, rot_n[:, 2:3]))
        
        shade = 0.55 + 0.45 * diffuse + 0.15 * rim
        lit_colors = np.clip(colors[:, :3] * shade * 255.0, 0, 255).astype(np.uint8)
        
        img_buf = np.full((H, W, 3), 24, dtype=np.uint8)
        order = np.argsort(rot_p[:, 2])
        
        aspect = W / H
        span_x = span_y * aspect
        
        for idx in order:
            p = rot_p[idx]
            c = lit_colors[idx]
            px = int((p[0] + span_x/2.0) / span_x * (W - 1))
            py = int((center_y + span_y/2.0 - p[1]) / span_y * (H - 1))
            if 0 <= px < W and 0 <= py < H:
                img_buf[py, px] = c
                
        return img_buf

    print("Rendering Studio Views...")
    # Full body front
    full_front = render_studio_view(0, center_y=0.98, span_y=2.1)
    # Full body 3/4 angle
    full_angle = render_studio_view(30, center_y=0.98, span_y=2.1)
    # Close-up on face & glasses & tie
    face_front = render_studio_view(0, center_y=1.45, span_y=0.95)
    # Close-up 3/4 angle on face
    face_angle = render_studio_view(25, center_y=1.45, span_y=0.95)
    
    # Combine into 2x2 presentation grid
    top_row = np.hstack([full_front, full_angle])
    bot_row = np.hstack([face_front, face_angle])
    grid = np.vstack([top_row, bot_row])
    
    out_path = r"frontend\public\character_studio_verification.png"
    Image.fromarray(grid).save(out_path)
    print("Saved character studio verification image to:", out_path)

if __name__ == "__main__":
    verify_and_render()
