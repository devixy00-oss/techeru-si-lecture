import struct
import json
import os
import sys

glb_path = r"C:\Users\user\.gemini\antigravity\brain\46e85e44-06f2-42d3-a57a-7f8d4f6b2c3a\.user_uploaded\media_1794830602820_181969c4.glb"

with open(glb_path, "rb") as f:
    magic, version, length = struct.unpack("<4sII", f.read(12))
    print(f"Magic: {magic}, Version: {version}, Total Length: {length} bytes")
    
    chunk_len, chunk_type = struct.unpack("<II", f.read(8))
    print(f"Chunk 0: len={chunk_len}, type={chunk_type}")
    
    json_bytes = f.read(chunk_len)
    gltf = json.loads(json_bytes.decode('utf-8'))
    
    print("=== glTF Summary ===")
    print("Asset:", gltf.get("asset"))
    print("Scenes:", len(gltf.get("scenes", [])))
    print("Nodes:", len(gltf.get("nodes", [])))
    print("Meshes:", len(gltf.get("meshes", [])))
    print("Materials:", len(gltf.get("materials", [])))
    print("Textures:", len(gltf.get("textures", [])))
    print("Images:", len(gltf.get("images", [])))
    print("Skins:", len(gltf.get("skins", [])))
    print("Animations:", len(gltf.get("animations", [])))
    
    if gltf.get("nodes"):
        print("\n--- Nodes ---")
        for i, node in enumerate(gltf["nodes"][:20]):
            print(f"Node {i}: {node.get('name', 'unnamed')}, mesh={node.get('mesh')}, children={node.get('children')}, skin={node.get('skin')}")
            
    if gltf.get("meshes"):
        print("\n--- Meshes ---")
        for i, m in enumerate(gltf["meshes"][:10]):
            print(f"Mesh {i}: {m.get('name', 'unnamed')}")
            for p in m.get("primitives", []):
                print("  Primitive attributes:", list(p.get("attributes", {}).keys()), "material:", p.get("material"))
                
    if gltf.get("materials"):
        print("\n--- Materials ---")
        for i, mat in enumerate(gltf["materials"][:10]):
            print(f"Material {i}: {mat.get('name')}, pbr: {mat.get('pbrMetallicRoughness')}")

    if gltf.get("accessors"):
        # Bounding box of position accessors
        print("\n--- Bounding Box (POSITION Accessors) ---")
        for i, acc in enumerate(gltf["accessors"]):
            if acc.get("type") == "VEC3" and "min" in acc and "max" in acc:
                print(f"Accessor {i}: min={acc['min']}, max={acc['max']}")
                break
