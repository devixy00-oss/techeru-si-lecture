import struct
import json
import numpy as np
from PIL import Image, ImageDraw
import os
import time

def load_glb(filepath):
    with open(filepath, 'rb') as f:
        magic, version, length = struct.unpack('<4sII', f.read(12))
        assert magic == b'glTF'
        
        c0_len, c0_type = struct.unpack('<II', f.read(8))
        json_data = json.loads(f.read(c0_len).decode('utf-8'))
        
        c1_len, c1_type = struct.unpack('<II', f.read(8))
        bin_data = f.read(c1_len)
        
    mesh = json_data['meshes'][0]
    prim = mesh['primitives'][0]
    
    pos_acc_idx = prim['attributes']['POSITION']
    idx_acc_idx = prim['indices']
    
    pos_acc = json_data['accessors'][pos_acc_idx]
    idx_acc = json_data['accessors'][idx_acc_idx]
    
    pos_bv = json_data['bufferViews'][pos_acc['bufferView']]
    idx_bv = json_data['bufferViews'][idx_acc['bufferView']]
    
    pos_offset = pos_bv.get('byteOffset', 0) + pos_acc.get('byteOffset', 0)
    idx_offset = idx_bv.get('byteOffset', 0) + idx_acc.get('byteOffset', 0)
    
    pos_count = pos_acc['count']
    idx_count = idx_acc['count']
    
    positions = np.frombuffer(bin_data, dtype=np.float32, count=pos_count * 3, offset=pos_offset).reshape(-1, 3)
    
    idx_comp_type = idx_acc['componentType']
    if idx_comp_type == 5125: # UNSIGNED_INT
        indices = np.frombuffer(bin_data, dtype=np.uint32, count=idx_count, offset=idx_offset)
    elif idx_comp_type == 5123: # UNSIGNED_SHORT
        indices = np.frombuffer(bin_data, dtype=np.uint16, count=idx_count, offset=idx_offset)
    else:
        raise ValueError(f"Unknown index type: {idx_comp_type}")
        
    indices = indices.reshape(-1, 3)
    return positions, indices

def calculate_face_data(positions, indices):
    tri_verts = positions[indices] # (N, 3, 3)
    v0 = tri_verts[:, 0]
    v1 = tri_verts[:, 1]
    v2 = tri_verts[:, 2]
    
    # Face centers
    centers = (v0 + v1 + v2) / 3.0
    
    # Face normals
    e1 = v1 - v0
    e2 = v2 - v0
    normals = np.cross(e1, e2)
    norms = np.linalg.norm(normals, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    normals /= norms
    
    return centers, normals, tri_verts

def render_view(filepath, view_name='front', out_path='render.png', width=1024, height=1280):
    t0 = time.time()
    positions, indices = load_glb(filepath)
    centers, normals, tri_verts = calculate_face_data(positions, indices)
    
    # glTF coordinates:
    # Let's inspect the model orientation:
    # Check bounding box:
    # min_pos = positions.min(axis=0)
    # max_pos = positions.max(axis=0)
    # Typically Y is UP, Z is FORWARD, X is RIGHT
    # For Front view: Screen X = positions[:, 0], Screen Y = positions[:, 1], Depth = positions[:, 2]
    # For Side Left: Screen X = positions[:, 2], Screen Y = positions[:, 1], Depth = -positions[:, 0]
    # For Side Right: Screen X = -positions[:, 2], Screen Y = positions[:, 1], Depth = positions[:, 0]
    # For Back view: Screen X = -positions[:, 0], Screen Y = positions[:, 1], Depth = -positions[:, 2]

    if view_name == 'front':
        u_pts = tri_verts[:, :, 0]
        v_pts = tri_verts[:, :, 1]
        depths = centers[:, 2]
        cam_dir = np.array([0.0, 0.0, 1.0])
        light_dir = np.array([0.3, 0.5, 0.8])
    elif view_name == 'side_left': # looking from character's right side
        u_pts = tri_verts[:, :, 2]
        v_pts = tri_verts[:, :, 1]
        depths = -centers[:, 0]
        cam_dir = np.array([-1.0, 0.0, 0.0])
        light_dir = np.array([-0.8, 0.4, 0.3])
    elif view_name == 'side_right': # looking from character's left side
        u_pts = -tri_verts[:, :, 2]
        v_pts = tri_verts[:, :, 1]
        depths = centers[:, 0]
        cam_dir = np.array([1.0, 0.0, 0.0])
        light_dir = np.array([0.8, 0.4, 0.3])
    elif view_name == 'back':
        u_pts = -tri_verts[:, :, 0]
        v_pts = tri_verts[:, :, 1]
        depths = -centers[:, 2]
        cam_dir = np.array([0.0, 0.0, -1.0])
        light_dir = np.array([-0.3, 0.5, -0.8])
        
    light_dir = light_dir / np.linalg.norm(light_dir)
    
    # Backface culling: Dot product of normal with cam_dir > 0
    cos_cull = np.sum(normals * cam_dir, axis=1)
    visible_mask = cos_cull > -0.05
    
    idx_visible = np.where(visible_mask)[0]
    print(f"[{view_name}] Triangles: total {len(indices)}, visible {len(idx_visible)}")
    
    # Bounding box of full model for consistent framing
    all_u = positions[:, 0] if view_name in ['front', 'back'] else positions[:, 2]
    all_v = positions[:, 1]
    
    u_min, u_max = all_u.min(), all_u.max()
    v_min, v_max = all_v.min(), all_v.max()
    
    u_center = 0.5 * (u_min + u_max)
    v_center = 0.5 * (v_min + v_max)
    
    span_u = (u_max - u_min) * 1.15
    span_v = (v_max - v_min) * 1.15
    
    scale = min((width - 60) / span_u, (height - 60) / span_v)
    
    # Screen coordinates for visible triangles
    px = ((u_pts[idx_visible] - u_center) * scale + width / 2).astype(np.float32)
    py = (height / 2 - (v_pts[idx_visible] - v_center) * scale).astype(np.float32)
    
    # Shading calculation
    vis_normals = normals[idx_visible]
    ndotl = np.clip(np.sum(vis_normals * light_dir, axis=1), 0.0, 1.0)
    # Secondary rim light
    ndotrim = np.clip(np.sum(vis_normals * (-light_dir + 2 * cam_dir), axis=1), 0.0, 1.0) * 0.2
    shade = 0.35 + 0.55 * ndotl + ndotrim
    shade = np.clip(shade, 0.0, 1.0)
    
    # White clay character base color RGB (225, 230, 240)
    base_color = np.array([225, 230, 240], dtype=np.float32)
    tri_colors = (shade[:, None] * base_color).astype(np.uint8)
    
    # Sort visible triangles back-to-front (depth ascending)
    vis_depths = depths[idx_visible]
    sort_order = np.argsort(vis_depths) # smallest depth (furthest) drawn first
    
    # Render onto high-res canvas with dark studio background (#0c1926)
    img = Image.new('RGB', (width, height), (12, 25, 38))
    draw = ImageDraw.Draw(img)
    
    sorted_indices = sort_order
    px_sorted = px[sorted_indices]
    py_sorted = py[sorted_indices]
    col_sorted = tri_colors[sorted_indices]
    
    for i in range(len(sorted_indices)):
        p0 = (px_sorted[i, 0], py_sorted[i, 0])
        p1 = (px_sorted[i, 1], py_sorted[i, 1])
        p2 = (px_sorted[i, 2], py_sorted[i, 2])
        c = tuple(col_sorted[i])
        draw.polygon([p0, p1, p2], fill=c)
        
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    img.save(out_path, format='PNG')
    print(f"Saved {out_path} in {time.time() - t0:.2f}s")

if __name__ == '__main__':
    glb_path = r'c:\Users\user\Music\project\Techeru_3D_Development\techeru_white_original.glb'
    out_dir = r'c:\Users\user\Music\project\Techeru_3D_Development\renders'
    render_view(glb_path, 'front', os.path.join(out_dir, 'techeru_front.png'))
    render_view(glb_path, 'side_left', os.path.join(out_dir, 'techeru_side.png'))
    render_view(glb_path, 'back', os.path.join(out_dir, 'techeru_back.png'))
