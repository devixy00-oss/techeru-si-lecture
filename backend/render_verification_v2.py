import struct
import json
import numpy as np
from PIL import Image

def verify_v2():
    glb_path = r"frontend\public\models\teacher-cat.glb"
    
    print("Reading baked GLB:", glb_path)
    with open(glb_path, "rb") as f:
        magic, version, length = struct.unpack("<4sII", f.read(12))
        chunk_len, _ = struct.unpack("<II", f.read(8))
        gltf = json.loads(f.read(chunk_len).decode("utf-8"))
        bin_len, _ = struct.unpack("<II", f.read(8))
        bin_data = f.read(bin_len)
        
    prim = gltf["meshes"][0]["primitives"][0]
    attrs = prim["attributes"]
    
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
    
    # Read linear colors from COLOR_0
    col_acc = gltf["accessors"][attrs["COLOR_0"]]
    col_bv = gltf["bufferViews"][col_acc["bufferView"]]
    offset_col = col_bv.get("byteOffset", 0) + col_acc.get("byteOffset", 0)
    linear_colors = np.frombuffer(bin_data, dtype=np.float32, count=col_acc["count"]*4, offset=offset_col).reshape((-1, 4))
    
    # Convert Linear back to display sRGB for rendering preview
    srgb_colors = np.power(np.clip(linear_colors[:, :3], 0.0, 1.0), 1.0 / 2.2) * 255.0
    
    # Studio lighting setup matching TeacherCat3D.tsx:
    # Key light: from top-front-right
    key_dir = np.array([0.45, 0.65, 0.60])
    key_dir /= np.linalg.norm(key_dir)
    # Fill light: from left
    fill_dir = np.array([-0.60, 0.40, 0.50])
    fill_dir /= np.linalg.norm(fill_dir)
    
    def render_studio(rot_y_deg, center_y, span_y, W=480, H=600):
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
        
        diff_key = np.maximum(0.0, np.sum(rot_n * key_dir, axis=1, keepdims=True))
        diff_fill = np.maximum(0.0, np.sum(rot_n * fill_dir, axis=1, keepdims=True))
        rim = np.maximum(0.0, -rot_n[:, 2:3]) * (1.0 - np.maximum(0.0, rot_n[:, 2:3]))
        
        # Balanced studio illumination curve:
        # Ambient 0.48, Key 0.42, Fill 0.15, Rim 0.20
        illum = 0.48 + 0.42 * diff_key + 0.15 * diff_fill + 0.20 * rim
        lit = np.clip(srgb_colors * illum, 0, 255).astype(np.uint8)
        
        buf = np.full((H, W, 3), 28, dtype=np.uint8)
        order = np.argsort(rot_p[:, 2])
        aspect = W / H
        span_x = span_y * aspect
        
        for idx in order:
            p = rot_p[idx]
            c = lit[idx]
            px = int((p[0] + span_x/2.0) / span_x * (W - 1))
            py = int((center_y + span_y/2.0 - p[1]) / span_y * (H - 1))
            if 0 <= px < W and 0 <= py < H:
                buf[py, px] = c
        return buf

    print("Rendering Multi-View Studio Verification...")
    full_front = render_studio(0, center_y=0.98, span_y=2.1)
    full_angle = render_studio(30, center_y=0.98, span_y=2.1)
    face_front = render_studio(0, center_y=1.40, span_y=0.90)
    back_view  = render_studio(180, center_y=0.98, span_y=2.1)
    
    top = np.hstack([full_front, full_angle])
    bot = np.hstack([face_front, back_view])
    grid = np.vstack([top, bot])
    
    out_img = Image.fromarray(grid)
    out_path = r"frontend\public\character_studio_verification_v2.png"
    out_img.save(out_path)
    print("Saved verification image to:", out_path)
    
    # Also save to artifact directory
    artifact_path = r"C:\Users\user\.gemini\antigravity\brain\46e85e44-06f2-42d3-a57a-7f8d4f6b2c3a\character_studio_verification_v2.png"
    out_img.save(artifact_path)
    print("Saved to artifact path:", artifact_path)

if __name__ == "__main__":
    verify_v2()
