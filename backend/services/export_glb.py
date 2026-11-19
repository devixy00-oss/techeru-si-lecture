import json
import struct
import os
import math
import numpy as np

def create_teacher_cat_glb(output_path: str):
    """
    Generates a valid, standalone GLB (glTF 2.0 Binary) containing the
    anthropomorphic orange tabby cat teacher character geometry and PBR materials.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    buffer_bytes = bytearray()
    accessors = []
    buffer_views = []
    meshes = []
    nodes = []
    materials = []

    # Material definitions matching character specification
    materials.append({
        "name": "OrangeTabbyFur",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.92, 0.49, 0.15, 1.0],
            "metallicFactor": 0.05,
            "roughnessFactor": 0.75
        }
    })
    materials.append({
        "name": "DarkTabbyStripe",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.61, 0.25, 0.03, 1.0],
            "metallicFactor": 0.05,
            "roughnessFactor": 0.8
        }
    })
    materials.append({
        "name": "CreamWhiteFur",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.98, 0.95, 0.88, 1.0],
            "metallicFactor": 0.0,
            "roughnessFactor": 0.8
        }
    })
    materials.append({
        "name": "PinkNoseInnerEar",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.96, 0.52, 0.60, 1.0],
            "metallicFactor": 0.0,
            "roughnessFactor": 0.5
        }
    })
    materials.append({
        "name": "NavyBlueSuit",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.11, 0.19, 0.35, 1.0],
            "metallicFactor": 0.1,
            "roughnessFactor": 0.55
        }
    })
    materials.append({
        "name": "WhiteShirt",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.97, 0.98, 1.0, 1.0],
            "metallicFactor": 0.0,
            "roughnessFactor": 0.4
        }
    })
    materials.append({
        "name": "StripedTie",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.88, 0.66, 0.29, 1.0],
            "metallicFactor": 0.2,
            "roughnessFactor": 0.45
        }
    })
    materials.append({
        "name": "GlassesFrame",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.10, 0.09, 0.09, 1.0],
            "metallicFactor": 0.3,
            "roughnessFactor": 0.25
        }
    })
    materials.append({
        "name": "GreenIris",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.23, 0.55, 0.25, 1.0],
            "metallicFactor": 0.1,
            "roughnessFactor": 0.2
        }
    })
    materials.append({
        "name": "BrownShoes",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.43, 0.21, 0.08, 1.0],
            "metallicFactor": 0.15,
            "roughnessFactor": 0.35
        }
    })
    materials.append({
        "name": "GoldPin",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.94, 0.73, 0.25, 1.0],
            "metallicFactor": 0.85,
            "roughnessFactor": 0.25
        }
    })
    materials.append({
        "name": "SilverTieClip",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.85, 0.88, 0.92, 1.0],
            "metallicFactor": 0.9,
            "roughnessFactor": 0.2
        }
    })

    def add_mesh_primitive(positions, normals, indices, material_idx):
        nonlocal buffer_bytes
        pos_array = np.array(positions, dtype=np.float32)
        norm_array = np.array(normals, dtype=np.float32)
        idx_array = np.array(indices, dtype=np.uint16)

        def pad(b):
            rem = len(b) % 4
            if rem != 0:
                b.extend(b'\x00' * (4 - rem))

        # Indices BufferView
        pad(buffer_bytes)
        idx_offset = len(buffer_bytes)
        idx_bytes = idx_array.tobytes()
        buffer_bytes.extend(idx_bytes)
        idx_view_idx = len(buffer_views)
        buffer_views.append({
            "buffer": 0,
            "byteOffset": idx_offset,
            "byteLength": len(idx_bytes),
            "target": 34963
        })
        idx_acc_idx = len(accessors)
        accessors.append({
            "bufferView": idx_view_idx,
            "byteOffset": 0,
            "componentType": 5123,
            "count": len(idx_array),
            "type": "SCALAR",
            "max": [int(idx_array.max())],
            "min": [int(idx_array.min())]
        })

        # Positions BufferView
        pad(buffer_bytes)
        pos_offset = len(buffer_bytes)
        pos_bytes = pos_array.tobytes()
        buffer_bytes.extend(pos_bytes)
        pos_view_idx = len(buffer_views)
        buffer_views.append({
            "buffer": 0,
            "byteOffset": pos_offset,
            "byteLength": len(pos_bytes),
            "target": 34962
        })
        pos_acc_idx = len(accessors)
        accessors.append({
            "bufferView": pos_view_idx,
            "byteOffset": 0,
            "componentType": 5126,
            "count": len(pos_array),
            "type": "VEC3",
            "max": pos_array.max(axis=0).tolist(),
            "min": pos_array.min(axis=0).tolist()
        })

        # Normals BufferView
        pad(buffer_bytes)
        norm_offset = len(buffer_bytes)
        norm_bytes = norm_array.tobytes()
        buffer_bytes.extend(norm_bytes)
        norm_view_idx = len(buffer_views)
        buffer_views.append({
            "buffer": 0,
            "byteOffset": norm_offset,
            "byteLength": len(norm_bytes),
            "target": 34962
        })
        norm_acc_idx = len(accessors)
        accessors.append({
            "bufferView": norm_view_idx,
            "byteOffset": 0,
            "componentType": 5126,
            "count": len(norm_array),
            "type": "VEC3",
            "max": norm_array.max(axis=0).tolist(),
            "min": norm_array.min(axis=0).tolist()
        })

        return {
            "attributes": {
                "POSITION": pos_acc_idx,
                "NORMAL": norm_acc_idx
            },
            "indices": idx_acc_idx,
            "material": material_idx
        }

    def make_box(center, size):
        cx, cy, cz = center
        sx, sy, sz = size[0]/2, size[1]/2, size[2]/2
        corners = [
            (-sx, -sy,  sz), ( sx, -sy,  sz), ( sx,  sy,  sz), (-sx,  sy,  sz),
            ( sx, -sy, -sz), (-sx, -sy, -sz), (-sx,  sy, -sz), ( sx,  sy, -sz),
            (-sx,  sy,  sz), ( sx,  sy,  sz), ( sx,  sy, -sz), (-sx,  sy, -sz),
            (-sx, -sy, -sz), ( sx, -sy, -sz), ( sx, -sy,  sz), (-sx, -sy,  sz),
            ( sx, -sy,  sz), ( sx, -sy, -sz), ( sx,  sy, -sz), ( sx,  sy,  sz),
            (-sx, -sy, -sz), (-sx, -sy,  sz), (-sx,  sy,  sz), (-sx,  sy, -sz),
        ]
        face_normals = [
            ( 0,  0,  1), ( 0,  0, -1), ( 0,  1,  0),
            ( 0, -1,  0), ( 1,  0,  0), (-1,  0,  0)
        ]
        positions = []
        normals = []
        indices = []
        for f in range(6):
            base_idx = f * 4
            norm = face_normals[f]
            for v in range(4):
                vx, vy, vz = corners[base_idx + v]
                positions.append([cx + vx, cy + vy, cz + vz])
                normals.append(list(norm))
            indices.extend([base_idx, base_idx + 1, base_idx + 2, base_idx, base_idx + 2, base_idx + 3])
        return positions, normals, indices

    def make_sphere(center, radius, rings=12, sectors=16, scale=(1.0, 1.0, 1.0)):
        cx, cy, cz = center
        sx, sy, sz = scale
        positions = []
        normals = []
        indices = []
        for r in range(rings + 1):
            theta = math.pi * r / rings
            sin_t = math.sin(theta)
            cos_t = math.cos(theta)
            for s in range(sectors + 1):
                phi = 2 * math.pi * s / sectors
                sin_p = math.sin(phi)
                cos_p = math.cos(phi)
                nx = cos_p * sin_t
                ny = cos_t
                nz = sin_p * sin_t
                positions.append([cx + nx * radius * sx, cy + ny * radius * sy, cz + nz * radius * sz])
                normals.append([nx, ny, nz])

        for r in range(rings):
            for s in range(sectors):
                first = r * (sectors + 1) + s
                second = first + sectors + 1
                indices.extend([first, second, first + 1])
                indices.extend([second, second + 1, first + 1])
        return positions, normals, indices

    def make_cylinder(center, r_top, r_bot, height, segments=16):
        cx, cy, cz = center
        positions = []
        normals = []
        indices = []
        hh = height / 2.0
        for i in range(segments + 1):
            angle = 2 * math.pi * i / segments
            ca = math.cos(angle)
            sa = math.sin(angle)
            positions.append([cx + ca * r_top, cy + hh, cz + sa * r_top])
            normals.append([ca, 0, sa])
            positions.append([cx + ca * r_bot, cy - hh, cz + sa * r_bot])
            normals.append([ca, 0, sa])

        for i in range(segments):
            idx = i * 2
            indices.extend([idx, idx + 1, idx + 2])
            indices.extend([idx + 1, idx + 3, idx + 2])
        return positions, normals, indices

    # 1. Head (Sculpted naturally proportioned cranium & cheeks)
    head_pos, head_norm, head_idx = make_sphere((0, 0.42, 0), 0.38, scale=(1.05, 0.95, 0.98))
    p1 = add_mesh_primitive(head_pos, head_norm, head_idx, 0)

    lcheek_pos, lcheek_norm, lcheek_idx = make_sphere((-0.24, 0.36, 0.10), 0.22, scale=(1.12, 0.85, 0.9))
    rcheek_pos, rcheek_norm, rcheek_idx = make_sphere((0.24, 0.36, 0.10), 0.22, scale=(1.12, 0.85, 0.9))
    p_lcheek = add_mesh_primitive(lcheek_pos, lcheek_norm, lcheek_idx, 0)
    p_rcheek = add_mesh_primitive(rcheek_pos, rcheek_norm, rcheek_idx, 0)

    # 2. Cream Muzzle & Chin
    lmuz_pos, lmuz_norm, lmuz_idx = make_sphere((-0.082, 0.34, 0.32), 0.12, scale=(1.1, 0.85, 0.75))
    rmuz_pos, rmuz_norm, rmuz_idx = make_sphere((0.082, 0.34, 0.32), 0.12, scale=(1.1, 0.85, 0.75))
    chin_pos, chin_norm, chin_idx = make_sphere((0, 0.23, 0.28), 0.11, scale=(1.15, 0.65, 0.65))
    p_lmuz = add_mesh_primitive(lmuz_pos, lmuz_norm, lmuz_idx, 2)
    p_rmuz = add_mesh_primitive(rmuz_pos, rmuz_norm, rmuz_idx, 2)
    p_chin = add_mesh_primitive(chin_pos, chin_norm, chin_idx, 2)

    # 3. Pink Nose
    nose_pos, nose_norm, nose_idx = make_box((0, 0.38, 0.39), (0.065, 0.048, 0.04))
    p_nose = add_mesh_primitive(nose_pos, nose_norm, nose_idx, 3)

    # 4. Ears
    lear_pos, lear_norm, lear_idx = make_cylinder((-0.24, 0.76, 0.02), 0.03, 0.14, 0.30)
    rear_pos, rear_norm, rear_idx = make_cylinder((0.24, 0.76, 0.02), 0.03, 0.14, 0.30)
    p_lear = add_mesh_primitive(lear_pos, lear_norm, lear_idx, 0)
    p_rear = add_mesh_primitive(rear_pos, rear_norm, rear_idx, 0)

    l_in_pos, l_in_norm, l_in_idx = make_cylinder((-0.23, 0.75, 0.04), 0.02, 0.09, 0.22)
    r_in_pos, r_in_norm, r_in_idx = make_cylinder((0.23, 0.75, 0.04), 0.02, 0.09, 0.22)
    p_lin = add_mesh_primitive(l_in_pos, l_in_norm, l_in_idx, 3)
    p_rin = add_mesh_primitive(r_in_pos, r_in_norm, r_in_idx, 3)

    # 5. Eyes
    leye_pos, leye_norm, leye_idx = make_sphere((-0.155, 0.46, 0.32), 0.082, scale=(1, 1, 0.4))
    reye_pos, reye_norm, reye_idx = make_sphere((0.155, 0.46, 0.32), 0.082, scale=(1, 1, 0.4))
    p_leye = add_mesh_primitive(leye_pos, leye_norm, leye_idx, 8)
    p_reye = add_mesh_primitive(reye_pos, reye_norm, reye_idx, 8)

    # 6. Glasses Frame & Bridge
    lrim_pos, lrim_norm, lrim_idx = make_box((-0.16, 0.46, 0.38), (0.23, 0.18, 0.025))
    rrim_pos, rrim_norm, rrim_idx = make_box((0.16, 0.46, 0.38), (0.23, 0.18, 0.025))
    br_pos, br_norm, br_idx = make_box((0, 0.46, 0.38), (0.12, 0.025, 0.025))
    p_lrim = add_mesh_primitive(lrim_pos, lrim_norm, lrim_idx, 7)
    p_rrim = add_mesh_primitive(rrim_pos, rrim_norm, rrim_idx, 7)
    p_br = add_mesh_primitive(br_pos, br_norm, br_idx, 7)

    # 7. Torso & Tailored Royal Navy Jacket (Athletic tailored taper)
    torso_pos, torso_norm, torso_idx = make_cylinder((0, -0.04, 0), 0.32, 0.35, 0.64)
    p_torso = add_mesh_primitive(torso_pos, torso_norm, torso_idx, 4)

    shirt_pos, shirt_norm, shirt_idx = make_box((0, 0.10, 0.24), (0.18, 0.30, 0.035))
    p_shirt = add_mesh_primitive(shirt_pos, shirt_norm, shirt_idx, 5)

    tie_pos, tie_norm, tie_idx = make_box((0, 0.03, 0.27), (0.075, 0.34, 0.025))
    p_tie = add_mesh_primitive(tie_pos, tie_norm, tie_idx, 6)

    # Suit accessories matching character model sheet
    pocket_pos, pocket_norm, pocket_idx = make_box((-0.18, 0.07, 0.26), (0.07, 0.03, 0.015))
    p_pocket = add_mesh_primitive(pocket_pos, pocket_norm, pocket_idx, 5)

    pin_pos, pin_norm, pin_idx = make_box((-0.14, 0.18, 0.28), (0.035, 0.035, 0.015))
    p_pin = add_mesh_primitive(pin_pos, pin_norm, pin_idx, 10)

    clip_pos, clip_norm, clip_idx = make_box((0.0, 0.02, 0.285), (0.065, 0.015, 0.018))
    p_clip = add_mesh_primitive(clip_pos, clip_norm, clip_idx, 11)

    # Tabby stripes on face
    f_str_pos, f_str_norm, f_str_idx = make_box((0.0, 0.60, 0.32), (0.028, 0.14, 0.035))
    p_f_str = add_mesh_primitive(f_str_pos, f_str_norm, f_str_idx, 1)

    l_chk_str_pos, l_chk_str_norm, l_chk_str_idx = make_box((-0.32, 0.34, 0.18), (0.07, 0.022, 0.05))
    p_l_chk_str = add_mesh_primitive(l_chk_str_pos, l_chk_str_norm, l_chk_str_idx, 1)

    r_chk_str_pos, r_chk_str_norm, r_chk_str_idx = make_box((0.32, 0.34, 0.18), (0.07, 0.022, 0.05))
    p_r_chk_str = add_mesh_primitive(r_chk_str_pos, r_chk_str_norm, r_chk_str_idx, 1)

    # Stepped Fluffy Cheek Fur Tufts matching character illustration
    ltufts_pos, ltufts_norm, ltufts_idx = make_cylinder((-0.36, 0.36, 0.12), 0.02, 0.08, 0.18)
    rtufts_pos, rtufts_norm, rtufts_idx = make_cylinder((0.36, 0.36, 0.12), 0.02, 0.08, 0.18)
    p_ltufts = add_mesh_primitive(ltufts_pos, ltufts_norm, ltufts_idx, 0)
    p_rtufts = add_mesh_primitive(rtufts_pos, rtufts_norm, rtufts_idx, 0)

    # Two tailored waist pocket flaps
    lflap_pos, lflap_norm, lflap_idx = make_box((-0.18, -0.06, 0.26), (0.09, 0.025, 0.02))
    rflap_pos, rflap_norm, rflap_idx = make_box((0.18, -0.06, 0.26), (0.09, 0.025, 0.02))
    p_lflap = add_mesh_primitive(lflap_pos, lflap_norm, lflap_idx, 4)
    p_rflap = add_mesh_primitive(rflap_pos, rflap_norm, rflap_idx, 4)

    # 8. Arms & Paws
    larm_pos, larm_norm, larm_idx = make_cylinder((-0.36, 0.04, 0), 0.095, 0.08, 0.46)
    rarm_pos, rarm_norm, rarm_idx = make_cylinder((0.36, 0.04, 0), 0.095, 0.08, 0.46)
    p_larm = add_mesh_primitive(larm_pos, larm_norm, larm_idx, 4)
    p_rarm = add_mesh_primitive(rarm_pos, rarm_norm, rarm_idx, 4)

    lpaw_pos, lpaw_norm, lpaw_idx = make_sphere((-0.36, -0.26, 0.03), 0.085)
    rpaw_pos, rpaw_norm, rpaw_idx = make_sphere((0.36, -0.26, 0.03), 0.085)
    p_lpaw = add_mesh_primitive(lpaw_pos, lpaw_norm, lpaw_idx, 0)
    p_rpaw = add_mesh_primitive(rpaw_pos, rpaw_norm, rpaw_idx, 0)

    # 9. Legs & Brown Shoes
    lleg_pos, lleg_norm, lleg_idx = make_cylinder((-0.17, -0.56, 0), 0.115, 0.10, 0.44)
    rleg_pos, rleg_norm, rleg_idx = make_cylinder((0.17, -0.56, 0), 0.115, 0.10, 0.44)
    p_lleg = add_mesh_primitive(lleg_pos, lleg_norm, lleg_idx, 4)
    p_rleg = add_mesh_primitive(rleg_pos, rleg_norm, rleg_idx, 4)

    lshoe_pos, lshoe_norm, lshoe_idx = make_box((-0.17, -0.84, 0.05), (0.17, 0.10, 0.32))
    rshoe_pos, rshoe_norm, rshoe_idx = make_box((0.17, -0.84, 0.05), (0.17, 0.10, 0.32))
    p_lshoe = add_mesh_primitive(lshoe_pos, lshoe_norm, lshoe_idx, 9)
    p_rshoe = add_mesh_primitive(rshoe_pos, rshoe_norm, rshoe_idx, 9)

    # 10. Rigged 7-segment striped tail
    tail_prims = []
    for i in range(7):
        t_y = -0.32 + i * 0.09
        t_z = -0.22 - i * 0.05
        mat = 0 if i % 2 == 0 else 1
        seg_pos, seg_norm, seg_idx = make_cylinder((0, t_y, t_z), 0.07, 0.06, 0.10)
        tail_prims.append(add_mesh_primitive(seg_pos, seg_norm, seg_idx, mat))

    all_primitives = [
        p1, p_lcheek, p_rcheek, p_ltufts, p_rtufts, p_lmuz, p_rmuz, p_chin, p_nose,
        p_lear, p_rear, p_lin, p_rin, p_leye, p_reye,
        p_lrim, p_rrim, p_br, p_f_str, p_l_chk_str, p_r_chk_str,
        p_torso, p_shirt, p_tie, p_pocket, p_pin, p_clip, p_lflap, p_rflap,
        p_larm, p_rarm, p_lpaw, p_rpaw, p_lleg, p_rleg,
        p_lshoe, p_rshoe
    ] + tail_prims

    meshes.append({
        "name": "TeacherCatMesh",
        "primitives": all_primitives
    })

    nodes.append({
        "name": "TeacherCatRoot",
        "mesh": 0
    })

    rem = len(buffer_bytes) % 4
    if rem != 0:
        buffer_bytes.extend(b'\x00' * (4 - rem))

    buffers = [{
        "byteLength": len(buffer_bytes)
    }]

    gltf_json = {
        "asset": {
            "generator": "TecheruAI 3D Generator",
            "version": "2.0"
        },
        "scene": 0,
        "scenes": [
            {
                "name": "Scene",
                "nodes": [0]
            }
        ],
        "nodes": nodes,
        "meshes": meshes,
        "materials": materials,
        "accessors": accessors,
        "bufferViews": buffer_views,
        "buffers": buffers
    }

    json_str = json.dumps(gltf_json, separators=(',', ':'))
    json_bytes = bytearray(json_str.encode('utf-8'))
    rem = len(json_bytes) % 4
    if rem != 0:
        json_bytes.extend(b' ' * (4 - rem))

    total_length = 12 + 8 + len(json_bytes) + 8 + len(buffer_bytes)

    header = struct.pack('<4sII', b'glTF', 2, total_length)
    chunk0_header = struct.pack('<I4s', len(json_bytes), b'JSON')
    chunk1_header = struct.pack('<I4s', len(buffer_bytes), b'BIN\x00')

    with open(output_path, 'wb') as f:
        f.write(header)
        f.write(chunk0_header)
        f.write(json_bytes)
        f.write(chunk1_header)
        f.write(buffer_bytes)

    print(f"Created GLB at {output_path} ({total_length} bytes)")

if __name__ == '__main__':
    create_teacher_cat_glb(r'C:\Users\user\Music\project\frontend\public\models\teacher-cat.glb')
