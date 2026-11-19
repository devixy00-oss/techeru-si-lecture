from gradio_client import Client

print("Checking trellis-community/TRELLIS...")
try:
    c = Client("trellis-community/TRELLIS")
    print("TRELLIS endpoints:")
    c.view_api()
except Exception as e:
    print("TRELLIS error:", e)

print("\nChecking TencentARC/InstantMesh...")
try:
    c2 = Client("TencentARC/InstantMesh")
    print("InstantMesh endpoints:")
    c2.view_api()
except Exception as e:
    print("InstantMesh error:", e)
