import os
import shutil
import time
from gradio_client import Client, handle_file

image_path = os.path.abspath("frontend/public/character/official_cat_ref.jpg")
target_glb = os.path.abspath("frontend/public/models/teacher-cat-instantmesh.glb")

print("Connecting to InstantMesh space...")
try:
    client = Client("TencentARC/InstantMesh")
    print("Preprocessing image...")
    preprocessed = client.predict(
        input_image=handle_file(image_path),
        do_remove_background=True,
        api_name="/preprocess"
    )
    print("Generating multiviews...")
    mvs = client.predict(
        input_image=handle_file(preprocessed),
        sample_steps=50,
        sample_seed=42,
        api_name="/generate_mvs"
    )
    print("Creating 3D GLB model...")
    res = client.predict(api_name="/make3d")
    print(f"InstantMesh result: {res}")
    if res and len(res) > 1 and res[1] and os.path.exists(res[1]):
        shutil.copyfile(res[1], target_glb)
        print(f"InstantMesh GLB saved to {target_glb} ({os.path.getsize(target_glb)} bytes)!")
except Exception as e:
    print(f"InstantMesh error: {e}")
