import sys
from gradio_client import Client, handle_file

image_path = "frontend/public/character/official_cat_ref.jpg"

print(f"Connecting to stabilityai/TripoSR...")
try:
    client = Client("stabilityai/TripoSR")
    print("Connected successfully! Checking API endpoints...")
    api_info = client.view_api(return_format="dict")
    print("Endpoints:", list(api_info.get("named_endpoints", {}).keys()))
except Exception as e:
    print(f"Error connecting to TripoSR: {e}")
