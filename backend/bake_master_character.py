import struct
import json
import numpy as np
from PIL import Image

def bake_master_glb():
    glb_src = r"frontend\public\models\teacher-cat.glb"
    ref_src = r"C:\Users\user\.gemini\antigravity\brain\46e85e44-06f2-42d3-a57a-7f8d4f6b2c3a\.user_uploaded\media_1794821613382_7f386bcc.jpg"
    glb_dst = r"frontend\public\models\teacher-cat.glb"
    
    print("Reading reference image...")
    ref_img = Image.open(ref_src).convert("RGB")
    ref_arr = np.array(ref_img, dtype=np.float32)
    img_w, img_h = ref_img.size
    
    print("Reading base GLB...")
    with open(glb_src, "rb") as f:
        f.seek(12)
        clen, _ = struct.unpack("<II", f.read(8))
        gltf = json.loads(f.read(clen))
        blen, _ = struct.unpack("<II", f.read(8))
        bin_data = f.read(blen)
        
    prim = gltf["meshes"][0]["primitives"][0]
    
    # Indices
    idx_acc = gltf["accessors"][prim["indices"]]
    idx_bv = gltf["bufferViews"][idx_acc["bufferView"]]
    offset_idx = idx_bv.get("byteOffset", 0) + idx_acc.get("byteOffset", 0)
    dtype_idx = np.uint32 if idx_acc["componentType"] == 5125 else np.uint16
    indices = np.frombuffer(bin_data, dtype=dtype_idx, count=idx_acc["count"], offset=offset_idx).reshape((-1, 3))
    
    # Positions
    pos_acc = gltf["accessors"][prim["attributes"]["POSITION"]]
    pos_bv = gltf["bufferViews"][pos_acc["bufferView"]]
    offset_pos = pos_bv.get("byteOffset", 0) + pos_acc.get("byteOffset", 0)
    positions = np.frombuffer(bin_data, dtype=np.float32, count=pos_acc["count"]*3, offset=offset_pos).reshape((-1, 3))
    
    # Normals
    norm_acc = gltf["accessors"][prim["attributes"]["NORMAL"]]
    norm_bv = gltf["bufferViews"][norm_acc["bufferView"]]
    offset_norm = norm_bv.get("byteOffset", 0) + norm_acc.get("byteOffset", 0)
    normals = np.frombuffer(bin_data, dtype=np.float32, count=norm_acc["count"]*3, offset=offset_norm).reshape((-1, 3))
    
    num_verts = len(positions)
    num_faces = len(indices)
    print(f"Mesh has {num_verts} vertices, {num_faces} triangles.")
    
    # Master Palette in sRGB [0..255]
    DEEP_NAVY_BASE = np.array([20.0, 36.0, 68.0])        # Rich deep royal navy
    DEEP_NAVY_SHADOW = np.array([12.0, 22.0, 44.0])      # Deep navy shadow/crease
    DEEP_NAVY_LAPEL = np.array([28.0, 50.0, 92.0])       # Subtle tailored lapel sheen
    
    RICH_ORANGE_FUR = np.array([238.0, 118.0, 22.0])     # Saturated warm ginger cat fur
    WARM_AMBER_FUR = np.array([250.0, 145.0, 36.0])      # Highlight golden fur
    TABBY_STRIPE = np.array([146.0, 50.0, 8.0])          # Rich dark amber tiger stripes
    CREAM_MUZZLE = np.array([255.0, 246.0, 235.0])       # Soft warm ivory cream
    PINK_NOSE = np.array([242.0, 102.0, 134.0])          # Cute pink nose
    PINK_PAW_PAD = np.array([244.0, 142.0, 156.0])       # Soft pink toe/palm beans
    
    WHITE_SHIRT = np.array([252.0, 253.0, 255.0])        # Crisp formal white shirt
    TIE_GOLD = np.array([226.0, 174.0, 50.0])            # Rich collegiate gold stripe
    TIE_NAVY = np.array([14.0, 28.0, 58.0])              # Deep navy tie stripe
    BELT_BROWN = np.array([68.0, 34.0, 14.0])            # Formal leather belt
    BELT_BUCKLE = np.array([220.0, 185.0, 75.0])         # Polished brass/gold buckle
    
    BROWN_SHOE_BASE = np.array([76.0, 38.0, 15.0])       # Burnished calfskin leather
    BROWN_SHOE_TIP = np.array([96.0, 48.0, 18.0])        # Polished toe cap highlight
    SHOE_SOLE = np.array([28.0, 14.0, 6.0])              # Dark leather sole
    
    GLASSES_BLACK = np.array([14.0, 14.0, 18.0])         # Polished black acetate frames
    GREEN_EYE = np.array([40.0, 175.0, 82.0])            # Emerald feline iris
    PUPIL_BLACK = np.array([8.0, 8.0, 10.0])             # Black pupil
    
    srgb_colors = np.zeros((num_verts, 3), dtype=np.float32)
    
    # 2D projection bounds for front features
    min_x, max_x = positions[:, 0].min(), positions[:, 0].max()
    min_y, max_y = positions[:, 1].min(), positions[:, 1].max()
    bx0, bx1 = 31.0, 271.0
    by0, by1 = 13.0, 359.0
    bw = bx1 - bx0
    bh = by1 - by0
    
    for i in range(num_verts):
        x, y, z = positions[i]
        nx, ny, nz = normals[i]
        
        # Screen UV coordinates
        u = (x - min_x) / (max_x - min_x)
        v = (max_y - y) / (max_y - min_y)
        px = int(np.clip(bx0 + u * bw, 0, img_w - 1))
        py = int(np.clip(by0 + v * bh, 0, img_h - 1))
        
        ref_col = ref_arr[py, px]
        
        # 1. SHOES (Y < 0.25)
        if y < 0.25:
            if y < 0.04:
                col = SHOE_SOLE
            else:
                toe_h = np.clip((z - 0.05) / 0.15, 0.0, 1.0)
                col = BROWN_SHOE_TIP * toe_h + BROWN_SHOE_BASE * (1.0 - toe_h)
                
        # 2. TROUSERS (0.25 <= Y < 0.76)
        elif y < 0.76:
            # Check if tail: X < -0.20 and Z < -0.05
            if x < -0.20 and z < -0.05:
                tail_pos = np.sqrt((x + 0.45)**2 + (y - 0.55)**2)
                is_stripe = (np.sin(tail_pos * 32.0) > 0.08)
                is_tip = (x < -0.55 and y > 0.60)
                col = CREAM_MUZZLE if is_tip else (TABBY_STRIPE if is_stripe else RICH_ORANGE_FUR)
            else:
                crease = np.abs(np.sin(x * 25.0)) * 0.15
                col = DEEP_NAVY_BASE * (1.0 - crease) + DEEP_NAVY_SHADOW * crease
                
        # 3. WAIST BELT (0.76 <= Y < 0.81)
        elif y < 0.81 and z > 0.08 and abs(x) < 0.18:
            if abs(x) < 0.03:
                col = BELT_BUCKLE
            else:
                col = BELT_BROWN
                
        # 4. TORSO & ARMS & SHIRT & TIE (0.76 <= Y < 1.30)
        elif y < 1.30:
            if x < -0.25 and z < -0.05:
                # Tail continues
                tail_pos = np.sqrt((x + 0.45)**2 + (y - 0.55)**2)
                is_stripe = (np.sin(tail_pos * 32.0) > 0.08)
                is_tip = (y > 0.95 or x < -0.55)
                col = CREAM_MUZZLE if is_tip else (TABBY_STRIPE if is_stripe else RICH_ORANGE_FUR)
                
            elif x > 0.40 and y > 0.98 and z > 0.18:
                # Pointing Paw
                col = PINK_PAW_PAD if (nz > 0.3 and y < 1.25) else RICH_ORANGE_FUR
                    
            elif x < -0.32 and y > 0.80 and z > 0.16:
                # Open Paw
                col = PINK_PAW_PAD if (nz > 0.2) else RICH_ORANGE_FUR
                    
            elif abs(x) < 0.13 and z > 0.10:
                # Tie & White Shirt center
                tie_w = 0.042 + (1.25 - y) * 0.018
                if abs(x) < tie_w and y >= 0.82 and y <= 1.24:
                    stripe_val = np.sin((y + x) * 48.0)
                    col = TIE_GOLD if stripe_val > 0.0 else TIE_NAVY
                else:
                    col = WHITE_SHIRT
                    
            elif abs(x) < 0.15 and y >= 1.22 and z > 0.12:
                # White Shirt Collar
                col = WHITE_SHIRT
                
            else:
                # Deep Navy Suit Jacket
                if x > 0.11 and x < 0.17 and y > 1.10 and y < 1.16 and z > 0.14:
                    col = WHITE_SHIRT # Pocket square
                else:
                    if abs(x) < 0.015 and z < 0.0:
                        col = DEEP_NAVY_SHADOW # Back seam
                    elif z > 0.12 and abs(abs(x) - 0.14) < 0.02:
                        col = DEEP_NAVY_LAPEL
                    else:
                        col = DEEP_NAVY_BASE
                        
        # 5. HEAD, FACE, EARS & GLASSES (Y >= 1.30)
        else:
            if z > 0.12 and abs(x) < 0.28:
                r_c, g_c, b_c = ref_col
                if g_c > r_c + 18 and g_c > 85 and y >= 1.48 and y <= 1.68:
                    col = GREEN_EYE
                elif r_c < 30 and g_c < 30 and b_c < 35 and y >= 1.50 and y <= 1.66 and abs(x) > 0.05 and abs(x) < 0.20:
                    col = PUPIL_BLACK
                elif r_c < 55 and g_c < 55 and b_c < 60 and y >= 1.45 and y <= 1.72:
                    col = GLASSES_BLACK
                elif r_c > 180 and g_c < 120 and b_c < 145 and y >= 1.40 and y <= 1.50 and abs(x) < 0.04:
                    col = PINK_NOSE
                elif r_c > 220 and g_c > 210 and b_c > 195 and y >= 1.36 and y <= 1.54:
                    col = CREAM_MUZZLE
                else:
                    fur_lum = (r_c * 0.299 + g_c * 0.587 + b_c * 0.114) / 255.0
                    col = RICH_ORANGE_FUR * (0.7 + 0.45 * fur_lum)
            else:
                stripe_freq = np.sin(y * 36.0 + np.sin(x * 12.0) * 2.5)
                if y > 1.76 and abs(x) > 0.12 and nz > 0.1:
                    col = CREAM_MUZZLE
                elif stripe_freq > 0.12:
                    col = TABBY_STRIPE
                else:
                    col = RICH_ORANGE_FUR
                    
        srgb_colors[i] = col
        
    srgb_colors = np.clip(srgb_colors, 0.0, 255.0)
    
    # Convert sRGB to Linear RGB for glTF COLOR_0 standard
    print("Converting colors to glTF standard Linear Color Space...")
    linear_colors = np.power(srgb_colors / 255.0, 2.2).astype(np.float32)
    colors_vec4 = np.zeros((num_verts, 4), dtype=np.float32)
    colors_vec4[:, :3] = linear_colors
    colors_vec4[:, 3] = 1.0 # Alpha = 1.0
    
    # Binary GLB Packaging
    print("Packing binary glTF 2.0...")
    indices_raw = indices.astype(np.uint32).tobytes()
    pos_raw = positions.astype(np.float32).tobytes()
    norm_raw = normals.astype(np.float32).tobytes()
    col_raw = colors_vec4.tobytes()
    
    def pad4(b):
        rem = len(b) % 4
        return b if rem == 0 else b + b"\x00" * (4 - rem)
        
    offset_idx_out = 0
    len_idx_out = len(indices_raw)
    
    offset_pos_out = offset_idx_out + len(pad4(indices_raw))
    len_pos_out = len(pos_raw)
    
    offset_norm_out = offset_pos_out + len(pad4(pos_raw))
    len_norm_out = len(norm_raw)
    
    offset_col_out = offset_norm_out + len(pad4(norm_raw))
    len_col_out = len(col_raw)
    
    total_bin = (
        pad4(indices_raw) +
        pad4(pos_raw) +
        pad4(norm_raw) +
        pad4(col_raw)
    )
    
    gltf_out = {
        "asset": {
            "version": "2.0",
            "generator": "Techeru AI Master Character Studio v2"
        },
        "scene": 0,
        "scenes": [
            {
                "name": "TeacherCatScene",
                "nodes": [0]
            }
        ],
        "nodes": [
            {
                "name": "TeacherCatCharacter",
                "mesh": 0
            }
        ],
        "materials": [
            {
                "name": "TeacherCatPBRMaterial",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [1.0, 1.0, 1.0, 1.0],
                    "metallicFactor": 0.04,
                    "roughnessFactor": 0.58
                },
                "doubleSided": True
            }
        ],
        "meshes": [
            {
                "name": "TeacherCatMesh",
                "primitives": [
                    {
                        "attributes": {
                            "POSITION": 1,
                            "NORMAL": 2,
                            "COLOR_0": 3
                        },
                        "indices": 0,
                        "material": 0,
                        "mode": 4
                    }
                ]
            }
        ],
        "buffers": [
            {
                "byteLength": len(total_bin)
            }
        ],
        "bufferViews": [
            {
                "buffer": 0,
                "byteOffset": offset_idx_out,
                "byteLength": len_idx_out,
                "target": 34963
            },
            {
                "buffer": 0,
                "byteOffset": offset_pos_out,
                "byteLength": len_pos_out,
                "byteStride": 12,
                "target": 34962
            },
            {
                "buffer": 0,
                "byteOffset": offset_norm_out,
                "byteLength": len_norm_out,
                "byteStride": 12,
                "target": 34962
            },
            {
                "buffer": 0,
                "byteOffset": offset_col_out,
                "byteLength": len_col_out,
                "byteStride": 16,
                "target": 34962
            }
        ],
        "accessors": [
            {
                "bufferView": 0,
                "byteOffset": 0,
                "componentType": 5125,
                "count": num_faces * 3,
                "type": "SCALAR",
                "max": [int(indices.max())],
                "min": [int(indices.min())]
            },
            {
                "bufferView": 1,
                "byteOffset": 0,
                "componentType": 5126,
                "count": num_verts,
                "type": "VEC3",
                "max": [float(positions[:, 0].max()), float(positions[:, 1].max()), float(positions[:, 2].max())],
                "min": [float(positions[:, 0].min()), float(positions[:, 1].min()), float(positions[:, 2].min())]
            },
            {
                "bufferView": 2,
                "byteOffset": 0,
                "componentType": 5126,
                "count": num_verts,
                "type": "VEC3",
                "max": [float(normals[:, 0].max()), float(normals[:, 1].max()), float(normals[:, 2].max())],
                "min": [float(normals[:, 0].min()), float(normals[:, 1].min()), float(normals[:, 2].min())]
            },
            {
                "bufferView": 3,
                "byteOffset": 0,
                "componentType": 5126,
                "count": num_verts,
                "type": "VEC4",
                "max": [1.0, 1.0, 1.0, 1.0],
                "min": [0.0, 0.0, 0.0, 1.0]
            }
        ]
    }
    
    json_bytes = json.dumps(gltf_out, separators=(',', ':')).encode('utf-8')
    rem_json = len(json_bytes) % 4
    if rem_json != 0:
        json_bytes += b" " * (4 - rem_json)
        
    total_length = 12 + 8 + len(json_bytes) + 8 + len(total_bin)
    
    print(f"Writing GLB to {glb_dst} ({total_length:,} bytes)...")
    with open(glb_dst, "wb") as f:
        f.write(struct.pack("<4sII", b"glTF", 2, total_length))
        f.write(struct.pack("<II", len(json_bytes), 0x4E4F534A))
        f.write(json_bytes)
        f.write(struct.pack("<II", len(total_bin), 0x004E4942))
        f.write(total_bin)
        
    print("Master character baked successfully!")

if __name__ == "__main__":
    bake_master_glb()
