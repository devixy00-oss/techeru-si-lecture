import os
import shutil
import time
from gradio_client import Client, handle_file

image_path = os.path.abspath("frontend/public/character/official_cat_ref.jpg")
target_glb = os.path.abspath("frontend/public/models/teacher-cat.glb")
target_trellis_glb = os.path.abspath("frontend/public/models/teacher-cat-trellis.glb")

print(f"Connecting to TRELLIS space...")
client = Client("trellis-community/TRELLIS")

print(f"Submitting image {image_path} to TRELLIS (/generate_and_extract_glb)...")
start_time = time.time()
try:
    result = client.predict(
        image=handle_file(image_path),
        multiimages=[],
        seed=42,
        ss_guidance_strength=7.5,
        ss_sampling_steps=12,
        slat_guidance_strength=3.0,
        slat_sampling_steps=12,
        multiimage_algo="stochastic",
        mesh_simplify=0.95,
        texture_size=1024,
        api_name="/generate_and_extract_glb"
    )
    duration = time.time() - start_time
    print(f"TRELLIS generated in {duration:.1f}s! Result: {result}")
    
    # Result has (video, extracted_glbgaussian, download_glb)
    glb_path = None
    if isinstance(result, (list, tuple)):
        for item in reversed(result):
            if isinstance(item, str) and (item.endswith(".glb") or os.path.isfile(item)):
                glb_path = item
                break
            elif isinstance(item, dict) and "path" in item and item["path"].endswith(".glb"):
                glb_path = item["path"]
                break
    elif isinstance(result, str) and os.path.isfile(result):
        glb_path = result

    if glb_path and os.path.exists(glb_path):
        size = os.path.getsize(glb_path)
        print(f"Found GLB at {glb_path} ({size} bytes). Copying to {target_glb}...")
        shutil.copyfile(glb_path, target_glb)
        shutil.copyfile(glb_path, target_trellis_glb)
        print(f"SUCCESS! Real AI-generated 3D GLB model installed at {target_glb} ({size} bytes)!")
    else:
        print(f"Could not locate .glb in result: {result}")
except Exception as e:
    print(f"Error during TRELLIS generation: {e}")
