import struct
import json
import numpy as np

with open(r'frontend/public/models/teacher-cat.glb', 'rb') as f:
    f.read(12)
    j_len, _ = struct.unpack('<II', f.read(8))
    gltf = json.loads(f.read(j_len).decode('utf-8'))
    b_len, _ = struct.unpack('<II', f.read(8))
    bin_data = f.read(b_len)

prim = gltf['meshes'][0]['primitives'][0]
pos_acc = gltf['accessors'][prim['attributes']['POSITION']]
pos_bv = gltf['bufferViews'][pos_acc['bufferView']]
pos_offset = pos_bv.get('byteOffset', 0) + pos_acc.get('byteOffset', 0)
positions = np.frombuffer(bin_data, dtype=np.float32, count=pos_acc['count']*3, offset=pos_offset).reshape(-1, 3)

c_acc = gltf['accessors'][prim['attributes']['COLOR_0']]
c_bv = gltf['bufferViews'][c_acc['bufferView']]
c_offset = c_bv.get('byteOffset', 0) + c_acc.get('byteOffset', 0)
c_dim = 4 if c_acc['type'] == 'VEC4' else 3

if c_acc['componentType'] == 5126: # float
    colors = np.frombuffer(bin_data, dtype=np.float32, count=c_acc['count']*c_dim, offset=c_offset).reshape(-1, c_dim)
elif c_acc['componentType'] == 5121: # ubyte
    colors = np.frombuffer(bin_data, dtype=np.uint8, count=c_acc['count']*c_dim, offset=c_offset).reshape(-1, c_dim).astype(np.float32) / 255.0

print('Positions shape:', positions.shape)
print('Colors shape:', colors.shape)
print('Colors min:', colors.min(axis=0), 'max:', colors.max(axis=0))

# Head is roughly Y in [0.25, 0.98]
head_mask = (positions[:, 1] > 0.25)
# Snout / muzzle is forward (Z > 0.15) and central (|X| < 0.25) and Y in [0.25, 0.55]
snout_mask = head_mask & (positions[:, 2] > 0.12) & (np.abs(positions[:, 0]) < 0.22) & (positions[:, 1] < 0.58)

print('Snout vertices count:', snout_mask.sum())
if snout_mask.sum() > 0:
    snout_colors = colors[snout_mask, :3]
    print('Snout mean color RGB:', snout_colors.mean(axis=0))
    print('Snout min color RGB:', snout_colors.min(axis=0))
    print('Snout max color RGB:', snout_colors.max(axis=0))
    # Count how many are very white (all channels > 0.85) vs noisy
    white_snout = (snout_colors > 0.8).all(axis=1)
    dark_snout = (snout_colors < 0.2).all(axis=1)
    print(f'Snout color breakdown: {white_snout.sum()} white, {dark_snout.sum()} dark, {len(snout_colors) - white_snout.sum() - dark_snout.sum()} other')

# Check eyes (|X| between 0.05 and 0.25, Y between 0.45 and 0.65, Z > 0.15)
eye_mask = head_mask & (np.abs(positions[:, 0]) > 0.04) & (np.abs(positions[:, 0]) < 0.26) & (positions[:, 1] > 0.42) & (positions[:, 1] < 0.68) & (positions[:, 2] > 0.12)
print('Eye region vertices count:', eye_mask.sum())
if eye_mask.sum() > 0:
    eye_colors = colors[eye_mask, :3]
    print('Eye region mean color RGB:', eye_colors.mean(axis=0))
