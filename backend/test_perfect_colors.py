import struct
import json
import numpy as np
from PIL import Image

def generate_perfect_character():
    glb_src = r"frontend\public\models\teacher-cat.glb"
    ref_src = r"C:\Users\user\.gemini\antigravity\brain\46e85e44-06f2-42d3-a57a-7f8d4f6b2c3a\.user_uploaded\media_1794821613382_7f386bcc.jpg"
    
    ref_img = Image.open(ref_src).convert("RGB")
    ref_arr = np.array(ref_img, dtype=np.float32)
    img_w, img_h = ref_img.size
    
    with open(glb_src, "rb") as f:
        f.seek(12)
        clen, _ = struct.unpack("<II", f.read(8))
        gltf = json.loads(f.read(clen))
        blen, _ = struct.unpack("<II", f.read(8))
        bin_data = f.read(blen)
        
    prim = gltf["meshes"][0]["primitives"][0]
    
    # Read indices
    idx_acc = gltf["accessors"][prim["indices"]]
    idx_bv = gltf["bufferViews"][idx_acc["bufferView"]]
    offset_idx = idx_bv.get("byteOffset", 0) + idx_acc.get("byteOffset", 0)
    dtype_idx = np.uint32 if idx_acc["componentType"] == 5125 else np.uint16
    indices = np.frombuffer(bin_data, dtype=dtype_idx, count=idx_acc["count"], offset=offset_idx).reshape((-1, 3))
    
    # Read positions
    pos_acc = gltf["accessors"][prim["attributes"]["POSITION"]]
    pos_bv = gltf["bufferViews"][pos_acc["bufferView"]]
    offset_pos = pos_bv.get("byteOffset", 0) + pos_acc.get("byteOffset", 0)
    positions = np.frombuffer(bin_data, dtype=np.float32, count=pos_acc["count"]*3, offset=offset_pos).reshape((-1, 3))
    
    # Read normals
    norm_acc = gltf["accessors"][prim["attributes"]["NORMAL"]]
    norm_bv = gltf["bufferViews"][norm_acc["bufferView"]]
    offset_norm = norm_bv.get("byteOffset", 0) + norm_acc.get("byteOffset", 0)
    normals = np.frombuffer(bin_data, dtype=np.float32, count=norm_acc["count"]*3, offset=offset_norm).reshape((-1, 3))
    
    num_verts = len(positions)
    print(f"Loaded mesh: {num_verts} vertices")
    
    # Precise Colors in sRGB [0..255]
    DEEP_NAVY_BASE = np.array([20.0, 36.0, 68.0])        # Rich deep royal navy
    DEEP_NAVY_SHADOW = np.array([12.0, 22.0, 44.0])      # Deep navy shadow/crease
    DEEP_NAVY_LAPEL = np.array([28.0, 50.0, 92.0])       # Subtle tailored lapel sheen
    
    RICH_ORANGE_FUR = np.array([236.0, 118.0, 24.0])     # Saturated warm ginger cat fur
    WARM_AMBER_FUR = np.array([248.0, 142.0, 36.0])      # Highlight golden fur
    TABBY_STRIPE = np.array([148.0, 52.0, 8.0])          # Rich dark amber tiger stripes
    CREAM_MUZZLE = np.array([255.0, 246.0, 235.0])       # Soft warm ivory cream
    PINK_NOSE = np.array([242.0, 102.0, 134.0])          # Cute pink nose
    PINK_PAW_PAD = np.array([244.0, 142.0, 156.0])       # Soft pink toe/palm beans
    
    WHITE_SHIRT = np.array([252.0, 253.0, 255.0])        # Crisp formal white shirt
    TIE_GOLD = np.array([224.0, 172.0, 52.0])            # Rich collegiate gold stripe
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
                # Highlight on front toe caps (z > 0.1)
                toe_h = np.clip((z - 0.05) / 0.15, 0.0, 1.0)
                col = BROWN_SHOE_TIP * toe_h + BROWN_SHOE_BASE * (1.0 - toe_h)
                
        # 2. TROUSERS (0.25 <= Y < 0.76)
        elif y < 0.76:
            # Check if tail: X < -0.20 and Z < -0.05
            if x < -0.20 and z < -0.05:
                # Curved plush tail
                tail_pos = np.sqrt((x + 0.45)**2 + (y - 0.55)**2)
                is_stripe = (np.sin(tail_pos * 32.0) > 0.08)
                is_tip = (x < -0.55 and y > 0.60)
                if is_tip:
                    col = CREAM_MUZZLE
                else:
                    col = TABBY_STRIPE if is_stripe else RICH_ORANGE_FUR
            else:
                # Deep navy trousers with crease shading
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
            # Check if Tail continues here:
            if x < -0.25 and z < -0.05:
                tail_pos = np.sqrt((x + 0.45)**2 + (y - 0.55)**2)
                is_stripe = (np.sin(tail_pos * 32.0) > 0.08)
                is_tip = (y > 0.95 or x < -0.55)
                col = CREAM_MUZZLE if is_tip else (TABBY_STRIPE if is_stripe else RICH_ORANGE_FUR)
                
            # Check if Pointing Paw (Left arm, viewer's right: X > 0.40, Y in [1.0, 1.4], Z > 0.20):
            elif x > 0.40 and y > 0.98 and z > 0.18:
                # Orange fur with pink finger pad
                if nz > 0.3 and y < 1.25:
                    col = PINK_PAW_PAD
                else:
                    col = RICH_ORANGE_FUR
                    
            # Check if Open Paw (Right arm, viewer's left: X < -0.32, Y in [0.82, 1.18], Z > 0.16):
            elif x < -0.32 and y > 0.80 and z > 0.16:
                # Forward facing palm shows pink pads!
                if nz > 0.2:
                    col = PINK_PAW_PAD
                else:
                    col = RICH_ORANGE_FUR
                    
            # Check if Tie & White Shirt (center chest: |X| < 0.13, Z > 0.10):
            elif abs(x) < 0.13 and z > 0.10:
                # Tie bounds: |x| < 0.045 + (1.25 - y)*0.02
                tie_w = 0.042 + (1.25 - y) * 0.018
                if abs(x) < tie_w and y >= 0.82 and y <= 1.24:
                    # Diagonal striped tie: 45 degree bands
                    # stripe coordinate = (y * 18.0 + x * 18.0)
                    stripe_val = np.sin((y + x) * 48.0)
                    if stripe_val > 0.0:
                        col = TIE_GOLD
                    else:
                        col = TIE_NAVY
                else:
                    # White shirt chest and collar
                    col = WHITE_SHIRT
                    
            # Check if White Shirt Collar peaks at top of chest (Y in [1.22, 1.30], |X| < 0.15, Z > 0.12):
            elif abs(x) < 0.15 and y >= 1.22 and z > 0.12:
                col = WHITE_SHIRT
                
            else:
                # Deep Navy Suit Jacket
                # Pocket square on viewer's right chest (cat's left: x in [0.12, 0.18], y in [1.12, 1.18], z > 0.15):
                if x > 0.11 and x < 0.17 and y > 1.10 and y < 1.16 and z > 0.14:
                    col = WHITE_SHIRT # Pocket square!
                else:
                    # Navy jacket with subtle lapel sheen and back seam
                    if abs(x) < 0.015 and z < 0.0:
                        col = DEEP_NAVY_SHADOW # Back seam
                    elif z > 0.12 and abs(abs(x) - 0.14) < 0.02:
                        col = DEEP_NAVY_LAPEL  # Lapel edge
                    else:
                        col = DEEP_NAVY_BASE
                        
        # 5. HEAD, FACE, EARS & GLASSES (Y >= 1.30)
        else:
            # Face front-facing area (Z > 0.12)
            if z > 0.12 and abs(x) < 0.28:
                # Sample high-detail facial features from reference image
                r_c, g_c, b_c = ref_col
                
                # Check for Green Eyes:
                if g_c > r_c + 18 and g_c > 85 and y >= 1.48 and y <= 1.68:
                    col = GREEN_EYE
                # Check for Black Pupil:
                elif r_c < 30 and g_c < 30 and b_c < 35 and y >= 1.50 and y <= 1.66 and abs(x) > 0.05 and abs(x) < 0.20:
                    col = PUPIL_BLACK
                # Check for Black Glasses Frames:
                elif r_c < 55 and g_c < 55 and b_c < 60 and y >= 1.45 and y <= 1.72:
                    col = GLASSES_BLACK
                # Check for Pink Nose:
                elif r_c > 180 and g_c < 120 and b_c < 145 and y >= 1.40 and y <= 1.50 and abs(x) < 0.04:
                    col = PINK_NOSE
                # Check for Cream Whisker Pads / Muzzle:
                elif r_c > 220 and g_c > 210 and b_c > 195 and y >= 1.36 and y <= 1.54:
                    col = CREAM_MUZZLE
                else:
                    # Natural Rich Orange Fur on Face & Cheeks
                    # Squeeze warmth and vibrancy into the fur:
                    fur_lum = (r_c * 0.299 + g_c * 0.587 + b_c * 0.114) / 255.0
                    col = RICH_ORANGE_FUR * (0.7 + 0.45 * fur_lum)
            else:
                # Back and Sides of Head & Ears:
                # Tiger tabby stripes across crown and back of head:
                stripe_freq = np.sin(y * 36.0 + np.sin(x * 12.0) * 2.5)
                # Inner ear tuft cream (y > 1.78, |x| > 0.12, z > 0.05):
                if y > 1.76 and abs(x) > 0.12 and nz > 0.1:
                    col = CREAM_MUZZLE
                elif stripe_freq > 0.12:
                    col = TABBY_STRIPE
                else:
                    col = RICH_ORANGE_FUR
                    
        srgb_colors[i] = col
        
    srgb_colors = np.clip(srgb_colors, 0.0, 255.0)
    
    # Render Studio Quality Previews
    light_dir = np.array([0.45, 0.65, 0.60])
    light_dir /= np.linalg.norm(light_dir)
    
    def render_view(rot_y_deg, center_y, span_y, W=480, H=600):
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
        
        diffuse = np.maximum(0.0, np.sum(rot_n * light_dir, axis=1, keepdims=True))
        rim = np.maximum(0.0, -rot_n[:, 2:3]) * 0.25
        
        shade = 0.58 + 0.42 * diffuse + rim
        lit = np.clip(srgb_colors * shade, 0, 255).astype(np.uint8)
        
        img_buf = np.full((H, W, 3), 26, dtype=np.uint8)
        order = np.argsort(rot_p[:, 2])
        aspect = W / H
        span_x = span_y * aspect
        
        for idx in order:
            p = rot_p[idx]
            c = lit[idx]
            px = int((p[0] + span_x/2.0) / span_x * (W - 1))
            py = int((center_y + span_y/2.0 - p[1]) / span_y * (H - 1))
            if 0 <= px < W and 0 <= py < H:
                img_buf[py, px] = c
        return img_buf

    print("Rendering verification preview...")
    full_f = render_view(0, 0.98, 2.1)
    full_a = render_view(32, 0.98, 2.1)
    face_f = render_view(0, 1.45, 0.95)
    back_f = render_view(180, 0.98, 2.1)
    
    top = np.hstack([full_f, full_a])
    bot = np.hstack([face_f, back_f])
    quad = np.vstack([top, bot])
    
    out_preview = r"frontend\public\perfect_cat_preview.png"
    Image.fromarray(quad).save(out_preview)
    print("Saved preview to:", out_preview)

if __name__ == "__main__":
    generate_perfect_character()
